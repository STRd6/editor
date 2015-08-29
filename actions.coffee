actions =
  save: (editor) ->
    editor.notify "Saving..."

    editor.save()
    .then ->
      # TODO: This could get slightly out of sync if there were changes
      # during the async call
      # The correct solution will be to use git shas to determine changed status
      # but that's a little heavy duty for right now.
      filetree.markSaved()

      editor.publish()
    .then ->
      editor.notify "Saved and published!"
    .fail (args...) ->
      editor.errors args
    .done()

  run: (editor) ->
    editor.notify "Running..."

    editor.run()
    .fail editor.classicError
    .done()

  test: (editor) ->
    editor.notify "Running tests..."

    editor.test()
    .fail (e) ->
      editor.errors [].concat(e)
    .done()

  docs: (editor) ->
    editor.notify "Running Docs..."

    if file = prompt("Docs file", "index")
      editor.runDocs({file})
      .fail editor.errors
      .done()

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
        github.repository(fullName).then repository
      else
        Q.fcall -> throw "No repo given"
    .then (repositoryInstance) ->
      editor.notify "Loading files..."

      editor.load
        repository: repositoryInstance
      .then ->
        editor.closeOpenEditors()

        editor.notifications.push "Loaded"
    .fail editor.classicError
    .done()

  new_feature: (editor) ->
    if title = prompt("Description")
      editor.notify "Creating feature branch..."

      editor.repository().createPullRequest
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
      , editor.classicError
      .done()

  pull_master: (editor) ->
    editor.confirmUnsaved()
    .then( ->
      editor.notify "Merging in default branch..."
      repository().pullFromBranch()
    , classicError
    ).then ->
      notifications.push "Merged!"

      branchName = repository().branch()
      notifications.push "\nReloading branch #{branchName}..."

      editor.load
        repository: repository()
      .then ->
        notifications.push "Loaded!"
      .fail ->
        editor.classicError "Error loading #{repository().url()}"
    .done()

  pull_upstream: (editor) ->
    editor.confirmUnsaved()
    .then( ->
      editor.notify "Pulling from upstream master"

      upstreamRepo = repository().parent().full_name

      github.repository(upstreamRepo)
      .then (repository) ->
        repository.latestContent()
      .then (results) ->
        files = processDirectory results
        editor.loadFiles files

    , classicError
    ).then ->
      notifications.push "\nYour code is up to date with the upstream master"
      closeOpenEditors()
    .done()

  tag_version: (editor) ->
    editor.notify "Building..."

    editor.build()
    .then (pkg) ->
      version = "v#{readSourceConfig(pkg).version}"

      editor.notify "Tagging version #{version} ..."

      repository().createRef("refs/tags/#{version}")
      .then ->
        notifications.push "Tagged #{version}"
      .then ->
        notifications.push "\nPublishing..."

        # Force branch for jsonp wrapper
        pkg.repository.branch = version

        repository().publish Packager.standAlone(pkg), version
      .then ->
        notifications.push "Published!"

    .fail editor.classicError
    .done()

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
