# Get stuff from our env
{$root, gist} = ENV

# Apply our styles
if styleContent = gist.files["style.css"]?.content
  $root.append $("<style>",
    html: styleContent
  )

actions =
  save: ->
    fileData = filetree.fileData()

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
    Gistquire.api "gists", (data) ->
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
