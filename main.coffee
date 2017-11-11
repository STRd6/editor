require "cornerstone"
{processDirectory} = require "./source/util"

require("analytics").init("UA-3464282-15")

# Create and auth a github API
# Global until we consolidate editor/actions into something cleaner

global.github = require("github")()
require("./github_auth").then (token) ->
  github.token token
  github.api('rate_limit')

Editor = require("./editor")

editor = global.editor = Editor()

SystemClient = require "sys"
{postmaster} = client = SystemClient()

# We have a parent window, maybe it's our good friend ZineOS :)
if postmaster.remoteTarget()
  require("./lib/zineos-adapter")(editor, client)

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

document.body.appendChild require("./templates/editor")(
  filetree: filetree
  actions: editor.actions
  notifications: editor.notifications
  issues: issues
  github: github
  repository: repository
)

editor.include require "./ace_shim"

window.onbeforeunload = ->
  if filetree.hasUnsavedChanges()
    "You have some unsaved changes, if you leave now you will lose your work."
