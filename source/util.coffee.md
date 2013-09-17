
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

    module.exports = Util
