Actions
=======

Trying to encapsulate our action button actions, but doing a poor job so far.

Some dependencies.

    Packager = require "packager"
    {processDirectory} = require "./util"

    documenter = require "md"

    Actions = (I={}, self) ->
      self.extend

        publish: ->
          self.build()
          .then (pkg) ->
            documenter.documentAll(pkg)
            .then (docs) ->
              # NOTE: This metadata is added from the builder
              publishBranch = pkg.repository.publishBranch

              # TODO: Don't pass files to packager, just merge them at the end
              # TODO: Have differenty types of building (docs/main) that can
              # be chosen in a config rather than hacks based on the branch name
              repository = self.repository()
              if repository.branch() is "blog" # HACK
                self.repository().publish(docs, undefined, publishBranch)
              else
                self.repository().publish(Packager.standAlone(pkg, docs), undefined, publishBranch)

        load: ({repository}) ->
          repository.latestContent()
          .then (results) ->
            self.repository repository

            files = processDirectory results
            self.loadFiles files

    module.exports = Actions
