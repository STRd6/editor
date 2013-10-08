Actions
=======

Trying to encapsulate our action button actions, but doing a poor job so far.

Some dependencies.

    Packager = require "packager"
    Runner = require("./runner")
    TestRunner = require("test_runner")
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

    Actions =
      run: ({builder, filetree}) ->
        data = filetree.data()

        sandbox = Runner.run
          config: readSourceConfig(source: arrayToHash(data))

        build(builder, data)
        .then (pkg) ->
          Packager.standAlone pkg
        .then (files) ->
          content = index(files)?.content

          sandbox.document.open()
          sandbox.document.write(content)
          sandbox.document.close()

      runDocs: ({builder, data}) ->
        sandbox = Runner.run
          config:
            width: 1280
            height: 800

        build(builder, data)
        .then (pkg) ->
          documenter.documentAll(pkg)
        .then (docs) ->
          content = index(docs)?.content

          sandbox.document.open()
          sandbox.document.write(content)
          sandbox.document.close()

      save: (params) ->
        commit(params)
        .then ->
          publish(params)

      test: ({builder, filetree}) ->
        runSandboxed readSourceConfig(PACKAGE),
          build(builder, filetree.data())
          .then (pkg) ->
            Packager.testScripts(pkg)
          .then (testScripts) ->
            html = TestRunner.html(testScripts)

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

    runSandboxed = (config, promise) ->
      sandbox = Runner.run
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

Get the `index.html` from a list of files.

    index = (files) ->
      files.filter (file) ->
        /index\.html$/.test file.path
      .first()
