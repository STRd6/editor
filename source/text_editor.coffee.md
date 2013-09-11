The `TextEditor` is a model for editing a text file. Currently it uses the Ace
editor, but we may switch in the future. All the editor specific things live in
here.

    @TextEditor = (I) ->
      Object.reverseMerge I,
        mode: "coffee"
        text: ""

      self = Model(I)

We can't use ace on a div not in the DOM so we need to be sure to pass one in.

      el = I.el

We can't serialize DOM elements so we need to be sure to delete it.

      delete I.el

Here we create and configure the Ace text editor.

TODO: Load these options from a preferences somewhere.

      editor = ace.edit(el)
      editor.setFontSize("16px")
      editor.setTheme("ace/theme/chrome")
      editor.getSession().setUseWorker(false)
      editor.getSession().setMode("ace/mode/#{I.mode}")
      editor.getSession().setUseSoftTabs(true)
      editor.getSession().setTabSize(2)

`reset` Sets the content of the editor to the given content and also resets any
cursor position or selection.

      reset = (content="") ->
        editor.setValue(content)
        editor.moveCursorTo(0, 0)
        editor.session.selection.clearSelection()
    
      reset(I.text)

Our text attribute is observable so clients can track changes.

      self.attrObservable "text"

We modify our text by listening to change events from Ace.

TODO: Remove these `updating` hacks.

      updating = false
      editor.getSession().on 'change', ->
        updating = true
        self.text(editor.getValue())
        updating = false

We also observe any changes to `text` ourselves to stay up to date with outside
modifications. Its a bi-directional binding.

      self.text.observe (newValue) ->
        unless updating
          reset(newValue)

We expose some properties and methods.

      self.extend
        el: el
        editor: editor
        reset: reset
    
      return self
