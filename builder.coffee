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

# TODO: Maybe doc more files than just .md?
documentFile = (content, path) ->
  if path.extension() is "md"
    marked(content)
  else
    ""

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

    program = @program(build)

    scriptTag = if ref
      tag = document.createElement "script"
      tag.src = "#{ref}.js"
      
      tag.outerHTML
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
