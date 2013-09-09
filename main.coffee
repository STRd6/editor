# Get stuff from our env
{source:files, distribution} = ENV

# For debugging
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
{owner, repo, branch, full_name:fullName} = ENV.repository

fullName ||= "#{owner}/#{repo}"

repository = Repository
  url: "repos/#{fullName}"

errors = Observable([])
notices = Observable(["Loaded!"])

builder = Builder
  errors: errors
  notices: notices

# Repo metadata for env
builder.addPostProcessor (data) ->
  # TODO: Track commit SHA as well
  data.repository =
    full_name: fullName
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
      repository: repository
      fileData: filetree.data()
      builder: builder
    .then ->
      # TODO: This could get slightly out of sync if there were changes
      # during the async call
      # The correct solution will be to use git shas to determine changed status
      # but that's a little heavy duty for right now.
      filetree.markSaved()
      notices ["Saved and published!"]

  run: ->
    Actions.run({builder, filetree})

  new_file: ->
    if name = prompt("File Name", "newfile.coffee")
      filetree.files.push File
        filename: name
        content: ""

  load_repo: (skipPrompt) ->
    Deferred.ConfirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?")
    .then ->
      fullName = prompt("Github repo", fullName) unless skipPrompt

      if fullName
        repository = Repository
          url: "repos/#{fullName}"
      else
        errors ["No repo given"]
  
        return
  
      notices ["Loading repo..."]
  
      Actions.load
        repository: repository
        filetree: filetree
      .then ->
        issues.repository = repository
        repository.issues().then issues.reset
        
        notices ["Finished loading!"]
      .fail ->
        errors ["Error loading #{repository.url()}"]
        
  "master <<": ->
    # Save to our current branch if we have unsaved changes
    Deferred.ExecuteIf(filetree.hasUnsavedChanges(), actions.save)
    .then ->
      notices ["Merging"]
      repository.mergeInto()
    .then ->
      notices ["Merged"]
      # TODO: Should CI build and deploy master branch?
      # Switch to master branch and deploy
      actions.load_repo(true)
      .then actions.save
      
    , (request) ->
      notices []
      errors [request.responseJSON or "Error merging"]

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
issues.repository = repository

issues.currentIssue.observe (issue) ->
  if issue
    notices [issue.fullDescription()]
    
    previousBranch = repository.branch()

    Deferred.ConfirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?")
    .then ->
      # Switch to branch for working on the issue
      repository.switchToBranch(issue.branchName())
      .then ->
        notices.push "\nLoading branch..."
        
        Actions.load
          repository: repository
          filetree: filetree
        .then ->
          notices.push "Loaded!"
    , ->
      # TODO: Issue will appear as being selected even though we cancelled
      # To correctly handle this we may need to really beef up our observables.
      # One possibility is to extend observables to full fledged deferreds
      # which can be rejected by listeners added to the chain.
      
      repository.branch(previousBranch)

  else
    notices ["No issue selected"]

# Load initial issues
repository.issues().then issues.reset

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

window.onbeforeunload = ->
  if filetree.hasUnsavedChanges()
    "You have some unsaved changes, if you leave now you will lose your work."
