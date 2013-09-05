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
        # TODO: Be better with exclusions
        return unless file.type() is "blob"

        name = file.filename()
        fileData[name] =
          content: file.content()
          filename: name
  
      return fileData
      
    gitTree: ->
      self.files().select (file) ->
        # TODO: Be better with the exclusions
        file.type() is "blob"
      .map (file) ->
        path: file.path()
        mode: "100644"
        content: file.content()
        type: "blob"

  return self
