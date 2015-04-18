The actions bar holds several buttons that can be pressed to perform actions in
the editor.

    .actions

Render a series of buttons, one for each action.

      %span
        - @actions.each ({name, handler}) ->
          %button(click=handler)
            = name.titleize()
      %span
        %b Path
        %input(value=@path)
