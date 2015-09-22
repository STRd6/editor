aceEditor = ace.edit "ace"
aceEditor.$blockScrolling = Infinity
aceEditor.setOptions
  fontSize: "16px"

module.exports = ->
  aceEditor: ->
    aceEditor

  initSession: (file) ->
    session = ace.createEditSession(file.content())

    session.setMode("ace/mode/#{file.mode()}")

    session.setUseSoftTabs true
    session.setTabSize 2

    aceEditor.setOptions
      highlightActiveLine: true

    # Filetree observable binding
    updating = false
    file.content.observe (newContent) ->
      return if updating

      session.setValue newContent

    # Bind session and file content
    session.on "change", ->
      updating = true
      file.content session.getValue()
      updating = false

    return session
