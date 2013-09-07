@Repository = (I={}) ->
  self = Model(I).observeAll()
  
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
    issues: ->
      get "issues"

    createIssue: (params) ->
      post "issues", params
      
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
      .fail (request) ->
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
          ;#TODO Return a promise in the correct state

    latestTree: (branch="master") ->
      get("git/refs/heads/#{branch}")
      .then (data) ->        
        get data.object.url
      .then (data) ->
        get "#{data.tree.url}?recursive=1"

    commitTree: ({branch, message, tree}) ->
      branch ?= "master"
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

  return self
