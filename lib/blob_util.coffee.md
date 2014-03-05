Blob Util
=========

    module.exports =
      fromDataURL: (dataURL) ->
        byteString = atob(dataURL.split(',')[1])
        mimeType = dataURL.split(',')[0].split(':')[1].split(';')[0]

        byteArray = new Uint8Array(new ArrayBuffer(byteString.length))

        [0...byteString.length].forEach (i) ->
          byteArray[i] = byteString.charCodeAt(i)

        new Blob [byteArray], type: mimeType
