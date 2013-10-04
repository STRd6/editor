Builder
=======

The builder knows how to compile a source tree or individual files into various
build products.

This should be extracted to a separate library eventually.

Dependencies
------------

This guy helps package our app and manage dependencies.

    Packager = require "packager"
    {readSourceConfig, arrayToHash} = require('./util')

Helpers
-------

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

`stringData` exports a string of text. When you require a file that exports
string data it returns the string for you to use in your code. This is handy for
CSS or other textually based data.

    stringData = (source) ->
      "module.exports = #{JSON.stringify(source)};"

`compileStyl` compiles a styl file into CSS and makes it available as a string
export.

    compileStyl = (source) ->
      styleContent = styl(source, whitespace: true).toString()

      stringData(styleContent)

`compileCoffee` compiles a coffee file into JS and adds the sourceURL comment.

TODO: Work with the require component to make the sourceURL unique for files in
modules.

    compileCoffee = (source, path) ->
      """
        #{CoffeeScript.compile(source)}
        //# sourceURL=#{path}
      """

`compileFile` take a fileData and returns a buildData. A buildData has a `path`,
and properties for what type of content was built.

TODO: Allow for files to generate docs and code at the same time.

    compileFile = ({path, content}) ->
      [name, extension] = [path.withoutExtension(), path.extension()]

      result =
        switch extension
          when "js"
            code: content
          when "json"
            code: stringData(JSON.parse(content))
          when "cson"
            code: stringData(CSON.parse(content))
          when "coffee"
            code: compileCoffee(content, path)
          when "haml"
            code: compileTemplate(content, name)
          when "styl"
            code: compileStyl(content)
          when "css"
            code: stringData(content)
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

Post processors operate on the built package.

TODO: Maybe we should split post processors into the packager.

      postProcessors = []

      addPostProcessor: (fn) ->
        postProcessors.push fn

Compile and build a tree of file data into a distribution. The distribution should
include source files, compiled files, and documentation.

      build: (fileData, cache={}) ->
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

          config = readSourceConfig(source: source)

          # TODO: Robustify bundled dependencies
          # Right now we're always loading them from remote urls during the
          # build step. The default http caching is probably fine to speed this
          # up, but we may want to look into keeping our own cache during dev
          # in addition to using the package's existing dependencies rather
          # than always updating
          dependencies = config.dependencies or {}

          Packager.collectDependencies(dependencies, cache)
          .then (bundledDependencies) ->
            postProcessors.pipeline
              version: config.version
              source: source
              distribution: arrayToHash(results)
              entryPoint: config.entryPoint or "main"
              dependencies: bundledDependencies
              remoteDependencies: config.remoteDependencies

    module.exports = Builder
