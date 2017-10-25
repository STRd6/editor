global.Builder = require "../source/builder"

describe "Builder", ->
  it "should build jadelet", (done) ->
    builder = Builder()

    fileData = [
      PACKAGE.source["templates/editor.jadelet"]
    ]

    builder.build(fileData).then (result) ->
      console.log result

      assert result.distribution["lib/jadelet-runtime"].content
      assert result.distribution["templates/editor"].content.match(/module\.exports =/)

      done()
    .catch done

  it "should build styl", (done) ->
    builder = Builder()

    fileData = [
      PACKAGE.source["style.styl"]
    ]

    builder.build(fileData).then (result) ->
      css = result.distribution["style"].content
      console.log css
      assert css
      done()
    .catch done

  it "should build HTML", (done) ->
    fileData = [{
      path: "template.html"
      content: """
        <div class="main">
          <h1>Test</h1>
          <div class="component"></div>
        </div>
      """
    }]

    builder = Builder()

    builder.build(fileData).then (result) ->
      content = result.distribution["template"].content
      m = {}
      Function("module", "return " + content)(m)
      template =  m.exports

      node = template()
      assert node.childElementCount is 2
      assert node.className is "main"
      done()
    .catch done

  it "should provide a working Hamlet runtime", ->
    assert typeof require("/lib/hamlet-runtime") is 'function'
