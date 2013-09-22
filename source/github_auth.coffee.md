A helper to capture client side authorization codes and send them to our gatekeeper
server to authenticate them with our app secret key.

Returns a promise that will contain the auth token, or an error.

    GithubAuth = ->

If the url contains a querystring parameter `code` then we send it to our auth
server to get the OAuth token.

      if code = window.location.href.match(/\?code=(.*)/)?[1]
        $.getJSON("https://hamljr-auth.herokuapp.com/authenticate/#{code}")
        .then (data) ->
          if token = data.token
            localStorage.authToken = token
          else
            if localStorage.authToken
              Deferred().resolve(localStorage.authToken)
            else
              Deferred().reject("Failed to get authorization from server and no token in local storage")
      else

We also check localStorage for our auth token.

        if localStorage.authToken
          Deferred().resolve(localStorage.authToken)
        else
          Deferred().reject("No token in local storage")

    module.exports = GithubAuth
