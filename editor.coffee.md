Editor
======

    Runner = require("runner")
    Actions = require("./source/actions")
    Builder = require("builder")
    {Filetree} = require("filetree")

    initBuilder = ->
      builder = Builder()

      builder.addPostProcessor (pkg) ->
        pkg.progenitor =
          url: "http://strd6.github.io/editor/"

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

Build the project, returning a promise that will be fulfilled with the `pkg`
when complete.

        build: ->
          data = filetree.data()
          # TODO: We may want a more robust dependency cache
          dependencyCache = PACKAGE.dependencies

          builder.build(data, dependencyCache)

        save: ({repository}) ->
          repository.commitTree
            tree: filetree.data()

        loadFiles: (fileData) ->
          filetree.load fileData

Currently we're exposing the filetree though in the future we shouldn't be.

        filetree: ->
          filetree

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

      return self

Helpers
-------

    {readSourceConfig, arrayToHash} = require("./source/util")
