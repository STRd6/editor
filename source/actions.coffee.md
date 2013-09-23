Some dependencies.

    packager = require("./packager")()
    Runner = require("./runner")
    TestRunner = require("test_runner")
    {readSourceConfig} = require("./util")

The primary actions of the editor. This should eventually become a mixin.

    publish = ({builder, fileData, repository}) ->
      builder.build(fileData)
      .then (build) ->
        repository.publish packager.standAlone(build)
    
    commit = ({fileData, repository, message}) ->
      repository.commitTree
        tree: fileData
        message: message

    Actions =
      run: ({builder, filetree}) ->
        sandbox = Runner.run
          config: readSourceConfig(PACKAGE)

        builder.runnable(filetree.data())
        .then ({html}) ->
          sandbox.document.open()
          sandbox.document.write(html)
          sandbox.document.close()

      save: (params) ->
        commit(params)
        .then ->
          publish(params)

      releaseTag: ({repository}) ->
        version = readSourceConfig(PACKAGE).version
        repository.createRef("v#{version}")
        .then (data) ->
          packager.standAlone(PACKAGE)

      test: ({builder, filetree}) ->
        sandbox = Runner.run
          config: readSourceConfig(PACKAGE)

        builder.build(filetree.data())
        .then (pkg) ->
          packager.testScripts(pkg)
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
