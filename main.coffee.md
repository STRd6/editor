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
    Q = require "q"
    {confirmIf} = require "../lib/ui"
    {processDirectory} = require "./source/util"

    global.PACKAGE = PACKAGE
    global.require = require

    require("analytics").init("UA-3464282-15")

    # Create and auth a github API
    # Global until we consolidate editor/actions into something cleaner
    global.github = require("github")(require("./source/github_auth"))

    ValueWidget = require "value-widget"

Templates
---------

- [Actions](./templates/actions)
- [Editor](./templates/editor)
- [Github Status](./templates/github_status)
- [Text Editor](./templates/text_editor)
- [Repo Info](./templates/repo_info)

    Editor = require("./editor")

    editor = global.editor = Editor()

    # TODO: Think about tracking this state better
    # It shouldn't just be loading the files of the package, but
    # actually loading the entire package as our model to be edited
    # this way recursive dependency exploring would work
    if p = ENV?.APP_STATE?.PACKAGE
      editor.loadFiles(p.source)
    else
      editor.loadFiles(PACKAGE.source)

    # TODO: Don't expose this
    filetree = editor.filetree()

    {File} = require "filetree"

    Hygiene = require "hygiene"
    Runtime = require "runtime"
    Packager = require "packager"

    {readSourceConfig} = require("./source/util")

    notifications = require("notifications")()
    {classicError, notify, errors} = notifications
    extend editor,
      classicError: classicError
      notify: notify
      errors: errors

    Runtime(PACKAGE)
      .boot()
      .applyStyleSheet(require('./style'))

    $root = $("body")

    confirmUnsaved = ->
      confirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?")

    closeOpenEditors = ->
      root = $root.children(".main")
      root.find("iframe").remove()

    editor.include require("./actions")

    hotReload = (->
      editor.hotReload()
    ).debounce 500

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

          hotReload()

    $root
      .append require("./templates/editor")(
        editor: editor
        filetree: filetree
        actions: editor.actions
        notifications: notifications
      )

    window.onbeforeunload = ->
      if filetree.hasUnsavedChanges()
        "You have some unsaved changes, if you leave now you will lose your work."
