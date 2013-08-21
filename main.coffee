compileTemplate = (source, name="test") ->
  ast = HAMLjr.parser.parse(source)
  
  HAMLjr.compile ast, 
    name: name
    compiler: CoffeeScript

build = ->  
  template = compileTemplate $('textarea').val(), "test"

  main = CoffeeScript.compile(Gistquire.Gists[gistId].files["main.coffee"].content)

  "#{template}\n\n#{main}"

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

$("body").append(HAMLjr.templates.test(model))