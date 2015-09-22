# Probably want a bunch of garish widgets... pop-out, drag to move

# Need to be able to launch the editor and create new applications/widgets

# Viewers for various media types

# It should be FUN!

# What is a widget, a DOM node?
# Maybe an object with an element property?
# widget = Dealy(data, host)
# document.body.appendChild widget.element()

# How does a widget live in a package?

# Apps will need some awareness of the OS for things like popping
# up a save prompt or file picker.

# Use Case - IDE
# Launch Editor
# Create Widget
# Save Widget
# Launch Widget

# Use Case - Audio Recording
# Launch the Theremin
# Launch the Sound Recorder
# Record a Jam Session on the Theremin in the Sound Recorder
# Save the song in your music folder
# Browse your music folder and play the song

# Use Case - Scriptin'
# Launch notepad.exe
# Type in some JavaScript
#     alert('haxor');
# Save as leet.js
# Click leet.js
# JS Executes!

# TODO: Move this inside
style = document.createElement "style"
style.innerHTML = require "./style"
document.head.appendChild style

global.system = module.exports = require("./system")()

document.body.appendChild require("./templates/main")(system)
