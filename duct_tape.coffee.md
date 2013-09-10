Here we have simple extension and utility methods that should be moved into our framework's environment libraries.

`String#dasherize` should be moved into inflecta.

Convert a string with spaces and mixed case into all lower case with spaces replaced with dashes. This is the style that Github branch names are commonly in.

    String::dasherize = ->
      @trim()
        .replace(/\s+/g, "-")
        .toLowerCase()

`Base64` should be moved into a browser polyfil library.

UTF-8 Enabled base64 encoding and decoding.

    @Base64 =
      encode: (s) ->
        btoa(unescape(encodeURIComponent(s)))
    
      decode: (s) ->
        decodeURIComponent(escape(atob(s.replace(/\s/g, ''))))
