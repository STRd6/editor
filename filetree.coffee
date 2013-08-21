@Filetree = (I={}) ->
  Object.defaults I,
    files: []

  self = Model(I).observeAll()

  self.attrObservable "selectedFile"

  self.extend
    load: (fileData) ->
      files = Object.keys(fileData).map (name) ->
        File fileData[name]
      .select (file) ->
        file.filename() != "style.css" and
        file.filename() != "build.js"

      self.files(files)

  return self
