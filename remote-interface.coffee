module.exports = (I, self) ->

  remoteAdapter =
    load: self.loadPackage
    plugin: self.plugin

  # Embedded package in ZineOS
  if system? and postmaster?
    Object.assign postmaster, remoteAdapter
  else if window.location.origin is "null"
    # Assume we're in a secure enough embedded iframe
    localPostmaster = require("postmaster")()
    extend localPostmaster, remoteAdapter
  else if window is window.parent
    # Not embedded, no need to enable remote interface
  else
    # otherwise we can't allow the remote interface as it could enable XSS
    console.warn "Remote interface disabled, iframe must be sandboxed"

  return self
