Runner manages running apps in sandboxed windows and passing messages back and
forth from the parent to the running instances.

We keep a list of running windows so we can hot-update them when we modify our
own code.

One cool example use is if you are modifying your css you can run several
instances of your app and navigate to different states. Then you can see in real
time how the css changes affect each one.

    runningWindows = []

    Runner =
      run: ({config}) ->
        sandbox = Sandbox
          width: config.width
          height: config.height

        runningWindows.push sandbox

        return sandbox

      hotReloadCSS: (css, path) ->
        runningWindows = runningWindows.select (window) ->
          return false if window.closed

          # TODO: We're assuming only one style in the body
          # which is reasonable in most cases, but we may want
          # to scope it by the path of the specific css file
          # to handle a wider range of situations
          $(window.document).find("body style:eq(0)").html(css)

          return true

    module.exports = Runner
