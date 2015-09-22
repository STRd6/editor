Github Status
=============

Display information about the current Github api session.

    - redirect = ->
      - window.location = github.authorizationUrl("bc46af967c926ba4ff87", "gist,repo,user:email")

    .status
      - github = this
      - if request = @lastRequest()
        %div
          - if request.getAllResponseHeaders and request.getAllResponseHeaders().match(/X-RateLimit-Limit: 5000/)
            Authenticated Scopes:
            = request.getResponseHeader("X-OAuth-Scopes")
            %br
            Rate Limit Remaining:
            = request.getResponseHeader("X-RateLimit-Remaining")
            = " / 5000"
          - else
            %button(click=redirect) Auth
