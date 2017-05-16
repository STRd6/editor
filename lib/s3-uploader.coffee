###
S3 Uploader
===========

Upload data directly to S3 from the client.

Usage
-----

>     uploader = S3.uploader(JSON.parse(localStorage.S3Policy))
>     uploader.upload
>       key: "myfile.text"
>       blob: new Blob ["radical"]
>       cacheControl: 60 # default 0


The uploader automatically prefixes the key with the namespace specified in the
policy.

A promise is returned that is fulfilled with the url of the uploaded resource.

>     .then (url) -> # "https://s3.amazonaws.com/trinket/18894/myfile.txt"

The promise is rejected with an error if the upload fails.

A progress event is fired with the percentage of the upload that has completed.

The policy is a JSON object with the following keys:

- `accessKey`
- `policy`
- `signature`

Since these are all needed to create and sign the policy we keep them all
together.

Giving this object to the uploader method creates an uploader capable of
asynchronously uploading files to the bucket specified in the policy.

Notes
-----

The policy must specify a `Cache-Control` header because we always try to set it.

License
-------

The MIT License (MIT)

Copyright (c) 2014

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

###

"use strict"

module.exports = (credentials) ->
  {policy, signature, accessKeyId} = credentials
  {acl, bucket, namespace} = extractPolicyData(policy)

  bucketUrl = "https://s3.amazonaws.com/#{bucket}"

  urlFor = (key) ->
    namespacedKey = "#{namespace}#{key}"

    "#{bucketUrl}/#{namespacedKey}"

  urlFor: urlFor

  upload: ({key, blob, cacheControl}) ->
    namespacedKey = "#{namespace}#{key}"
    url = urlFor(key)

    sendForm bucketUrl, objectToForm
      key: namespacedKey
      "Content-Type": blob.type or 'binary/octet-stream'
      "Cache-Control": "max-age=#{cacheControl or 31536000}"
      AWSAccessKeyId: accessKeyId
      "x-amz-security-token": credentials.sessionToken
      acl: acl
      policy: policy
      signature: signature
      file: blob
    .then ->
      "#{bucketUrl}/#{encodeURIComponent(namespacedKey)}"

getKey = (conditions, key) ->
  results = conditions.filter (condition) ->
    typeof condition is "object"
  .map (object) ->
    object[key]
  .filter (value) ->
    value

  results[0]

getNamespaceFromPolicyConditions = (conditions) ->
  (conditions.filter ([a, b, c]) ->
    b is "$key" and (a is "starts-with" or a is "eq")
  )[0][2]

extractPolicyData = (policy) ->
  policyObject = JSON.parse(atob(policy))

  conditions = policyObject.conditions

  acl: getKey(conditions, "acl")
  bucket: getKey(conditions, "bucket")
  namespace: getNamespaceFromPolicyConditions(conditions)

isSuccess = (request) ->
  request.status.toString()[0] is "2"

sendForm = (url, formData) ->
  new ProgressPromise (resolve, reject, notify) ->
    request = new XMLHttpRequest()

    request.open("POST", url, true)

    request.upload?.onprogress = notify

    request.onreadystatechange = (e) ->
      if request.readyState is 4
        if isSuccess(request)

          resolve request
        else
          reject request

    request.send(formData)

objectToForm = (data) ->
  formData = Object.keys(data).reduce (formData, key) ->
    value = data[key]

    if value
      formData.append(key, value)

    return formData
  , new FormData
