@Repository = (I={}) ->
  Object.defaults I,
    branch: "master"
    defaultBranch: "master"

  self = Model(I).observeAll()
  
  # The currently active branch in the working copy
  self.attrObservable "branch"
  
  # TODO: Extract all of these methods to an API generator
  requestOptions = (type, data) ->
    type: type
    data: JSON.stringify(data)

  api = (path, options) ->
    if path.match /^http/
      url = path
    else
      url = "#{self.url()}/#{path}"
          
    Gistquire.api url, options

  get = (path, data) ->
    api path, data: data

  put = (path, data) ->
    api(path, requestOptions("PUT", data))
    
  post = (path, data) ->
    api(path, requestOptions("POST", data))
    
  patch = (path, data) ->
    api path, requestOptions("PATCH", data)

  self.extend
    pullRequests: ->
      get "pulls"

    createPullRequest: ({title}) ->
      head = title.dasherize()

      self.switchToBranch(head)
      .then(self.commitEmpty)
      .then ->
        post "pulls",
          base: I.defaultBranch
          head: head
          title: title

    initPagesBranch: ->
      branch = "gh-pages"
    
      # Post an empty tree to use for the base commit
      # TODO: Learn how to post an empty tree
      post "git/trees",
        tree: [{
          mode: "1006444"
          path: "tempest.txt"
          content: "created by strd6.github.io/editor"
        }]
      .then (data) ->
        # Create the base commit for the branch
        post "git/commits",
          message: "Initial gh-pages commit"
          tree: data.sha
      .then (data) ->
        # Create the branch based on the base commit
        post "git/refs",
          ref: "refs/heads/#{branch}"
          sha: data.sha
      
    writeFile: (params) ->
      {branch, path, content, message} = params

      get "contents/#{path}",
        ref: branch
      .then (data) ->
        # The file existed, so we update it using the existing sha
        put "contents/#{path}",
          content: content
          sha: data.sha
          message: message
          branch: branch
      , (request) ->
        # If we fail because the gh-pages branch doesn't exist try creating it and retrying
        if request.responseJSON?.message is "No commit found for the ref gh-pages"
          self.initPagesBranch().then ->
            # Trying again after creating the gh-pages branch
            self.writeFile(params)
        # The file didn't exist so we create a new one
        else if request.status is 404
          put "contents/#{path}",
            content: content
            message: message
            branch: branch
        else
          Deferred().reject(arguments...)

    latestTree: (branch=self.defaultBranch()) ->
      get("git/refs/heads/#{branch}")
      .then (data) ->
        get data.object.url
      .then (data) ->
        get "#{data.tree.url}?recursive=1"
      .then (data) ->
        files = data.tree.select (file) ->
          file.type is "blob"
  
        # Gather the data for each file
        $.when.apply(null, files.map (datum) ->
          get(datum.url)
          .then (data) ->
            Object.extend(datum, data)
        )
      .then (results...) -> 
        results

    commitTree: ({message, tree}) ->
      branch = self.branch()
      message ?= "Updated in browser at strd6.github.io/editor"
      
      unless tree
        throw Error("Must pass in a tree")
        
      # TODO: Is there a cleaner way to pass this through promises?
      latestCommitSha = null

      get("git/refs/heads/#{branch}")
      .then (data) ->
        latestCommitSha = data.object.sha
        
        post "git/trees",
          tree: tree
      .then (data) ->
        # Create another commit
        post "git/commits",
          parents: [latestCommitSha]
          message: message
          tree: data.sha
      .then (data) ->
        # Update the branch head
        patch "git/refs/heads/#{branch}",
          sha: data.sha
    
    # TODO: this is currently a hack because we can't create a pull request
    # if there are no different commits
    commitEmpty: ->
      branch = self.branch()
      latestCommit = null
      
      get("git/refs/heads/#{branch}")
      .then (data) ->
        get data.object.url
      .then (data) ->
        # Create another commit
        post "git/commits",
          parents: [data.sha]
          message: "This commit intentionally left blank"
          tree: data.tree.sha
      .then (data) ->
        # Update the branch head
        patch "git/refs/heads/#{branch}",
          sha: data.sha

    switchToBranch: (branch) ->
      ref = "refs/heads/#{branch}"
      
      setBranch = (data) ->
        self.branch(branch)
        
        return data

      get("git/#{ref}")
      .then setBranch # Success
      , (request) -> # Failure
        branchNotFound = (request.status is 404)

        if branchNotFound
          # Create branch if it doesn't exist
          # Use our current branch as a base
          get("git/refs/heads/#{self.branch()}")
          .then (data) ->
            post "git/refs",
              ref: ref
              sha: data.object.sha
          .then(setBranch)
        else
          Deferred().reject(arguments...)

    mergeInto: (branch=self.defaultBranch()) ->
      # TODO: Use default branch rather than master
      post "merges",
        base: branch
        head: self.branch()
        
    pullFromBranch: (branch=self.defaultBranch()) ->
      post "merges",
        base: self.branch()
        head: branch

    publish: ({html, script}) ->
      branch = self.branch()
      message = "Built #{branch} in browser in strd6.github.io/tempest"

      if branch is "master"
        path = "index.html"
      else
        path = "#{branch}.html"

      # Assuming git repo with gh-pages branch
      publishBranch = "gh-pages"

      # create <branch>.html
      promise = self.writeFile
        path: path
        content: Base64.encode(html)
        branch: publishBranch
        message: message

      # Create <branch>.js
      if script
        promise.then self.writeFile
          path: "#{branch}.js"
          content: Base64.encode(script)
          branch: publishBranch
          message: message
      else
        promise

  return self
