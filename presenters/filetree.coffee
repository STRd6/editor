FilePresenter = require "./file"
FiletreeTemplate = require "../templates/filetree"

FiletreePresenter = (filetree, basePath="", expandedState) ->
  expandedState ?=
    "": true
  expanded = expandedState[basePath]
  selectedFile = filetree.selectedFile
  filetree.remove ?= filetree.files.remove
  removeFile = filetree.remove

  self =
    basePath: basePath
    displayPath: ->
      basePath.split("/").slice(-2).join("/")
    expanded: Observable expanded
    expandedClass: ->
      "expanded" if self.expanded()
    elements: ->
      return unless self.expanded()

      files = filetree.files()
      fileLookup = {}
      folderLookup = {}

      files.forEach (file) ->
        path = file.path()

        return unless path.indexOf(basePath) is 0

        [firstSegment] = pathSegments = path.replace(basePath, "").split("/")

        if pathSegments.length > 1
          folderLookup[firstSegment] ?= []
          folderLookup[firstSegment].push file
        else
          fileLookup[firstSegment] = file

      folderElements = Object.keys(folderLookup).sort().map (folderPath) ->
        FiletreePresenter
          files: ->
            folderLookup[folderPath]
          remove: removeFile
          selectedFile: selectedFile
        , basePath + folderPath + "/", expandedState

      fileElements = Object.keys(fileLookup).sort().map (filePath) ->
        FilePresenter fileLookup[filePath], selectedFile, removeFile, basePath

      folderElements.concat fileElements
    toggleExpand: ->
      expandedState[basePath] = self.expanded.toggle()

  return FiletreeTemplate self

module.exports = FiletreePresenter
