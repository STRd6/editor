Runners
=======

Hold all the ways the editor can run things: apps, docs, tests, maybe more.

    Packager = require "packager"
    {PackageRunner, Sandbox} = require("runner")
    Tests = require "tests"
    documenter = require "md"

    module.exports = (I={}, self) ->
      runningInstances = []

      self.extend

Rebuild the package and send the reload message to the runner with the newest package.

        hotReload: ->
          self.build()
          .then (pkg) ->
            runningInstances.invoke "launch", pkg

Run some code in a sandboxed popup window. We need to popup the window immediately
in response to user input to prevent pop-up blocking so we also pass a promise
that will contain the content to render in the window. If the promise fails we
auto-close the window.

        runInSandboxWindow: (config, promise) ->
          sandbox = Sandbox config

          promise.then(
            (content) ->
              sandbox.document.open()
              sandbox.document.write(content)
              sandbox.document.close()
            , (error) ->
              sandbox.close()

              throw error
          )

        runInAppWindow: ->
          packageRunner = PackageRunner(self.config())

          self.build()
          .then(
            (pkg) ->
              runningInstances.push packageRunner

              packageRunner.window.addEventListener "unload", ->
                runningInstances.remove(packageRunner)

              packageRunner.launch(pkg)

              packageRunner
            , (error) ->
              packageRunner.close()

              return error
          )

        run: ->
          self.runInAppWindow()

        runDocs: ({file}) ->
          file ?= "index"

          self.runInSandboxWindow docsConfig,
            self.build()
            .then (pkg) ->
              documenter.documentAll(pkg)
            .then (docs) ->
              script = docs.first()

              path = script.path.split("/")
              path.pop()
              path.push("#{file}.html")
              path = path.join("/")

              if file = findFile(path, docs)
                file.content + "<script>#{script.content}<\/script>"
              else
                "Failed to find file at #{path}"

        test: ->
          self.runInSandboxWindow self.config(),
            self.build()
            .then (pkg) ->
              Packager.testScripts(pkg)
            .then (testScripts) ->

              # TODO: Editor should not have to return runner to run tests.
              html = Tests.html(testScripts)

Helpers
-------

    docsConfig =
      width: 1280
      height: 800

Get the `index.html` from a list of files.

    index = (files) ->
      files.filter (file) ->
        /index\.html$/.test file.path
      .first()

Find a file in a list of files by path.

    findFile = (path, files) ->
      files.filter (file) ->
        file.path is path
      .first()
