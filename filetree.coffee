@Filetree = (I={}) ->
  Object.defaults I,
    files: []

  self = Model(I).observeAll()

  self.attrObservable "selectedFile"

  self.extend
    # Load files either from an array of file data objects
    # or from an object with filenames as keys and file data objects as values
    load: (fileData) ->
      if Array.isArray(fileData)
        files = fileData.sort (a, b) ->
          if a.path < b.path
            -1
          else if b.path < a.path
            1
          else
            0
        .map File

      else
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
