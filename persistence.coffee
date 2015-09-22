Uploader = require "s3-uploader"

{SHA256} = CryptoJS = require "./lib/crypto"

POLICY_STORAGE_KEY = "WHIMSY_POLICY"

module.exports = (I, self) ->
  self.extend
    uploadPolicy: ->
      getLocalPolicy()
      .fail ->
        getToken()
        .then (token) ->
          refreshPolicy(token)

    saveDataBlob: (blob) ->
      blobTypedArray(blob)
      .then (arrayBuffer) ->
        path = "data/#{urlSafeBase64EncodedSHA256(arrayBuffer)}"

        self.saveBlob path, blob, 31536000

    saveBlob: (path, blob, cacheControl=0) ->
      self.uploadPolicy()
      .then (policy) ->
        uploader = Uploader(policy)
        uploader.upload
          key: path
          blob: blob
          cacheControl: cacheControl

    saveFilesystem: ->
      data = I.filesystem

      blob = new Blob [JSON.stringify(data)], type: "application/json"

      self.saveDataBlob blob

    saveIndexHtml: ->
      self.saveFilesystem()
      .then (fsURL) ->
        user = "danielx"
        blob = new Blob [indexPage(PACKAGE.remoteDependencies, fsURL)], type: "text/html"

        self.saveBlob "index.html", blob
      .catch (e) ->
        console.error e

urlSafeBase64EncodedSHA256 = (arrayBuffer) ->
  hash = SHA256(CryptoJS.lib.WordArray.create(arrayBuffer))
  base64 = hash.toString(CryptoJS.enc.Base64)
  urlSafeBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, "")

blobTypedArray = (blob) ->
  return new Promise (resolve, reject) ->
    reader = new FileReader()

    reader.onloadend = ->
      resolve(reader.result)

    reader.onerror = reject

    reader.readAsArrayBuffer(blob)

getToken = ->
  Q.fcall ->
    if token = localStorage.WHIMSY_TOKEN
      token
    else
      localStorage.WHIMSY_TOKEN = token = prompt "Your ticket to Whimsy:"

    console.log token

    token

getLocalPolicy = ->
  Q.fcall ->
    policy = JSON.parse(localStorage[POLICY_STORAGE_KEY])
  .then validatePolicyExpiration

validatePolicyExpiration = (policy) ->
  expiration = JSON.parse(atob(policy.policy)).expiration

  if (Date.parse(expiration) - new Date) <= 30
    throw "Policy expired"
  else
    return policy

refreshPolicy = (token) ->
  getJSON "http://api.whimsy.space/policy.json",
    headers:
      Authorization: token
  .then (policyJSON) ->
    localStorage[POLICY_STORAGE_KEY] = JSON.stringify(policyJSON)

    policyJSON

getJSON = (path, options={}) ->
  deferred = Q.defer()

  xhr = new XMLHttpRequest()

  xhr.open('GET', path, true)

  headers = options.headers
  if headers
    Object.keys(headers).forEach (header) ->
      value = headers[header]
      xhr.setRequestHeader header, value

  xhr.onload = (e) ->
    if (200 <= this.status < 300) or this.status is 304
      try
        deferred.resolve JSON.parse this.responseText
      catch error
        deferred.reject error
    else
      deferred.reject e

  xhr.onprogress = deferred.notify
  xhr.onerror = deferred.reject
  xhr.send()

  deferred.promise

indexPage = (remoteDependencies, fsURL) ->
  """
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        #{dependencyScripts(remoteDependencies)}
      </head>
      <body>
        #{launcherScript(fsURL)}
      </body>
    </html>
  """

# `makeScript` returns a string representation of a script tag that has a src
# attribute.
makeScript = (src) ->
  "<script src=#{JSON.stringify(src)}><\/script>"

# `dependencyScripts` returns a string containing the script tags that are the
# remote script dependencies of this build.
dependencyScripts = (remoteDependencies=[]) ->
  remoteDependencies.map(makeScript).join("\n")

# Fetch a pacakge from a url and require it
launcherScript = (filesystemURL) ->
  """
    <script>
      (function() {
        var oldRequire = window.Require;
        #{PACKAGE.dependencies.require.distribution.main.content};
        var require = Require.require;
        window.Require = oldRequire;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', #{JSON.stringify(filesystemURL)}, true);
        xhr.onload = function(e) {
          var ref;
          if (((200 <= (ref = this.status) && ref < 300)) || this.status === 304) {
            var fs = JSON.parse(this.responseText);
            var systemPackageFile = fs.files.filter(function(file) {
              return file.path === "System/system.pkg"
            })[0];

            require(JSON.parse(systemPackageFile.content)).boot(fs);
          }
        };
        xhr.onerror = console.error.bind(console);
        xhr.send();
      })();
    <\/script>
  """
