arrayToHash = (array) ->
  array.eachWithObject {}, (file, hash) ->
    hash[file.path] = file

@Builder = (I={}) ->
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
          else
            models.push "#{source};"
        else if name.extension() is "coffee"
          if name is "main.coffee"
            main = CoffeeScript.compile(source)
          else
            models.push CoffeeScript.compile(source)
      catch {location, message}
        if location?
          message = "Error on line #{location.first_line + 1}: #{message}"

        message = "#{path} - #{message}"

        errors.push message

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
        if path.extension() is "styl"
          styles.push styl(content, whitespace: true).toString()
      catch error
        errors.push error.stack
  
    errors: errors
    result: styles.join("\n")

  I: I

  build: (fileData, callback) ->
    I.notices.push "Building..."
    
    {errors:collectedErrors, result:compileResult} = build(fileData)

    {errors, result} = buildStyle(fileData)
    collectedErrors = collectedErrors.concat(errors)
    
    dist = []

    if compileResult.trim() != ""
      dist.push
        path: "build.js"
        content: compileResult
        type: "blob"

    if result != ""
      dist.push
        path: "style.css"
        content: result
        type: "blob"

    if collectedErrors.length
      I.errors?(collectedErrors)
    else
      callback
        source: arrayToHash(fileData)
        distribution: arrayToHash(dist)

  standAloneHtml: (build) ->
    {source, distribution} = build
    
    content = []

    content.push """
      <!doctype html>
      <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    """

    # TODO: Get these from a more robust method than just script tags with classes
    content = content.concat $('script.env').map ->
      @outerHTML
    .get()
  
    entryPoint = "build.js"
    program = distribution[entryPoint].content
  
    # TODO: Think about nesting, components
    # TODO?: Exclude build.js from files
    content.push """</head><body><script>
      Function("ENV", #{JSON.stringify(program)})(#{JSON.stringify(build)});
    <\/script>"""
    
    content.join "\n"
