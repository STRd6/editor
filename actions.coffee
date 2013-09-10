publish = ({builder, fileData, repository}) ->
  branch = repository.branch()
  message = "Built #{branch} in browser in strd6.github.io/tempest"

  if branch is "master"
    path = "index.html"
  else
    path = "#{branch}.html"

  # Assuming git repo with gh-pages branch
  publishBranch = "gh-pages"

  builder.build(fileData)
  .then (build) ->
    # create <ref>.html in gh-pages branch
    repository.writeFile
      path: path
      content: Base64.encode(builder.standAloneHtml(build))
      branch: publishBranch
      message: message

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
      
      sandbox = Sandbox
        width: config.width
        height: config.height
      
      sandbox.document.open()
      sandbox.document.write(builder.standAloneHtml(build))

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
