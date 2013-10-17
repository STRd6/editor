Actions
=======

Trying to encapsulate our action button actions, but doing a poor job so far.

Some dependencies.

    Packager = require "packager"
    {readSourceConfig, arrayToHash} = require("./util")

    documenter = require("md")

    build = (builder, fileData) ->
      builder.build(fileData, PACKAGE.dependencies)

The primary actions of the editor. This should eventually become a mixin.

    publish = ({builder, fileData, repository}) ->
      build(builder, fileData)
      .then (pkg) ->
        repository.publish(Packager.standAlone(pkg))
        .then -> # Can't outdent because we need `pkg`
          documenter.documentAll(pkg)
        .then (docs) ->
          repository.commitTree
            tree: docs
            baseTree: true
            branch: repository.publishBranch()

    commit = ({fileData, repository, message}) ->
      repository.commitTree
        tree: fileData
        message: message

    Actions = (I={}, self) ->
      self.extend
        run: ({builder, filetree}) ->
          data = filetree.data()
  
          self.runInSandboxWindow configFor(data),
            build(builder, data)
            .then (pkg) ->
              Packager.standAlone pkg
            .then (files) ->
              content = index(files)?.content
  
        runDocs: ({builder, data, file}) ->
          file ?= "index"
  
          self.runInSandboxWindow docsConfig,
            build(builder, data)
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
  
        save: (params) ->
          commit(params)
          .then ->
            publish(params)
  
        test: ({builder, filetree}) ->
          data = filetree.data()
  
          self.runInSandboxWindow configFor(data),
            build(builder, data)
            .then (pkg) ->
              Packager.testScripts(pkg)
            .then (testScripts) ->
              # TODO: Editor should not have to return runner to run tests.
              html = self.runner().testsHtml(testScripts)

        load: ({filetree, repository}) ->
          # Decode all content in place
          processDirectory = (items) ->
            items.each (item) ->
              return item unless item.content
  
              item.content = Base64.decode(item.content)
              item.encoding = "raw"
  
          repository.latestContent()
          .then (results) ->
            files = processDirectory results
            filetree.load files

    module.exports = Actions

Helpers
-------

    configFor = (data) ->
      readSourceConfig(source: arrayToHash(data))

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
