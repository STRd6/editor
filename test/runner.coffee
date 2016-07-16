{PackageRunner} = Runner = require "../runner"

describe "Runner", ->
  it "should be able to open a window with content", (done) ->
    p = new Promise (resolve) ->
      setTimeout ->
        resolve "some content"

    Runner.openWindowWithContent({}, p)
    .then (sandbox) ->
      assert.equal sandbox.document.body.innerText, "some content"
      sandbox.close()
      done()
    .catch (err) ->
      console.log err

describe "PackageRunner", ->
  it "should be separate from the popup", (done) ->
    launcher = PackageRunner()

    launcher.launch(PACKAGE)

    assert launcher.eval("window !== top")

    launcher.close()
    done()

  it "should have a window", (done) ->
    launcher = PackageRunner()

    assert launcher.window
    assert launcher.window != window

    launcher.close()
    done()

  it "should share console with the popup", (done) ->
    launcher = PackageRunner()

    launcher.launch(PACKAGE)

    assert launcher.eval("console === top.console")

    launcher.close()
    done()

  it "should share opener with the popup", (done) ->
    launcher = PackageRunner()

    launcher.launch(PACKAGE)

    assert launcher.eval("opener === top.opener")

    launcher.close()
    done()

  it "should be able to make RPC calls to the a package that runs `Postmaster`", (done) ->
    pkg =
      distribution:
        main:
          content: """
            pm = require("postmaster")();
            pm.successRPC = function() {
              return "success";
            };
            pm.failRPC = function() {
              throw new Error("I am error");
            };
            pm.echo = function(a) {
              return a;
            };
          """
      dependencies: PACKAGE.dependencies
      entryPoint: "main"

    launcher = PackageRunner()
    launcher.launch(pkg)

    Promise.all [
      launcher.send "successRPC"
      .then (result) ->
        assert.equal result, "success"

      launcher.send "failRPC"
      .catch (e) ->
        assert.equal e.message, "I am error"

      launcher.send("echo", 5)
      .then (result) ->
        assert.equal result, 5
    ]
    .then ->
      launcher.close()
      done()
