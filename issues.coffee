@Issues = (I={}) ->
  Object.defaults I,
    issues: [
      title: "Test Issue"
      number: "2"
    ]

  self = Model(I)

  self.attrModels "issues"
  self.attrObservable "currentIssue"

  self.currentIssue.observe (issue) ->
    console.log issue

  return self
