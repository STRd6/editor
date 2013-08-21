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

buildStyle = ->
  styles = []
  
  filetree.files.each (file) ->
    name = file.filename()
    source = file.content()

    if name.extension() is "styl"
      styles.push styl(source, whitespace: true).toString()

  styles.join("\n")

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

    fileData["style.css"] =
      content: buildStyle()

    Gistquire.update gistId,
      files: fileData

  new: ->
    if name = prompt("File Name", "newfile.coffee")
      filetree.files.push File
        filename: name
        content: ""

  run: ->
    sandbox = Sandbox()
    # TODO: Copy over some setup script tags?
    sandbox.eval(build())

  load: ->
    if id = prompt("Gist Id", gistId)
      console.log id
      
      Gistquire.get gistId, (data) ->
        filetree.load(data.files)

filetree = Filetree
  files: files

filetree.selectedFile.observe (file) ->
  # TODO: Scope DOM mutation
  $(".editor-wrap").remove()
  $("body").append(HAMLjr.templates.editor())

  # TODO: Choose correct editor mode

  editor = TextEditor
    text: file.content()
    el: $('.editor').get(0)

  # Not sure why this is necessary O_o
  editor.reset(editor.text())

  editor.text.observe file.content

$("body")
  .append(HAMLjr.templates.actions(actions))
  .append(HAMLjr.templates.filetree(filetree))
