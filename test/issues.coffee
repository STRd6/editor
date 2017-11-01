require "cornerstone"

Issue = require "../models/issue"
Issues = require "../models/issues"

describe "issues", ->
  it "should be chill", ->
    assert Issues()

  it "should have a default null Issue", ->
    assert Issues().issues.size() is 1

describe "main", ->
  it "should have stuff", ->
    assert Issue
    assert Issues

describe "Issue", ->
  it "should have a full description", ->
    assert Issue().fullDescription()
