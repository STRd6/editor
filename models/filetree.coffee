File = require("./file")

module.exports = Filetree = (I={}) ->
  defaults I,
    files: []

  self = Model(I)

  self.attrModels "files", File
  self.attrObservable "selectedFile"

  self.extend
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
        files = Object.keys(fileData).sort().map (path) ->
          File fileData[path]

      self.files(files)

    data: ->
      self.files.map (file) ->
        file.I

    hasUnsavedChanges: ->
      self.files().select (file) ->
        file.modified()
      .length

    markSaved: ->
      self.files().forEach (file) ->
        file.modified(false)

  return self
