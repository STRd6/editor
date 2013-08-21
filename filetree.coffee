@Filetree = (I) ->
  self = Model(I).observeAll

  self.attrObservable "selectedFile"

  return self