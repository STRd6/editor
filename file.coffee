@File = (I={}) ->
  self = Model(I).observeAll()

  self.extend
    extension: ->
      self.filename().extension()

    mode: ->
      switch extension = self.extension()
        when "js"
          "javascript"
        else
          extension

  return self
