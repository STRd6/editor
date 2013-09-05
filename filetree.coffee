@Filetree = (I={}) ->
  Object.defaults I,
    files: []

  self = Model(I).observeAll()

  self.attrObservable "selectedFile"

  self.extend
    load: (fileData) ->
      files = Object.keys(fileData).sort().map (name) ->
        File fileData[name]

      self.files(files)

    data: ->
      self.files.map (file) ->
        path: file.filename()
        mode: "100644"
        content: file.content()
        type: "blob"

  return self
