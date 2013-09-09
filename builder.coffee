arrayToHash = (array) ->
  array.eachWithObject {}, (file, hash) ->
    hash[file.path] = file

stripMarkdown = (content) ->
  content.split("\n").map (line) ->
    if match = (/^([ ]{4}|\t)/).exec line
      line[match[0].length..]
    else
      ""
  .join("\n")

compileTemplate = (source, name="test") ->
  ast = HAMLjr.parser.parse(source)
  
  HAMLjr.compile ast, 
    name: name
    compiler: CoffeeScript
    
compileStyl = (source) ->
  styl(source, whitespace: true).toString()

compileFile = ({path, content}) ->
  name = path.split('/').last()
  [name, extension] = [name.withoutExtension(), name.extension()]
  
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

@Builder = (I={}) ->
  compileTemplate = (source, name="test") ->
    ast = HAMLjr.parser.parse(source)
    
    HAMLjr.compile ast, 
      name: name
      compiler: CoffeeScript
  
  build = (fileData) ->    
    fileData.map ({path, content}) ->
      try
        # TODO: Separate out tests

        compileFile
          path: path
          content: content
      catch {location, message}
        if location?
          message = "Error on line #{location.first_line + 1}: #{message}"

        error: "#{path} - #{message}"

  postProcessors = []

  I: I
  
  addPostProcessor: (fn) ->
    postProcessors.push fn

  build: (fileData, callback) ->
    I.notices.push "Building..."

    [errors, builtItems] = build(fileData).partition (result) ->
      result.error

    if errors.length
      I.errors errors

      return

    results =
      code: []
      style: []
      main: []

    builtItems.eachWithObject results, (item, hash) ->
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

    callback postProcessors.pipeline
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
