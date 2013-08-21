@Filetree = (I) ->
  self = Model(I).observeAll

  self.attrObservable "selectedFile"

  self.selectedFile.observe (file) ->
    console.log "SELECTED", file

  return self
