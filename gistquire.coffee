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
