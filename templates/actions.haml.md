The actions bar holds several buttons that can be pressed to perform actions in
the editor.

    .actions
      - actions = @actions

Render a series of buttons, one for each action.

      %span
        - Object.keys(actions).each (name) ->
          %button(click=actions[name])
            = name.titleize()

The issues selector is also rendered in the actions bar.

      %select(value=@issues.currentIssue options=@issues.issues)
