compileTemplate = (source, name="test") ->
  ast = HAMLjr.parser.parse(source)
  
  HAMLjr.compile ast, 
    name: name
    compiler: CoffeeScript

build = ->  
  templates = []

  Object.keys(Gistquire.Gists[gistId].files).each (name) ->
    if name.extension() is "haml"
      source = Gistquire.Gists[gistId].files[name].content
      templates.push compileTemplate(source, name.withoutExtension())

  main = CoffeeScript.compile(Gistquire.Gists[gistId].files["main.coffee"].content)

  "#{templates.join("\n")}\n\n#{main}"

model = Model(
  source: Gistquire.Gists[gistId].files["editor.haml"].content
)

model.attrObservable("source")

model.save = ->
  # TODO: Merge in each file

  Gistquire.update gistId,
    files:
      "build.js":
        content:  build()
      "editor.haml":
        content: $('textarea').val()

$("body").append(HAMLjr.templates.editor(model))