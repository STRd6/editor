    Runner = require("./runner")

The primary actions of the editor. This should eventually become a mixin.

    publish = ({builder, fileData, repository}) ->
      
        builder.build(fileData)
        .then (build) ->
          branch = repository.branch()
    
          repository.publish builder.standAlone(build, branch)
    
    commit = ({fileData, repository, message}) ->
      repository.commitTree
        tree: fileData
        message: message

    Actions =
      save: (params) ->
        commit(params)
        .then ->
          publish(params)
    
      run: ({builder, filetree}) ->
        builder.runnable(filetree.data())
        .then Runner.run

      load: ({filetree, repository}) ->
        # Decode all content in place
        processDirectory = (items) ->
          items.each (item) ->
            return item unless item.content
    
            item.content = Base64.decode(item.content)
            item.encoding = "raw"
    
        repository.latestTree()
        .then (results) ->
          files = processDirectory results
          filetree.load files

    if module?
      module.exports = Actions
    else
      window.Actions = Actions