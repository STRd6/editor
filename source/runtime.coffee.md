The runtime holds utilities to assist with an apps running environment.

It should me moved into it's own component one day.

    Runtime = (ENV) ->

Returns the node that is the parent of the script element that contains the code
that calls this function. If `document.write` has been called before this then the
results may not be accurate. Therefore be sure to call currentNode before
writing anything to the document.

      currentNode = ->
        target = document.documentElement
      
        while (target.childNodes.length and target.lastChild.nodeType == 1)
          target = target.lastChild
      
        return target.parentNode

Display a promo in the console linking back to the creator of this app.

      promo = ->
        console.log("%c You should meet my creator #{ENV.progenitor.url}", """
          background: #000; 
          color: white; 
          font-size: 2em;
          line-height: 2em;
          padding: 40px 100px;
          margin-bottom: 1em;
          text-shadow: 
            0 0 0.05em #fff, 
            0 0 0.1em #fff, 
            0 0 0.15em #fff, 
            0 0 0.2em #ff00de, 
            0 0 0.35em #ff00de, 
            0 0 0.4em #ff00de, 
            0 0 0.5em #ff00de, 
            0 0 0.75em #ff00de;'
        """)

Call on start to boot up the runtime, get the root node, add styles, display a 
promo.

      boot: ->
        root = currentNode()

        promo()

Returns the root element, where the app should append all of the elements it
creates.

        return root
        
      applyStyleSheet: (root, name) ->
        styleNode = document.createElement("style")
        styleNode.innerHTML = require(name)
        styleNode.className = name
        
        root.appendChild(styleNode)

Export

    module.exports = Runtime
