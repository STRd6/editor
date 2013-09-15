This guy is resopnsible for packaging things, probably related to the builder.

Just putting some things here to try and sort them out.

The main responsibilities will be bundling dependencies, and creating the
package.

    Packager = ->
      collectDependencies: (dependencies) ->
        names = Object.keys(dependencies)
      
        $.when.apply(null, names.map (name) ->
          value = dependencies[name]
          
          if typeof value is "string"
            $.getJSON(value)
          else
            Deferred().reject("Can only handle url string dependencies right now")
        ).then (results...) ->
          # WTF: jQuery.when behaves differently for one argument than it does for
          # two or more.
          if names.length is 1
            results = [results]
          
          bundledDependencies = {}

          debugger

          names.each (name, i) ->
            bundledDependencies[name] = results[i][0]

          return bundledDependencies

    module.exports = Packager
