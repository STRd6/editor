Issue = require "./issue"

nullIssue =
  toString: ->
    "- Default Branch -"

module.exports = (I={}, self=Model(I)) ->
  defaults I,
    issues: []

  self.attrModels "issues", Issue
  self.attrObservable "currentIssue"

  self.extend
    # TODO: We should be able to do this purely functionally
    # composing the null issue with whatever the issues happen to be
    reset: (issueData) ->
      self.currentIssue(nullIssue)

      self.issues [nullIssue].concat issueData.map (x) -> Issue x

  self.reset I.issues

  return self
