Hygiene = require "./hygiene"

ace.require("ace/ext/language_tools")

aceEditor = ace.edit "ace"
aceEditor.$blockScrolling = Infinity
aceEditor.setOptions
  fontSize: "16px"
  enableBasicAutocompletion: true
  enableLiveAutocompletion: true

extraModes =
  jadelet: "jade"
  styl: "stylus"

mode = (mode) ->
  extraModes[mode] or mode

module.exports = (I, self) ->
  self.extend
    aceEditor: ->
      aceEditor

    closeOpenEditors: ->
      aceEditor.setSession(ace.createEditSession(""))

    goto: (file, line) ->
      self.filetree().selectedFile(file)
      aceEditor.moveCursorTo(line, 0)
      aceEditor.clearSelection()
      aceEditor.scrollToLine(line, true, false, ->)

    initSession: (file) ->
      session = ace.createEditSession(file.content())

      session.setMode("ace/mode/#{mode file.mode()}")

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

      # Make sure ace resets to the correct size
      window.dispatchEvent(new Event('resize'))

      return session

  self.filetree().selectedFile.observe (file) ->
    return if file.binary?()

    unless file.session
      switch file.path().extension()
        when "md", "coffee", "js", "styl", "cson"
          file.content Hygiene.clean file.content()

      file.session = self.initSession(file)

    aceEditor.setSession(file.session)
    aceEditor.focus()

  return self
