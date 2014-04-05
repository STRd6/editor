Editor
======

The funny story about this editor is that it has an unbroken history from a
single gist https://gist.github.com/STRd6/6286182/6196ffb39db7d10c56aa263190525318ca609db7

The original gist was an exploration in a self-hosting gist editor. One that
could load gists via the Github API, update them, and create new gists. It
succeeded at that, but I ran into the limits of the gist structure, namely no
branches or folders.

I went on and created a git repo, merged in the gist history, and continued from
there. Maybe if I were smarter I could have rewritten it from scratch to be better,
but I had no idea what I was doing and still don't know to this day.

So that may explain why this is in such need of a cleanup.

Demo
----

[Run it!](/editor)

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

    require("analytics").init("UA-3464282-15")

    # Create and auth a github API
    # Global until we consolidate editor/actions into something cleaner
    global.github = require("github")(require("./source/github_auth")())

    ValueWidget = require "value-widget"

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
      "repo_info"
    ].each (name) ->
      template = require("./templates/#{name}")
      # TODO Transitional type check
      if typeof template is "function"
        templates[name] = template

    Editor = require("./editor")

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
    {classicError, notify, errors} = notifications

    Runtime(PACKAGE)
      .boot()
      .applyStyleSheet(require('./style'))

    $root = $("body")

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
      root.find("iframe").remove()

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

      publish_chrapp: ->
        Chrapps = require "chrapps"

        notify "Chrapping..."

        editor.build().then (pkg) ->
          editor.repository().publish(Chrapps.processPackage(pkg), undefined, "chrapps")
        .then ->
          notify "Chrapped!"
        .fail (args...) ->
          errors args

      convert_data: ->
        converter = require("./lib/converter").convertDataToJSON

        converter
          editor: editor
          outputFileName: "images.json"
          matcher: /^images\/(.*)\.png$/
          mimeType: "image/png"

        converter
          editor: editor
          outputFileName: "sounds.json"
          matcher: /^sounds\/(.*)\.wav$/
          mimeType: "audio/wav"

        converter
          editor: editor
          outputFileName: "music.json"
          matcher: /^sounds\/(.*)\.mp3$/
          mimeType: "audio/mp3"

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
      root.find("iframe").hide()

      if file.editor
        file.editor.trigger("show")
      else
        iframe = document.createElement "iframe"
        root.append iframe
        file.editor = $(iframe)

        switch file.path().extension()
          when "md", "coffee", "js", "styl", "cson"
            file.content Hygiene.clean file.content()

        textEditor = ValueWidget
          value: file.content()
          iframe: iframe
          url: "http://distri.github.io/text/v0.1.1/"
          options:
            mode: file.mode()

        file.editor.on "show", ->
          file.editor.show()
          textEditor.send "focus"

        textEditor.observe (value) ->
          file.content(value)

          # TODO: Trigger hot reload

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
