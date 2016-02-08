Runners
=======

Hold all the ways the editor can run things: apps, docs, tests, maybe more.

    Packager = require "packager"
    {PackageRunner} = Runner = require("runner")
    documenter = require "md"

    module.exports = (I={}, self) ->
      runningInstances = []

      self.extend

Rebuild the package and send the reload message to the runner with the newest package.

        hotReload: ->
          self.build()
          .then (pkg) ->
            runningInstances.invoke "launch", pkg

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

              throw error
          )

        run: ->
          self.runInAppWindow()

        runDocs: ({file}) ->
          file ?= "index"

          Runner.openWindowWithContent docsConfig,
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
          Runner.openWindowWithContent self.config(),
            self.build()
            .then (pkg) ->
              Packager.testScripts(pkg)
            .then (testScripts) ->
              html = testsHtml(testScripts)

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

Tests html template.

    testsHtml = (testScripts) -> """
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mocha Tests</title>
        <link rel="stylesheet" href="https://distri.github.io/tests/mocha.css" />
      </head>
      <body>
        <div id="mocha"></div>
        <script src="https://distri.github.io/tests/assert.js"><\/script>
        <script src="https://distri.github.io/tests/mocha.js"><\/script>
        <script>mocha.setup('bdd')<\/script>
        #{testScripts}
        <script>
          mocha.checkLeaks();
          mocha.globals(['jQuery']);
          mocha.run();
        <\/script>
      </body>
      </html>
    """
