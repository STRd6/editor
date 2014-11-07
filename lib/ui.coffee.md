UI Helpers
==========

UI helpers that return promises.

Currently just wrapping native JS ui methods, but could be expanded in the
future to have their own look and feel.

    Q = require "q"

    confirm = (message) ->
      deferred = Q.defer()

      if confirm(message)
        deferred.resolve()
      else
        deferred.reject()

      return deferred.promise

    confirmIf = (shouldConfirm, message) ->
      if shouldConfirm
        confirm(message)
      else
        Q.fcall ->

    module.exports =
      confirm: confirm
      confirmIf: confirmIf
