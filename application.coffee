require "cornerstone"

module.exports = (I={}, self=Model(I)) ->
  activeFilename = null
  
  self.attrAccessor "width", "height"

  self.extend
    save: (data) ->
      unless activeFilename
        activeFilename = prompt "Filename"

        self.title "#{I.title} - #{activeFilename}"

      if activeFilename
        system.filesystem().writeFile(activeFilename, data)

    content: ->
      iframe

    title: Observable I.title

    drop: (e) ->
      e.preventDefault()

      if file = system.drag
        system.drag = null
        sendData file.content()

  iframe = document.createElement 'iframe'

  sendData = (data) ->
    iframe.contentWindow.postMessage
      method: "load"
      params: [data]
    , "*"

  window.addEventListener "message", ({data, source}) ->
    if source is iframe.contentWindow
      if (data.status is "ready") and I.data
        sendData I.data

      if data.method
        id = data.id
        Q(self[data.method]?(data.params...))
        .then ->
          ; #TODO: Reply with result, using id token
        .fail ->
          ; #TODO: Reply with error using id token
        .done()

  if I.url
    iframe.src = I.url

  return self
