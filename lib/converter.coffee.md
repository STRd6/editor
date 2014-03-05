Converter
=========

Handle converting binary data from files into `json`.

    module.exports = self =
      convertDataToJSON: ({editor, outputFileName, matcher, mimeType}={}) ->
        outputFileName ?= "sounds.json"
        matcher ?= /^sounds\/(.*)\.wav$/
        mimeType ?= "audio/wav"

        # Gather image data from images/
        imageFiles = editor.filesMatching(matcher)

        fileData = self.convert imageFiles.map (file) ->
          path: file.path()
          content: file.content()
          mimeType: mimeType
          replacer: matcher

        # Delete files in images/
        imageFiles.forEach (file) ->
          editor.files().remove(file)

        # Create/update images.json
        # Read file if it exists
        try
          existingData = JSON.parse(editor.fileContents(outputFileName))
        catch
          existingData = {}

        # Merge data
        Object.extend existingData, fileData

        # Write file
        editor.writeFile(outputFileName, JSON.stringify(existingData, null, 2))

      convert: (fileData) ->
        fileData.reduce (hash, {path, content, mimeType, replacer}) ->
          path = path.replace(replacer, "$1")
          hash[path] = "data:#{mimeType};base64,#{btoa(content)}"

          hash
        , {}
