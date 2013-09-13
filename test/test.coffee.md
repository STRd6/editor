Starting with just an assert true to test that testing works at all.

    describe "editor", ->
      it "should test things", ->
        assert true

    describe "runtime environment", ->
      it "should have access to ENV", ->
        assert ENV
