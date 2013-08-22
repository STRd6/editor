# Get stuff from our env
{$root, gist} = ENV

# Apply our styles
if styleContent = gist.files["style.css"]?.content
  $root.append $("<style>",
    html: styleContent
  )

builder = Builder()

actions =
  save: ->
    builder.build filetree.fileData(),
      success: (fileData) ->
        Gistquire.update gist.id,
          files: fileData
      error: (errors) ->
        # TODO Error display
        console.log errors

  test: ->
    console.log "TEST", gist.id

  new: ->
    if name = prompt("File Name", "newfile.coffee")
      filetree.files.push File
        filename: name
        content: ""

  run: ->
    $root.children(".demo").remove()
    demoElement = $("<div>", class: "demo")
    $root.append(demoElement)
    
    builder.build filetree.fileData(),
      success: (fileData) ->
        Function("ENV", fileData["build.js"].content)(
          $root: demoElement
          gist:
            files: fileData
        )
        
      error: (errors) ->
        console.log errors
        
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
  $root.find(".editor-wrap").remove()
  $root.find(".main").append(HAMLjr.templates.editor())

  # TODO: Choose correct editor mode

  editor = TextEditor
    text: file.content()
    el: $root.find('.editor').get(0)

  editor.text.observe (value) ->
    file.content(value)
    
    # TODO: Autorun
    # actions.run()

$root
  .append(HAMLjr.templates.main(
    filetree: filetree
    actions: actions
  ))
