Runners = require "./runners"
Actions = require("./actions")
Builder = require("./source/builder")
Packager = require("./packager")
{Filetree, File} = require("filetree")
{processDirectory} = require "./source/util"

loadedPackage = Observable null

initBuilder = (self) ->
  builder = Builder()

  # Add editor's metadata
  builder.addPostProcessor (pkg) ->
    pkg.progenitor =
      url: document.location.href

  # Add metadata from our config
  builder.addPostProcessor (pkg) ->
    config = readSourceConfig(pkg)

    pkg.config = config
    pkg.version = config.version
    pkg.entryPoint = config.entryPoint or "main"
    pkg.remoteDependencies = config.remoteDependencies

  # Attach repo metadata to package
  builder.addPostProcessor (pkg) ->
    repository = self.repository()

    # TODO: Track commit SHA as well
    pkg.repository = cleanRepositoryData repository.toJSON()

    # Add publish branch
    pkg.repository.publishBranch = self.config().publishBranch or repository.publishBranch()

  return builder

module.exports = (I={}, self=Model(I)) ->
  builder = initBuilder(self)
  filetree = Filetree()

  notifications = require("notifications")()
  {classicError, notify, errors} = notifications
  extend self,
    classicError: classicError
    notify: notify
    errors: errors
    notifications: notifications
    errorCatcher: (e) ->
      if e.status and e.statusText
        editor.errors ["#{e.status} - #{e.statusText}"]
      else if e.stack
        editor.errors [e.stack]
      else
        editor.errors [e]
    findRegex: Observable "regex"

  self.extend
    repository: Observable()

    confirmUnsaved: ->
      Promise.resolve()
      .then ->
        if filetree.hasUnsavedChanges()
          throw "Cancelled" unless window.confirm "You will lose unsaved changes in your current branch, continue?"

    publish: (message) ->
      self.build()
      .then (pkg) ->
        # If the project defines a custom publish script execute it
        # TODO: Security :P
        # We'll want to prompt to ask if we can run untrusted code
        # though this requires a user taking action to save anyway.
        # We can sandbox this with an iframe to mitigate.
        publishScript = pkg.distribution._publish
        if publishScript
          code = require.packageWrapper(pkg, 'return require("./_publish")').replace(/^;/, "return ")
          publisher = Function(code)()
        else
          # Use the editor's default publish script
          publisher = require "./_publish"

        publisher(pkg, self)
        # TODO: Revist docs

    load: (repository) ->
      repository.latestContent()
      .then (results) ->
        self.loadPackage
          repository: cleanRepositoryData repository.toJSON()
          source: processDirectory results

    # Build the project, returning a promise that will be fulfilled with
    # the `pkg` when complete.
    build: ->
      data = filetree.data()

      builder.build(data)
      .then (pkg) ->
        config = readSourceConfig(pkg)

        dependencies = config.dependencies or {}

        Packager.collectDependencies(dependencies)
        .then (dependencies) ->
          pkg.dependencies = dependencies

          return pkg

    loadedPackage: loadedPackage

    save: (message) ->
      self.repository().commitTree
        tree: filetree.data()
        message: message

    dependencies: ->
      loadedPackage().dependencies

    exploreDependency: (name) ->


    loadPackage: (pkg) ->
      loadedPackage pkg

      filetree.load pkg.source

      pkg

    loadFiles: (fileData) ->
      filetree.load fileData

    filetree: ->
      filetree

    files: ->
      filetree.files()

    fileAt: (path) ->
      self.files().select (file) ->
        file.path() is path
      .first()

    fileContents: (path) ->
      self.fileAt(path)?.content()

    filesMatching: (expr) ->
      self.files().select (file) ->
        file.path().match expr

    findInFiles: (expr) ->
      regexp = new RegExp(expr, "ig")
      matches = []
      totalMatches = 0
      maxMatches = 100

      self.files().forEach (file) ->
        return if totalMatches >= maxMatches

        content = file.content()
        while result = regexp.exec(content)
          totalMatches += 1
          match = result[0]
          location = regexp.lastIndex - match.length
          line = lineFromPosition(content, location)
          matches.push [file, match, line]

          return if totalMatches >= maxMatches
        return

      return matches

    writeFile: (path, content) ->
      if existingFile = self.fileAt(path)
        existingFile.content(content)

        return existingFile
      else
        file = File
          path: path
          content: content

        filetree.files.push(file)

        return file

    builder: ->
      builder

    config: ->
      readSourceConfig(source: arrayToHash(filetree.data()))

    plugin: (pluginJSON) ->
      self.include require(pluginJSON)

  self.include(Runners)
  self.include(Actions)

  extend require("postmaster")(),
    load: self.loadPackage
    plugin: self.plugin

  return self

# Helpers

{readSourceConfig, arrayToHash} = require("./source/util")

pick = (object, keys...) ->
  result = {}

  keys.forEach (key) ->
    if key of object
      result[key] = object[key]

  return result

cleanRepositoryData = (data) ->
  pick data, "branch", "default_branch", "full_name", "homepage", "description", "html_url", "url"

lineFromPosition = (str, pos) ->
  lines = str.substr(0, pos).match(/[\n\r]/g)

  lines?.length or 0
