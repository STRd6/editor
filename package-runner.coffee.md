Package Runner
==============

Run a package in an iframe.

The `launch` command will get the state of the app, replace the iframe with a clean
one, boot the new package and reload the app state. You can also optionally pass
in an app state to launch into.

A primary reason for wrapping the running iframe with a shim window is that we
can dispose of timeouts and everything else very cleanly, while still keeping the
same opened window.

One example use of hot reloading is if you are modifying your css you can run
several instances of your app and navigate to different states. Then you can see
in real time how the css changes affect each one.

The package runner assumes that it has total control over the document so you
probably won't want to give it the one in your own window.

    Sandbox = require "./lib/sandbox"
    {html} = require "./packager"
    {executePackageWrapper} = require "require"

    module.exports = (config={}) ->
      sandbox = Sandbox(config)
      document = sandbox.document

      applyStylesheet document, require "./runner-style"
      runningInstance = null

      self =
        launch: (pkg, data) ->
          # Get data from running instance
          data ?= runningInstance?.contentWindow?.appData?()

          # Remove Running instance
          runningInstance?.remove()

          # Create new instance
          runningInstance = document.createElement "iframe"
          document.body.appendChild runningInstance

          proxyCalls document, runningInstance

          # Pass in app state
          extend runningInstance.contentWindow.ENV ?= {},
            APP_STATE: data

          runningInstance.contentWindow.document.write html(pkg, executePackageWrapper)
          runningInstance.contentWindow.document.close()

          return self

Make RPC calls to running a package that is using `Postmaster`.

Returns a promise that is fulfilled with the results of the successful
invocation of the call, or rejected with an error object.

        send: do ->
          incId = -1

          handlers = {}

          addEventListener "message", ({source, data}) ->
            if source is runningInstance?.contentWindow
              {type, id, success, error} = data

              if type is "response"
                if success
                  handlers[id][0](success)
                else if error
                  handlers[id][1](error)

                delete handlers[id]

          (method, params...) ->
            new Promise (resolve, reject) ->
              incId += 1
              handlers[incId] = [resolve, reject]

              runningInstance.contentWindow.postMessage
                id: incId
                method: method
                params: params
              , "*"

        window: sandbox

        close: ->
          sandbox.close()

        eval: (code) ->
          runningInstance.contentWindow.eval(code)

Helpers
-------

Proxy calls from the iframe to the top window.

    proxyCalls = (document, iframe) ->
      [
        "opener"
        "console"
      ].forEach (name) ->
        iframe.contentWindow[name] = document.defaultView[name]

`makeScript` returns a string representation of a script tag that has a src
attribute.

    makeScript = (src) ->
      "<script src=#{JSON.stringify(src)}><\/script>"

`dependencyScripts` returns a string containing the script tags that are
the remote script dependencies of this build.

    dependencyScripts = (remoteDependencies=[]) ->
      remoteDependencies.map(makeScript).join("\n")

    applyStylesheet = (document, style, id="primary") ->
      styleNode = document.createElement("style")
      styleNode.innerHTML = style
      styleNode.id = id

      if previousStyleNode = document.head.querySelector("style##{id}")
        previousStyleNode.parentNode.removeChild(prevousStyleNode)

      document.head.appendChild(styleNode)
