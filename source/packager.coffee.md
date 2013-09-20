This guy is resopnsible for creating and consuming packages.

TODO: Extract the package construction parts of the builder into here, that way
the consumption and creation of packages can be near each other. The builder
should only be responsible for compiling all the files, or perhaps be a higher
level component that coordinates a compiler, packager, etc.

The main responsibilities will be bundling dependencies, and creating the
package.

    Packager = ->
      collectDependencies: (dependencies) ->
        names = Object.keys(dependencies)

        $.when.apply(null, names.map (name) ->
          value = dependencies[name]

          if typeof value is "string"

If our string is an absolute URL then we assume that the server is CORS enabled
and we can make a cross origin request to collect the JSON data.

            if value.startsWith("http")
              $.getJSON(value)
            else

Handle a Github repo dependency. Something like `STRd6/issues:master`. This uses
JSONP to load the package from the gh-pages branch of the given repo.

`STRd6/issues:master` will be accessible at `http://strd6.github.io/issues/master.jsonp`.
The callback is the same as the repo info string: `window["STRd6/issues:master"](... JSON DATA ...)`

Why all the madness? Github pages doesn't allow CORS right now, so we need to use
the JSONP hack to work around it. Because the files are static we can't allow the
server to generate a wrapper in response to our query string param so we need to
work out a unique one per file ahead of time. The `<user>/<repo>:<ref>` string is 
unique for all our packages so we use it to determine the URL and name callback.

              if (match = value.match(/([^\/]*)\/([^\:]*)\:(.*)/))
                [callback, user, repo, branch] = match
                
                user = user.toLowerCase()
                
                $.ajax
                  url: "http://#{user}.github.io/#{repo}/#{branch}.jsonp"
                  dataType: "jsonp"
                  jsonpCallback: callback
                  cache: true
              else
                reject """
                  Failed to parse repository info string be sure it's in the 
                  form `<user>/<repo>:<ref>` for example: `STRd6/issues:master`
                  or `STRd6/editor:v0.9.1`
                """
          else
            reject "Can only handle url string dependencies right now"
        ).then (results...) ->
          # WTF: jQuery.when behaves differently for one argument than it does for
          # two or more.
          if names.length is 1
            results = [results]
          
          bundledDependencies = {}

          names.each (name, i) ->
            bundledDependencies[name] = results[i][0]

          return bundledDependencies

    module.exports = Packager

Helpers
-------

Create a rejected deferred with the given message.

    reject = (message) ->
      Deferred().reject(message)
