Window = require "./templates/window"

module.exports = (I, self) ->
  topIndex = 1

  raise = (appWindow) ->
    topIndex += 1

    appWindow.style.zIndex = topIndex

  self.extend
    addWindow: (params) ->
      params.zIndex ?= topIndex

      if typeof params.width is "number"
        params.width = params.width + "px"

      if typeof params.height is "number"
        params.height = params.height + "px"

      document.getElementsByTagName("desktop")[0].appendChild Window params

  activeDrag = null
  initialPosition = null
  initialMouse = null
  document.addEventListener "mousedown", (e) ->
    target = e.target

    if target.classList.contains "handle"
      activeDrag = target.parentNode

      raise(activeDrag)
      document.getElementsByClassName("drag-fix")[0].style.zIndex = topIndex + 1

      initialPosition = activeDrag.getBoundingClientRect()
      initialMouse = e

  document.addEventListener "mousemove", (e) ->
    if activeDrag
      delta =
        x: e.pageX - initialMouse.pageX
        y: e.pageY - initialMouse.pageY

      activeDrag.style.left = initialPosition.left + delta.x + "px"
      activeDrag.style.top = initialPosition.top + delta.y + "px"

  document.addEventListener "mouseup", (e) ->
    document.getElementsByClassName("drag-fix")[0].style.zIndex = -1
    activeDrag = null

  cancel = (e) ->
    e.preventDefault()
    return false

  document.addEventListener "dragstart", (e) ->
    setTimeout ->
      $('window').addClass "drop-hover"

  document.addEventListener "drop", (e) ->
    $('window').removeClass "drop-hover"
    system.drag = null

  document.addEventListener "mouseup", (e) ->
    setTimeout ->
      $('window').removeClass "drop-hover"

  document.addEventListener "dragover", cancel
  document.addEventListener "dragenter", cancel

  dropper = require "./lib/drop"

  dropper document, (e) ->
    self.receiveDrop e.dataTransfer.files
