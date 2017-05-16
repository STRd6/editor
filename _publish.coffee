S3Uploader = require "./lib/s3-uploader"

module.exports = (pkg) ->
  console.log "_publish", pkg

  fetch "https://dumper.glitch.me/policy",
    headers:
      Authorization: "yolo"
  .then (response) ->
    response.json()
  .then (credentials) ->
    uploader = S3Uploader(credentials)

    console.log credentials

  # TODO: Upload html and json to S3 based on branch
  # Use localStorage for an upload policy
  # Alternatively use "My Briefcase" or similar... maybe it's possible to run 
  # the briefcase in in iframe and have it handle the authing
