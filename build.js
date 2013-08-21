(function() {
  var _base;
 
  this.HAMLjr || (this.HAMLjr = {});
 
  (_base = this.HAMLjr).templates || (_base.templates = {});
 
  this.HAMLjr.templates["actions"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
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
      __text(__element, "Yolo!\n");
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
 
  this.HAMLjr.templates["editor"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("textarea");
      __push(__element);
      __element = document.createTextNode('');
      __text(__element, this.content);
      __push(__element);
      __pop();
      __on("change", this.content);
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
      var selectedFile, __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("ul");
      __push(__element);
      selectedFile = this.selectedFile;
      __each(this.files, function(file) {
        __element = document.createElement("li");
        __push(__element);
        __element = document.createTextNode('');
        __text(__element, file.filename);
        __push(__element);
        __pop();
        __on("click", function() {
          return selectedFile(file);
        });
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
    filetree.files.each(function(file) {
      var name, source;
      name = file.filename();
      source = file.content();
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
 
  model = {
    save: function() {
      var fileData;
      fileData = {
        "build.js": {
          content: build()
        }
      };
      filetree.files.each(function(file) {
        return fileData[file.filename] = {
          content: file.content()
        };
      });
      return Gistquire.update(gistId, {
        files: fileData
      });
    }
  };
 
  files = Object.keys(Gistquire.Gists[gistId].files).map(function(filename) {
    var data;
    data = Gistquire.Gists[gistId].files[filename];
    return File(data);
  });
 
  filetree = Filetree({
    files: files
  });
 
  filetree.selectedFile.observe(function(file) {
    $("textarea").remove();
    return $("body").append(HAMLjr.templates.editor(file));
  });
 
  $("body").append(HAMLjr.templates.actions(model)).append(HAMLjr.templates.filetree(filetree));
 
}).call(this);
