Packager
========

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
                  Failed to parse repository info string #{value}, be sure it's in the 
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

Create the standalone components of this package. An html page that loads the 
main entry point for demonstration purposes and a json package that can be
used as a dependency in other packages.

      standAlone: (pkg) ->
        {source, distribution, entryPoint} = pkg

        html = """
          <!doctype html>
          <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          #{dependencyScripts(pkg.remoteDependencies)}
          </head>
          <body>
          <script>
          #{packageWrapper(pkg, "require('./#{entryPoint}')")}
          <\/script>
          </body>
          </html>
        """

        json = JSON.stringify(pkg, null, 2)

        html: html
        js: program(pkg)
        json: json
        jsonp: jsonpWrapper(pkg.repository, json)

Generates a standalone page for testing the app.

      testScripts: (pkg) ->
        {distribution} = pkg

        testProgram = Object.keys(distribution).select (path) ->
          path.match /test\//
        .map (testPath) ->
          "require('./#{testPath}')"
        .join "\n"
        
        """
          #{dependencyScripts(pkg.remoteDependencies)}
          <script>
            #{packageWrapper(pkg, testProgram)}
          <\/script>
        """

    module.exports = Packager

Helpers
-------

Create a rejected deferred with the given message.

    reject = (message) ->
      Deferred().reject([message])

`makeScript` returns a string representation of a script tag. Don't use this
with tons of stuff stuck inside as html, it gets messed up. Using with src is
fine though.

    makeScript = (attrs) ->
      $("<script>", attrs).prop('outerHTML')

`dependencyScripts` returns a string containing the script tags that are
the dependencies of this build.

    dependencyScripts = (remoteDependencies=[]) ->
      remoteDependencies.map (src) ->
        makeScript
          class: "env"
          src: src

      .join("\n")

A standalone JS program for the package. Does not use `require` and is only
suitable for script style dependencies.

    program = ({distribution, entryPoint}) ->
      if main = distribution[entryPoint]
        return main.content
      else
        # TODO: We should emit some kind of user-visible warning
        console.warn "Entry point #{entryPoint} not found."
        
        return ""

Wraps the given data in a JSONP function wrapper. This allows us to host our
packages on Github pages and get around any same origin issues by using JSONP.

    jsonpWrapper = (repository, data) ->
      """
        window["#{repository.full_name}:#{repository.branch}"](#{data});
      """

Wrap code in a closure that provides the package and a require function. This
can be used for generating standalone HTML pages, scripts, and tests.

    packageWrapper = (pkg, code) ->
      """
        ;(function(PACKAGE) {
        require = Require.generateFor(PACKAGE)
        #{code}
        })(#{JSON.stringify(pkg, null, 2)});
      """
