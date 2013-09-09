# TODO: These should mainly only be pull requests, but may have to be compatible
# with issues created outside the system.
@Issue = (I={}) ->
  self = Model(I)

  self.extend
    optionText: ->
      "#{I.number} - #{I.title}"

    fullDescription: ->
      """
        #{self.optionText()}
        #{I.html_url}
        #{I.body}
      """

    branchName: ->
      I.head?.ref? or "issue-#{I.number}"

  return self
