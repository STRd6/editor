@File = (I={}) ->
  I.path ?= I.filename
  I.filename ?= I.path.split("/").last()

  self = Model(I).observeAll()

  self.extend
    extension: ->
      self.filename().extension()

    mode: ->
      switch extension = self.extension()
        when "js"
          "javascript"
        when ""
          "text"
        else
          extension

  return self
