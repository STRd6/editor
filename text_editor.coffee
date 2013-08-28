@TextEditor = (I) ->
  Object.reverseMerge I,
    mode: "coffee"
    text: ""

  self = Model(I)

  # We can't use ace on a div not in the DOM :(
  el = I.el
  # We can't serialize DOM elements
  delete I.el

  editor = ace.edit(el)
  editor.setFontSize("16px")
  editor.setTheme("ace/theme/chrome")
  editor.getSession().setUseWorker(false)
  editor.getSession().setMode("ace/mode/#{I.mode}")
  editor.getSession().setUseSoftTabs(true)
  editor.getSession().setTabSize(2)

  reset = (content="") ->
    editor.setValue(content)
    editor.moveCursorTo(0, 0)
    editor.session.selection.clearSelection()

  reset(I.text)

  self.attrObservable "text"

  updating = false
  editor.getSession().on 'change', ->
    updating = true
    self.text(editor.getValue())
    updating = false

  self.text.observe (newValue) ->
    unless updating
      reset(newValue)

  self.extend
    el: el
    editor: editor
    reset: reset

  return self
