Util
====

    CSON = require "cson"

A collection of shared utilities

    Util =

Read the config for the package from the package source.

      readSourceConfig: (pkg=PACKAGE) ->
        if configData = pkg.source["pixie.cson"]?.content
          CSON.parse(configData)
        else if configData = pkg.source["pixie.json"]?.content
          JSON.parse(configData)
        else
          {}

Decodes all content in place.

      processDirectory: (items) ->
        items.forEach (item) ->
          return item unless item.content

          if isBinary(item.path)
            item.binary = true
            item.content = atob(item.content.replace(/\s/g, ""))
          else # Text
            # NOTE: This implementation of Base64 assumes utf-8
            item.content = Base64.decode(item.content)

          item.encoding = "raw"

        return items

`arrayToHash` converts an array of fileData objects into an object where each
file's path is a key and the fileData is the object.

      arrayToHash: (array) ->
        array.eachWithObject {}, (file, hash) ->
          hash[file.path] = file

    module.exports = Util

Helpers
-------

Determines if a file is a binary file by looking up common file extensions.

    isBinary = (path) ->
      pathCheckRegEx = RegExp [
        "gif"
        "jpeg"
        "jpg"
        "mp3"
        "png"
        "sfs"
        "wav"
      ].map (extension) ->
        "\\.#{extension}$"
      .join("|")

      path.match(pathCheckRegEx)
