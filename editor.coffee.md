Editor
======

    Runners = require "./runners"
    Actions = require("./source/actions")
    Builder = require("builder")
    Packager = require("packager")
    {Filetree, File} = require("filetree")

    initBuilder = ->
      builder = Builder()

      # Add editor's metadata
      builder.addPostProcessor (pkg) ->
        pkg.progenitor =
          url: document.location.href

      # Add metadata from our config
      builder.addPostProcessor (pkg) ->
        config = readSourceConfig(pkg)

        pkg.version = config.version
        pkg.entryPoint = config.entryPoint or "main"
        pkg.remoteDependencies = config.remoteDependencies

      return builder

    module.exports = (I={}, self=Model(I)) ->
      builder = initBuilder()
      filetree = Filetree()

      self.extend
        repository: Observable()

Build the project, returning a promise that will be fulfilled with the `pkg`
when complete.

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

        save: ->
          self.repository().commitTree
            tree: filetree.data()

        loadFiles: (fileData) ->
          filetree.load fileData

Currently we're exposing the filetree though in the future we shouldn't be.

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

Likewise we shouldn't expose the builder directly either.

        builder: ->
          builder

        config: ->
          readSourceConfig(source: arrayToHash(filetree.data()))

      self.include(Runners)
      self.include(Actions)

      # TODO: Merge this in and clean up the `initBuilder` code
      # Attach repo metadata to package
      builder.addPostProcessor (pkg) ->
        repository = self.repository()
        # TODO: Track commit SHA as well
        pkg.repository = repository.toJSON()

        # Add publish branch
        pkg.repository.publishBranch = self.config().publishBranch or repository.publishBranch()

        pkg

      return self

Helpers
-------

    {readSourceConfig, arrayToHash} = require("./source/util")

