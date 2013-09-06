@Gistquire =
  accessToken: null

  # Calling auth will redirect to github for authentication
  auth: ->
    scope = "gist,repo,user:email"
    url = "https://github.com/login/oauth/authorize?client_id=bc46af967c926ba4ff87&scope=#{scope}"

    window.location = url

  # Call onload to check for the code returned from github authentication
  # and to get our access token from our authorization app.
  onload: ->
    # TODO: Namespace local storage key

    if code = window.location.href.match(/\?code=(.*)/)?[1]
      $.getJSON "https://hamljr-auth.herokuapp.com/authenticate/#{code}", (data) =>
        if token = data.token
          @accessToken = token
          localStorage.authToken = token

    if localStorage.authToken
      @accessToken = localStorage.authToken

  update: (id, {data, success, error}) ->
    url = "https://api.github.com/gists/#{id}"

    if @accessToken
      url += "?access_token=#{@accessToken}"

    $.ajax
      url: url
      type: "PATCH"
      dataType: 'json'
      data: JSON.stringify(data)
      success: success
      error: error

  create: (data, callback) ->
    url = "https://api.github.com/gists"

    if @accessToken
      url += "?access_token=#{@accessToken}"

    $.ajax
      url: url
      type: "POST"
      dataType: 'json'
      data: JSON.stringify(data)
      success: callback

  get: (id, callback) ->
    @api "gists/#{id}",
      success: callback

  api: (path, options={}) ->
    if path.match /^http/
      url = path
    else
      url = "https://api.github.com/#{path}"
    
    options.headers ||= {}
    
    if @accessToken
      options.headers["Authorization"] = "token #{@accessToken}"

    options = Object.extend
      url: url
      type: "GET"
      dataType: 'json'
    , options

    $.ajax options

  initPagesBranch: ({owner, repo, success, error}) ->
    success ?= ->
    error ?= ->
    branch = "gh-pages"
  
    unless owner and repo
      throw Error("Must pass in an owner and a repo")
  
    # Post an empty tree to use for the base commit
    # TODO: Learn how to post an empty tree
    Gistquire.api "repos/#{owner}/#{repo}/git/trees",
      type: "POST"
      data: JSON.stringify
        tree: [{
          mode: "1006444"
          path: "tempest.txt"
          content: "created by strd6.github.io/editor"
        }]
      success: (data) ->
        # Create the base commit for the branch
        Gistquire.api "repos/#{owner}/#{repo}/git/commits",
          type: "POST"
          data: JSON.stringify
            message: "Initial gh-pages commit"
            tree: data.sha
          success: (data) ->
            # Create the branch based on the base commit
            Gistquire.api "repos/#{owner}/#{repo}/git/refs",
              type: "POST"
              data: JSON.stringify
                ref: "refs/heads/#{branch}"
                sha: data.sha
              success: success
              error: error
          error: error
      error: error

  writeFile: ({owner, repo, branch, path, content, message, success, error}) ->
    success ?= ->
    error ?= ->
    
    Gistquire.api "repos/#{owner}/#{repo}/contents/#{path}",
      data:
        ref: branch
      success: (data) ->
        Gistquire.api "repos/#{owner}/#{repo}/contents/#{path}",
          type: "PUT"
          data: JSON.stringify
            content: content
            sha: data.sha
            message: message
            branch: branch
          success: success
          error: error
      error: (request) ->
        if request.responseJSON?.message is "No commit found for the ref gh-pages"
          Gistquire.initPagesBranch({
            owner: owner
            repo: repo
          }).then ->
            Gistquire.writeFile({owner, repo, branch, path, content, message, success, error})
        else if request.status is 404
          Gistquire.api "repos/#{owner}/#{repo}/contents/#{path}",
            type: "PUT"
            data: JSON.stringify
              content: content
              message: message
              branch: branch
            success: success
            error: error
        else
          error(arguments...)

  commitTree: ({owner, repo, branch, message, tree, success, error}) ->
    success ?= ->
    error ?= ->
    branch ?= "master"
    message ?= "Updated in browser at strd6.github.io/editor"
    
    unless owner and repo and tree
      throw Error("Must pass in an owner, a tree, and a repo")
      
    Gistquire.api "repos/#{owner}/#{repo}/git/refs/heads/#{branch}",
      success: (data) ->
        latestCommitSha = data.object.sha
        
        Gistquire.api "repos/#{owner}/#{repo}/git/trees",
          type: "POST"
          data: JSON.stringify
            tree: tree
          success: (data) ->
            # Create another commit
            Gistquire.api "repos/#{owner}/#{repo}/git/commits",
              type: "POST"
              data: JSON.stringify
                parents: [latestCommitSha]
                message: message
                tree: data.sha
              success: (data) ->
                # Update the branch head
                Gistquire.api "repos/#{owner}/#{repo}/git/refs/heads/#{branch}",
                  type: "PATCH"
                  data: JSON.stringify
                    sha: data.sha
                  success: success
                  error: error
              error: error
          error: error
      error: error
  
  latestTree: ({owner, repo, branch, success, error}) ->
    success ?= ->
    error ?= ->
    branch ?= "master"
    
    Gistquire.api "repos/#{owner}/#{repo}/git/refs/heads/#{branch}",
      success: (data) ->        
        Gistquire.api data.object.url,
          success: (data) ->
            Gistquire.api "#{data.tree.url}?recursive=1",
              success: success
              error: error
          error: error
      error: error
