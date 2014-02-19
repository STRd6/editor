Editor
======

    Runner = require("runner")
    Actions = require("./source/actions")
    Builder = require("builder")
    Packager = require("packager")
    {Filetree, File} = require("filetree")

    initBuilder = ->
      builder = Builder()

      # Add editor's metadata
      builder.addPostProcessor (pkg) ->
        pkg.progenitor =
          url: "http://strd6.github.io/editor/"

      # Add metadata from our config
      builder.addPostProcessor (pkg) ->
        config = readSourceConfig(pkg)

        pkg.version = config.version
        pkg.entryPoint = config.entryPoint or "main"
        pkg.remoteDependencies = config.remoteDependencies

      return builder

    module.exports = (I={}, self=Model(I)) ->
      runner = Runner()
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

            # TODO: Robustify bundled dependencies
            # Right now we're always loading them from remote urls during the
            # build step. The default http caching is probably fine to speed this
            # up, but we may want to look into keeping our own cache during dev
            # in addition to using the package's existing dependencies rather
            # than always updating
            dependencies = config.dependencies or {}

            # TODO: We will want a more robust dependency cache instead of just
            # grabbing our own package's dependencies
            Packager.collectDependencies(dependencies, PACKAGE.dependencies)
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

        # TODO: Don't expose this, instead expose things like `runDocs`, `runTests`, etc.
        runner: ->
          runner

Run some code in a sandboxed popup window. We need to popup the window immediately
in response to user input to prevent pop-up blocking so we also pass a promise
that will contain the content to render in the window. If the promise fails we
auto-close the window.

        runInSandboxWindow: (config, promise) ->
          sandbox = runner.run
            config: config

          promise.then(
            (content) ->
              sandbox.document.open()
              sandbox.document.write(content)
              sandbox.document.close()
            , (error) ->
              sandbox.close()

              return error
          )

      self.include(Actions)

      # TODO: Merge this in and clean up the `initBuilder` code
      # Attach repo metadata to package
      builder.addPostProcessor (pkg) ->
        # TODO: Track commit SHA as well
        pkg.repository = self.repository().toJSON()

        pkg

      return self

Helpers
-------

    {readSourceConfig, arrayToHash} = require("./source/util")
