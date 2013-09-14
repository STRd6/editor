Gistquire handles our connection to the Github API.

    Gistquire =
      accessToken: null

Calling auth will redirect to github for authentication.

TODO: parameterize the method to allow for different `scope`s or `client_id`s.

      auth: ->
        scope = "gist,repo,user:email"
        url = "https://github.com/login/oauth/authorize?client_id=bc46af967c926ba4ff87&scope=#{scope}"
    
        window.location = url
    
Call onload to check for the code returned from github authentication
and to get our access token from our authorization app.

TODO: Maybe think about returning a deferred?

      onload: ->
        # TODO: Namespace local storage key
    
        if code = window.location.href.match(/\?code=(.*)/)?[1]
          $.getJSON "https://hamljr-auth.herokuapp.com/authenticate/#{code}", (data) =>
            if token = data.token
              @accessToken = token
              localStorage.authToken = token
    
        if localStorage.authToken
          @accessToken = localStorage.authToken

Make a call to the github API. The path can be either a relative path such as
`users/STRd6` or an absolute path like `https://api.github.com/users/octocat` or
`user.url`.

We attach our `accessToken` if present.

`api` returns a promise for easy chaining.

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

Exports

    module.exports = Gistquire
