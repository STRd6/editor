FileTemplate = require "../templates/file"

module.exports = (file, selectedFile, basePath="") ->

  self =
    active: ->
      "active" if file is selectedFile()
    displayName: ->
      file.displayName().replace(basePath, "")
    select: (e) ->
      selectedFile(file) if e.target.nodeName is 'FILE'
    remove: ->
      files.remove(file) if confirm("Delete #{file.path()}?")

  return FileTemplate self
