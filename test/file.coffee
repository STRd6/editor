Editor = require("../editor")
editor = Editor()

editor.loadPackage(PACKAGE)

mocha.globals([
  "STRd6/filetree:v0.3.2"
  "STRd6/hygiene:v0.2.0"
])

describe "File", ->
  it "should be able to create a file from a package", (done) ->
    @timeout 10000

    editor.build()
    .then (pkg) ->
      console.log pkg
      data = JSON.stringify(pkg)
      
      console.log data.length
      
      file = new File [data], "something.pkg", type: "application/json"
      assert file
      console.log file

      done()
    .catch (e) ->
      console.error e
      throw e
