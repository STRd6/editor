# Get stuff from our env
{$root, gist, request} = ENV

# Apply our styles
if styleContent = gist.files["style.css"]?.content
  $root.append $("<style>",
    html: styleContent
  )

# Init Github access token stuff
Gistquire.onload()

builder = Builder()

errors = Observable([])
notices = Observable(["Loaded!"])

actions =
  save: ->
    builder.build filetree.fileData(),
      success: (fileData) ->
        Gistquire.update gist.id,
          data:
            files: fileData
          success: ->
            notices(["Saved!"])
          error: ->
            errors(["Save Failed :("])

        notices(["Saving..."])
        errors([])
      error: errors

  new: ->
    if name = prompt("File Name", "newfile.coffee")
      filetree.files.push File
        filename: name
        content: ""

  run: (->    
    builder.build filetree.fileData(),
      success: (fileData) ->
        if fileData["pixie.json"]
          config = JSON.parse(fileData["pixie.json"].content)
        else
          config = {}
        
        sandbox = Sandbox
          width: config.width
          height: config.height
        
        sandbox.document.open()
        $('script.env').each ->
          sandbox.document.write(this.outerHTML)

        sandbox.document.write """<body><script>
          ENV = {
            "$root": $('body'), 
            "gist": {
              files: #{JSON.stringify(fileData)}
            }
          };
          
          #{fileData["build.js"].content};
        <\/script>"""

        sandbox.document.close()

        # TODO: Display this notice when we receive confirmation from child window
        notices(["Runnnig!"])
        # TODO: Catch and display runtime errors
        errors([])

      error: errors
    ).debounce(250)
    
  load: (e, id) ->
    if id ||= prompt("Gist Id", gist.id)
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
  root = $root.children(".main")
  root.find(".editor-wrap").hide()
  
  if file.editor
    file.editor.trigger("show")
  else
    root.append(HAMLjr.templates.editor())
    file.editor = root.find(".editor-wrap").last()
    
    # TODO: Choose correct editor mode
    editor = TextEditor
      text: file.content()
      el: file.editor.find('.editor').get(0)

    file.editor.on "show", ->
      file.editor.show()
      editor.editor.focus()
  
    editor.text.observe (value) ->
      file.content(value)
      
      # Autorun
      # actions.run()

$root
  .append(HAMLjr.templates.main(
    filetree: filetree
    actions: actions
    notices: notices
    errors: errors
  ))

Gistquire.api "/rate_limit", 
  complete: (request, status) ->
    $root.append HAMLjr.templates.github_status
      request: request

if loadId = window.location.href.match(/loadId=(\d+)/)?[1]
  actions.load(null, loadId)
