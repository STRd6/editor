A simple console to display streams of errors and notices.

    .console-wrap
      %pre.errors
        - each @errors, (error) ->
          = error
      %pre.notices
        - each @notices, (notice) ->
          = notice
