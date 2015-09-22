Display some info about the current repository

    .repo_info
      - if info = this()
        %div
          = info.full_name
          :
          = info.branch
