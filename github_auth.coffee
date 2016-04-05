module.exports = Promise.resolve().then ->
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
    if localStorage.authToken
      localStorage.authToken
    else
      throw "No token in local storage"
