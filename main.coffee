compileTemplate = (source, name="test") ->
  ast = HAMLjr.parser.parse(source)
  
  HAMLjr.compile ast, 
    name: name
    compiler: CoffeeScript

build = ->  
  templates = []
  models = []

  Object.keys(Gistquire.Gists[gistId].files).each (name) ->
    source = Gistquire.Gists[gistId].files[name].content

    if name.extension() is "haml"
      templates.push compileTemplate(source, name.withoutExtension())
  
    else if name.extension() is "coffee"
      # Skip main
      return if name is "main.coffee"

      models.push CoffeeScript.compile(source)

  main = CoffeeScript.compile(Gistquire.Gists[gistId].files["main.coffee"].content)

  """
    #{templates.join("\n")}
    #{models.join("\n")}
    #{main}
  """

model =
  save: ->
    # TODO: Merge in each file

    Gistquire.update gistId,
      files:
        "build.js":
          content:  build()

files = Object.keys(Gistquire.Gists[gistId].files).map (filename) ->
  data = Gistquire.Gists[gistId].files[filename]
  
  File(data)

filetree = Filetree
  files: files

filetree.selectedFile.observe (file) ->
  $("body").append(HAMLjr.templates.editor(file))

$("body")
  .append(HAMLjr.templates.actions(model))
  .append(HAMLjr.templates.filetree(filetree))
