{Observable} = require "sys"

module.exports = (editor, client) ->
  {system, postmaster, application} = client

  editor.removeActionByName "Save"

  editor.addAction "Save As", (editor) ->
    editor.saveAs()
  , 0

  editor.addAction "Save", (editor) ->
    editor.save()
  , 0

  # Add fileIO
  # Provides
  # - save
  # - saveAs
  # - saved
  # - open
  # - currentPath
  client.util.FileIO(editor)

  # We need to provide
  # - loadFile
  # - saveData
  # - newFile (optional)
  Object.assign editor,
    # Implement ZineOS FileIO compatible `loadFile`
    loadFile: (blob, path) ->
      url = URL.createObjectURL(blob)

      blob.readAsJSON()
      .then editor.loadPackage
      .then ->
        editor.currentPath path
        return

    # `saveData` is the built package
    saveData: ->
      editor.build()

  # TODO: Maybe consolidate these into the same thing
  editor.saved.observe (newValue) ->
    if newValue
      editor.filetree().markSaved()

  # Bind to application title
  Observable ->
    path = editor.currentPath()
    if editor.saved()
      savedIndicator = ""
    else
      savedIndicator = "*"

    if path
      path = " - #{path}"

    application.title "Progenitor#{path}#{savedIndicator}"

  postmaster.delegate = editor

  system.ready()
