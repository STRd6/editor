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

  this.HAMLjr.templates["errors"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("div");
      __push(__element);
      __attribute(__element, "class", "error-wrap");
      __element = document.createElement("pre");
      __push(__element);
      __attribute(__element, "class", "errors");
      __each(this, function(error) {
        __element = document.createTextNode('');
        __text(__element, error.stack);
        __push(__element);
        return __pop();
      });
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

  this.HAMLjr.templates["github_status"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("div");
      __push(__element);
      __attribute(__element, "class", "status");
      if (this.request && this.request.getAllResponseHeaders().match(/X-RateLimit-Limit: 5000/)) {
        __element = document.createTextNode('');
        __text(__element, "Authenticated\n");
        __push(__element);
        __pop();
      } else {
        __element = document.createElement("button");
        __push(__element);
        __element = document.createTextNode('');
        __text(__element, "Auth\n");
        __push(__element);
        __pop();
        __on("click", Gistquire.auth);
        __pop();
      }
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
      __element = document.createTextNode('');
      __text(__element, HAMLjr.templates.errors(this.errors));
      __push(__element);
      __pop();
      __element = document.createTextNode('');
      __text(__element, HAMLjr.templates.github_status(this));
      __push(__element);
      __pop();
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);

(function() {
  this.Builder = function() {
    var build, buildStyle, compileTemplate;
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
    build = function(fileData) {
      var errors, main, models, templates;
      templates = [];
      models = [];
      main = "";
      errors = [];
      Object.keys(fileData).each(function(name) {
        var error, source;
        source = fileData[name].content;
        try {
          if (name.extension() === "haml") {
            return templates.push(compileTemplate(source, name.withoutExtension()));
          } else if (name.extension() === "coffee") {
            if (name === "main.coffee") {
              return main = CoffeeScript.compile(source);
            } else {
              return models.push(CoffeeScript.compile(source));
            }
          }
        } catch (_error) {
          error = _error;
          return errors.push(error);
        }
      });
      return {
        errors: errors,
        result: "" + (templates.join("\n")) + "\n" + (models.join("\n")) + "\n" + main
      };
    };
    buildStyle = function(fileData) {
      var errors, styles;
      styles = [];
      errors = [];
      Object.keys(fileData).each(function(name) {
        var error, source;
        source = fileData[name].content;
        try {
          if (name.extension() === "styl") {
            return styles.push(styl(source, {
              whitespace: true
            }).toString());
          }
        } catch (_error) {
          error = _error;
          return errors.push(error);
        }
      });
      return {
        errors: errors,
        result: styles.join("\n")
      };
    };
    return {
      build: function(fileData, _arg) {
        var collectedErrors, error, errors, result, success, _ref, _ref1;
        success = _arg.success, error = _arg.error;
        _ref = build(fileData), collectedErrors = _ref.errors, result = _ref.result;
        fileData["build.js"] = {
          filename: "build.js",
          content: result
        };
        _ref1 = buildStyle(fileData), errors = _ref1.errors, result = _ref1.result;
        collectedErrors = collectedErrors.concat(errors);
        fileData["style.css"] = {
          filename: "style.css",
          content: result
        };
        if (collectedErrors.length) {
          return error(collectedErrors);
        } else {
          return success(fileData);
        }
      }
    };
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
    var self;
    if (I == null) {
      I = {};
    }
    Object.defaults(I, {
      files: []
    });
    self = Model(I).observeAll();
    self.attrObservable("selectedFile");
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
          var name;
          name = file.filename();
          return fileData[name] = {
            content: file.content(),
            filename: name
          };
        });
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
  var $root, actions, builder, errors, filetree, gist, request, styleContent, _ref;

  $root = ENV.$root, gist = ENV.gist, request = ENV.request;

  if (styleContent = (_ref = gist.files["style.css"]) != null ? _ref.content : void 0) {
    $root.append($("<style>", {
      html: styleContent
    }));
  }

  builder = Builder();

  errors = Observable([]);

  actions = {
    save: function() {
      return builder.build(filetree.fileData(), {
        success: function(fileData) {
          Gistquire.update(gist.id, {
            files: fileData
          });
          return errors([]);
        },
        error: errors
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
    run: (function() {
      var demoElement;
      $root.children(".demo").remove();
      demoElement = $("<div>", {
        "class": "demo"
      });
      $root.append(demoElement);
      return builder.build(filetree.fileData(), {
        success: function(fileData) {
          Function("ENV", fileData["build.js"].content)({
            $root: demoElement,
            gist: {
              files: fileData
            }
          });
          return errors([]);
        },
        error: errors
      });
    }).debounce(250),
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
    var editor, root;
    root = $root.children(".main");
    root.find(".editor-wrap").hide();
    if (file.editor) {
      return file.editor.show();
    } else {
      root.append(HAMLjr.templates.editor());
      file.editor = root.find(".editor-wrap").last();
      editor = TextEditor({
        text: file.content(),
        el: file.editor.find('.editor').get(0)
      });
      return editor.text.observe(function(value) {
        return file.content(value);
      });
    }
  });

  $root.append(HAMLjr.templates.main({
    filetree: filetree,
    actions: actions,
    errors: errors,
    request: request
  }));

}).call(this);
