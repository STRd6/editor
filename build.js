(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["actions"] = function(data) {
    return (function() {
      var actions, __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("div");
      __push(__element);
      __attribute(__element, "class", "actions");
      actions = this;
      Object.keys(actions).each(function(name) {
        __element = document.createElement("button");
        __push(__element);
        __element = document.createTextNode('');
        __text(__element, name.titleize());
        __push(__element);
        __pop();
        __on("click", actions[name]);
        return __pop();
      });
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
      __element = document.createElement("div");
      __push(__element);
      __attribute(__element, "class", "editor-wrap");
      __element = document.createElement("div");
      __push(__element);
      __attribute(__element, "class", "editor");
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
      var selectedFile, __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("ul");
      __push(__element);
      __attribute(__element, "class", "filetree");
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
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["gist_list"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("ul");
      __push(__element);
      __attribute(__element, "class", "gists");
      __each(this.gists, function(gist) {
        __element = document.createElement("li");
        __push(__element);
        __element = document.createTextNode('');
        __text(__element, gist.id);
        __push(__element);
        __pop();
        __on("click", function() {
          return alert(gist.id);
        });
        return __pop();
      });
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);

(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["main"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("div");
      __push(__element);
      __attribute(__element, "class", "main");
      __element = document.createTextNode('');
      __text(__element, HAMLjr.templates.actions(this.actions));
      __push(__element);
      __pop();
      __element = document.createTextNode('');
      __text(__element, HAMLjr.templates.filetree(this.filetree));
      __push(__element);
      __pop();
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);

(function() {
  this.File = function(I) {
    if (I == null) {
      I = {};
    }
    return Model(I).observeAll();
  };

}).call(this);

(function() {
  this.Filetree = function(I) {
    var build, buildStyle, compileTemplate, self;
    if (I == null) {
      I = {};
    }
    Object.defaults(I, {
      files: []
    });
    self = Model(I).observeAll();
    self.attrObservable("selectedFile");
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
      main = "";
      self.files.each(function(file) {
        var name, source;
        name = file.filename();
        source = file.content();
        if (name.extension() === "haml") {
          return templates.push(compileTemplate(source, name.withoutExtension()));
        } else if (name.extension() === "coffee") {
          if (name === "main.coffee") {
            return main = CoffeeScript.compile(source);
          } else {
            return models.push(CoffeeScript.compile(source));
          }
        }
      });
      return "" + (templates.join("\n")) + "\n" + (models.join("\n")) + "\n" + main;
    };
    buildStyle = function() {
      var styles;
      styles = [];
      self.files.each(function(file) {
        var name, source;
        name = file.filename();
        source = file.content();
        if (name.extension() === "styl") {
          return styles.push(styl(source, {
            whitespace: true
          }).toString());
        }
      });
      return styles.join("\n");
    };
    self.extend({
      load: function(fileData) {
        var files;
        files = Object.keys(fileData).map(function(name) {
          return File(fileData[name]);
        }).select(function(file) {
          return file.filename() !== "style.css" && file.filename() !== "build.js";
        });
        return self.files(files);
      },
      fileData: function() {
        var fileData;
        fileData = {};
        self.files.each(function(file) {
          return fileData[file.filename()] = {
            content: file.content()
          };
        });
        fileData["build.js"] = {
          content: build()
        };
        fileData["style.css"] = {
          content: buildStyle()
        };
        return fileData;
      }
    });
    return self;
  };

}).call(this);

(function() {
  this.Sandbox = function(code, _arg) {
    var height, methods, sandbox, width, _ref;
    _ref = _arg != null ? _arg : {}, width = _ref.width, height = _ref.height, methods = _ref.methods;
    if (width == null) {
      width = 800;
    }
    if (height == null) {
      height = 600;
    }
    if (methods == null) {
      methods = {};
    }
    sandbox = window.open("", "sandbox", "width=" + width + ",height=" + height);
    Object.extend(sandbox, methods);
    return sandbox;
  };

}).call(this);

(function() {
  this.TextEditor = function(I) {
    var editor, el, reset, self, updating;
    Object.reverseMerge(I, {
      mode: "coffee",
      text: ""
    });
    self = Model(I);
    el = I.el;
    delete I.el;
    editor = ace.edit(el);
    editor.setFontSize("16px");
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/" + I.mode);
    editor.getSession().setUseSoftTabs(true);
    editor.getSession().setTabSize(2);
    reset = function(content) {
      if (content == null) {
        content = "";
      }
      editor.setValue(content);
      editor.moveCursorTo(0, 0);
      return editor.session.selection.clearSelection();
    };
    reset(I.text);
    self.attrObservable("text");
    updating = false;
    editor.getSession().on('change', function() {
      updating = true;
      self.text(editor.getValue());
      return updating = false;
    });
    self.text.observe(function(newValue) {
      if (!updating) {
        return reset(newValue);
      }
    });
    self.extend({
      el: el,
      editor: editor,
      reset: reset
    });
    return self;
  };

}).call(this);

(function() {
  var $root, actions, filetree, gist, styleContent, _ref;

  $root = ENV.$root, gist = ENV.gist;

  if (styleContent = (_ref = gist.files["style.css"]) != null ? _ref.content : void 0) {
    $root.append($("<style>", {
      html: styleContent
    }));
  }

  actions = {
    save: function() {
      var fileData;
      fileData = filetree.fileData();
      return Gistquire.update(gist.id, {
        files: fileData
      });
    },
    "new": function() {
      var name;
      if (name = prompt("File Name", "newfile.coffee")) {
        return filetree.files.push(File({
          filename: name,
          content: ""
        }));
      }
    },
    run: function() {
      var demoElement;
      $root.children(".demo").remove();
      demoElement = $("<div>", {
        "class": "demo"
      });
      $root.append(demoElement);
      return Function("ENV", build())({
        $root: demoElement,
        gist: gist
      });
    },
    load: function() {
      var id;
      if (id = prompt("Gist Id", gist.id)) {
        console.log(id);
        return Gistquire.get(id, function(data) {
          gist = data;
          return filetree.load(gist.files);
        });
      }
    },
    list: function() {
      return Gistquire.api("gists", function(data) {
        return $root.append(HAMLjr.templates.gist_list({
          gists: data
        }));
      });
    }
  };

  filetree = Filetree();

  filetree.load(gist.files);

  filetree.selectedFile.observe(function(file) {
    var editor;
    $root.find(".editor-wrap").remove();
    $root.find(".main").append(HAMLjr.templates.editor());
    editor = TextEditor({
      text: file.content(),
      el: $root.find('.editor').get(0)
    });
    return editor.text.observe(function(text) {
      file.content(text);
      //return actions.run();
    });
  });

  $root.append(HAMLjr.templates.main({
    filetree: filetree,
    actions: actions
  }));

}).call(this);
