    Runner = require("runner")
    Actions = require("./source/actions")
    
    module.exports = (I={}, self=Model(I)) ->
      runner = Runner()

      self.extend

Run some code in a sandboxed popup window. We need to popup the window immediately
in response to user input to prevent pop-up blocking so we also pass a promise
that will contain the content to render in the window. If the promise fails we
auto-close the window.

        runSandboxed: (config, promise) ->
          sandbox = runner.run
            config: config
    
          promise.then(
            (content) ->
              sandbox.document.open()
              sandbox.document.write(content)
              sandbox.document.close()
            , (error) ->
              sandbox.close()
    
              return error
          )

      self.include(Actions)

      return self