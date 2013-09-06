@Issues = (I={}) ->
  Object.defaults I,
    issues: [
      title: "Test Issue"
      number: "2"
    ]

  notices = null
  errors = null

  self = Model(I)

  self.attrModels "issues"
  self.attrObservable "currentIssue"

  self.currentIssue.observe (issue) ->
    # TODO: We may want to be more cautious about who can clear what streams
    notices? [issue.fullDescription()]

  self.extend
    reset: (issueData) ->
      self.issues issueData.map(Issue)
    # TODO: Explore and refine piping conventions
    pipe: (streams) ->
      {notices, errors} = streams

  return self
