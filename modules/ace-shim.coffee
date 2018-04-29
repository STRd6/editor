CodeArea = require "../views/code-area"

Hygiene = require "../hygiene"

extraModes =
  jadelet: "jade"
  styl: "stylus"

mode = (mode) ->
  extraModes[mode] or mode

module.exports = (I, self) ->
  codeArea = CodeArea()

  aceEditor = codeArea.aceEditor()
  nullSession = ace.createEditSession("")

  self.extend
    editorElement: ->
      codeArea.element

    goto: (file, line) ->
      self.filetree().selectedFile(file)
      codeArea.goto(line)

    closeOpenEditors: ->
      codeArea.setSession(nullSession, true)

  self.filetree().selectedFile.observe (file) ->
    return if file.binary?()

    {session} = file

    unless session
      switch file.path().extension()
        when "md", "coffee", "js", "styl", "cson"
          file.content Hygiene.clean file.content()

      session = codeArea.initSession(file.content)
      file.session = session

      fileMode = mode(file.mode())
      session.setMode("ace/mode/#{fileMode}")

    codeArea.setSession(session)
