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
      ast = HAMLjr.parser.parse(source)
      
      HAMLjr.compile ast, 
        name: name
        compiler: CoffeeScript

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

Builder
-------

The builder instance.

TODO: Extract this whole duder to a separate component.

TODO: Standardize interface to use promises.

TODO: Allow configuration of builder instances, adding additional compilers,
postprocessors, etc.

    @Builder = (I={}) ->
      compileTemplate = (source, name="test") ->
        ast = HAMLjr.parser.parse(source)
        
        HAMLjr.compile ast, 
          name: name
          compiler: CoffeeScript
      
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
    
      I: I
      
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
    
      build: (fileData) ->
        I.notices.push "Building..."              

        build(fileData).then (items) ->
          results =
            code: []
            style: []
            main: []
    
          items.eachWithObject results, (item, hash) ->
            if code = item.code
              if item.name is "main" and (item.extension is "js" or item.extension is "coffee")
                hash.main.push code
              else
                hash.code.push code
            else if style = item.style
              hash.style.push style
            else
              # Do nothing, we don't know about this item
          
          distCode = results.code.concat(results.main).join(';').trim()
          distStyle = results.style.join('').trim()
      
          dist = []
      
          unless distCode.blank()
            dist.push
              path: "build.js"
              content: distCode
              type: "blob"
      
          unless distStyle.blank()
            dist.push
              path: "style.css"
              content: distStyle
              type: "blob"
      
          Deferred().resolve postProcessors.pipeline
            source: arrayToHash(fileData)
            distribution: arrayToHash(dist)
    
      program: (build) ->
        {distribution} = build
    
        entryPoint = "build.js"
        program = distribution[entryPoint].content
    
        """
          Function("ENV", #{JSON.stringify(program)})(#{JSON.stringify(build)});
        """
    
      standAlone: (build, ref) ->
        {source, distribution} = build
    
        makeScript = (attrs) -> 
          $("<script>", attrs).prop('outerHTML')
    
        content = []
    
        content.push """
          <!doctype html>
          <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        """
        
        remoteDependencies = readConfig(build).remoteDependencies
    
        dependencyScripts = if remoteDependencies
          remoteDependencies.map (src) ->
            makeScript
              class: "env"
              src: src
        else # Carry forward our own env if no dependencies specified
          $('script.env').map ->
            @outerHTML
          .get()
    
        content = content.concat dependencyScripts
    
        program = @program(build)
    
        scriptTag = if ref
          makeScript
            src: "#{ref}.js?#{+new Date}"
        else
          """
          <script>
          #{program}
          <\/script>
          """
    
        content.push """
          </head>
          <body>
          #{scriptTag}
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
