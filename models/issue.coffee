module.exports = (I={}, self=Model(I)) ->
  self.extend
    toString: ->
      I.title

    fullDescription: ->
      """
        #{self.toString()}
        #{I.html_url}
        #{I.body}
      """

    branchName: ->
      I.head?.ref or "issue-#{I.number}"

  return self
