module.exports = (pkg) ->
  console.log "_publish", pkg

  # TODO: Upload html and json to S3 based on branch
  # Use localStorage for an upload policy
  # Alternatively use "My Briefcase" or similar... maybe it's possible to run 
  # the briefcase in in iframe and have it handle the authing
