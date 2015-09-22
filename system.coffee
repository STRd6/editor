require "cornerstone"
Folder = require "./templates/folder"

Application = require "./application"
Filesystem = require "./filesystem"

module.exports = (I={}, self=Model(I)) ->
  defaults I,
    filesystem: {}

  self.attrModel "filesystem", Filesystem

  self.extend
    # Expose PACKAGE and require so scripts can really dig in!
    PACKAGE: PACKAGE
    Require: require "require"
    require: require

    # Execute JavaScript code in a fresh context
    # with `system` available
    exec: (code) ->
      try
        return Function("system", code)(self)
      catch e
        console.error e

      return

    receiveDrop: (files) ->
      console.log files

    registerHandler: (extension, fn) ->
      handlers[extension] = fn

    filePresentersIn: (path) ->
      self.filesystem().foldersIn(path).map (folderName) ->
        presentFolder folderName, path
      .concat self.filesystem().filesIn(path).map presentFile

    # Drop on desktop
    drop: (e) ->
      if folderPath = system.dragFolder
        [..., name, unused] = folderPath.split('/')
        self.filesystem().moveFolder(folderPath, name + "/")
      if file = system.drag
        file.path file.name()

    boot: (filesystem) ->
      self.filesystem Filesystem filesystem

      # Run init scripts
      self.filesystem().filesIn("System/Boot/").forEach (file) ->
        if file.path().endsWith(".js")
          self.exec(file.content())

  self.include require("./window-ui")
  self.include require("./persistence")

  handlers =
    folder: (file) ->
      openFolder JSON.parse(file.content())

    launch: (file) ->
      openWidget JSON.parse(file.content())

  filePresenters =
    launch: (file) ->
      data = JSON.parse(file.content())

      title: data.title
      icon: data.icon

  open = (file) ->
    if handler = handlers[file.extension()]
      handler(file)
    else
      alert "Don't know about this kind of file"

  presentFolder = (path, basePath="") ->
    title: path.split('/').last()
    icon: "http://findicons.com/files/icons/2256/hamburg/32/folder.png"
    fn: ->
      openFolder(basePath + path)
    dragstart: (e) ->
      system.dragFolder = basePath + path + "/"
      e.dataTransfer.setData("application/whimsy-folder", basePath + path)
    drop: folderDrop(basePath + path)

  fileDrag = (file) ->
    (e) ->
      system.drag = file
      e.dataTransfer.setData("application/whimsy-file", JSON.stringify(file.I))

  folderDrop = (path) ->
    (e) ->
      if folderPath = system.dragFolder
        system.dragFolder = null
        [..., name, unused] = folderPath.split('/')
        self.filesystem().moveFolder(folderPath, path + "/" + name + "/")
      if file = system.drag
        system.drag = null
        file.path path + "/" + file.name()

  presentFile = (file) ->
    if presenter = filePresenters[file.extension()]
      extend presenter(file),
        fn: ->
          open file
        dragstart: fileDrag(file)

    else
      title: file.path().split('/').last()
      icon: "http://files.softicons.com/download/toolbar-icons/iconza-grey-icons-by-turbomilk/png/32x32/document.png"
      fn: ->
        open file
      dragstart: fileDrag(file)

  openFolder = (path) ->
    self.addWindow
      title: path.split('/').last()
      content: Folder
        system: self
        path: path + "/"
      drop: folderDrop(path)
      width: ->
      height: ->

  openWidget = (params) ->
    app = Application(params)

    self.addWindow app

  self.filesystem().writeFile("System/system.pkg", JSON.stringify(PACKAGE))

  self.registerHandler "txt", (file) ->
    openWidget
      url: "http://distri.github.io/text/whimsy"
      data: file.content()
      title: file.name()
      save: true

  self.registerHandler "pkg", (file) ->
    console.log file.content()
    openWidget
      url: "http://danielx.net/editor"
      value: file.content()
      title: file.name()

  self.registerHandler "js", (file) ->
    self.exec(file.content())

  return self
