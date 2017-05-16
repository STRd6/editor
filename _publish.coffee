S3Uploader = require "./lib/s3-uploader"

module.exports = (pkg) ->
  console.log "_publish", pkg

  authorization = localStorage.DUMPER_AUTH
  fetch "https://dumper.glitch.me/policy?authorization=#{authorization}"
  .then (response) ->
    response.json()
  .then (credentials) ->
    uploader = S3Uploader(credentials)

    blob = new Blob [JSON.stringify(pkg)],
      type: "application/json"

    repo = "editor"
    branch = "master"

    # TODO: Write index.html
    # TODO: Handle non-master branches as subfolders

    uploader.upload
      blob: blob
      key: "public/#{repo}/#{branch}.json"
      cacheControl: 0
  .then (res) ->
    console.log res

  # TODO: Upload html and json to S3 based on branch
  # Use localStorage for an upload policy
  # Alternatively use "My Briefcase" or similar... maybe it's possible to run 
  # the briefcase in in iframe and have it handle the authing
