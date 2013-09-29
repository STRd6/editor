Render a list of files as a filetree.

    %ul.filetree
      - selectedFile = @selectedFile
      - files = @files
      - each files, (file) ->
        %li= file.displayName
          - on "click", (e) ->
            - selectedFile(file) if $(e.target).is('li')
          .delete
            - on "click", -> files.remove(file) if confirm("Delete #{file.path()}?")
            X
