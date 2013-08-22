@Filetree = (I={}) ->
  Object.defaults I,
    files: []

  self = Model(I).observeAll()

  self.attrObservable "selectedFile"
  
  compileTemplate = (source, name="test") ->
    ast = HAMLjr.parser.parse(source)
    
    HAMLjr.compile ast, 
      name: name
      compiler: CoffeeScript
  
  build = ->  
    templates = []
    models = []
    main = ""
  
    self.files.each (file) ->
      name = file.filename()
      source = file.content()
  
      if name.extension() is "haml"
        templates.push compileTemplate(source, name.withoutExtension())
    
      else if name.extension() is "coffee"
        if name is "main.coffee"
          main = CoffeeScript.compile(source)
        else
          models.push CoffeeScript.compile(source)
  
    """
      #{templates.join("\n")}
      #{models.join("\n")}
      #{main}
    """
  
  buildStyle = ->
    styles = []
    
    self.files.each (file) ->
      name = file.filename()
      source = file.content()
  
      if name.extension() is "styl"
        styles.push styl(source, whitespace: true).toString()
  
    styles.join("\n")

  self.extend
    load: (fileData) ->
      files = Object.keys(fileData).map (name) ->
        File fileData[name]
      .select (file) ->
        file.filename() != "style.css" and
        file.filename() != "build.js"

      self.files(files)

    fileData: ->
      fileData = {}

      # TODO: Handle deleted files
  
      # Merge in each file
      self.files.each (file) ->
        fileData[file.filename()] =
          content: file.content()
  
      # Add build files
      fileData["build.js"] =
        content:  build()
  
      fileData["style.css"] =
        content: buildStyle()
        
      return fileData

  return self
