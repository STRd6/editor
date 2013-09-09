# Use jQuery.Deferred to implement deferreds, but
# stay insulated by not blasting the $ all over our code
# that doesn't really depend on jQuery
# This let's us swap our our Deferred provider more easily later.
@Deferred = $.Deferred

withDeferrence = (fn) ->
  deferred = Deferred()

  # TODO: This try catch may be useless from deferring the fn
  try
    fn.defer(deferred)
  catch e
    deferred.reject(e)

  return deferred.promise()

Deferred.Confirm = (message) ->
  withDeferrence (deferred) ->
    if window.confirm(message)
      deferred.resolve()
    else
      deferred.reject()

Deferred.ConfirmIf = (flag, message) ->
  if flag
    return Deferred.Confirm(message)
  else
    withDeferrence (deferred) ->
      deferred.resolve()

Deferred.ExecuteIf = (flag, callback) ->
  withDeferrence (deferred) ->
    if flag
      callback().then deferred.resolve
    else
      deferred.resolve()
