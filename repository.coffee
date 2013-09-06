@Repository = (I={}) ->
  self = Model(I).observeAll()
  
  # TODO: Extract all of these methods to an API generator
  requestOptions = (type, data) ->
    type: type
    data: JSON.stringify(options.data)

  api = (path, options) ->
    if path.match /^http/
      url = path
    else
      url = "#{self.url()}/#{path}"
          
    Gistquire.api url, options

  get = (path) ->
    api path

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
