Actions
=======

Action buttons that do stuff in the editor

    module.exports = (editor) ->
      {notify, errors, classicError} = editor

      actions =
        save: ->
          notify "Saving..."
  
          editor.save()
          .then ->
            # TODO: This could get slightly out of sync if there were changes
            # during the async call
            # The correct solution will be to use git shas to determine changed status
            # but that's a little heavy duty for right now.
            editor.filetree.markSaved()
  
            editor.publish()
          .then ->
            notify "Saved and published!"
          .fail (args...) ->
            errors args
          .done()
  
        run: ->
          notify "Running..."
  
          editor.run()
          .fail classicError
          .done()
  
        test: ->
          notify "Running tests..."
  
          editor.test()
          .fail (e) ->
            errors [].concat(e)
          .done()
  
        docs: ->
          notify "Running Docs..."
  
          if file = prompt("Docs file", "index")
            editor.runDocs({file})
            .fail errors
            .done()
  
        new_file: ->
          if name = prompt("File Name", "newfile.coffee")
            file = File
              path: name
              content: ""
            editor.filetree.files.push file
            editor.filetree.selectedFile file
  
        load_package: ->
          confirmUnsaved()
          .then ->
            if url = prompt("Package URL")
              Q(jQuery.getJSON(url))
              .then (p) ->
                console.log p
                editor.loadFiles(p.source)
            else
              Q.fcall -> throw "No url given"
          .fail classicError
          .done()

      Object.keys(actions).map (name) ->
        [name, actions[name]]
