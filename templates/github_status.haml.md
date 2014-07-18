Github Status
=============

Display information about the current Github api session.

    - redirect = ->
      - window.location = github.authorizationUrl("bc46af967c926ba4ff87", "gist,repo,user:email")

    .status
      - github = this
      - each @lastRequest, ->
        %div
          - if @getAllResponseHeaders and @getAllResponseHeaders().match(/X-RateLimit-Limit: 5000/)
            Authenticated Scopes:
            = @getResponseHeader("X-OAuth-Scopes")
            %br
            Rate Limit Remaining:
            = @getResponseHeader("X-RateLimit-Remaining")
            = " / 5000"
          - else
            %button(click=redirect) Auth
