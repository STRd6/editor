@Issues = (I={}) ->
  Object.defaults I,
    issues: []

  self = Model(I)

  self.attrModels "issues"
  self.attrObservable "currentIssue"

  self.extend
    reset: (issueData) ->
      self.currentIssue(undefined)
      self.issues issueData.map(Issue)

    newIssue: ->
      if title = prompt("Issue title")
        console.log title
        self.repository.createIssue
          title: title

  return self
