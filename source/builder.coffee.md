Builder
=======

The builder knows how to compile a source tree or individual files into various
build products.

This should be extracted to a separate library eventually.

Dependencies
------------

This guy helps package our app and manage dependencies.

    packager = require('./packager')()

Helpers
-------

`arrayToHash` converts an array of fileData objects into an object where each
file's path is a key and the fileData is the object.

    arrayToHash = (array) ->
      array.eachWithObject {}, (file, hash) ->
        hash[file.path] = file

`stripMarkdown` converts a literate file into pure code for compilation or execution.

    stripMarkdown = (content) ->
      content.split("\n").map (line) ->
        if match = (/^([ ]{4}|\t)/).exec line
          line[match[0].length..]
        else
          ""
      .join("\n")

`compileTemplate` compiles a haml file into a HAMLjr program.

    compileTemplate = (source, name="test") ->
      program = HAMLjr.compile source,
        compiler: CoffeeScript

      "module.exports = #{program};"

`compileStyl` compiles a styl file into css.

    compileStyl = (source) ->
      styleContent = styl(source, whitespace: true).toString()
      
      "module.exports = #{JSON.stringify(styleContent)}"

`compileFile` take a fileData and returns a buildData. A buildData has a `path`,
and properties for what type of content was built.

TODO: Allow for files to generate docs and code at the same time.

    compileFile = ({path, content}) ->
      [name, extension] = [path.withoutExtension(), path.extension()]
      
      result =
        switch extension
          when "js"
            code: content
          when "coffee"
            code: CoffeeScript.compile(content)
          when "haml"
            code: compileTemplate(content, name)
          when "styl"
            code: compileStyl(content)
          when "md"
            # Separate out code and call compile again
            compileFile
              path: name
              content: stripMarkdown(content)
          else
            {}
    
      Object.defaults result,
        name: name
        extension: extension

      Object.extend result,
        path: path

`documentFile` generates documentation for a literate file. Right now it just
renders straight markdown, but it will get more clever in the future.

TODO: Maybe doc more files than just .md?

    documentFile = (content, path) ->
      if path.extension() is "md"
        marked(content)
      else
        ""

`makeScript` returns a string representation of a script tag.

    makeScript = (attrs) -> 
      $("<script>", attrs).prop('outerHTML')

`dependencyScripts` returns a string containing the script tags that are
the dependencies of this build.

    dependencyScripts = (build) ->
      remoteDependencies = readConfig(build).remoteDependencies
  
      (if remoteDependencies
        remoteDependencies.map (src) ->
          makeScript
            class: "env"
            src: src
      else # Carry forward our own env if no dependencies specified
        $('script.env').map ->
          @outerHTML
        .get()
      ).join("\n")

Builder
-------

The builder instance.

TODO: Extract this whole duder to a separate component.

TODO: Standardize interface to use promises.

TODO: Allow configuration of builder instances, adding additional compilers,
postprocessors, etc.

    Builder = ->
      build = (fileData) ->    
        results = fileData.map ({path, content}) ->
          try
            # TODO: Separate out tests
    
            compileFile
              path: path
              content: content
          catch {location, message}
            if location?
              message = "Error on line #{location.first_line + 1}: #{message}"
    
            error: "#{path} - #{message}"
            
        [errors, data] = results.partition (result) -> result.error
        
        if errors.length
          Deferred().reject(errors.map (e) -> e.error)
        else
          Deferred().resolve(data)
    
      postProcessors = []
      
      addPostProcessor: (fn) ->
        postProcessors.push fn
        
      buildDocs: (fileData) ->
        fileData.map ({path, content}) ->
          try
            path: path
            documentation: documentFile(content, path)
          catch {location, message}
            if location?
              message = "Error on line #{location.first_line + 1}: #{message}"
    
            error: "#{path} - #{message}"

Compile and build a tree of file data into a distribution. The distribution should
include source files, compiled files, and documentation.

      build: (fileData) ->
        build(fileData)
        .then (items) ->
          results = []

          items.eachWithObject results, (item, hash) ->
            if item.code
              results.push item
            else
              # Do nothing, we don't know about this item

          results = results.map (item) ->
            path: item.name
            content: item.code
            type: "blob"
      
          # TODO: We should be able to put a lot of this into postProcessors
      
          source = arrayToHash(fileData)
      
          # TODO: Robustify bundled dependencies
          # Right now we're always loading them from remote urls during the
          # build step. The default http caching is probably fine to speed this
          # up, but we may want to look into keeping our own cache during dev
          # in addition to using the package's existing dependencies rather
          # than always updating
          dependencies = readConfig(source: source).dependencies or {}
          
          packager.collectDependencies(dependencies)
          .then (bundledDependencies) ->
            postProcessors.pipeline
              source: source
              distribution: arrayToHash(results)
              entryPoint: "main"
              dependencies: bundledDependencies
    
      program: (build) ->
        {distribution, entryPoint} = build

        program = distribution[entryPoint].content

      packageWrapper: (build, code) ->
        """
          ;(function(PACKAGE) {
          // TODO: Remove transitional ENV
          ENV = PACKAGE
          require = Require.generateFor(PACKAGE)
          #{code}
          })(#{JSON.stringify(build, null, 2)});
        """

      buildStyle: (fileData) ->
        @build(fileData)
        .then (build) ->
          {distribution} = build

          content = distribution["style.css"]?.content or ""

      testScripts: (fileData) ->
        @build(fileData).then (build) =>
          {distribution} = build

          testProgram = Object.keys(distribution).select (path) ->
            path.match /test\//
          .map (testPath) ->
            "require('./#{testPath}')"
          .join "\n"
          
          """
            #{dependencyScripts(build)}
            <script>
              #{@packageWrapper(build, testProgram)}
            <\/script>
          """
          
      runnable: (fileData) ->
        @build(fileData)
        .then (build) =>
          standAlone = @standAlone(build)
          standAlone.config = Builder.readConfig(build)

          return standAlone

Create the standalone components of this package. An html page that loads the 
main entry point for demonstration purposes and a json package that can be
used as a dependency in other packages.

      standAlone: (pkg) ->
        {source, distribution} = pkg

        content = []
    
        content.push """
          <!doctype html>
          <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        """

        content = content.concat dependencyScripts(pkg)

        program = @program(pkg)

Get entry point from package configuration

        entryPoint = readConfig(pkg).entryPoint or "main"
        
        content.push """
          </head>
          <body>
          #{makeScript html: @packageWrapper(pkg, "require('./#{entryPoint}')")}
          </body>
          </html>
        """

        html: content.join "\n"
        script: program
        json: JSON.stringify(pkg, null, 2)

TODO: May want to move this to the environment so any program can read its
config

    readConfig = (build) ->
      if configData = build.source["pixie.cson"]?.content
        CSON.parse(configData)
      else if configData = build.source["pixie.json"]?.content
        JSON.parse(configData)
      else
        {}
    
    Builder.readConfig = readConfig

    module.exports = Builder
