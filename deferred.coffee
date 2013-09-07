# Use jQuery.Deferred to implement deferreds, but
# stay insulated by not blasting the $ all over our code
# that doesn't really depend on jQuery
# This let's us swap our our Deferred provider more easily later.
@Deferred = $.Deferred
