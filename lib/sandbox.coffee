###
Sandbox
=======

Sandbox creates a popup window in which you can run code.

You can pass in a width and a height to set the size of the window.
###

module.exports = ({name, width, height}={}) ->
  name ?= "sandbox-#{Math.random()}"
  width ?= 800
  height ?= 600

  sandbox = window.open(
    ""
    name
    "width=#{width},height=#{height}"
  )

  # Close sandbox when closing our window.
  window.addEventListener "unload", ->
    sandbox.close()

  return sandbox
