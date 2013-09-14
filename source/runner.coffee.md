Runner manages running apps in sandboxed windows and passing messages back and 
forth from the parent to the running instances.

We keep a list of running windows so we can hot-update them when we modify our
own code.

One cool example use is if you are modifying your css you can run several 
instances of your app and navigate to different states. Then you can see in real
time how the css changes affect each one.

    runningWindows = []

    Runner =
      run: ({config, html}) ->
        sandbox = Sandbox
          width: config.width
          height: config.height
  
        sandbox.document.open()
        sandbox.document.write(html)
        sandbox.document.close()
        
        runningWindows.push sandbox

      hotReloadCSS: (css) ->
        runningWindows = runningWindows.partition (window) ->
          return false if window.closed
          
          # TODO: Reference this from some other place rather than magic constant
          styleClass = "primary"
          $(window.document).find("style.#{styleClass}").html(css)
          
          return true

    module.exports = Runner
