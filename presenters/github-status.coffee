Template = require "../templates/github-status"

module.exports = (github) ->
  self =
    authenticated: ->
      request = github.lastRequest()

      if request
        request.getAllResponseHeaders and request.getAllResponseHeaders().match(/X-RateLimit-Limit: ?5000/i)

    rateLimitRemaining: ->
      github.lastRequest()?.getResponseHeader("X-RateLimit-Remaining") or 0

    authenticatedScopes: ->
      github.lastRequest()?.getResponseHeader("X-OAuth-Scopes")

    redirect: ->
      window.location = github.authorizationUrl("bc46af967c926ba4ff87", "gist,repo,user:email")

    hiddenIfAuthenticated: ->
      "hidden" if self.authenticated()

    hiddenUnlessAuthenticated: ->
      "hidden" unless self.authenticated()

    title: ->
      scopes = self.authenticatedScopes()
      rateLimitRemaining = self.rateLimitRemaining()

      "#{rateLimitRemaining}/5000 #{scopes}"

  return Template self
