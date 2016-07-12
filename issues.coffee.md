Issues
======

    Issue = require "./issue"

A collection of issues including a `currentIssue` to represent the actively
selected issue.

We may want to formalize this collection pattern later, but for now lets just
see how it goes.

    nullIssue =
      toString: ->
        "- Default Branch -"

    Issues = (I={}, self=Model(I)) ->
      defaults I,
        issues: []

Our `issues` method is a list of `Issue` models.

      self.attrModels "issues", Issue

We want to expose the currently selected issue as an observable as well.

      self.attrObservable "currentIssue"

      self.extend

The reset method accepts an array of raw issue data, converts it into an array
of issue objects, replaces the previous issues with the new ones and clears the
selected issue.

        # TODO: We should be able to do this purely functionally
        # composing the null issue with whatever the issues happen to be
        reset: (issueData) ->
          self.currentIssue(nullIssue)

          self.issues [nullIssue].concat issueData.map (x) -> Issue x

      self.reset I.issues

      return self

    module.exports = Issues
