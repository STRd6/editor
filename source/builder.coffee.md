Builder
=======

The builder knows how to compile a source tree or individual files into various
build products.

This should be extracted to a separate library eventually.

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

      # TOOD: Transitional require, making templates global until `require`
      console.log "builder template"

      "(HAMLjr.templates || (HAMLjr.templates = {}))[#{JSON.stringify(name)}] = #{program};"

`compileStyl` compiles a styl file into css.

    compileStyl = (source) ->
      styl(source, whitespace: true).toString()

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
            style: compileStyl(content)
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
          results =
            code: []
            style: []

          items.eachWithObject results, (item, hash) ->
            if item.code
              hash.code.push item
            else if style = item.style
              hash.style.push style
            else
              # Do nothing, we don't know about this item

          dist = []

          results.code.each (item) ->
            dist.push
              path: item.name
              content: item.code
              type: "blob"
          
          distStyle = results.style.join('').trim()
          unless distStyle.blank()
            dist.push
              path: "style.css"
              content: distStyle
              type: "blob"
      
          # TODO: We should be able to put a lot of this into postProcessors
      
          source = arrayToHash(fileData)
      
          # TODO: Optionally bundle dependencies
          dependencies = readConfig(source: source).dependencies or {}
      
          Deferred().resolve postProcessors.pipeline
            source: source
            distribution: arrayToHash(dist)
            entryPoint: "main"
            dependencies: dependencies
    
      program: (build) ->
        {distribution, entryPoint} = build

        program = distribution[entryPoint].content

      envDeclaration: (build) ->
        """
          ENV = #{JSON.stringify(build, null, 2)};
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
            distribution[testPath].content
          .join "\n"
          
          """
            #{dependencyScripts(build)}
            <script>
              #{@envDeclaration(build)}
              #{testProgram}
            <\/script>
          """
          
      runnable: (fileData) ->
        @build(fileData)
        .then (build) =>
          standAlone = @standAlone(build)
          standAlone.config = Builder.readConfig(build)

          return standAlone

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

        content.push """
          </head>
          <body>
          #{makeScript html: @envDeclaration(pkg)}
          #{makeScript html: program}
          </body>
          </html>
        """
    
        html: content.join "\n"
        script: program

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

    if module?
      module.exports = Builder
    else
      window.Builder = Builder
