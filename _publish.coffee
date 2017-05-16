S3Uploader = require "./lib/s3-uploader"
Packager = require "./packager"

module.exports = (pkg) ->
  console.log "_publish", pkg

  authorization = localStorage.DUMPER_AUTH
  fetch "https://dumper.glitch.me/policy?authorization=#{authorization}"
  .then (response) ->
    response.json()
  .then (credentials) ->
    uploader = S3Uploader(credentials)

    json = new Blob [JSON.stringify(pkg)],
      type: "application/json;charset=utf-8"

    html = new Blob [Packager.html(pkg)],
      type: "text/html;charset=utf-8"

    repo = "editor"
    branch = "master"

    htmlPath = if branch is "master"
      "index.html"
    else
      "#{branch}/index.html"

    Promise.all [
      uploader.upload
        blob: html
        key: "public/#{repo}/#{htmlPath}"
      ,
      uploader.upload
        blob: json
        key: "public/#{repo}/#{branch}.json"
        cacheControl: 0
    ]
  .then (results) ->
    console.log res

  # TODO: Upload html and json to S3 based on branch
  # Use localStorage for an upload policy
  # Alternatively use "My Briefcase" or similar... maybe it's possible to run 
  # the briefcase in in iframe and have it handle the authing
