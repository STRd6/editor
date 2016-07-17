module.exports = (fn) ->
  cache = {}

  memoized = (key) ->
    unless cache[key]
      cache[key] = fn.apply(this, arguments)

      cache[key].catch ->
        delete cache[key]

    return cache[key]

    return memoized
