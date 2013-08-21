@Sandbox = (code, {width, height, methods}={}) ->
  width ?= 800
  height ?= 600
  methods ?= {}

  sandbox = window.open(
    ""
    "sandbox"
    "width=#{width},height=#{height}"
  )

  # Pass functions to the running window
  Object.extend sandbox, methods

  sandbox
