
    require "./duct_tape" # TODO: Only for CSON, which should be moved into Tempest

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

          item.content = Base64.decode(item.content)
          item.encoding = "raw"

        return items

`arrayToHash` converts an array of fileData objects into an object where each
file's path is a key and the fileData is the object.

      arrayToHash: (array) ->
        array.eachWithObject {}, (file, hash) ->
          hash[file.path] = file

    module.exports = Util
