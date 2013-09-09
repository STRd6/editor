String::dasherize = ->
  @trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
