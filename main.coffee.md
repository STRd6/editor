Editor
======

Components
----------

- [Packager](/packager/docs)
- [Hygiene](/hygiene/docs)
- [Runtime](/runtime/docs)

TODO: This needs a big cleanup.

    # Get stuff from our package
    {source:files} = PACKAGE

    global.Sandbox = require 'sandbox'
    require "./source/duct_tape"
    require "./source/deferred"
    {processDirectory} = require "./source/util"

    global.PACKAGE = PACKAGE
    global.require = require

    # Create and auth a github API
    # Global until we consolidate editor/actions into something cleaner
    global.github = require("github")(require("./source/github_auth")())

Templates
---------

- [Actions](./templates/actions)
- [Editor](./templates/editor)
- [Github Status](./templates/github_status)
- [Text Editor](./templates/text_editor)
- [Repo Info](./templates/repo_info)

    # Load and attach Templates
    templates = (HAMLjr.templates ||= {})
    [
      "actions"
      "editor"
      "github_status"
      "text_editor"
      "repo_info"
    ].each (name) ->
      template = require("./templates/#{name}")
      # TODO Transitional type check
      if typeof template is "function"
        templates[name] = template

    Editor = require("./editor")
    TextEditor = require("./source/text_editor")

    editor = global.editor = Editor()
    editor.loadFiles(files)

    # TODO: Don't expose these
    builder = editor.builder()
    filetree = editor.filetree()

    {File, template:filetreeTemplate} = require "filetree"
    templates["filetree"] = filetreeTemplate

    Hygiene = require "hygiene"
    Runtime = require "runtime"
    Packager = require "packager"

    {readSourceConfig} = require("./source/util")

    notifications = require("notifications")()
    templates.notifications = notifications.template
    {classicError, notify, errors} = notifications

    # The root is the node that contains the script file.
    runtime = Runtime(PACKAGE)
    rootNode = runtime.boot()

    runtime.applyStyleSheet(require('./style'))

    $root = $(rootNode)

    # Branch Chooser using pull requests
    {models:{Issue, Issues}, templates:{issues:issuesTemplate}} = require("issues")
    templates["issues"] = issuesTemplate
    issues = Issues()

    # Github repository observable
    # TODO: Finalize move into editor module
    repository = editor.repository

    repository.observe (repository) ->
      issues.repository = repository
      repository.pullRequests().then issues.reset

      notify "Loaded repository: #{repository.full_name()}"

    PACKAGE.repository.url ||= "repos/#{PACKAGE.repository.full_name}"

    repository github.Repository(PACKAGE.repository)

    confirmUnsaved = ->
      Deferred.ConfirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?")

    closeOpenEditors = ->
      root = $root.children(".main")
      root.find(".editor-wrap").remove()

    actions =
      save: ->
        notify "Saving..."

        editor.save()
        .then ->
          # TODO: This could get slightly out of sync if there were changes
          # during the async call
          # The correct solution will be to use git shas to determine changed status
          # but that's a little heavy duty for right now.
          filetree.markSaved()

          editor.publish()
        .then ->
          notify "Saved and published!"
        .fail (args...) ->
          errors args

      run: ->
        notify "Running..."

        editor.run()
        .fail classicError

      test: ->
        notify "Running tests..."

        editor.test()
        .fail errors

      docs: ->
        notify "Running Docs..."

        if file = prompt("Docs file", "index")
          editor.runDocs({file})
          .fail errors

      convert_images: ->
        # Gather image data from images/
        imageFiles = editor.filesMatching(/^images\//)

        imageData = require("./lib/images").convert imageFiles.map (file) ->
          path: file.path()
          content: file.content()

        # Delete files in images/
        imageFiles.forEach (file) ->
          editor.files().remove(file)

        # Create/update images.json
        # Read file if it exists
        try
          existingImages = JSON.parse(editor.fileContents("images.json"))
        catch
          existingImages = {}

        # Merge data
        Object.extend existingImages, imageData

        # Write file
        editor.writeFile("images.json", JSON.stringify(existingImages, null, 2))

      new_file: ->
        if name = prompt("File Name", "newfile.coffee")
          file = File
            path: name
            content: ""
          filetree.files.push file
          filetree.selectedFile file

      load_repo: (skipPrompt) ->
        confirmUnsaved()
        .then ->
          currentRepositoryName = repository().full_name()

          fullName = prompt("Github repo", currentRepositoryName)

          if fullName
            github.repository(fullName).then repository
          else
            Deferred().reject("No repo given")
        .then (repositoryInstance) ->
          notify "Loading files..."

          editor.load
            repository: repositoryInstance
          .then ->
            closeOpenEditors()

            notifications.push "Loaded"
        .fail classicError

      new_feature: ->
        if title = prompt("Description")
          notify "Creating feature branch..."

          editor.repository().createPullRequest
            title: title
          .then (data) ->
            issue = Issue(data)
            issues.issues.push issue

            # TODO: Standardize this like backbone or something
            # or think about using deferreds in some crazy way
            issues.silent = true
            issues.currentIssue issue
            issues.silent = false

            notifications.push "Created!"
          , classicError

      pull_master: ->
        confirmUnsaved()
        .then( ->
          notify "Merging in default branch..."
          repository().pullFromBranch()
        , classicError
        ).then ->
          notifications.push "Merged!"

          branchName = repository().branch()
          notifications.push "\nReloading branch #{branchName}..."

          editor.load
            repository: repository()
          .then ->
            notifications.push "Loaded!"
          .fail ->
            classicError "Error loading #{repository().url()}"

      pull_upstream: ->
        confirmUnsaved()
        .then( ->
          notify "Pulling from upstream master"

          upstreamRepo = repository().parent().full_name

          github.repository(upstreamRepo)
          .then (repository) ->
            repository.latestContent()
          .then (results) ->
            files = processDirectory results
            editor.loadFiles files

        , classicError
        ).then ->
          notifications.push "\nYour code is up to date with the upstream master"
          closeOpenEditors()

      tag_version: ->
        notify "Building..."

        editor.build()
        .then (pkg) ->
          version = "v#{readSourceConfig(pkg).version}"

          notify "Tagging version #{version} ..."

          repository().createRef("refs/tags/#{version}")
          .then ->
            notifications.push "Tagged #{version}"
          .then ->
            notifications.push "\nPublishing..."

            # Force branch for jsonp wrapper
            pkg.repository.branch = version

            repository().publish Packager.standAlone(pkg), version
          .then ->
            notifications.push "Published!"

        .fail classicError

    filetree.selectedFile.observe (file) ->
      return if file.binary?()

      root = $root.children(".main")
      root.find(".editor-wrap").hide()

      if file.editor
        file.editor.trigger("show")
      else
        root.append(HAMLjr.render "text_editor")
        file.editor = root.find(".editor-wrap").last()

        switch file.path().extension()
          when "md", "coffee", "js", "styl", "cson"
            file.content Hygiene.clean file.content()

        textEditor = TextEditor
          text: file.content()
          el: file.editor.find('.editor').get(0)
          mode: file.mode()

        file.editor.on "show", ->
          file.editor.show()
          textEditor.editor.focus()

        textEditor.text.observe (value) ->
          file.content(value)

          # TODO May want to move this into a collection listener for all files
          # in the filetree
          if file.path().match(/\.styl$/)
            hotReloadCSS(file)

    hotReloadCSS = ( (file) ->
      try
        css = styl(file.content(), whitespace: true).toString()

      editor.runner().hotReloadCSS(css) if css
    ).debounce(100)

    issues?.currentIssue.observe (issue) ->
      # TODO: Formalize this later
      return if issues.silent

      changeBranch = (branchName) ->
        previousBranch = repository().branch()

        confirmUnsaved()
        .then ->
          closeOpenEditors()

          # Switch to branch for working on the issue
          repository().switchToBranch(branchName)
          .then ->
            notifications.push "\nLoading branch #{branchName}..."

            editor.load
              repository: repository()
            .then ->
              notifications.push "Loaded!"
        , ->
          # TODO: Issue will appear as being selected even though we cancelled
          # To correctly handle this we may need to really beef up our observables.
          # One possibility is to extend observables to full fledged deferreds
          # which can be rejected by listeners added to the chain.

          repository.branch(previousBranch)

          classicError "Error switching to #{branchName}, still on #{previousBranch}"

      if issue
        notify issue.fullDescription()

        changeBranch issue.branchName()
      else
        notify "Default branch selected"

        changeBranch repository().defaultBranch()

    $root
      .append(HAMLjr.render "editor",
        filetree: filetree
        actions: actions
        notifications: notifications
        issues: issues
        github: github
        repository: repository
      )

    window.onbeforeunload = ->
      if filetree.hasUnsavedChanges()
        "You have some unsaved changes, if you leave now you will lose your work."
