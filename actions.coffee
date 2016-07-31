{File} = require "filetree"
Issue = require("./issue")
Packager = require("./packager")
{readSourceConfig} = require("./source/util")
emoji = require "emojer"

actions =
  save: (editor) ->
    editor.notify "Saving..."

    message = "#{emoji()}#{emoji()} Updated at https://danielx.net/editor/"

    editor.save(message)
    .then ->
      # TODO: This could get slightly out of sync if there were changes
      # during the async call
      # The correct solution will be to use git shas to determine changed status
      # but that's a little heavy duty for right now.
      editor.filetree().markSaved()

      editor.publish(message)
    .then ->
      editor.notify "Saved and published!"
    .catch editor.errorCatcher

  run: (editor) ->
    editor.notify "Running..."

    editor.run()
    .catch editor.errorCatcher

  test: (editor) ->
    editor.notify "Running tests..."

    editor.test()
    .catch (e) ->
      editor.errors [].concat(e)

  docs: (editor) ->
    editor.notify "Running Docs..."

    if file = prompt("Docs file", "index")
      editor.runDocs({file})
      .catch (e) ->
        editor.errors [e]

  new_file: (editor) ->
    if name = prompt("File Name", "newfile.coffee")
      file = File
        path: name
        content: ""
      editor.filetree().files.push file
      editor.filetree().selectedFile file

  load_repo: (editor) ->
    editor.confirmUnsaved()
    .then ->
      currentRepositoryName = editor.repository().full_name()

      fullName = prompt("Github repo", currentRepositoryName)

      if fullName
        editor.notify "Loading repo data..."
        github.repository(fullName)
      else
        throw "No repo given"
    .then (repository) ->
      editor.notifications.push "Done!\nLoading files..."

      editor.repository repository
      editor.load repository
    .then ->
      editor.notifications.push "Done!"
      editor.closeOpenEditors()

    .catch editor.errorCatcher

  new_feature: (editor) ->
    if title = prompt("Description")
      editor.notify "Creating feature branch..."

      editor.repository().createPullRequest
        title: title
      .then (data) ->
        issue = Issue(data)
        issues = editor.issues
        issues.issues.push issue

        # TODO: Standardize this like backbone or something
        # or think about using deferreds in some crazy way
        issues.silent = true
        issues.currentIssue issue
        issues.silent = false

        editor.notifications.push "Created!"
      .catch editor.errorCatcher

  pull_master: (editor) ->
    editor.confirmUnsaved()
    .then ->
      editor.notify "Merging in default branch..."
      editor.repository().pullFromBranch()
    .then ->
      editor.notifications.push "Merged!"

      branchName = editor.repository().branch()
      editor.notifications.push "\nReloading branch #{branchName}..."

      editor.load
        repository: repository()
      .then ->
        editor.notifications.push "Loaded!"
      .catch ->
        editor.classicError "Error loading #{editor.repository().url()}"
    .catch editor.errorCatcher

  pull_upstream: (editor) ->
    editor.confirmUnsaved()
    .then ->
      editor.notify "Pulling from upstream master"

      upstreamRepo = editor.repository().parent().full_name

      github.repository(upstreamRepo)
      .then (repository) ->
        repository.latestContent()
      .then (results) ->
        files = processDirectory results
        editor.loadFiles files
    .then ->
      editor.notifications.push "\nYour code is up to date with the upstream master"
      editor.closeOpenEditors()
    .catch editor.errorCatcher

  tag_version: (editor) ->
    editor.notify "Building..."

    editor.build()
    .then (pkg) ->
      version = "v#{readSourceConfig(pkg).version}"

      editor.notify "Tagging version #{version} ..."

      editor.repository().createRef("refs/tags/#{version}")
      .then ->
        editor.notifications.push "Tagged #{version}"
        editor.notifications.push "\nPublishing..."

        # Force branch for jsonp wrapper
        pkg.repository.branch = version

        editor.repository().publish Packager.standAlone(pkg), version
    .then ->
      editor.notifications.push "Published!"

    .catch editor.errorCatcher

module.exports = (I={}, self) ->
  self.actions = Observable []

  self.extend
    addAction: (name, fn) ->
      self.actions.push
        name: name
        handler: ->
          fn(self)

  Object.keys(actions).forEach (key) ->
    self.addAction key, actions[key]

  return self
