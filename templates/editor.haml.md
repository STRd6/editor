The main editor template renders all the other sub-templates.

    .main
      = HAMLjr.render "actions", actions: @actions, issues: @issues
      = HAMLjr.render "filetree", @filetree
      = HAMLjr.render "notices", this
      = HAMLjr.render "repo_info", @repository
