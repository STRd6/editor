Display information about the current Github api session.

    .status
      - if @request and @request.getAllResponseHeaders().match(/X-RateLimit-Limit: 5000/)
        Authenticated Scopes:
        = @request.getResponseHeader("X-OAuth-Scopes")
        %br
        Rate Limit Remaining:
        = @request.getResponseHeader("X-RateLimit-Remaining")
        = " / 5000"
      - else
        %button Auth
          - on "click", Gistquire.auth
