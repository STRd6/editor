(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["editor"] = function(data) {
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
      __on("click", this.save);
      __pop();
      __element = document.createElement("button");
      __push(__element);
      __element = document.createTextNode('');
      __text(__element, "These Lumps\n");
      __push(__element);
      __pop();
      __pop();
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);

(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["filetree"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("ul");
      __push(__element);
      __each(this.files, function(file) {
        __element = document.createElement("li");
        __push(__element);
        __element = document.createTextNode('');
        __text(__element, file.name);
        __push(__element);
        __pop();
        __on("click", this.selectedFile(file));
        return __pop();
      });
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);

(function() {
  this.File = function(I) {
    return Model(I).observeAll();
  };

}).call(this);

(function() {
  this.Filetree = function(I) {
    var self;
    self = Model(I).observeAll();
    self.attrObservable("selectedFile");
    self.selectedFile.observe(function(file) {
      return console.log("SELECTED", file);
    });
    return self;
  };

}).call(this);

(function() {
  var build, compileTemplate, files, filetree, model;

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
    var main, models, templates;
    templates = [];
    models = [];
    Object.keys(Gistquire.Gists[gistId].files).each(function(name) {
      var source;
      source = Gistquire.Gists[gistId].files[name].content;
      if (name.extension() === "haml") {
        return templates.push(compileTemplate(source, name.withoutExtension()));
      } else if (name.extension() === "coffee") {
        if (name === "main.coffee") {
          return;
        }
        return models.push(CoffeeScript.compile(source));
      }
    });
    main = CoffeeScript.compile(Gistquire.Gists[gistId].files["main.coffee"].content);
    return "" + (templates.join("\n")) + "\n" + (models.join("\n")) + "\n" + main;
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

  files = Object.keys(Gistquire.Gists[gistId].files).map(function(filename) {
    var data;
    data = Gistquire.Gists[gistId].files[filename];
    return File(data);
  });

  filetree = Filetree({
    files: files
  });

  $("body").append(HAMLjr.templates.filetree(filetree)).append(HAMLjr.templates.editor(model));

}).call(this);
