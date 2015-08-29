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

    require "cornerstone"
    {confirmIf} = require "../lib/ui"
    {processDirectory} = require "./source/util"

    global.PACKAGE = PACKAGE
    global.require = require

    require("analytics").init("UA-3464282-15")

    # Create and auth a github API
    # Global until we consolidate editor/actions into something cleaner
    global.github = require("github")(require("./source/github_auth"))

Templates
---------

- [Actions](./templates/actions)
- [Editor](./templates/editor)
- [Github Status](./templates/github_status)
- [Text Editor](./templates/text_editor)
- [Repo Info](./templates/repo_info)

    Editor = require("./editor")

    editor = global.editor = Editor()

    if pkg = ENV?.APP_STATE
      editor.loadPackage(pkg)
    else
      editor.loadPackage(PACKAGE)

    global.appData = ->
      editor.loadedPackage()

    # TODO: Don't expose this
    filetree = editor.filetree()

    {File} = require "filetree"

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
    {models:{Issue, Issues}} = require("issues")
    issues = Issues()

    # Github repository observable
    # TODO: Finalize move into editor module
    repository = editor.repository

    repository.observe (repository) ->
      issues.repository = repository
      repository.pullRequests().then issues.reset

      notify "Loaded repository: #{repository.full_name()}"

    PACKAGE.repository.url ||= "repos/#{PACKAGE.repository.full_name}"

    # Need to delay this slightly so our auth token deferred has time to load
    # TODO: Make better use of observables and computed functions so the timing
    # doesn't matter
    setTimeout ->
      repository github.Repository(PACKAGE.repository)

    confirmUnsaved = ->
      confirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?")

    closeOpenEditors = ->
      aceShim.aceEditor().setSession(ace.createEditSession(""))

    hotReload = (->
      editor.hotReload()
    ).debounce 500

    filetree.selectedFile.observe (file) ->
      return if file.binary?()

      unless file.session
        switch file.path().extension()
          when "md", "coffee", "js", "styl", "cson"
            file.content Hygiene.clean file.content()

        file.content.observe (newContent) ->
          hotReload()
        file.session = aceShim.initSession(file)

      aceShim.aceEditor().getSession()?._signal("blur")
      aceShim.aceEditor().setSession(file.session)
      file.session._signal?("focus")

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

      if issue?.branchName?
        notify issue.fullDescription()

        changeBranch issue.branchName()
      else
        notify "Default branch selected"

        changeBranch repository().defaultBranch()

    $root
      .append require("./templates/editor")(
        filetree: filetree
        actions: editor.actions
        notifications: notifications
        issues: issues
        github: github
        repository: repository
      )

    AceShim = require "./ace_shim"
    aceShim = AceShim()

    window.onbeforeunload = ->
      if filetree.hasUnsavedChanges()
        "You have some unsaved changes, if you leave now you will lose your work."
