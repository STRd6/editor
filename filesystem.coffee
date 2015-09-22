require "cornerstone"

File = (I={}, self=Model(I)) ->
  self.attrObservable "path", "content", "type"

  self.extend
    name: ->
      self.path().split('/').last()

    extension: ->
      self.extensions().last()

    extensions: ->
      pieces = self.path().split('.')
      pieces.shift()

      pieces.map (piece, index) ->
        pieces[index...].join(".")

  return self

module.exports = Filesystem = (I={}, self=Model(I)) ->
  defaults I,
    files: [{
      path: "duder.txt"
      content: "Hello"
    }, {
      path: "pixel.launch"
      content: JSON.stringify
        title: "Paint"
        url: "http://www.danielx.net/pixel-editor"
        icon: "http://dist.alternativeto.net/icons/microsoft-paint_3495.png"
        width: 800
        height: 600
      type: "application/json"
    }, {
      path: "theremin.launch"
      content: JSON.stringify
        title: "Theremin"
        url: "http://distri.github.io/synth"
        icon: "http://osx.iusethis.com/icon/osx/theremin.png"
    }, {
      path: "recorder.launch"
      content: JSON.stringify
        title: "Sound Recorder"
        url: "http://distri.github.io/sound-recorder/"
        icon: "http://iconizer.net/files/Tango/orig/audio-input-microphone.png"
    }, {
      path: "text.launch"
      content: JSON.stringify
        title: "notepad.exe"
        url: "http://distri.github.io/text/",
        icon: "http://files.softicons.com/download/application-icons/sleek-xp-software-icons-by-deleket/png/32/Notepad.png"
        save: true
        width: 400
        height: 300
    }, {
      path: "Games/contrasaurus.launch"
      content: JSON.stringify
        icon: "http://0.pixiecdn.com/sprites/26528/original.png"
        url: "http://contrasaur.us"
        width: 640
        height: 600
        title: "Contrasaurus [Broken]"
    }, {
      path: "Games/Ludum Dare/dungeon.launch"
      content: JSON.stringify
        icon: "http://0.pixiecdn.com/sprites/131792/original."
        url: "http://danielx.net/ld33"
        width: 650
        height: 520
        title: "Dungeon of Sadness"
    }, {
      path: "Games/Ludum Dare/hotdog.launch"
      content: JSON.stringify
        title: "Bionic Hotdog"
        icon: "http://t0.pixiecdn.com/18894/data/db894dd6682f2a08985ed5ec3400c8a25418fba4"
        url: "http://danielx.net/grappl3r"
        width: 1024
        height: 576
    }, {
      path: "System/Boot/info.js"
      content: """
        console.log('INFO RAN AT BOOT');
      """
    }, {
      path: "Test/"
    }]

  self.attrModels "files", File

  self.extend
    find: (path) ->
      [file] = self.files().filter (file) ->
        file.path() is path

      return file

    writeFile: (path, content) ->
      if file = self.find(path)
        file.content content
      else
        self.files.push File
          path: path
          content: content

    # Ex: moveFolder "Games/", "Cool Stuff/Games/"
    moveFolder: (from, to) ->
      self.files().forEach (file) ->
        path = file.path()

        if path.startsWith from
          file.path to + path.slice(from.length)

    filesIn: (directory) ->
      self.files().filter (file) ->
        path = file.path()

        if path.startsWith(directory)
          rest = path.replace(directory, '')

          rest and (rest.indexOf('/') is -1)

    foldersIn: (directory) ->
      dirHash = self.files().map (file) ->
        file.path()
      .filter (path) ->
        if path.startsWith(directory)
          rest = path.replace(directory, '')

          rest.indexOf('/') > 0

      .eachWithObject {}, (path, hash) ->
        hash[path.replace(directory, '').split('/')[0]] = true

      Object.keys(dirHash)

  return self

Filesystem.File = File
