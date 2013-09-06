# Get stuff from our env
{source:files, distribution} = ENV

window.ENV = ENV

# TODO: Move to env utils
currentNode = ->
  target = document.documentElement

  while (target.childNodes.length and target.lastChild.nodeType == 1)
    target = target.lastChild

  return target.parentNode

# The root is the node that contains the script file.
$root = $(currentNode())

# Apply our styles
if styleContent = distribution["style.css"]?.content
  $root.append $("<style>",
    html: styleContent
  )

# Init Github access token stuff
Gistquire.onload()
  
# TODO: Real branch and repo info, maybe from ENV
branch = "master"
userName = "STRd6"
repoName = "editor"
repo = null

errors = Observable([])
notices = Observable(["Loaded!"])

builder = Builder
  errors: errors
  notices: notices

# Repo metadata for env
builder.addPostProcessor (data) ->
  # TODO: Track commit SHA as well
  data.repository =
    repo: repoName
    owner: userName
    branch: branch

  data

builder.addPostProcessor (data) ->
  # TODO: Think about a robust way to get 'self' and set it as progenitor data
  data.progenitor =
    url: "http://strd6.github.io/editor/"

  data

actions =
  save: ->
    notices ["Saving..."]
    
    Actions.save
      owner: userName
      repo: repoName
      fileData: filetree.data()
      builder: builder
    .then ->
      notices ["Saved and published!"]

  run: ->
    Actions.run({builder, filetree})

  new_file: ->
    if name = prompt("File Name", "newfile.coffee")
      filetree.files.push File
        filename: name
        content: ""

  load_repo: ->
    repoName = prompt("Github repo", "STRd6/matrix.js")
    
    if repoName
      [userName, repoName] = repoName.split("/")
    else
      errors ["No repo given"]

      return

    Actions.load
      repo: repoName
      owner: userName
      branch: branch
      notices: notices
      errors: errors
      filetree: filetree
    .then ->
      Gistquire.api("repos/#{userName}/#{repoName}/issues")
      .then issues.reset

filetree = Filetree()
filetree.load(files)

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

issues = Issues()
issues.pipe({notices, errors})

# Load initial issues
Gistquire.api("repos/#{userName}/#{repoName}/issues")
.then issues.reset

$root
  .append(HAMLjr.templates.main(
    filetree: filetree
    actions: actions
    notices: notices
    errors: errors
    issues: issues
  ))

Gistquire.api "rate_limit", 
  complete: (request, status) ->
    $root.append HAMLjr.templates.github_status
      request: request
