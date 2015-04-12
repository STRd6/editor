Actions
=======

Action buttons that do stuff in the editor

TODO: Pass editor as an arg to actions

    {File} = require "filetree"
    Q = require "q"
    S3Uploader = require "s3-uploader"
    SHA1 = require "sha1"

    POLICY_KEY = "S3Policy"
    getS3Credentials = ->
      Q.fcall ->
        JSON.parse localStorage[POLICY_KEY]
      .fail ->
        policyString = prompt "S3 Upload Policy"
        policy = JSON.parse(policyString)
        if policy
          localStorage[POLICY_KEY] = policyString

          return policy
        else
          throw "No policy given"

    module.exports = (I, self) ->
      actions = self.actions = Observable []

      self.addAction = (name, fn) ->
        actions.push
          name: name
          handler: ->
            fn(self)

      actionData =
        publish: (editor) ->
          editor.notify "Publishing..."

          editor.save()
          .then ->
            # TODO: This could get slightly out of sync if there were changes
            # during the async call
            # The correct solution will be to use git shas to determine changed status
            # but that's a little heavy duty for right now.
            editor.filetree().markSaved()

            editor.build()
          .then (pkg) ->
            getS3Credentials().then (policy) ->
              console.log policy
              console.log pkg

              blob = new Blob [JSON.stringify(pkg)],
                type: "application/json"
              SHA1(blob).then (sha) ->
                S3Uploader(policy).upload
                  key: "data/#{sha}"
                  blob: blob
                  cacheControl: 31536000
          .then (url) ->
            editor.notify "Saved and published as #{url}"
          .fail (args...) ->
            editor.errors args
          .done()

        run: (editor) ->
          editor.notify "Running..."
  
          editor.run()
          .fail editor.classicError
          .done()
  
        test: (editor) ->
          editor.notify "Running tests..."
  
          editor.test()
          .fail (e) ->
            editor.errors [].concat(e)
          .done()
  
        docs: (editor) ->
          editor.notify "Running Docs..."
  
          if file = prompt("Docs file", "index")
            editor.runDocs({file})
            .fail editor.errors
            .done()
  
        new_file: (editor) ->
          if name = prompt("File Name", "newfile.coffee")
            file = File
              path: name
              content: ""
            editor.filetree().files.push file
            editor.filetree().selectedFile file
  
        load_package: (editor) ->
          editor.confirmUnsaved()
          .then ->
            if url = prompt("Package URL")
              Q(jQuery.getJSON(url))
              .then (p) ->
                console.log p
                editor.loadFiles(p.source)
            else
              Q.fcall -> throw "No url given"
          .fail editor.classicError
          .done()
        
        explore_dependency: (editor) ->
          name = prompt "Dependency Name"
          if name
            {PackageRunner} = require "runner"

            # Fork editor
            PackageRunner().launch PACKAGE,
              # Load dependency in child
              PACKAGE: PACKAGE.dependencies[name]

      Object.keys(actionData).forEach (name) ->
        self.addAction name, actionData[name]
