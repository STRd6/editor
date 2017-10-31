###

File Model
==========

The `File` model represents a file in a file system. It is populated by data
returned from the Github API.

Attributes
----------
`modified` tracks whether the file has been changed since it was created.

`path` is the path to the file.

`content` contains the text content of the file.

`mode` is the file mode for saving to github.

`sha` is the git SHA1 of the file.

###

{SHA1} = require "sha1"
utf8 = require "../lib/utf8"

File = (I={}) ->
  defaults I,
    content: ""
    modified: false
    mode: "100644"
    path: ""
    initialSha: null

  throw "File must have a path" unless I.path

  I.initialSha ?= I.sha

  self = Model(I)

  self.attrObservable Object.keys(I)...

  self.extend

    extension: ->
      extension self.path()

# TODO: This mode should be moved out of here because it is ambiguous with the
# github file mode.

# The `mode` of the file is what editor mode to use for our text editor.

    mode: ->
      switch extension = self.extension()
        when "js"
          "javascript"
        when "md" # TODO: See about nested markdown code modes for .haml.md, .js.md, and .coffee.md
          "markdown"
        when "cson"
          "coffee"
        when ""
          "text"
        else
          extension

  self.content.observe ->
    self.modified(true)

  self.sha = Observable ->
    I.sha = gitSHA(self.content())

  self.displayName = Observable ->
    changed = ""
    if self.modified()
      changed = "*"

    "#{changed}#{self.path()}"

  return self

module.exports = File

extension = (path) ->
  if match = path.match(/\.([^\.]*)$/, '')
    match[1]
  else
    ''

gitSHA = (string) ->
  length = byteCount(string)
  header = "blob #{length}\0"

  SHA1("#{header}#{string}").toString()

byteCount = (string) ->
  utf8.encode(string).length
