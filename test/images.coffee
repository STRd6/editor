Images = require "../lib/images"

describe "images", ->
  it "should convert", ->
    result = Images.convert [
      path: "images/duder.png"
      content: atob "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAALUlEQVRYR+3QQREAAAABQfqXFsNnFTizzXk99+MAAQIECBAgQIAAAQIECBAgMBo/ACHo7lH9AAAAAElFTkSuQmCC"
    ]

    console.log result

    assert result.duder
