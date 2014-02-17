Images
======

Handle converting images from a directory into an images.json

    module.exports =
      convert: (fileData) ->
        fileData.reduce (hash, {path, content}) ->
          if path.match /\.png$/
            path = path.replace(/\.png$/, "").replace(/^images\//, "")
            hash[path] = "data:image/png;base64,#{btoa(content)}"
          hash
        , {}
