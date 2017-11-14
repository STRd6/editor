module.exports = (I, self) ->
  self.extend
    getToken: (key) ->
      Promise.resolve()
      .then ->
        localStorage[key]
  
    setToken: (key, value) ->
      Promise.resolve()
      .then ->
        localStorage[key] = value
        return value
