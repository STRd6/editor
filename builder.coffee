@Builder = ->
  compileTemplate = (source, name="test") ->
    ast = HAMLjr.parser.parse(source)
    
    HAMLjr.compile ast, 
      name: name
      compiler: CoffeeScript
  
  build = (fileData) ->
    templates = []
    models = []
    main = ""
    errors = []
  
    fileData.each ({path, content}) ->
      name = path.split('/').last()
      source = content

      try
        if name.extension() is "haml"
          templates.push compileTemplate(source, name.withoutExtension())
        else if name.extension() is "js"
          if name is "main.js"
            main = source
          else if name is "build.js"
            # Do nothing
          else
            models.push source
        else if name.extension() is "coffee"
          if name is "main.coffee"
            main = CoffeeScript.compile(source)
          else
            models.push CoffeeScript.compile(source)
      catch error
        errors.push error.stack
  
    errors: errors
    result: """
        #{templates.join("\n")}
        #{models.join("\n")}
        #{main}
      """
  
  buildStyle = (fileData) ->
    styles = []
    errors = []
    
    fileData.each ({path, content}) ->
      try
        debugger
        if path.extension() is "styl"
          styles.push styl(content, whitespace: true).toString()
      catch error
        errors.push error.stack
  
    errors: errors
    result: styles.join("\n")
    
  build: (fileData, {success, error}) ->
    {errors:collectedErrors, result:compileResult} = build(fileData)

    {errors, result} = buildStyle(fileData)
    collectedErrors = collectedErrors.concat(errors)

    if compileResult.trim() != ""
      fileData.push
        path: "build.js"
        content: compileResult
        type: "blob"

    if result != ""
      fileData.push
        path: "style.css"
        content: result
        type: "blob"

    fileMap = fileData.eachWithObject {}, (file, hash) ->
      hash[file.path] = file

    if collectedErrors.length
      error(collectedErrors)
    else
      success(fileMap)
      
  standAloneHtml: (fileData) ->
    # TODO: Get these from a more robust method than just script tags with classes
    content = $('script.env').map ->
      @outerHTML
    .get()

    entryPoint = "build.js"
    program = fileData[entryPoint].content

    # TODO: Think about nesting, components
    # TODO?: Exclude build.js from files
    content.push """<body><script>
      Function("ENV", #{JSON.stringify(program)})({
        files: #{JSON.stringify(fileData)}
      });
    <\/script>"""
    
    content.join "\n"
