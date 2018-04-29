# The builder knows how to compile a source tree or individual files into various
# build products.

CSON = require "cson"
Jadelet = require "../lib/jadelet.min"

jadeletRuntimePath = "lib/jadelet-runtime"

stylus = require "../lib/stylus.min"

# `stripMarkdown` converts a literate file into pure code for compilation or execution.

stripMarkdown = (content) ->
  content.split("\n").map (line) ->
    if match = (/^([ ]{4}|\t)/).exec line
      line[match[0].length..]
    else
      ""
  .join("\n")

compileTemplate = (source) ->
  Jadelet.compile source,
    compiler: CoffeeScript
    runtime: "require(\"/#{jadeletRuntimePath}\")"

# `compileHTML` compiles an HTML file into a function that returns a DOM node.

compileHTML = (htmlString) ->
  compileCoffee """
    module.exports = ->
      wrapper = document.createElement "div"
      wrapper.innerHTML = #{JSON.stringify(htmlString)}

      return wrapper.children[0]
  """

# `stringData` exports a string of text. When you require a file that exports
# string data it returns the string for you to use in your code. This is handy for
# CSS or other textually based data.

stringData = (source) ->
  "module.exports = #{JSON.stringify(source)};"

# `compileStyl` compiles a styl file into CSS and makes it available as a string
# export.

compileStyl = (source) ->
  styleContent = stylus(source).render()

  stringData(styleContent)

# `compileCoffee` compiles a coffee file into JS. The `require` library handles
# appending a sourceURL comment to assist in debugging.

compileCoffee = (source, path) ->
  CoffeeScript.compile(source)

# `compileFile` take a fileData and returns a buildData. A buildData has a `path`,
# and properties for what type of content was built.

compileFile = ({path, content}) ->
  [name, extension] = [withoutExtension(path), fileExtension(path)]

  result =
    switch extension
      when "coffee"
        code: compileCoffee(content, path)
      when "cson"
        code: stringData(CSON.parse(content))
      when "css"
        code: stringData(content)
      when "html"
        code: compileHTML(content)
      when "jadelet"
        code: compileTemplate(content)
      when "js"
        code: content
      when "json"
        code: stringData(JSON.parse(content))
      when "md"
        # Separate out code and call compile again
        compileFile
          path: name
          content: stripMarkdown(content)
      when "styl"
        code: compileStyl(content)
      else
        {}

  result.name ?= name
  result.extension ?= extension

  extend result,
    path: path

# TODO: Standardize interface to use promises or pipes.

Builder = ->
  build = (fileData) ->
    results = fileData.map (datum) ->
      {path} = datum

      try
        (cached compileFile) datum
      catch {location, message}
        if location?
          message = "Error on line #{location.first_line + 1}: #{message}"

        error: "#{path} - #{message}"

    errors = results.filter (result) -> result.error
    data = results.filter (result) -> !result.error

    if errors.length
      Promise.reject (errors.map (e) -> e.error).join("\n")
    else
      # Add the Jadelet runtime if any jadelet templates were compiled
      hasJadelet = fileData.some ({path}) ->
        path.match(/.*\.jadelet(\..*)?$/)

      if hasJadelet
        libExists = data.some ({name}) ->
          name is jadeletRuntimePath

        unless libExists
          data.push
            name: jadeletRuntimePath
            code: PACKAGE.distribution["lib/jadelet-runtime.min"].content # Kinda gross

      Promise.resolve data

# Post processors operate on the built package.

# TODO: Maybe we should split post processors into the packager.

  postProcessors = []

  addPostProcessor: (fn) ->
    postProcessors.push fn

# Compile and build a tree of file data into a distribution. The distribution should
# include source files, compiled files, and documentation.

  build: (fileData) ->
    build(fileData)
    .then (items) ->
      results =
        items.filter (item) ->
          item.code
        .map (item) ->
          path: item.name
          content: item.code
          type: "blob"

      source = arrayToHash(fileData.map cleanSourceFile)

      pkg =
        source: source
        distribution: arrayToHash(results)

      postProcessors.forEach (fn) ->
        fn(pkg)

      return pkg

module.exports = Builder

# Cache

compilerCache = {}

cached = (compileFn) ->
  (data) ->
    {path, sha, content} = data
    if sha
      key = "#{path}:#{sha}"
      compilerCache[key] or compilerCache[key] = compileFn(data)
    else
      compileFn(data)

# Helpers

cleanSourceFile = ({path, content, mode, type}) ->
  {path, content, mode, type}

arrayToHash = (array) ->
  array.reduce (hash, file) ->
    hash[file.path] = file
    hash
  , {}

extend = (target, sources...) ->
  for source in sources
    for name of source
      target[name] = source[name]

  return target

fileExtension = (str) ->
  if match = str.match(/\.([^\.]*)$/, '')
    match[match.length - 1]
  else
    ''

withoutExtension = (str) ->
  str.replace(/\.[^\.]*$/,"")
