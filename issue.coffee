@Issue = (I={}) ->
  self = Model(I)

  self.optionText = ->
    "#{I.number} - #{I.title}"

  return self
