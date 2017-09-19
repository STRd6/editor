S3Uploader = require "./lib/s3-uploader"
Packager = require "./packager"
documenter = require "md"

statusCheck = (response) ->
  if response.status >= 200 && response.status < 300
    return response
  else
    throw new Error response

publishS3 = (pkg) ->
  authorization = localStorage.DUMPER_AUTH
  fetch "https://dumper.glitch.me/policy?authorization=#{authorization}"
  .then statusCheck
  .then (response) ->
    response.json()
  .then (credentials) ->
    uploader = S3Uploader(credentials)

    json = new Blob [JSON.stringify(pkg)],
      type: "application/json;charset=utf-8"

    html = new Blob [Packager.html(pkg)],
      type: "text/html;charset=utf-8"

    [..., repo] = pkg.repository.full_name.split("/")
    branch = pkg.repository.branch

    htmlPath = if branch is pkg.repository.default_branch
      "index.html"
    else
      "#{branch}/index.html"

    Promise.all [
      uploader.upload
        blob: html
        key: "public/#{repo}/#{htmlPath}"
        cacheControl: 0
    ,
      uploader.upload
        blob: json
        key: "public/#{repo}/#{branch}.json"
        cacheControl: 0
    ]
  .then (results) ->
    console.log results
  .catch (e) ->
    # Just swallow this so the other publish can succeed
    console.error e

  # TODO: Upload html and json to S3 based on branch
  # Use localStorage for an upload policy
  # Alternatively use "My Briefcase" or similar... maybe it's possible to run
  # the briefcase in in iframe and have it handle the authing


publishGitHubPages = (pkg, editor) ->
  documenter.documentAll(pkg)
  .then (docs) ->
    publishBranch = pkg.repository.publishBranch

    editor.repository().publish(Packager.standAlone(pkg, docs), "", publishBranch)

module.exports = (pkg, editor) ->
  console.log "_publish", pkg

  # Publish to both for now
  # TODO: Switch based on config?
  Promise.all [
    publishGitHubPages(pkg, editor)
    publishS3(pkg)
  ]
