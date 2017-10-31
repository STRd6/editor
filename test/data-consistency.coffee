sampleData = require "./sample-data"
{SHA1} = require "sha1"

describe "data consistency", ->
  it "should decode and verify sha", ->
    sampleData.forEach ({path, content, sha, size}) ->
      header = "blob #{size}\0"
      decodedContent = atob(content)
      console.log decodedContent
      actual = SHA1("#{header}#{decodedContent}").toString()
      expected = sha

      assert.equal actual, expected, "Path: #{path}, Actual #{actual}, expected #{expected}"
