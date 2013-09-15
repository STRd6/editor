Here we have simple extension and utility methods that should be moved into our framework's environment libraries.

`String#dasherize` should be moved into inflecta.

Convert a string with spaces and mixed case into all lower case with spaces replaced with dashes. This is the style that Github branch names are commonly in.

    String::dasherize = ->
      @trim()
        .replace(/\s+/g, "-")
        .toLowerCase()

`CSON` parses CoffeeScript object literals. This is a big hack, but can be 
formalized later if it proves useful.

Another downside is that it depends on the CoffeeScript compiler when it should
be a simple parser of its own.

    global.CSON =
      parse: (source) ->
        Function("return #{CoffeeScript.compile(source, bare: true)}")()

This really needs to be improved. To do it correctly we'd need to detect 
object/array values and indent while moving them to separate lines. Single
values would exist without newlines or indentation. CSON.stringify would be
called recursively.

The current hack of using JSON works because JSON is valid CSON.

      stringify: (object) ->
        representation = JSON.parse(JSON.stringify(obj))

        Object.keys(representation).map (key) ->
          value = representation[key]
          "#{key}: #{JSON.stringify(value)}"
        .join("\n")
        
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
