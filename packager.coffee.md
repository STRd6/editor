Packager
========

The main responsibilities of the packager are bundling dependencies, and
creating the package.

Specification
-------------

A package is a json object with the following properties:

`dependencies` an object whose keys are names of dependencies within our context
and whose values are packages.

`distribution` an object whose keys are extensionless file paths and whose
values are executable code compiled from the source files that exist at those paths.

`source` an object whose keys are file paths and whose values are source code.
The `source` can be loaded and modified in an editor to recreate the compiled
package.

If the environment or dependecies contain all the tools required to build the
package then theoretically `distribution` may be omitted as it can be recreated
from `source`.

For a "production" distribution `source` may be omitted, but that will greatly
limit adaptability of packages.

The package specification is closely tied to the `require` method. This allows
us to use a simplified Node.js style `require` from the browser.

[Require Docs](http://distri.github.io/require/docs)

Dependencies
------------

    MemoizePromise = require "./util/memoize_promise"

Helpers
-------

The path to the published package json. This is the primary build product and is
used when requiring in other packages and running standalone html.

    jsonPath = ({repository:{branch}}) ->
      "#{branch}.json"

Check if repository is publishing to default branch.

    isDefault = (pkg) ->
      {repository} = pkg
      {branch} = repository

      branch is repository.default_branch

    relativePackagePath = (pkg) ->
      if isDefault(pkg)
        jsonPath(pkg)
      else
        "../#{jsonPath(pkg)}"

Launcher

    launcherScript = (pkg) ->
      """
        <script>
          xhr = new XMLHttpRequest;
          url = #{JSON.stringify(relativePackagePath(pkg))};
          xhr.open("GET", url, true);
          xhr.responseType = "json";
          xhr.onload = function() {
            (function(PACKAGE) {
              var src = #{JSON.stringify(PACKAGE.dependencies.require.distribution.main.content)};
              var Require = new Function("PACKAGE", "return " + src)({distribution: {main: {content: src}}});
              var require = Require.generateFor(PACKAGE);
              require('./' + PACKAGE.entryPoint);
            })(xhr.response)
          };
          xhr.send();
        <\/script>
      """

    startsWith = (string, prefix) ->
      string.match RegExp "^#{prefix}"

Create a rejected promise with the given message.

    reject = (message) ->
      Promise.reject new Error message

A standalone html page for a package.

    html = (pkg) ->
      metas = [
        '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
      ]

      try
        info = JSON.parse pkg.distribution.pixie.content.slice(18, -1)
        console.log info

      """
        <!DOCTYPE html>
        <html manifest="manifest.appcache?#{+new Date}">
          <head>
            #{metas.join("\n")}
            #{dependencyScripts(pkg.remoteDependencies)}
          </head>
          <body>
            #{launcherScript(pkg)}
          </body>
        </html>
      """

An HTML5 cache manifest for a package.

    cacheManifest = (pkg) ->
      # TODO: Add js file
      """
        CACHE MANIFEST
        # #{+ new Date}

        CACHE:
        index.html
        #{relativePackagePath(pkg)}
        #{(pkg.remoteDependencies or []).join("\n")}

        NETWORK:
        https://*
        http://*
        *
      """

`makeScript` returns a string representation of a script tag that has a src
attribute.

    makeScript = (src) ->
      "<script src=#{JSON.stringify(src)}><\/script>"

`dependencyScripts` returns a string containing the script tags that are
the remote script dependencies of this build.

    dependencyScripts = (remoteDependencies=[]) ->
      remoteDependencies.map(makeScript).join("\n")

If our string is an absolute URL then we assume that the server is CORS enabled
and we can make a cross origin request to collect the JSON data.

We also handle a Github repo dependency such as `STRd6/issues:master`.
This loads the package from the published gh-pages branch of the given repo.

`STRd6/issues:master` will be accessible at `http://strd6.github.io/issues/master.json`.

    fetchDependency = MemoizePromise (path) ->
      if typeof path is "string"
        if startsWith(path, "http")
          ajax.getJSON(path)
          .catch ({status, response}) ->
            switch status
              when 0
                message = "Aborted"
              when 404
                message = "Not Found"
              else
                throw new Error response

            throw "#{status} #{message}: #{path}"
        else
          if (match = path.match(/([^\/]*)\/([^\:]*)\:(.*)/))
            [callback, user, repo, branch] = match

            url = "https://#{user}.github.io/#{repo}/#{branch}.json"

            ajax.getJSON(url)
            .catch ->
              throw new Error "Failed to load package '#{path}' from #{url}"
          else
            reject """
              Failed to parse repository info string #{path}, be sure it's in the
              form `<user>/<repo>:<ref>` for example: `STRd6/issues:master`
              or `STRd6/editor:v0.9.1`
            """
      else
        reject "Can only handle url string dependencies right now"

Implementation
--------------

    Ajax = require "ajax"
    ajax = Ajax()

    Packager =
      collectDependencies: (dependencies) ->
        names = Object.keys(dependencies)

        Promise.all(names.map (name) ->
          value = dependencies[name]

          fetchDependency value

        ).then (results) ->
          bundledDependencies = {}

          names.forEach (name, i) ->
            bundledDependencies[name] = results[i]

          return bundledDependencies

Create the standalone components of this package. An html page that loads the
main entry point for demonstration purposes and a json package that can be
used as a dependency in other packages.

The html page is named `index.html` and is in the folder of the ref, or the root
if our ref is the default branch.

Docs are generated and placed in `docs` directory as a sibling to `index.html`.

An application manifest is served up as a sibling to `index.html` as well.

The `.json` build product is placed into the root level, as siblings to the
folder containing `index.html`. If this branch is the default then these build
products are placed as siblings to `index.html`

The optional second argument is an array of files to be added to the final
package.

      standAlone: (pkg, files=[]) ->
        repository = pkg.repository
        branch = repository.branch

        if isDefault(pkg)
          base = ""
        else
          base = "#{branch}/"

        add = (path, content) ->
          files.push
            content: content
            mode: "100644"
            path: path
            type: "blob"

        add "#{base}index.html", html(pkg)
        add "#{base}manifest.appcache", cacheManifest(pkg)

        json = JSON.stringify(pkg, null, 2)

        add jsonPath(pkg), json

        return files

Generates a standalone page for testing the app.

      testScripts: (pkg) ->
        {distribution} = pkg

        testProgram = Object.keys(distribution).filter (path) ->
          path.match /test\//
        .map (testPath) ->
          "require('./#{testPath}')"
        .join "\n"

        """
          #{dependencyScripts(pkg.remoteDependencies)}
          <script>
            #{require('require').packageWrapper(pkg, testProgram)}
          <\/script>
        """

      relativePackagePath: relativePackagePath

    module.exports = Packager
