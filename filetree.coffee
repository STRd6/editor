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

    fileData: ->
      fileData = {}

      # TODO: Handle deleted files
  
      # Merge in each file
      self.files.each (file) ->
        name = file.filename()
        fileData[name] =
          content: file.content()
          filename: name
  
      return fileData
      
    gitTree: ->
      self.files.map (file) ->
        path: file.filename()
        mode: "100644"
        content: file.content()
        type: "blob"

  return self
