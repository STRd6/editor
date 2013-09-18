# Get stuff from our package
{source:files} = PACKAGE

global.Sandbox = require 'sandbox'
require("./source/duct_tape")
require("./source/deferred")

# Load and attach Templates
templates = (HAMLjr.templates ||= {})
[
  "actions"
  "editor"
  "filetree"
  "github_status"
  "text_editor"
  "repo_info"
].each (name) ->
  template = require("./templates/#{name}")
  # TODO Transitional type check
  if typeof template is "function"
    templates[name] = template

Actions = require("./source/actions")
Builder = require("./source/builder")
Runner = require("./source/runner")
Runtime = require("./source/runtime")
Gistquire = require("./source/gistquire")
Repository = require("./source/repository")
Filetree = require("./source/filetree")
File = require("./source/file")
TextEditor = require("./source/text_editor")

notifications = require("notifications")()
templates.notifications = notifications.template
{classicError, notify, errors} = notifications

# The root is the node that contains the script file.
runtime = Runtime(PACKAGE)
rootNode = runtime.boot()

try
  runtime.applyStyleSheet(rootNode, '/style')

$root = $(rootNode)

# Init Github access token stuff
Gistquire.onload()

# Real branch and repo info, from package
{owner, repo, branch, full_name:fullName} = PACKAGE.repository

fullName ||= "#{owner}/#{repo}"

repository = Repository
  fullName: fullName
  url: "repos/#{fullName}"
  branch: branch

builder = Builder()

repositoryLoaded = (repository) ->
  issues.repository = repository
  repository.pullRequests().then issues.reset
  
  notify "Finished loading!"
  
confirmUnsaved = ->
  Deferred.ConfirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?")

{models:{Issue, Issues}, templates:{issues:issuesTemplate}} = require("issues")
templates["issues"] = issuesTemplate
issues = Issues()

# Attach repo metadata to package
builder.addPostProcessor (pkg) ->
  # TODO: Track commit SHA as well
  pkg.repository =
    full_name: fullName
    branch: repository.branch()

  pkg

builder.addPostProcessor (pkg) ->
  # TODO: Think about a robust way to get 'self' and set it as progenitor data
  pkg.progenitor =
    url: "http://strd6.github.io/editor/"

  pkg

actions =
  save: ->
    notify "Saving..."

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
      notify "Saved and published!"
    .fail (args...) ->
      errors args

  run: ->
    Actions.run({builder, filetree})
    .fail errors

  test: ->
    notify "Running tests..."

    Actions.test({builder, filetree})
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
        classicError "No repo given"
  
        return
  
      notify "Loading repo..."
  
      Actions.load
        repository: repository
        filetree: filetree
      .then ->
        repositoryLoaded(repository)
        
        root = $root.children(".main")
        root.find(".editor-wrap").remove()
      .fail classicError

  new_feature: ->
    if title = prompt("Description")
      notify "Creating feature branch..."

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

        notifications.push "Created!"
      , classicError
      
  pull_master: ->
    confirmUnsaved()
    .then( ->
      notify "Merging in default branch..."
      repository.pullFromBranch()
    , classicError
    ).then ->
      notifications.push "Merged!"
      
      branchName = repository.branch()
      notifications.push "\nReloading branch #{branchName}..."
        
      Actions.load
        repository: repository
        filetree: filetree
      .then ->
        notifications.push "Loaded!"
      .fail ->
        classicError "Error loading #{repository.url()}"

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
        hotReloadCSS(file)

hotReloadCSS = ( (file) ->
  css = styl(file.content(), whitespace: true).toString()

  Runner.hotReloadCSS(css, file.path())
).debounce(500)

repositoryLoaded(repository)

issues?.currentIssue.observe (issue) ->
  # TODO: Formalize this later
  return if issues.silent
  
  changeBranch = (branchName) ->
    previousBranch = repository.branch()

    confirmUnsaved()
    .then ->
      # Switch to branch for working on the issue
      repository.switchToBranch(branchName)
      .then ->
        notifications.push "\nLoading branch #{branchName}..."
        
        Actions.load
          repository: repository
          filetree: filetree
        .then ->
          notifications.push "Loaded!"
    , ->
      # TODO: Issue will appear as being selected even though we cancelled
      # To correctly handle this we may need to really beef up our observables.
      # One possibility is to extend observables to full fledged deferreds
      # which can be rejected by listeners added to the chain.
      
      repository.branch(previousBranch)

      classicError "Error switching to #{branchName}, still on #{previousBranch}"

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
    notifications: notifications
    issues: issues
    repository: repository
  )

Gistquire.api("rate_limit")
.then (data, status, request) ->
  $root.append HAMLjr.render "github_status",
    request: request

window.onbeforeunload = ->
  if filetree.hasUnsavedChanges()
    "You have some unsaved changes, if you leave now you will lose your work."
