The main editor template renders all the other sub-templates.

    .main
      = require("./actions") actions: @actions, issues: @issues
      = require("filetree").template @filetree
      -# TODO: Figure out why we can't just add the notifications view directly
      = @notifications.view.children[0]
      = require("./repo_info") @repository
      = require("./github_status") @github
