# Use jQuery.Deferred to implement deferreds, but
# stay insulated by not blasting the $ all over our code
# that doesn't really depend on jQuery
# This let's us swap our our Deferred provider more easily later.
@Deferred = $.Deferred

Deferred.Confirm = (message) ->
  deferred = Deferred()

  (->
    if window.confirm(message)
      deferred.resolve()
    else
      deferred.reject()
  ).defer()

  return deferred.promise()

Deferred.ConfirmIf = (flag, message) ->
  if flag
    return Deferred.Confirm(message)
  else
    deferred = Deferred()

    (-> deferred.resolve()).defer()

    return deferred.promise()
