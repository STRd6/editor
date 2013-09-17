    Util = require "../source/util"

    describe "Util", ->
      it "should allow reading of the source config", ->
        assert Util.readSourceConfig(PACKAGE)
