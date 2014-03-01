Converter
=========

Handle converting binary data from files into `json`.

    module.exports =
      convert: (fileData) ->
        fileData.reduce (hash, {path, content, mimeType, replacer}) ->
          path = path.replace(replacer, "$1")
          hash[path] = "data:#{mimeType};base64,#{btoa(content)}"

          hash
        , {}
