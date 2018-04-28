###
The Code Area View provides a multi-session ace editor element.

Require these dependencies in pixie.cson:

  "https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.9/ace.js"
  "https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.9/ext-language_tools.js"
###

ace.require("ace/ext/language_tools")

module.exports = () ->
  editorElement = document.createElement 'div'

  aceEditor = ace.edit editorElement

  aceEditor.$blockScrolling = Infinity
  aceEditor.setOptions
    fontSize: "16px"
    enableBasicAutocompletion: true
    enableLiveAutocompletion: true

  element: editorElement

  aceEditor: ->
    aceEditor

  goto: (line) ->
    aceEditor.moveCursorTo(line, 0)
    aceEditor.clearSelection()
    aceEditor.scrollToLine(line, true, false, ->)

    return

  setSession: (session, readOnly=false) ->
    aceEditor.setSession(session)
    aceEditor.setReadOnly(readOnly)
    aceEditor.focus()

    return

  ###
  Initialize a session to track an observable
  ###
  initSession: (contentObservable) ->
    session = ace.createEditSession(contentObservable())

    session.setUseWorker(false)

    session.setUseSoftTabs true
    session.setTabSize 2

    aceEditor.setOptions
      highlightActiveLine: true

    # Filetree observable binding
    updating = false
    contentObservable.observe (newContent) ->
      return if updating

      session.setValue newContent

    # Bind session and file content
    session.on "change", ->
      updating = true
      contentObservable session.getValue()
      updating = false

    return session
