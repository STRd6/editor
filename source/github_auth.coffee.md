A helper to capture client side authorization codes and send them to our gatekeeper
server to authenticate them with our app secret key.

Returns a promise that will contain the auth token, or an error.

    module.exports = Q.fcall ->

If the url contains a querystring parameter `code` then we send it to our auth
server to get the OAuth token.

      if code = window.location.href.match(/\?code=(.*)/)?[1]
        fetch("https://hamljr-auth.herokuapp.com/authenticate/#{code}")
        .then (response) ->
          response.json()
        .then (data) ->
          if token = data.token
            localStorage.authToken = token
          else
            if localStorage.authToken
              localStorage.authToken
            else
              throw "Failed to get authorization from server and no token in local storage"
      else

We also check localStorage for our auth token.

        if localStorage.authToken
          localStorage.authToken
        else
          throw "No token in local storage"
