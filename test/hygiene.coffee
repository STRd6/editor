Hygiene = require "../hygiene"

describe "cleaning", ->
  it "should remove trailing whitespace", ->
    assert.equal Hygiene.clean("heyy   \n"), "heyy\n"

  it "should ensure trailing newline", ->
    assert.equal Hygiene.clean("a"), "a\n"

  it "should keep empties empty", ->
    assert.equal Hygiene.clean(""), ""
