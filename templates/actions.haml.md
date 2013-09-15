The actions bar holds several buttons that can be pressed to perform actions in
the editor.

    .actions
      - actions = @actions

Render a series of buttons, one for each action.

      - Object.keys(actions).each (name) ->
        %button
          = name.titleize()

In our click handler we don't pass any event data to the action.

          - on "click", ->
            - actions[name]()

The issues selector is also rendered in the actions bar.

      -# HAMLjr.render "issues", @issues
