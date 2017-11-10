Sandbox = require "./lib/sandbox"
{html, testScripts} = Packager = require "./packager"
{executePackageWrapper} = require "require"

documenter = require "md"

module.exports = (I={}, self) ->
  runningInstances = []

  self.extend
    runPackageInAppWindow: (pkg, popup) ->
      navigateToBlobURL popup, html(pkg, executePackageWrapper)

    run: ->
      popup = Sandbox()

      self.build()
      .then (pkg) ->
        self.runPackageInAppWindow(pkg, popup)

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
      popup = Sandbox()

      self.build()
      .then (pkg) ->
        testScripts(pkg)
      .then (testScripts) ->
        navigateToBlobURL popup, testsHtml(testScripts)

navigateToBlobURL = (popup, htmlSource) ->
  blob = new Blob [htmlSource], 
    type: "text/html; charset=utf-8"
  url = URL.createObjectURL(blob)

  popup.location.href = url

docsConfig =
  width: 1280
  height: 800

index = (files) ->
  files.filter (file) ->
    /index\.html$/.test file.path
  .first()

findFile = (path, files) ->
  files.filter (file) ->
    file.path is path
  .first()

testsHtml = (testScripts) -> """
  <html>
  <head>
    <meta charset="utf-8">
    <title>Mocha Tests</title>
    <link rel="stylesheet" href="https://unpkg.com/mocha@2.5.3/mocha.css" />
  </head>
  <body>
    <div id="mocha"></div>
    <script src="https://distri.github.io/tests/assert.js"><\/script>
    <script src="https://unpkg.com/mocha@2.5.3/mocha.js"><\/script>
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
