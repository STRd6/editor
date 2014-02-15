Images = require "../lib/images"

describe "images", ->
  it "should convert", ->
    testImage = Base64.decode "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAALUlEQVRYR+3QQREAAAABQfqXFsNnFTizzXk99+MAAQIECBAgQIAAAQIECBAgMBo/ACHo7lH9AAAAAElFTkSuQmCC"
    result = Images.convert [{
      path: "images/test.png"
      content: testImage
    }, {
      path: "images/yolo.png"
      content: testImage
    }, {
      path: "main.coffee.md"
      content: "Not an image"
    }]

    assert result.test
    assert result.yolo
    assert !result.main
