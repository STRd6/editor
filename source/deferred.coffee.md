Deferred
========

Use jQuery.Deferred to implement deferreds, but
stay insulated by not blasting the $ all over our code
that doesn't really depend on jQuery
This let's us swap our our Deferred provider more easily later.

    global.Deferred = $.Deferred

A helper to return a promise that may be resolved or rejected by the passed
code block.

    withDeferrence = (fn) ->
      deferred = Deferred()

      # TODO: This try catch may be useless from deferring the fn
      try
        fn.defer(deferred)
      catch e
        deferred.reject(e)

      return deferred.promise()

A deferred encapsulating a confirm dialog.

    Deferred.Confirm = (message) ->
      withDeferrence (deferred) ->
        if window.confirm(message)
          deferred.resolve()
        else
          deferred.reject()

A deferred that may present a confirm dialog, but only if a certain condition is
met.

    Deferred.ConfirmIf = (flag, message) ->
      if flag
        return Deferred.Confirm(message)
      else
        withDeferrence (deferred) ->
          deferred.resolve()

A deferred that encapsulates a conditional execution of a block that returns a
promise. If the condition is met the promise returning block is executed,
otherwise the deferred is marked as resolved and the block is not executed.

    Deferred.ExecuteIf = (flag, callback) ->
      withDeferrence (deferred) ->
        if flag
          callback().then deferred.resolve
        else
          deferred.resolve()

A touched up version of jQuery's `when`. Succeeds if all promises succeed, fails
if any promise fails. Handles jQuery weirdness if only operating on one promise.

TODO: We should think about the case when there are zero promises. Probably
succeed with an empty array for results.

    Deferred.when = (promises) ->
      $.when.apply(null, promises)
      .then (results...) ->
        # WTF: jQuery.when behaves differently for one argument than it does for
        # two or more.
        if promises.length is 1
          results = [results]
        else
          results
