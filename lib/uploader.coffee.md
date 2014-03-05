Uploader
========

Upload dataURLs to S3.

    uploadResources = ({data, directory, extension, fileName, namespace, uploader, complete}) ->
      baseURL = "a0.pixiecdn.com"

      pending = 0
      finishedOne = ->
        pending -= 1

        if pending is 0
          complete(data)

      Object.keys(data).forEach (name) ->
        return unless data[name].match /^data\:/

        BlobUtil = require("/lib/blob_util")
        blob = BlobUtil.fromDataURL(data[name])

        key = "#{namespace}/#{directory}/#{name}.#{extension}"

        data[name] = "http://#{baseURL}/#{key}"
        pending += 1

        xhr = uploader.upload
          key: key
          blob: blob

        xhr.addEventListener "load", finishedOne

    module.exports =
      upload: (editor) ->
        if namespace = prompt "Namespace"
          uploader = require("s3").uploader(JSON.parse(localStorage.S3Policy))

          [
            ["music", "mp3"]
            ["sounds", "wav"]
            ["images", "png"]
          ].forEach ([resource, extension]) ->
            fileName = "#{resource}.json"

            uploadResources
              data: JSON.parse(editor.fileContents(fileName))
              extension: extension
              namespace: namespace
              directory: resource
              uploader: uploader
              complete: (data) ->
                editor.writeFile(fileName, JSON.stringify(data, null, 2))
