###
Sandbox
=======

Sandbox creates a popup window in which you can run code.

###

module.exports = ({url, name}={}) ->
  url ?= ""
  name ?= "sandbox-#{Math.random()}"

  sandbox = window.open(
    url
    name
  )

  # Close sandbox when closing our window.
  window.addEventListener "unload", ->
    sandbox.close()

  return sandbox
