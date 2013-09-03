# Get stuff from our env
{files, gist} = ENV

files ||= gist?.files

gist ||=
  files: files
  id: 6286182

# TODO: Consider passing root from env for components
$root = $('body')

# Apply our styles
if styleContent = files["style.css"]?.content
  $root.append $("<style>",
    html: styleContent
  )

# Init Github access token stuff
Gistquire.onload()

# Github api
github = new Github
  auth: "oauth"
  token: localStorage.authToken
  
# TODO: Real branch and repo info, maybe from ENV
branch = "master"
commitMessage = "Yolo! (http://strd6.github.io/tempest/)"
userName = "STRd6"
repoName = "editor"
repo = null

builder = Builder()

errors = Observable([])
notices = Observable(["Loaded!"])

appendError = (error) ->
  console.log error
  
  errors.push(error) if error

actions =
  commit: ->
    notices(["Saving..."])
        
    Gistquire.commitTree
      owner: userName
      repo: repoName
      tree: filetree.gitTree()
      success: ->
        notices(["Saved!"])
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
        sandbox.document.write(builder.standAloneHtml(fileData))

        sandbox.document.close()

        # TODO: Display this notice when we receive confirmation from child window
        notices(["Runnnig!"])
        # TODO: Catch and display runtime errors
        errors([])

      error: errors
    ).debounce(250)

  load_repo: ->
    gist = null
    repoName = prompt("Github repo", "STRd6/matrix.js")
    
    if repoName
      [userName, repoName] = repoName.split("/")
    else
      # TODO: Display error
      return

    repo = github.getRepo(userName, repoName)
    
    # Decode all content in place
    processDirectory = (items) ->
      items.each (item) ->
        if Array.isArray(item)
          processDirectory(item)
        else
          return item unless item.content
          
          item.content = Base64.decode(item.content)
          item.encoding = "raw"
    
    mapToGist = (tree, files={}) ->
      tree.inject files, (files, leaf) ->
        if Array.isArray(leaf)
          mapToGist(leaf, files)
        else
          leaf.filename = leaf.name
          files[leaf.path] = leaf
          
          return files
    
    # TODO: Need get tree recursively
    repo.contents "master", "", (error, data) ->
      if data
        notices [JSON.stringify data, null, 2]
        
        # TODO: We should flatten the tree first, then
        # do our async content gathering
        async.map data, (datum, callback) ->
          path = datum.url.split('/')[3..].join('/')
          Gistquire.api path,
            success: (data) ->
              callback(null, data)

        , (error, results) ->
          processDirectory results
          
          files = mapToGist(results)
          
          notices [
            files
            # Temporary hack to map repo into same structure as gist files
          ].map (item) ->
            JSON.stringify(item, null, 2)
            
          filetree.load files

      else
        errors [error]
        
  publish: ->
    # Assuming git repo with gh-pages branch
    publishBranch = "gh-pages"
    
    notices ["Publishing..."]
    
    builder.build filetree.fileData(),
      success: (fileData) ->
        # create <ref>.html in gh-pages branch
        Gistquire.writeFile
          repo: repoName
          owner: userName
          path: "#{branch}.html"
          content: Base64.encode(builder.standAloneHtml(fileData))
          branch: publishBranch
          message: "Built #{branch} in browser in strd6.github.io/tempest"
          success: ->
            notices ["Published"]
          error: ->
            errors ["Error Publishing :("]        
      error: errors

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
    
    editor = TextEditor
      text: file.content()
      el: file.editor.find('.editor').get(0)
      mode: file.mode()

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

Gistquire.api "rate_limit", 
  complete: (request, status) ->
    $root.append HAMLjr.templates.github_status
      request: request

if loadId = window.location.href.match(/loadId=(\d+)/)?[1]
  actions.load(null, loadId)
