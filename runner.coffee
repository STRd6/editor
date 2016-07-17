Sandbox = require "sandbox"

module.exports =
  Sandbox: Sandbox
  PackageRunner: require "./package-runner"

  ###
  Run some code in a sandboxed popup window. We need to popup the window immediately
  in response to user input to prevent pop-up blocking so we also pass a promise
  that will contain the content to render in the window. If the promise fails we
  auto-close the window.
  ###
  openWindowWithContent: (config, contentPromise) ->
    sandbox = Sandbox config

    contentPromise.then(
      (content) ->
        sandbox.document.open()
        sandbox.document.write(content)
        sandbox.document.close()

        sandbox
      , (error) ->
        sandbox.close()

        throw error
    )
