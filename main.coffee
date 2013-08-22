# Get stuff from our env
{$root, gist} = ENV

# Apply our styles
if styleContent = gist.files["style.css"]?.content
  $root.append $("<style>",
    html: styleContent
  )

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

    Gistquire.update gist.id,
      files: fileData

  new: ->
    if name = prompt("File Name", "newfile.coffee")
      filetree.files.push File
        filename: name
        content: ""

  run: ->
    $root.children(".demo").remove()
    demoElement = $("<div>", class: "demo")
    $root.append(demoElement)
    Function("ENV", build())(
      $root: demoElement
      gist: gist
    )

  load: ->
    if id = prompt("Gist Id", gist.id)
      console.log id
      
      Gistquire.get id, (data) ->
        gist = data
        filetree.load(gist.files)
        
  list: ->
    Gistquire.get "", (data) ->
      $root.append HAMLjr.templates.gist_list(
        gists: data
      )

filetree = Filetree()
filetree.load(gist.files)

filetree.selectedFile.observe (file) ->
  # TODO: Scope DOM mutation
  $root.find(".editor-wrap").remove()
  $root.find(".main").append(HAMLjr.templates.editor())

  # TODO: Choose correct editor mode

  editor = TextEditor
    text: file.content()
    el: $root.find('.editor').get(0)

  # Not sure why this is necessary O_o
  editor.reset(editor.text())

  editor.text.observe file.content

$root
  .append(HAMLjr.templates.main(
    filetree: filetree
    actions: actions
  ))
