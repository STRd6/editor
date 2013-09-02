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
  
    Object.keys(fileData).each (name) ->
      source = fileData[name].content
  
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
    
    Object.keys(fileData).each (name) ->
      source = fileData[name].content
      
      try
        if name.extension() is "styl"
          styles.push styl(source, whitespace: true).toString()
      catch error
        errors.push error.stack
  
    errors: errors
    result: styles.join("\n")
    
  build: (fileData, {success, error}) ->
    {errors:collectedErrors, result} = build(fileData)

    if result.trim() != ""
      fileData["build.js"] = 
        filename: "build.js"
        content: result

    {errors, result} = buildStyle(fileData)
    collectedErrors = collectedErrors.concat(errors)
    
    if result != ""
      fileData["style.css"] =
        filename: "style.css"
        content: result
    
    if collectedErrors.length
      error(collectedErrors)
    else
      success(fileData)
      
  standAloneHtml: (fileData) ->
    # TODO: Get these from a more robust method than just script tags with classes
    content = $('script.env').map ->
      @outerHTML

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
