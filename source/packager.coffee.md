This guy is resopnsible for packaging things, probably related to the builder.

Just putting some things here to try and sort them out.

The main responsibilities will be bundling dependencies, and creating the
package.

    Packager = ->
      collectDependencies: (dependencies) ->
        debugger
        names = Object.keys(dependencies)
      
        $.when.apply(null, names.map (name) ->
          value = dependencies[name]
          
          if typeof value is "string"
            $.getJSON(value)
          else
            Deferred().reject("Can only handle url string dependencies right now")
        ).then (results...) ->
          bundledDependencies = {}

          names.each (name, i) ->
            bundledDependencies[name] = results[i]

    module.exports = Packager
