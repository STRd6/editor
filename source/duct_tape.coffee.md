Duct Tape
=========

HACK: Using global observable until we eliminate envweb.

    global.Observable = require "observable"

Here we have simple extension and utility methods that should be moved into our framework's environment libraries.

`String#dasherize` should be moved into inflecta.

Convert a string with spaces and mixed case into all lower case with spaces replaced with dashes. This is the style that Github branch names are commonly in.

    String::dasherize = ->
      @trim()
        .replace(/\s+/g, "-")
        .toLowerCase()

Adds a `render` helper method to HAMLjr. This should work it's way back into the
HAMLjr runtime.

`render` Looks up a template and renders it with the given object.

    HAMLjr.render = (templateName, object) ->
      templates = HAMLjr.templates
      template = templates[templateName] or templates["templates/#{templateName}"]

      if template
        template(object)
      else
        throw "Could not find template named #{templateName}"
