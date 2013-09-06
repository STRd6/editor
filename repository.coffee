@Repository = (I={}) ->
  self = Model(I).observeAll()

  self.extend
    issues: ->
      Gistquire.api "#{self.url()}/issues"

    createIssue: (params) ->
      Gistquire.api "#{self.url()}/issues"
        type: "POST"
        data: JSON.stringify(params)

  return self
