The main editor template renders all the other sub-templates.

    .main
      = HAMLjr.render "actions", actions: @actions, issues: @issues
      = HAMLjr.render "filetree", @filetree
      = @notifications.view
      = HAMLjr.render "repo_info", @repository
      = HAMLjr.render "github_status", @github
