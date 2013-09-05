publish = ({fileData, repo, owner, branch, message}) ->
  branch ?= "master"
  message ?= "Built #{branch} in browser in strd6.github.io/tempest"

  if branch is "master"
    path = "index.html"
  else
    path = "#{branch}.html"

  # Assuming git repo with gh-pages branch
  publishBranch = "gh-pages"

  # create <ref>.html in gh-pages branch
  Gistquire.writeFile
    repo: repo
    owner: owner
    path: path
    content: Base64.encode(Builder.standAloneHtml(fileData))
    branch: publishBranch
    message: message
    success: ->
      notices ["Published"]
    error: ->
      errors ["Error Publishing :("]

commit = ({fileData, repo, owner, branch, message}) ->
  
        
  Gistquire.commitTree
    owner: owner
    repo: repo
    tree: fileData
    success: ->
      notices(["Saved!"])
      errors([])
    error: errors

@Actions =
  save: ({fileData, repo, owner, branch, message}) ->
    notices(["Saving..."])
    
    async.parallel([
     -> commit()
     -> publish()
    ], (error) ->
      if error
        errors [error]
      else
        notices ["Saved!"]
    )
