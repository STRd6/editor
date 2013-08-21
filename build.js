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
      __element = document.createElement("div");
      __push(__element);
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
              content: HAMLjr.compile(HAMLjr.parser.parse($('textarea').val()), {
                name: "test",
                compiler: CoffeeScript
              }) + CoffeeScript.compile(Gistquire.Gists[gistId].files["main.coffee"].content)
            },
            "editor.haml": {
              content: $('textarea').val()
            }
          }
        });
      });
      __pop();
      __element = document.createElement("button");
      __push(__element);
      __element = document.createTextNode('');
      __text(__element, "Radical\n");
      __push(__element);
      __pop();
      __pop();
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);

var build, compileTemplate, model;

compileTemplate = function(source, name) {
  var ast;
  if (name == null) {
    name = "test";
  }
  ast = HAMLjr.parser.parse(source);
  return HAMLjr.compile(ast, {
    name: name,
    compiler: CoffeeScript
  });
};

build = function() {
  var main, template;
  template = compileTemplate($('textarea').val(), "test");
  main = CoffeeScript.compile(Gistquire.Gists[gistId].files["main.coffee"].content);
  return "" + template + "\n\n" + main;
};

model = Model({
  source: Gistquire.Gists[gistId].files["editor.haml"].content
});

model.attrObservable("source");

model.save = function() {
  return Gistquire.update(gistId, {
    files: {
      "build.js": {
        content: build()
      },
      "editor.haml": {
        content: $('textarea').val()
      }
    }
  });
};

$("body").append(HAMLjr.templates.test(model));
