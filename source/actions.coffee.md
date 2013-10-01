Actions
=======

Trying to encapsulate our action button actions, but doing a poor job so far.

Some dependencies.

    Packager = require "packager"
    Runner = require("./runner")
    TestRunner = require("test_runner")
    {readSourceConfig, arrayToHash} = require("./util")

    documenter = require("md")

The primary actions of the editor. This should eventually become a mixin.

    publish = ({builder, fileData, repository}) ->
      builder.build(fileData)
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

        builder.build(data)
        .then (pkg) ->
          Packager.standAlone pkg
        .then ({html}) ->
          sandbox.document.open()
          sandbox.document.write(html)
          sandbox.document.close()

      save: (params) ->
        commit(params)
        .then ->
          publish(params)

      test: ({builder, filetree}) ->
        sandbox = Runner.run
          config: readSourceConfig(PACKAGE)

        builder.build(filetree.data())
        .then (pkg) ->
          Packager.testScripts(pkg)
        .then (testScripts) ->
          html = TestRunner.html(testScripts)
          sandbox.document.open()
          sandbox.document.write(html)
          sandbox.document.close()

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
