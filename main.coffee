# Get stuff from our env
{source:files, distribution} = ENV

# For debugging
window.ENV = ENV

# TODO: Move notifications stuff into its own class
classicError = (request) ->
  notices []
  
  if request.responseJSON
    message = JSON.stringify(request.responseJSON, null, 2)
  else
    message = "Error"

  errors [message]

notify = (message) ->
  notices [message]
  errors []

# The root is the node that contains the script file.
$root = $(Runtime(ENV).boot())

# Init Github access token stuff
Gistquire.onload()
  
# Real branch and repo info, from ENV
{owner, repo, branch, full_name:fullName} = ENV.repository

fullName ||= "#{owner}/#{repo}"

repository = Repository
  url: "repos/#{fullName}"

errors = Observable([])
notices = Observable(["Loaded!"])

builder = Builder
  errors: errors
  notices: notices

repositoryLoaded = (repository) ->
  issues.repository = repository
  repository.pullRequests().then issues.reset
  
  notices ["Finished loading!"]
  
confirmUnsaved = ->
  Deferred.ConfirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?")

issues = Issues()

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
    .fail errors

  test: ->
    notify "Running tests..."

    builder.testScripts(filetree.data())
    .then (testScripts) ->
      TestRunner.launch(testScripts)
    .fail errors

  new_file: ->
    if name = prompt("File Name", "newfile.coffee")
      file = File
        filename: name
        content: ""
      filetree.files.push file
      filetree.selectedFile file      

  load_repo: (skipPrompt) ->
    confirmUnsaved()
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
        repositoryLoaded(repository)
        
        root = $root.children(".main")
        root.find(".editor-wrap").remove()
      .fail ->
        errors ["Error loading #{repository.url()}"]
        
  new_feature: ->
    if title = prompt("Description")
      notices ["Creating feature branch..."]
    
      repository.createPullRequest
        title: title
      .then (data) ->
        issue = Issue(data)
        issues.issues.push issue

        # TODO: Standardize this like backbone or something
        # or think about using deferreds in some crazy way
        issues.silent = true
        issues.currentIssue issue
        issues.silent = false

        notices.push "Created!"
      , classicError
      
  pull_master: ->
    confirmUnsaved()
    .then( ->
      notify "Merging in default branch..."
      repository.pullFromBranch()
    , classicError
    ).then ->
      notices.push "Merged!"
      
      branchName = repository.branch()
      notices.push "\nReloading branch #{branchName}..."
        
      Actions.load
        repository: repository
        filetree: filetree
      .then ->
        notices.push "Loaded!"

filetree = Filetree()
filetree.load(files)

filetree.selectedFile.observe (file) ->
  root = $root.children(".main")
  root.find(".editor-wrap").hide()
  
  if file.editor
    file.editor.trigger("show")
  else
    root.append(HAMLjr.render "text_editor")
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
      
      # TODO May want to move this into a collection listener for all files
      # in the filetree
      if file.path().match(/\.styl$/)
        hotReloadCSS()

hotReloadCSS = (->
  builder.buildStyle(filetree.data())
  .then Runner.hotReloadCSS
).debounce(500)

repositoryLoaded(repository)

issues.currentIssue.observe (issue) ->
  # TODO: Formalize this later
  return if issues.silent
  
  changeBranch = (branchName) ->
    previousBranch = repository.branch()

    confirmUnsaved()
    .then ->
      # Switch to branch for working on the issue
      repository.switchToBranch(branchName)
      .then ->
        notices.push "\nLoading branch #{branchName}..."
        
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

      errors ["Error switching to #{branchName}, still on #{previousBranch}"]

  if issue
    notify issue.fullDescription()
    
    changeBranch issue.branchName()
  else    
    notify "Default branch selected"
    
    changeBranch repository.defaultBranch()

$root
  .append(HAMLjr.render "editor",
    filetree: filetree
    actions: actions
    notices: notices
    errors: errors
    issues: issues
  )

Gistquire.api("rate_limit")
.then (data, status, request) ->
  $root.append HAMLjr.render "github_status",
    request: request

window.onbeforeunload = ->
  if filetree.hasUnsavedChanges()
    "You have some unsaved changes, if you leave now you will lose your work."
