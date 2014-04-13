Actions
=======

Trying to encapsulate our action button actions, but doing a poor job so far.

Some dependencies.

    Packager = require "packager"
    {processDirectory} = require "./util"
    Tests = require "tests"

    documenter = require("md")

The primary actions of the editor. This is a mixin that is included in the editor.

    Actions = (I={}, self) ->
      self.extend

        run: ->
          self.runInSandboxWindow self.config(),
            self.build()
            .then (pkg) ->
              Packager.standAlone pkg
            .then (files) ->
              content = index(files)?.content

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

        publish: ->
          self.build()
          .then (pkg) ->
            documenter.documentAll(pkg)
            .then (docs) ->
              # NOTE: This metadata is added from the builder
              publishBranch = pkg.repository.publishBranch

              # TODO: Don't pass files to packager, just merge them at the end
              # TODO: Have differenty types of building (docs/main) that can
              # be chosen in a config rather than hacks based on the branch name
              repository = self.repository()
              if repository.branch() is "blog" # HACK
                self.repository().publish(docs, undefined, publishBranch)
              else
                self.repository().publish(Packager.standAlone(pkg, docs), undefined, publishBranch)

        test: ->
          self.runInSandboxWindow self.config(),
            self.build()
            .then (pkg) ->
              Packager.testScripts(pkg)
            .then (testScripts) ->
              
              # TODO: Editor should not have to return runner to run tests.
              html = Tests.html(testScripts)

        load: ({repository}) ->
          repository.latestContent()
          .then (results) ->
            self.repository repository

            files = processDirectory results
            self.loadFiles files

    module.exports = Actions

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

Process results returned from Github API.
