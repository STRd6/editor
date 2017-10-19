FileTemplate = require "../templates/file"

module.exports = (file, selectedFile) ->

  self =
    displayName: file.displayName
    select: (e) ->
      selectedFile(file) if e.target.nodeName is 'LI'
    remove: ->
      files.remove(file) if confirm("Delete #{file.path()}?")

  return FileTemplate self
