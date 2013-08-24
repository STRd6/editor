@Sandbox = ({name, width, height, methods}={}) ->
  name ?= "sandbox" + new Date
  width ?= 800
  height ?= 600
  methods ?= {}

  sandbox = window.open(
    ""
    name
    "width=#{width},height=#{height}"
  )

  # Pass functions to the running window
  Object.extend sandbox, methods

  sandbox
