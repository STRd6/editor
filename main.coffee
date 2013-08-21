compileTemplate = (source, name="test") ->
  ast = HAMLjr.parser.parse(source)
  
  HAMLjr.compile ast, 
    name: name
    compiler: CoffeeScript

build = ->  
  templates = []
  models = []
  main = ""

  filetree.files.each (file) ->
    name = file.filename()
    source = file.content()

    if name.extension() is "haml"
      templates.push compileTemplate(source, name.withoutExtension())
  
    else if name.extension() is "coffee"
      if name is "main.coffee"
        main = CoffeeScript.compile(source)
      else
        models.push CoffeeScript.compile(source)

  """
    #{templates.join("\n")}
    #{models.join("\n")}
    #{main}
  """

actions =
  save: ->
    fileData = {}

    # TODO: Handle deleted files

    # Merge in each file
    filetree.files.each (file) ->
      fileData[file.filename()] =
        content: file.content()

    fileData["build.js"] =
      content:  build()

    Gistquire.update gistId,
      files: fileData

  new: ->
    if name = prompt("File Name", "newfile.coffee")
      filetree.files.push File
        filename: name
        content: ""

files = Object.keys(Gistquire.Gists[gistId].files).map (filename) ->
  data = Gistquire.Gists[gistId].files[filename]
  
  File(data)

filetree = Filetree
  files: files

filetree.selectedFile.observe (file) ->
  $("textarea").remove()
  $("body").append(HAMLjr.templates.editor(file))

$("body")
  .append(HAMLjr.templates.actions(actions))
  .append(HAMLjr.templates.filetree(filetree))
