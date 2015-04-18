Actions
=======

Action buttons that do stuff in the editor

TODO: Pass editor as an arg to actions

    {File} = require "filetree"
    {PackageRunner} = require "runner"
    Q = require "q"
    S3Uploader = require "s3-uploader"
    SHA1 = require "sha1"
    policyEndpoint = "http://locohost:9393/root.json"

    fetchPolicy = ({notify}) ->
      notify "Fetching policy from #{policyEndpoint}"
      Q($.getJSON(policyEndpoint))

    POLICY_KEY = "S3Policy"
    getS3Credentials = ({notify}) ->
      Q.fcall ->
        policy = JSON.parse localStorage[POLICY_KEY]

        debugger

        expiration = JSON.parse(atob(policy.policy)).expiration

        if (Date.parse(expiration) - new Date) <= 30
          notify "Policy expired"
          fetchPolicy({notify})
        else
          return policy
      .then (policy) ->
        notify "Policy loaded"
        localStorage[POLICY_KEY] = JSON.stringify(policy)

        return policy
      .fail ->
        throw "Failed to get S3 upload Policy"

    module.exports = (I, self) ->
      actions = self.actions = Observable []

      self.addAction = (name, fn) ->
        actions.push
          name: name
          handler: ->
            fn(self)

      actionData =
        publish: (editor) ->
          editor.notify "Building..."
          # TODO: Get real publish path
          publishPath = editor.path()

          editor.build()
          .then (pkg) ->
            editor.notify "Publishing..."
            getS3Credentials(editor).then (policy) ->
              blob = new Blob [JSON.stringify(pkg)],
                type: "application/json"
              SHA1(blob).then (sha) ->
                Q.all [
                  S3Uploader(policy).upload
                    key: publishPath
                    blob: new Blob [PackageRunner.html(pkg)],
                      type: "text/html"
                    cacheControl: 0
  
                  S3Uploader(policy).upload
                    key: "data/#{sha}"
                    blob: blob
                    cacheControl: 31536000
                ]
          .then ([htmlUrl, jsonUrl]) ->
            editor.notify "Saved and published as #{htmlUrl}"
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
            # Fork editor
            PackageRunner().launch PACKAGE,
              # Load dependency in child
              PACKAGE: PACKAGE.dependencies[name]

      Object.keys(actionData).forEach (name) ->
        self.addAction name, actionData[name]
