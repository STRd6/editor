(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["test"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("textarea");
      __push(__element);
      __element = document.createTextNode('');
      __text(__element, this.source);
      __push(__element);
      __pop();
      __pop();
      __element = document.createElement("button");
      __push(__element);
      __element = document.createTextNode('');
      __text(__element, "Save\n");
      __push(__element);
      __pop();
      __on("click", function() {
        return Gistquire.update(gistId, {
          files: {
            "build.js": {
              content: HAMLjr.compile(HAMLjr.parse($('textarea').val()), {
                name: "test"
              })
            },
            "editor.haml": {
              content: $('textarea').val()
            }
          }
        });
      });
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);

$("body").append(HAMLjr.templates.test({source: Gistquire.Gists[gistId].files["editor.haml"].content}));