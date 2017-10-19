FilePresenter = require "./file"
FiletreeTemplate = require "../templates/filetree"

FiletreePresenter = (filetree, basePath="") ->
  selectedFile = filetree.selectedFile

  directorySort = (a, b) ->
    lengthA = a.length
    lengthB = b.length
    l = Math.max(lengthA, lengthB)

    i = 0
    while i < l
      # Directories before files
      if lengthA - 1 is i # a is file
        return +1 if lengthB > lengthA
      if lengthB - 1 is i # b is file
        return -1 if lengthA > lengthB

      return +1 if a[i] > b[i]
      return -1 if a[i] < b[i]
      i += 1

    return 0

  self =
    basePath: basePath
    elements: ->
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
          selectedFile: selectedFile
        , basePath + folderPath + "/"

      fileElements = Object.keys(fileLookup).sort().map (filePath) ->
        FilePresenter fileLookup[filePath], selectedFile, basePath

      folderElements.concat fileElements

  return FiletreeTemplate self

module.exports = FiletreePresenter
