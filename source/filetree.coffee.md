    File = require("./file")

The `Filetree` model represents a tree of files.

    Filetree = (I={}) ->
      Object.defaults I,
        files: []

      self = Model(I).observeAll()

The `selectedFile` observable keeps people up to date on what file has been
selected.

      self.attrObservable "selectedFile"

      self.extend

Load files either from an array of file data objects or from an object with
paths as keys and file data objects as values.

The files are sorted by name after loading.

TODO: Always maintain the files in a sorted list using some kind of sorted
observable.

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

The `data` method returns an array of file data objects that is compatible with
the github tree api.

The objects have a `path`, `content`, `type`, and `mode`.

        data: ->
          self.files.map (file) ->
            path: file.path()
            mode: "100644"
            content: file.content()
            type: "blob"

The filetree `hasUnsavedChanges` if any file in the tree is modified.

        hasUnsavedChanges: ->
          self.files().select (file) ->
            file.modified()
          .length

Marking the filetree as saved resets the modification status of each file.

TODO: There can be race conditions since the save is async.

TODO: Use git trees and content shas to robustly manage changed state.

        markSaved: ->
          self.files().each (file) ->
            file.modified(false)

      return self

Export

    module.exports = Filetree
