require "cornerstone"
{processDirectory} = require "./source/util"

require("analytics").init("UA-3464282-15")

GitHubStatusPresenter = require("./presenters/github-status")

global.github = require("github")()

Editor = require("./editor")
editor = global.editor = Editor()

# Connect to ZineOS if available altering editor as needed
# in any case call editor.read when done
require("./lib/zineos-adapter")(editor)

if pkg = ENV?.APP_STATE
  editor.loadPackage(pkg)
else
  editor.loadPackage(PACKAGE)

global.appData = ->
  editor.loadedPackage()

# TODO: Don't expose this
filetree = editor.filetree()

styleNode = document.createElement("style")
styleNode.innerHTML = require('./style')
document.head.appendChild(styleNode)

# Branch Chooser using pull requests
Issue = require "./models/issue"
Issues = require "./models/issues"
issues = editor.issues = Issues()

# Github repository observable
# TODO: Finalize move into editor module
repository = editor.repository

updateIssues = (repository) ->
  issues.repository = repository
  repository.pullRequests().then issues.reset

repository.observe updateIssues

# TODO: Make better use of observables and computed functions so we no
# longer need this setTimeout hack
setTimeout ->
  repository github.Repository(editor.loadedPackage().repository)
, 0

issues?.currentIssue.observe (issue) ->
  # TODO: Formalize this later
  return if issues.silent

  changeBranch = (branchName) ->
    previousBranch = repository().branch()

    editor.confirmUnsaved()
    .then ->
      editor.closeOpenEditors()

      # Switch to branch for working on the issue
      repository().switchToBranch(branchName)
      .then ->
        editor.notifications.push "\nLoading branch #{branchName}..."

        editor.load repository()
        .then ->
          editor.notifications.push "Loaded!"
    , ->
      # TODO: Issue will appear as being selected even though we cancelled
      # To correctly handle this we may need to really beef up our observables.
      # One possibility is to extend observables to full fledged deferreds
      # which can be rejected by listeners added to the chain.

      repository().branch(previousBranch)

      editor.classicError "Error switching to #{branchName}, still on #{previousBranch}"

  if issue?.branchName?
    editor.notify issue.fullDescription()

    changeBranch issue.branchName()
  else
    editor.notify "Default branch selected"

    changeBranch repository().defaultBranch()

editor.include require "./modules/ace-shim"

document.body.appendChild require("./templates/editor")(
  filetree: filetree
  actions: editor.actions
  notifications: editor.notifications
  issues: issues
  github: GitHubStatusPresenter github
  repository: repository
  editorElement: editor.editorElement
)

window.onbeforeunload = ->
  if filetree.hasUnsavedChanges()
    "You have some unsaved changes, if you leave now you will lose your work."
