trailingWhitespace = /[ \t]*$/gm
nothing = ""
newline = "\n"

ensureTrailingNewline = (content) ->
  if content.lastIndexOf(newline) != content.length - 1
    "#{content}#{newline}"
  else
    content

module.exports =
  clean: (content) ->
    ensureTrailingNewline(
      content
      .replace(trailingWhitespace, nothing)
    )
