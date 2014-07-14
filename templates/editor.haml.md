The main editor template renders all the other sub-templates.

    .main
      = require("./actions") actions: @actions, issues: @issues
      = require("./filetree") @filetree
      = @notifications.view
      = require("./repo_info") @repository
      = require("./github_status") @github
