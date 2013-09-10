publish = ({builder, fileData, repository}) ->
  
    builder.build(fileData)
    .then (build) ->
      branch = repository.branch()

      repository.publish builder.standAlone(build, branch)

commit = ({fileData, repository, message}) ->
  repository.commitTree
    tree: fileData
    message: message

@Actions =
  save: (params) ->
    commit(params)
    .then ->
      publish(params)

  run: ({builder, filetree}) ->
    builder.build(filetree.data())
    .then (build) ->
      if configData = build.source["pixie.json"]?.content
        config = JSON.parse(configData)
      else
        config = {}
      
      html = builder.standAlone(build).html
      
      sandbox = Sandbox
        width: config.width
        height: config.height

      sandbox.document.open()
      sandbox.document.write(html)
      sandbox.document.close()

      builder.I.notices? ["Running!"]
      # TODO: Catch and display runtime errors

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
