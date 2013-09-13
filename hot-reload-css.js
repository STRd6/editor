(function (ENV) {
(function() {
  var commit, publish;

  publish = function(_arg) {
    var builder, fileData, repository;
    builder = _arg.builder, fileData = _arg.fileData, repository = _arg.repository;
    return builder.build(fileData).then(function(build) {
      var branch;
      branch = repository.branch();
      return repository.publish(builder.standAlone(build, branch));
    });
  };

  commit = function(_arg) {
    var fileData, message, repository;
    fileData = _arg.fileData, repository = _arg.repository, message = _arg.message;
    return repository.commitTree({
      tree: fileData,
      message: message
    });
  };

  this.Actions = {
    save: function(params) {
      return commit(params).then(function() {
        return publish(params);
      });
    },
    run: function(_arg) {
      var builder, filetree;
      builder = _arg.builder, filetree = _arg.filetree;
      return builder.runnable(filetree.data()).then(Runner.run);
    },
    load: function(_arg) {
      var filetree, processDirectory, repository;
      filetree = _arg.filetree, repository = _arg.repository;
      processDirectory = function(items) {
        return items.each(function(item) {
          if (!item.content) {
            return item;
          }
          item.content = Base64.decode(item.content);
          return item.encoding = "raw";
        });
      };
      return repository.latestTree().then(function(results) {
        var files;
        files = processDirectory(results);
        return filetree.load(files);
      });
    }
  };

}).call(this);
;(function() {
  var arrayToHash, compileFile, compileStyl, compileTemplate, dependencyScripts, documentFile, makeScript, readConfig, stripMarkdown;

  arrayToHash = function(array) {
    return array.eachWithObject({}, function(file, hash) {
      return hash[file.path] = file;
    });
  };

  stripMarkdown = function(content) {
    return content.split("\n").map(function(line) {
      var match;
      if (match = /^([ ]{4}|\t)/.exec(line)) {
        return line.slice(match[0].length);
      } else {
        return "";
      }
    }).join("\n");
  };

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

  compileStyl = function(source) {
    return styl(source, {
      whitespace: true
    }).toString();
  };

  compileFile = function(_arg) {
    var content, extension, name, path, result, _ref;
    path = _arg.path, content = _arg.content;
    _ref = [path.withoutExtension(), path.extension()], name = _ref[0], extension = _ref[1];
    result = (function() {
      switch (extension) {
        case "js":
          return {
            code: content
          };
        case "coffee":
          return {
            code: CoffeeScript.compile(content)
          };
        case "haml":
          return {
            code: compileTemplate(content, name)
          };
        case "styl":
          return {
            style: compileStyl(content)
          };
        case "md":
          return compileFile({
            path: name,
            content: stripMarkdown(content)
          });
        default:
          return {};
      }
    })();
    Object.defaults(result, {
      name: name,
      extension: extension
    });
    if (path.match(/^test\//)) {
      if (result.code) {
        result.test = "" + (result.test || "") + ";" + result.code;
        delete result.code;
      }
    }
    return Object.extend(result, {
      path: path
    });
  };

  documentFile = function(content, path) {
    if (path.extension() === "md") {
      return marked(content);
    } else {
      return "";
    }
  };

  makeScript = function(attrs) {
    return $("<script>", attrs).prop('outerHTML');
  };

  dependencyScripts = function(build) {
    var remoteDependencies;
    remoteDependencies = readConfig(build).remoteDependencies;
    return (remoteDependencies ? remoteDependencies.map(function(src) {
      return makeScript({
        "class": "env",
        src: src
      });
    }) : $('script.env').map(function() {
      return this.outerHTML;
    }).get()).join("\n");
  };

  this.Builder = function(I) {
    var build, postProcessors;
    if (I == null) {
      I = {};
    }
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
      var data, errors, results, _ref;
      results = fileData.map(function(_arg) {
        var content, location, message, path;
        path = _arg.path, content = _arg.content;
        try {
          return compileFile({
            path: path,
            content: content
          });
        } catch (_error) {
          location = _error.location, message = _error.message;
          if (location != null) {
            message = "Error on line " + (location.first_line + 1) + ": " + message;
          }
          return {
            error: "" + path + " - " + message
          };
        }
      });
      _ref = results.partition(function(result) {
        return result.error;
      }), errors = _ref[0], data = _ref[1];
      if (errors.length) {
        return Deferred().reject(errors.map(function(e) {
          return e.error;
        }));
      } else {
        return Deferred().resolve(data);
      }
    };
    postProcessors = [];
    return {
      I: I,
      addPostProcessor: function(fn) {
        return postProcessors.push(fn);
      },
      buildDocs: function(fileData) {
        return fileData.map(function(_arg) {
          var content, location, message, path;
          path = _arg.path, content = _arg.content;
          try {
            return {
              path: path,
              documentation: documentFile(content, path)
            };
          } catch (_error) {
            location = _error.location, message = _error.message;
            if (location != null) {
              message = "Error on line " + (location.first_line + 1) + ": " + message;
            }
            return {
              error: "" + path + " - " + message
            };
          }
        });
      },
      build: function(fileData) {
        return build(fileData).then(function(items) {
          var dist, distCode, distStyle, distTest, results;
          results = {
            code: [],
            style: [],
            main: [],
            test: []
          };
          items.eachWithObject(results, function(item, hash) {
            var code, style, test;
            if (code = item.code) {
              if (item.name === "main" && (item.extension === "js" || item.extension === "coffee")) {
                return hash.main.push(code);
              } else {
                return hash.code.push(code);
              }
            } else if (style = item.style) {
              return hash.style.push(style);
            } else if (test = item.test) {
              return hash.test.push(test);
            } else {

            }
          });
          distCode = results.code.concat(results.main).join(';').trim();
          distTest = results.code.concat(results.test).join(';').trim();
          distStyle = results.style.join('').trim();
          dist = [];
          if (!distCode.blank()) {
            dist.push({
              path: "build.js",
              content: distCode,
              type: "blob"
            });
          }
          if (!distStyle.blank()) {
            dist.push({
              path: "style.css",
              content: distStyle,
              type: "blob"
            });
          }
          if (!distTest.blank()) {
            dist.push({
              path: "test.js",
              content: distTest,
              type: "blob"
            });
          }
          return Deferred().resolve(postProcessors.pipeline({
            source: arrayToHash(fileData),
            distribution: arrayToHash(dist)
          }));
        });
      },
      program: function(build) {
        var distribution, entryPoint, program;
        distribution = build.distribution;
        entryPoint = "build.js";
        program = distribution[entryPoint].content;
        return "(function (ENV) {\n" + program + "\n}(" + (JSON.stringify(build, null, 2)) + "));";
      },
      buildStyle: function(fileData) {
        return this.build(fileData).then(function(build) {
          var content, distribution, _ref;
          distribution = build.distribution;
          return content = ((_ref = distribution["style.css"]) != null ? _ref.content : void 0) || "";
        });
      },
      testScripts: function(fileData) {
        return this.build(fileData).then(function(build) {
          var content, distribution, _ref;
          distribution = build.distribution;
          content = ((_ref = distribution["test.js"]) != null ? _ref.content : void 0) || "";
          return "" + (dependencyScripts(build)) + "\n<script>" + content + "<\/script>";
        });
      },
      runnable: function(fileData) {
        var _this = this;
        return this.build(fileData).then(function(build) {
          var standAlone;
          standAlone = _this.standAlone(build);
          standAlone.config = Builder.readConfig(build);
          return standAlone;
        });
      },
      standAlone: function(build, ref) {
        var content, distribution, program, scriptTag, source;
        source = build.source, distribution = build.distribution;
        content = [];
        content.push("<!doctype html>\n<head>\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />");
        content = content.concat(dependencyScripts(build));
        program = this.program(build);
        scriptTag = ref ? makeScript({
          src: "" + ref + ".js?" + (+(new Date))
        }) : "<script>\n" + program + "\n<\/script>";
        content.push("</head>\n<body>\n" + scriptTag + "\n</body>\n</html>");
        return {
          html: content.join("\n"),
          script: program
        };
      }
    };
  };

  readConfig = function(build) {
    var configData, _ref, _ref1;
    if (configData = (_ref = build.source["pixie.cson"]) != null ? _ref.content : void 0) {
      return CSON.parse(configData);
    } else if (configData = (_ref1 = build.source["pixie.json"]) != null ? _ref1.content : void 0) {
      return JSON.parse(configData);
    } else {
      return {};
    }
  };

  Builder.readConfig = readConfig;

}).call(this);
;(function() {
  var withDeferrence;

  this.Deferred = $.Deferred;

  withDeferrence = function(fn) {
    var deferred, e;
    deferred = Deferred();
    try {
      fn.defer(deferred);
    } catch (_error) {
      e = _error;
      deferred.reject(e);
    }
    return deferred.promise();
  };

  Deferred.Confirm = function(message) {
    return withDeferrence(function(deferred) {
      if (window.confirm(message)) {
        return deferred.resolve();
      } else {
        return deferred.reject();
      }
    });
  };

  Deferred.ConfirmIf = function(flag, message) {
    if (flag) {
      return Deferred.Confirm(message);
    } else {
      return withDeferrence(function(deferred) {
        return deferred.resolve();
      });
    }
  };

  Deferred.ExecuteIf = function(flag, callback) {
    return withDeferrence(function(deferred) {
      if (flag) {
        return callback().then(deferred.resolve);
      } else {
        return deferred.resolve();
      }
    });
  };

}).call(this);
;(function() {
  String.prototype.dasherize = function() {
    return this.trim().replace(/\s+/g, "-").toLowerCase();
  };

  this.Base64 = {
    encode: function(s) {
      return btoa(unescape(encodeURIComponent(s)));
    },
    decode: function(s) {
      return decodeURIComponent(escape(atob(s.replace(/\s/g, ''))));
    }
  };

  this.CSON = {
    parse: function(source) {
      return Function("return " + (CoffeeScript.compile(source, {
        bare: true
      })))();
    },
    stringify: function(object) {
      var representation;
      representation = JSON.parse(JSON.stringify(obj));
      return Object.keys(representation).map(function(key) {
        var value;
        value = representation[key];
        return "" + key + ": " + (JSON.stringify(value));
      }).join("\n");
    }
  };

  HAMLjr.render = function(templateName, object) {
    var template, templates;
    templates = HAMLjr.templates;
    template = templates[templateName] || templates["templates/" + templateName];
    if (template) {
      return template(object);
    } else {
      throw "Could not find template named " + templateName;
    }
  };

}).call(this);
;(function() {
  this.File = function(I) {
    var self;
    if (I == null) {
      I = {};
    }
    if (I.path == null) {
      I.path = I.filename;
    }
    if (I.filename == null) {
      I.filename = I.path.split("/").last();
    }
    self = Model(I).observeAll();
    self.extend({
      extension: function() {
        return self.filename().extension();
      },
      mode: function() {
        var extension;
        switch (extension = self.extension()) {
          case "js":
            return "javascript";
          case "md":
            return "markdown";
          case "":
            return "text";
          default:
            return extension;
        }
      },
      modified: Observable(false),
      displayName: Observable(self.path())
    });
    self.content.observe(function() {
      return self.modified(true);
    });
    self.modified.observe(function(modified) {
      if (modified) {
        return self.displayName("*" + (self.path()));
      } else {
        return self.displayName(self.path());
      }
    });
    return self;
  };

}).call(this);
;(function() {
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
        if (Array.isArray(fileData)) {
          files = fileData.sort(function(a, b) {
            if (a.path < b.path) {
              return -1;
            } else if (b.path < a.path) {
              return 1;
            } else {
              return 0;
            }
          }).map(File);
        } else {
          files = Object.keys(fileData).sort().map(function(path) {
            return File(fileData[path]);
          });
        }
        return self.files(files);
      },
      data: function() {
        return self.files.map(function(file) {
          return {
            path: file.path(),
            mode: "100644",
            content: file.content(),
            type: "blob"
          };
        });
      },
      hasUnsavedChanges: function() {
        return self.files().select(function(file) {
          return file.modified();
        }).length;
      },
      markSaved: function() {
        return self.files().each(function(file) {
          return file.modified(false);
        });
      }
    });
    return self;
  };

}).call(this);
;(function() {
  this.Gistquire = {
    accessToken: null,
    auth: function() {
      var scope, url;
      scope = "gist,repo,user:email";
      url = "https://github.com/login/oauth/authorize?client_id=bc46af967c926ba4ff87&scope=" + scope;
      return window.location = url;
    },
    onload: function() {
      var code, _ref,
        _this = this;
      if (code = (_ref = window.location.href.match(/\?code=(.*)/)) != null ? _ref[1] : void 0) {
        $.getJSON("https://hamljr-auth.herokuapp.com/authenticate/" + code, function(data) {
          var token;
          if (token = data.token) {
            _this.accessToken = token;
            return localStorage.authToken = token;
          }
        });
      }
      if (localStorage.authToken) {
        return this.accessToken = localStorage.authToken;
      }
    },
    api: function(path, options) {
      var url;
      if (options == null) {
        options = {};
      }
      if (path.match(/^http/)) {
        url = path;
      } else {
        url = "https://api.github.com/" + path;
      }
      options.headers || (options.headers = {});
      if (this.accessToken) {
        options.headers["Authorization"] = "token " + this.accessToken;
      }
      options = Object.extend({
        url: url,
        type: "GET",
        dataType: 'json'
      }, options);
      return $.ajax(options);
    }
  };

}).call(this);
;(function() {
  var __slice = [].slice;

  this.Repository = function(I) {
    var api, get, patch, post, put, requestOptions, self;
    if (I == null) {
      I = {};
    }
    Object.defaults(I, {
      branch: "master",
      defaultBranch: "master"
    });
    self = Model(I).observeAll();
    self.attrObservable("branch");
    requestOptions = function(type, data) {
      return {
        type: type,
        data: JSON.stringify(data)
      };
    };
    api = function(path, options) {
      var url;
      if (path.match(/^http/)) {
        url = path;
      } else {
        url = "" + (self.url()) + "/" + path;
      }
      return Gistquire.api(url, options);
    };
    get = function(path, data) {
      return api(path, {
        data: data
      });
    };
    put = function(path, data) {
      return api(path, requestOptions("PUT", data));
    };
    post = function(path, data) {
      return api(path, requestOptions("POST", data));
    };
    patch = function(path, data) {
      return api(path, requestOptions("PATCH", data));
    };
    self.extend({
      pullRequests: function() {
        return get("pulls");
      },
      createPullRequest: function(_arg) {
        var head, title;
        title = _arg.title;
        head = title.dasherize();
        return self.switchToBranch(head).then(self.commitEmpty).then(function() {
          return post("pulls", {
            base: I.defaultBranch,
            head: head,
            title: title
          });
        });
      },
      initPagesBranch: function() {
        var branch;
        branch = "gh-pages";
        return post("git/trees", {
          tree: [
            {
              mode: "1006444",
              path: "tempest.txt",
              content: "created by strd6.github.io/editor"
            }
          ]
        }).then(function(data) {
          return post("git/commits", {
            message: "Initial gh-pages commit",
            tree: data.sha
          });
        }).then(function(data) {
          return post("git/refs", {
            ref: "refs/heads/" + branch,
            sha: data.sha
          });
        });
      },
      writeFile: function(params) {
        var branch, content, message, path;
        branch = params.branch, path = params.path, content = params.content, message = params.message;
        return get("contents/" + path, {
          ref: branch
        }).then(function(data) {
          return put("contents/" + path, {
            content: content,
            sha: data.sha,
            message: message,
            branch: branch
          });
        }, function(request) {
          var _ref, _ref1;
          if (((_ref = request.responseJSON) != null ? _ref.message : void 0) === "No commit found for the ref gh-pages") {
            return self.initPagesBranch().then(function() {
              return self.writeFile(params);
            });
          } else if (request.status === 404) {
            return put("contents/" + path, {
              content: content,
              message: message,
              branch: branch
            });
          } else {
            return (_ref1 = Deferred()).reject.apply(_ref1, arguments);
          }
        });
      },
      latestTree: function(branch) {
        if (branch == null) {
          branch = self.branch();
        }
        return get("git/refs/heads/" + branch).then(function(data) {
          return get(data.object.url);
        }).then(function(data) {
          return get("" + data.tree.url + "?recursive=1");
        }).then(function(data) {
          var files;
          files = data.tree.select(function(file) {
            return file.type === "blob";
          });
          return $.when.apply(null, files.map(function(datum) {
            return get(datum.url).then(function(data) {
              return Object.extend(datum, data);
            });
          }));
        }).then(function() {
          var results;
          results = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return results;
        });
      },
      commitTree: function(_arg) {
        var branch, latestCommitSha, message, tree;
        message = _arg.message, tree = _arg.tree;
        branch = self.branch();
        if (message == null) {
          message = "Updated in browser at strd6.github.io/editor";
        }
        if (!tree) {
          throw Error("Must pass in a tree");
        }
        latestCommitSha = null;
        return get("git/refs/heads/" + branch).then(function(data) {
          latestCommitSha = data.object.sha;
          return post("git/trees", {
            tree: tree
          });
        }).then(function(data) {
          return post("git/commits", {
            parents: [latestCommitSha],
            message: message,
            tree: data.sha
          });
        }).then(function(data) {
          return patch("git/refs/heads/" + branch, {
            sha: data.sha
          });
        });
      },
      commitEmpty: function() {
        var branch, latestCommit;
        branch = self.branch();
        latestCommit = null;
        return get("git/refs/heads/" + branch).then(function(data) {
          return get(data.object.url);
        }).then(function(data) {
          return post("git/commits", {
            parents: [data.sha],
            message: "This commit intentionally left blank",
            tree: data.tree.sha
          });
        }).then(function(data) {
          return patch("git/refs/heads/" + branch, {
            sha: data.sha
          });
        });
      },
      switchToBranch: function(branch) {
        var ref, setBranch;
        ref = "refs/heads/" + branch;
        setBranch = function(data) {
          self.branch(branch);
          return data;
        };
        return get("git/" + ref).then(setBranch, function(request) {
          var branchNotFound, _ref;
          branchNotFound = request.status === 404;
          if (branchNotFound) {
            return get("git/refs/heads/" + (self.branch())).then(function(data) {
              return post("git/refs", {
                ref: ref,
                sha: data.object.sha
              });
            }).then(setBranch);
          } else {
            return (_ref = Deferred()).reject.apply(_ref, arguments);
          }
        });
      },
      mergeInto: function(branch) {
        if (branch == null) {
          branch = self.defaultBranch();
        }
        return post("merges", {
          base: branch,
          head: self.branch()
        });
      },
      pullFromBranch: function(branch) {
        if (branch == null) {
          branch = self.defaultBranch();
        }
        return post("merges", {
          base: self.branch(),
          head: branch
        });
      },
      publish: function(_arg) {
        var branch, html, message, path, promise, publishBranch, script;
        html = _arg.html, script = _arg.script;
        branch = self.branch();
        message = "Built " + branch + " in browser in strd6.github.io/editor";
        if (branch === "master") {
          path = "index.html";
        } else {
          path = "" + branch + ".html";
        }
        publishBranch = "gh-pages";
        promise = self.writeFile({
          path: path,
          content: Base64.encode(html),
          branch: publishBranch,
          message: message
        });
        if (script) {
          return promise.then(self.writeFile({
            path: "" + branch + ".js",
            content: Base64.encode(script),
            branch: publishBranch,
            message: message
          }));
        } else {
          return promise;
        }
      }
    });
    return self;
  };

}).call(this);
;(function() {
  this.Runtime = function(ENV) {
    var applyStyleSheet, currentNode, promo;
    currentNode = function() {
      var target;
      target = document.documentElement;
      while (target.childNodes.length && target.lastChild.nodeType === 1) {
        target = target.lastChild;
      }
      return target.parentNode;
    };
    applyStyleSheet = function(root) {
      var styleClass, styleContent, styleNode, _ref;
      styleClass = "primary";
      if (styleContent = (_ref = ENV.distribution["style.css"]) != null ? _ref.content : void 0) {
        styleNode = document.createElement("style");
        styleNode.innerHTML = styleContent;
        styleNode.className = styleClass;
        return root.appendChild(styleNode);
      }
    };
    promo = function() {
      return console.log("%c You should meet my creator " + ENV.progenitor.url, "background: #000; \ncolor: white; \nfont-size: 2em;\nline-height: 2em;\npadding: 40px 100px;\nmargin-bottom: 1em;\ntext-shadow: \n  0 0 0.05em #fff, \n  0 0 0.1em #fff, \n  0 0 0.15em #fff, \n  0 0 0.2em #ff00de, \n  0 0 0.35em #ff00de, \n  0 0 0.4em #ff00de, \n  0 0 0.5em #ff00de, \n  0 0 0.75em #ff00de;'");
    };
    return {
      boot: function() {
        var root;
        root = currentNode();
        applyStyleSheet(root);
        promo();
        return root;
      }
    };
  };

}).call(this);
;(function() {
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
    editor.getSession().setUseWorker(false);
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
;(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["templates/actions"] = function(data) {
    return (function() {
      var actions, __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("div");
      __push(__element);
      __attribute(__element, "class", "actions");
      actions = this.actions;
      Object.keys(actions).each(function(name) {
        __element = document.createElement("button");
        __push(__element);
        __element = document.createTextNode('');
        __text(__element, name.titleize());
        __push(__element);
        __pop();
        __on("click", function() {
          return actions[name]();
        });
        return __pop();
      });
      __element = document.createTextNode('');
      __text(__element, HAMLjr.render("issues", this.issues));
      __push(__element);
      __pop();
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);
;(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["templates/editor"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("div");
      __push(__element);
      __attribute(__element, "class", "main");
      __element = document.createTextNode('');
      __text(__element, HAMLjr.render("actions", {
        actions: this.actions,
        issues: this.issues
      }));
      __push(__element);
      __pop();
      __element = document.createTextNode('');
      __text(__element, HAMLjr.render("filetree", this.filetree));
      __push(__element);
      __pop();
      __element = document.createTextNode('');
      __text(__element, HAMLjr.render("notices", this));
      __push(__element);
      __pop();
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);
;(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["templates/filetree"] = function(data) {
    return (function() {
      var files, selectedFile, __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("ul");
      __push(__element);
      __attribute(__element, "class", "filetree");
      selectedFile = this.selectedFile;
      files = this.files;
      __each(files, function(file) {
        __element = document.createElement("li");
        __push(__element);
        __element = document.createTextNode('');
        __text(__element, file.displayName);
        __push(__element);
        __pop();
        __on("click", function(e) {
          if ($(e.target).is('li')) {
            return selectedFile(file);
          }
        });
        __element = document.createElement("div");
        __push(__element);
        __attribute(__element, "class", "delete");
        __on("click", function() {
          if (confirm("Delete " + (file.path()) + "?")) {
            return files.remove(file);
          }
        });
        __element = document.createTextNode('');
        __text(__element, "X\n");
        __push(__element);
        __pop();
        __pop();
        return __pop();
      });
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);
;(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["templates/github_status"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("div");
      __push(__element);
      __attribute(__element, "class", "status");
      if (this.request && this.request.getAllResponseHeaders().match(/X-RateLimit-Limit: 5000/)) {
        __element = document.createTextNode('');
        __text(__element, "Authenticated Scopes:\n");
        __push(__element);
        __pop();
        __element = document.createTextNode('');
        __text(__element, this.request.getResponseHeader("X-OAuth-Scopes"));
        __push(__element);
        __pop();
        __element = document.createElement("br");
        __push(__element);
        __pop();
        __element = document.createTextNode('');
        __text(__element, "Rate Limit Remaining:\n");
        __push(__element);
        __pop();
        __element = document.createTextNode('');
        __text(__element, this.request.getResponseHeader("X-RateLimit-Remaining"));
        __push(__element);
        __pop();
        __element = document.createTextNode('');
        __text(__element, " / 5000");
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
;(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["templates/notices"] = function(data) {
    return (function() {
      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
      __push(document.createDocumentFragment());
      __element = document.createElement("div");
      __push(__element);
      __attribute(__element, "class", "console-wrap");
      __element = document.createElement("pre");
      __push(__element);
      __attribute(__element, "class", "errors");
      __each(this.errors, function(error) {
        __element = document.createTextNode('');
        __text(__element, error);
        __push(__element);
        return __pop();
      });
      __pop();
      __element = document.createElement("pre");
      __push(__element);
      __attribute(__element, "class", "notices");
      __each(this.notices, function(notice) {
        __element = document.createTextNode('');
        __text(__element, notice);
        __push(__element);
        return __pop();
      });
      __pop();
      __pop();
      return __pop();
    }).call(data);
  };

}).call(this);
;(function() {
  var _base;

  this.HAMLjr || (this.HAMLjr = {});

  (_base = this.HAMLjr).templates || (_base.templates = {});

  this.HAMLjr.templates["templates/text_editor"] = function(data) {
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
;(function() {
  var runningWindows;

  runningWindows = [];

  this.Runner = {
    run: function(_arg) {
      var config, html, sandbox;
      config = _arg.config, html = _arg.html;
      sandbox = Sandbox({
        width: config.width,
        height: config.height
      });
      sandbox.document.open();
      sandbox.document.write(html);
      sandbox.document.close();
      return runningWindows.push(sandbox);
    },
    hotReloadCSS: function(css) {
      runningWindows = runningWindows.partition(function(window) {
        var styleClass;
        if (window.closed) {
          return false;
        }
        styleClass = "primary";
        $(window.document).find("style." + styleClass).html(css);
        return true;
      });
      return console.log(css);
    }
  };

}).call(this);
;(function() {
  var $root, actions, branch, builder, classicError, confirmUnsaved, distribution, errors, files, filetree, fullName, hotReloadCSS, issues, notices, notify, owner, repo, repository, repositoryLoaded, _ref;

  files = ENV.source, distribution = ENV.distribution;

  window.ENV = ENV;

  classicError = function(request) {
    var message;
    notices([]);
    if (request.responseJSON) {
      message = JSON.stringify(request.responseJSON, null, 2);
    } else {
      message = "Error";
    }
    return errors([message]);
  };

  notify = function(message) {
    notices([message]);
    return errors([]);
  };

  $root = $(Runtime(ENV).boot());

  Gistquire.onload();

  _ref = ENV.repository, owner = _ref.owner, repo = _ref.repo, branch = _ref.branch, fullName = _ref.full_name;

  fullName || (fullName = "" + owner + "/" + repo);

  repository = Repository({
    url: "repos/" + fullName
  });

  errors = Observable([]);

  notices = Observable(["Loaded!"]);

  builder = Builder({
    errors: errors,
    notices: notices
  });

  repositoryLoaded = function(repository) {
    issues.repository = repository;
    repository.pullRequests().then(issues.reset);
    return notices(["Finished loading!"]);
  };

  confirmUnsaved = function() {
    return Deferred.ConfirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?");
  };

  issues = Issues();

  builder.addPostProcessor(function(data) {
    data.repository = {
      full_name: fullName,
      branch: branch
    };
    return data;
  });

  builder.addPostProcessor(function(data) {
    data.progenitor = {
      url: "http://strd6.github.io/editor/"
    };
    return data;
  });

  actions = {
    save: function() {
      notices(["Saving..."]);
      return Actions.save({
        repository: repository,
        fileData: filetree.data(),
        builder: builder
      }).then(function() {
        filetree.markSaved();
        return notices(["Saved and published!"]);
      });
    },
    run: function() {
      return Actions.run({
        builder: builder,
        filetree: filetree
      }).fail(errors);
    },
    test: function() {
      notify("Running tests...");
      return builder.testScripts(filetree.data()).then(function(testScripts) {
        return TestRunner.launch(testScripts);
      }).fail(errors);
    },
    new_file: function() {
      var name;
      if (name = prompt("File Name", "newfile.coffee")) {
        return filetree.files.push(File({
          filename: name,
          content: ""
        }));
      }
    },
    load_repo: function(skipPrompt) {
      return confirmUnsaved().then(function() {
        if (!skipPrompt) {
          fullName = prompt("Github repo", fullName);
        }
        if (fullName) {
          repository = Repository({
            url: "repos/" + fullName
          });
        } else {
          errors(["No repo given"]);
          return;
        }
        notices(["Loading repo..."]);
        return Actions.load({
          repository: repository,
          filetree: filetree
        }).then(function() {
          return repositoryLoaded(repository);
        }).fail(function() {
          return errors(["Error loading " + (repository.url())]);
        });
      });
    },
    new_feature: function() {
      var title;
      if (title = prompt("Description")) {
        notices(["Creating feature branch..."]);
        return repository.createPullRequest({
          title: title
        }).then(function(data) {
          var issue;
          issue = Issue(data);
          issues.issues.push(issue);
          issues.silent = true;
          issues.currentIssue(issue);
          issues.silent = false;
          return notices.push("Created!");
        }, classicError);
      }
    },
    pull_master: function() {
      return confirmUnsaved().then(function() {
        notify("Merging in default branch...");
        return repository.pullFromBranch();
      }, classicError).then(function() {
        var branchName;
        notices.push("Merged!");
        branchName = repository.branch();
        notices.push("\nReloading branch " + branchName + "...");
        return Actions.load({
          repository: repository,
          filetree: filetree
        }).then(function() {
          return notices.push("Loaded!");
        });
      });
    }
  };

  filetree = Filetree();

  filetree.load(files);

  filetree.selectedFile.observe(function(file) {
    var editor, root;
    root = $root.children(".main");
    root.find(".editor-wrap").hide();
    if (file.editor) {
      return file.editor.trigger("show");
    } else {
      root.append(HAMLjr.render("text_editor"));
      file.editor = root.find(".editor-wrap").last();
      editor = TextEditor({
        text: file.content(),
        el: file.editor.find('.editor').get(0),
        mode: file.mode()
      });
      file.editor.on("show", function() {
        file.editor.show();
        return editor.editor.focus();
      });
      return editor.text.observe(function(value) {
        file.content(value);
        if (file.path().match(/\.styl$/)) {
          return hotReloadCSS();
        }
      });
    }
  });

  hotReloadCSS = (function() {
    return builder.buildStyle(filetree.data()).then(Runner.hotReloadCSS);
  }).debounce(500);

  repositoryLoaded(repository);

  issues.currentIssue.observe(function(issue) {
    var changeBranch;
    if (issues.silent) {
      return;
    }
    changeBranch = function(branchName) {
      var previousBranch;
      previousBranch = repository.branch();
      return confirmUnsaved().then(function() {
        return repository.switchToBranch(branchName).then(function() {
          notices.push("\nLoading branch " + branchName + "...");
          return Actions.load({
            repository: repository,
            filetree: filetree
          }).then(function() {
            return notices.push("Loaded!");
          });
        });
      }, function() {
        repository.branch(previousBranch);
        return errors(["Error switching to " + branchName + ", still on " + previousBranch]);
      });
    };
    if (issue) {
      notify(issue.fullDescription());
      return changeBranch(issue.branchName());
    } else {
      notify("Default branch selected");
      return changeBranch(repository.defaultBranch());
    }
  });

  $root.append(HAMLjr.render("editor", {
    filetree: filetree,
    actions: actions,
    notices: notices,
    errors: errors,
    issues: issues
  }));

  Gistquire.api("rate_limit").then(function(data, status, request) {
    return $root.append(HAMLjr.render("github_status", {
      request: request
    }));
  });

  window.onbeforeunload = function() {
    if (filetree.hasUnsavedChanges()) {
      return "You have some unsaved changes, if you leave now you will lose your work.";
    }
  };

}).call(this);
}({
  "source": {
    "TODO": {
      "path": "TODO",
      "mode": "100644",
      "content": "TODO\n----\nBundled Dependencies\n- Build bundled dependencies into published script\n- Dependency source should not be in revision control\n- requires and module.exports\n- inter-component and intra-component dependencies\n- One day we'll need to implement a bundleresque system, but not today\n\nLive Update Demo\n- Hot reload css\n- Display Demo Runtime Errors in console\n\nOpen published page in editor and run live demo with same state as when editor was opened\n- Pass git repo/branch metadata to published page for use in editor\n\nPersist state across demo reloads\n\nOrganize File tree by type\nFile icons\n\nDisplay Diffs\n\nFirst auth doesn't display in bar\n\nCache Git trees and files in some form of local storage\n\nSometimes editor appears blank when switching files\n\nEditor plugins\n- static analysis\n- find in files\n- source file hygiene\n",
      "type": "blob"
    },
    "main.coffee": {
      "path": "main.coffee",
      "mode": "100644",
      "content": "# Get stuff from our env\n{source:files, distribution} = ENV\n\n# For debugging\nwindow.ENV = ENV\n\n# TODO: Move notifications stuff into its own class\nclassicError = (request) ->\n  notices []\n  \n  if request.responseJSON\n    message = JSON.stringify(request.responseJSON, null, 2)\n  else\n    message = \"Error\"\n\n  errors [message]\n\nnotify = (message) ->\n  notices [message]\n  errors []\n\n# The root is the node that contains the script file.\n$root = $(Runtime(ENV).boot())\n\n# Init Github access token stuff\nGistquire.onload()\n  \n# Real branch and repo info, from ENV\n{owner, repo, branch, full_name:fullName} = ENV.repository\n\nfullName ||= \"#{owner}/#{repo}\"\n\nrepository = Repository\n  url: \"repos/#{fullName}\"\n\nerrors = Observable([])\nnotices = Observable([\"Loaded!\"])\n\nbuilder = Builder\n  errors: errors\n  notices: notices\n\nrepositoryLoaded = (repository) ->\n  issues.repository = repository\n  repository.pullRequests().then issues.reset\n  \n  notices [\"Finished loading!\"]\n  \nconfirmUnsaved = ->\n  Deferred.ConfirmIf(filetree.hasUnsavedChanges(), \"You will lose unsaved changes in your current branch, continue?\")\n\nissues = Issues()\n\n# Repo metadata for env\nbuilder.addPostProcessor (data) ->\n  # TODO: Track commit SHA as well\n  data.repository =\n    full_name: fullName\n    branch: branch\n\n  data\n\nbuilder.addPostProcessor (data) ->\n  # TODO: Think about a robust way to get 'self' and set it as progenitor data\n  data.progenitor =\n    url: \"http://strd6.github.io/editor/\"\n\n  data\n\nactions =\n  save: ->\n    notices [\"Saving...\"]\n    \n    Actions.save\n      repository: repository\n      fileData: filetree.data()\n      builder: builder\n    .then ->\n      # TODO: This could get slightly out of sync if there were changes\n      # during the async call\n      # The correct solution will be to use git shas to determine changed status\n      # but that's a little heavy duty for right now.\n      filetree.markSaved()\n      notices [\"Saved and published!\"]\n\n  run: ->\n    Actions.run({builder, filetree})\n    .fail errors\n\n  test: ->\n    notify \"Running tests...\"\n\n    builder.testScripts(filetree.data())\n    .then (testScripts) ->\n      TestRunner.launch(testScripts)\n    .fail errors\n\n  new_file: ->\n    if name = prompt(\"File Name\", \"newfile.coffee\")\n      filetree.files.push File\n        filename: name\n        content: \"\"\n\n  load_repo: (skipPrompt) ->\n    confirmUnsaved()\n    .then ->\n      fullName = prompt(\"Github repo\", fullName) unless skipPrompt\n\n      if fullName\n        repository = Repository\n          url: \"repos/#{fullName}\"\n      else\n        errors [\"No repo given\"]\n  \n        return\n  \n      notices [\"Loading repo...\"]\n  \n      Actions.load\n        repository: repository\n        filetree: filetree\n      .then ->\n        repositoryLoaded(repository)\n      .fail ->\n        errors [\"Error loading #{repository.url()}\"]\n        \n  new_feature: ->\n    if title = prompt(\"Description\")\n      notices [\"Creating feature branch...\"]\n    \n      repository.createPullRequest\n        title: title\n      .then (data) ->\n        issue = Issue(data)\n        issues.issues.push issue\n\n        # TODO: Standardize this like backbone or something\n        # or think about using deferreds in some crazy way\n        issues.silent = true\n        issues.currentIssue issue\n        issues.silent = false\n\n        notices.push \"Created!\"\n      , classicError\n      \n  pull_master: ->\n    confirmUnsaved()\n    .then( ->\n      notify \"Merging in default branch...\"\n      repository.pullFromBranch()\n    , classicError\n    ).then ->\n      notices.push \"Merged!\"\n      \n      branchName = repository.branch()\n      notices.push \"\\nReloading branch #{branchName}...\"\n        \n      Actions.load\n        repository: repository\n        filetree: filetree\n      .then ->\n        notices.push \"Loaded!\"\n\nfiletree = Filetree()\nfiletree.load(files)\n\nfiletree.selectedFile.observe (file) ->\n  root = $root.children(\".main\")\n  root.find(\".editor-wrap\").hide()\n  \n  if file.editor\n    file.editor.trigger(\"show\")\n  else\n    root.append(HAMLjr.render \"text_editor\")\n    file.editor = root.find(\".editor-wrap\").last()\n    \n    editor = TextEditor\n      text: file.content()\n      el: file.editor.find('.editor').get(0)\n      mode: file.mode()\n\n    file.editor.on \"show\", ->\n      file.editor.show()\n      editor.editor.focus()\n  \n    editor.text.observe (value) ->\n      file.content(value)\n      \n      # TODO May want to move this into a collection listener for all files\n      # in the filetree\n      if file.path().match(/\\.styl$/)\n        hotReloadCSS()\n\nhotReloadCSS = (->\n  builder.buildStyle(filetree.data())\n  .then Runner.hotReloadCSS\n).debounce(500)\n\nrepositoryLoaded(repository)\n\nissues.currentIssue.observe (issue) ->\n  # TODO: Formalize this later\n  return if issues.silent\n  \n  changeBranch = (branchName) ->\n    previousBranch = repository.branch()\n\n    confirmUnsaved()\n    .then ->\n      # Switch to branch for working on the issue\n      repository.switchToBranch(branchName)\n      .then ->\n        notices.push \"\\nLoading branch #{branchName}...\"\n        \n        Actions.load\n          repository: repository\n          filetree: filetree\n        .then ->\n          notices.push \"Loaded!\"\n    , ->\n      # TODO: Issue will appear as being selected even though we cancelled\n      # To correctly handle this we may need to really beef up our observables.\n      # One possibility is to extend observables to full fledged deferreds\n      # which can be rejected by listeners added to the chain.\n      \n      repository.branch(previousBranch)\n\n      errors [\"Error switching to #{branchName}, still on #{previousBranch}\"]\n\n  if issue\n    notify issue.fullDescription()\n    \n    changeBranch issue.branchName()\n  else    \n    notify \"Default branch selected\"\n    \n    changeBranch repository.defaultBranch()\n\n$root\n  .append(HAMLjr.render \"editor\",\n    filetree: filetree\n    actions: actions\n    notices: notices\n    errors: errors\n    issues: issues\n  )\n\nGistquire.api(\"rate_limit\")\n.then (data, status, request) ->\n  $root.append HAMLjr.render \"github_status\",\n    request: request\n\nwindow.onbeforeunload = ->\n  if filetree.hasUnsavedChanges()\n    \"You have some unsaved changes, if you leave now you will lose your work.\"\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "width: 960\nheight: 800\nremoteDependencies: [\n  \"//cdnjs.cloudflare.com/ajax/libs/coffee-script/1.6.3/coffee-script.min.js\"\n  \"//code.jquery.com/jquery-1.10.1.min.js\"\n  \"//d1n0x3qji82z53.cloudfront.net/src-min-noconflict/ace.js\"\n  \"http://strd6.github.io/tempest/javascripts/envweb.js\"\n  \"http://strd6.github.io/sandbox/master.js\"\n  \"http://strd6.github.io/issues/master.js\"\n  \"http://strd6.github.io/tests/master.js\"\n]\n",
      "type": "blob"
    },
    "source/actions.coffee.md": {
      "path": "source/actions.coffee.md",
      "mode": "100644",
      "content": "The primary actions of the editor. This should eventually become a mixin.\n\n    publish = ({builder, fileData, repository}) ->\n      \n        builder.build(fileData)\n        .then (build) ->\n          branch = repository.branch()\n    \n          repository.publish builder.standAlone(build, branch)\n    \n    commit = ({fileData, repository, message}) ->\n      repository.commitTree\n        tree: fileData\n        message: message\n        \nKeep a list of all running instances for piping data in and out.\n\n    @Actions =\n      save: (params) ->\n        commit(params)\n        .then ->\n          publish(params)\n    \n      run: ({builder, filetree}) ->\n        builder.runnable(filetree.data())\n        .then Runner.run\n\n      load: ({filetree, repository}) ->\n        # Decode all content in place\n        processDirectory = (items) ->\n          items.each (item) ->\n            return item unless item.content\n    \n            item.content = Base64.decode(item.content)\n            item.encoding = \"raw\"\n    \n        repository.latestTree()\n        .then (results) ->\n          files = processDirectory results\n          filetree.load files\n",
      "type": "blob"
    },
    "source/builder.coffee.md": {
      "path": "source/builder.coffee.md",
      "mode": "100644",
      "content": "Builder\n=======\n\nThe builder knows how to compile a source tree or individual files into various\nbuild products.\n\nThis should be extracted to a separate library eventually.\n\nHelpers\n-------\n\n`arrayToHash` converts an array of fileData objects into an object where each\nfile's path is a key and the fileData is the object.\n\n    arrayToHash = (array) ->\n      array.eachWithObject {}, (file, hash) ->\n        hash[file.path] = file\n\n`stripMarkdown` converts a literate file into pure code for compilation or execution.\n\n    stripMarkdown = (content) ->\n      content.split(\"\\n\").map (line) ->\n        if match = (/^([ ]{4}|\\t)/).exec line\n          line[match[0].length..]\n        else\n          \"\"\n      .join(\"\\n\")\n\n`compileTemplate` compiles a haml file into a HAMLjr program.\n\n    compileTemplate = (source, name=\"test\") ->\n      ast = HAMLjr.parser.parse(source)\n      \n      HAMLjr.compile ast, \n        name: name\n        compiler: CoffeeScript\n\n`compileStyl` compiles a styl file into css.\n\n    compileStyl = (source) ->\n      styl(source, whitespace: true).toString()\n\n`compileFile` take a fileData and returns a buildData. A buildData has a `path`,\nand properties for what type of content was built.\n\nTODO: Allow for files to generate docs and code at the same time.\n\n    compileFile = ({path, content}) ->\n      [name, extension] = [path.withoutExtension(), path.extension()]\n      \n      result =\n        switch extension\n          when \"js\"\n            code: content\n          when \"coffee\"\n            code: CoffeeScript.compile(content)\n          when \"haml\"\n            code: compileTemplate(content, name)\n          when \"styl\"\n            style: compileStyl(content)\n          when \"md\"\n            # Separate out code and call compile again\n            compileFile\n              path: name\n              content: stripMarkdown(content)\n          else\n            {}\n    \n      Object.defaults result,\n        name: name\n        extension: extension\n\nSeparate out test code from regular files.\n\n      if path.match /^test\\//\n        if result.code\n          result.test = \"#{(result.test or \"\")};#{result.code}\"\n          delete result.code\n\n      Object.extend result,\n        path: path\n\n`documentFile` generates documentation for a literate file. Right now it just\nrenders straight markdown, but it will get more clever in the future.\n\nTODO: Maybe doc more files than just .md?\n\n    documentFile = (content, path) ->\n      if path.extension() is \"md\"\n        marked(content)\n      else\n        \"\"\n\n`makeScript` returns a string representation of a script tag.\n\n    makeScript = (attrs) -> \n      $(\"<script>\", attrs).prop('outerHTML')\n\n`dependencyScripts` returns a string containing the script tags that are\nthe dependencies of this build.\n\n    dependencyScripts = (build) ->\n      remoteDependencies = readConfig(build).remoteDependencies\n  \n      (if remoteDependencies\n        remoteDependencies.map (src) ->\n          makeScript\n            class: \"env\"\n            src: src\n      else # Carry forward our own env if no dependencies specified\n        $('script.env').map ->\n          @outerHTML\n        .get()\n      ).join(\"\\n\")\n\nBuilder\n-------\n\nThe builder instance.\n\nTODO: Extract this whole duder to a separate component.\n\nTODO: Standardize interface to use promises.\n\nTODO: Allow configuration of builder instances, adding additional compilers,\npostprocessors, etc.\n\n    @Builder = (I={}) ->\n      compileTemplate = (source, name=\"test\") ->\n        ast = HAMLjr.parser.parse(source)\n        \n        HAMLjr.compile ast, \n          name: name\n          compiler: CoffeeScript\n      \n      build = (fileData) ->    \n        results = fileData.map ({path, content}) ->\n          try\n            # TODO: Separate out tests\n    \n            compileFile\n              path: path\n              content: content\n          catch {location, message}\n            if location?\n              message = \"Error on line #{location.first_line + 1}: #{message}\"\n    \n            error: \"#{path} - #{message}\"\n            \n        [errors, data] = results.partition (result) -> result.error\n        \n        if errors.length\n          Deferred().reject(errors.map (e) -> e.error)\n        else\n          Deferred().resolve(data)\n    \n      postProcessors = []\n    \n      I: I\n      \n      addPostProcessor: (fn) ->\n        postProcessors.push fn\n        \n      buildDocs: (fileData) ->\n        fileData.map ({path, content}) ->\n          try\n            path: path\n            documentation: documentFile(content, path)\n          catch {location, message}\n            if location?\n              message = \"Error on line #{location.first_line + 1}: #{message}\"\n    \n            error: \"#{path} - #{message}\"\n    \n      build: (fileData) ->\n        build(fileData)\n        .then (items) ->\n          results =\n            code: []\n            style: []\n            main: []\n            test: []\n\n          items.eachWithObject results, (item, hash) ->\n            if code = item.code\n              if item.name is \"main\" and (item.extension is \"js\" or item.extension is \"coffee\")\n                hash.main.push code\n              else\n                hash.code.push code\n            else if style = item.style\n              hash.style.push style\n            else if test = item.test\n              hash.test.push test \n            else\n              # Do nothing, we don't know about this item\n          \n          distCode = results.code.concat(results.main).join(';').trim()\n          distTest = results.code.concat(results.test).join(';').trim()\n          distStyle = results.style.join('').trim()\n      \n          dist = []\n      \n          unless distCode.blank()\n            dist.push\n              path: \"build.js\"\n              content: distCode\n              type: \"blob\"\n      \n          unless distStyle.blank()\n            dist.push\n              path: \"style.css\"\n              content: distStyle\n              type: \"blob\"\n              \n          unless distTest.blank()\n            dist.push\n              path: \"test.js\"\n              content: distTest\n              type: \"blob\"\n      \n          Deferred().resolve postProcessors.pipeline\n            source: arrayToHash(fileData)\n            distribution: arrayToHash(dist)\n    \n      program: (build) ->\n        {distribution} = build\n    \n        entryPoint = \"build.js\"\n        program = distribution[entryPoint].content\n    \n        \"\"\"\n          (function (ENV) {\n          #{program}\n          }(#{JSON.stringify(build, null, 2)}));\n        \"\"\"\n\n      buildStyle: (fileData) ->\n        @build(fileData)\n        .then (build) ->\n          {distribution} = build\n\n          content = distribution[\"style.css\"]?.content or \"\"\n\n      testScripts: (fileData) ->\n        @build(fileData).then (build) ->\n          {distribution} = build\n\n          content = distribution[\"test.js\"]?.content or \"\"\n          \n          \"\"\"\n            #{dependencyScripts(build)}\n            <script>#{content}<\\/script>\n          \"\"\"\n          \n      runnable: (fileData) ->\n        @build(fileData)\n        .then (build) =>\n          standAlone = @standAlone(build)\n          standAlone.config = Builder.readConfig(build)\n\n          return standAlone\n\n      standAlone: (build, ref) ->\n        {source, distribution} = build\n    \n        content = []\n    \n        content.push \"\"\"\n          <!doctype html>\n          <head>\n          <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\n        \"\"\"\n\n        content = content.concat dependencyScripts(build)\n    \n        program = @program(build)\n    \n        scriptTag = if ref\n          makeScript\n            src: \"#{ref}.js?#{+new Date}\"\n        else\n          \"\"\"\n          <script>\n          #{program}\n          <\\/script>\n          \"\"\"\n    \n        content.push \"\"\"\n          </head>\n          <body>\n          #{scriptTag}\n          </body>\n          </html>\n        \"\"\"\n    \n        html: content.join \"\\n\"\n        script: program\n    \nTODO: May want to move this to the environment so any program can read its\nconfig\n\n    readConfig = (build) ->\n      if configData = build.source[\"pixie.cson\"]?.content\n        CSON.parse(configData)\n      else if configData = build.source[\"pixie.json\"]?.content\n        JSON.parse(configData)\n      else\n        {}\n    \n    Builder.readConfig = readConfig\n",
      "type": "blob"
    },
    "source/deferred.coffee.md": {
      "path": "source/deferred.coffee.md",
      "mode": "100644",
      "content": "Use jQuery.Deferred to implement deferreds, but\nstay insulated by not blasting the $ all over our code\nthat doesn't really depend on jQuery\nThis let's us swap our our Deferred provider more easily later.\n\n    @Deferred = $.Deferred\n\nA helper to return a promise that may be resolved or rejected by the passed\ncode block.\n\n    withDeferrence = (fn) ->\n      deferred = Deferred()\n    \n      # TODO: This try catch may be useless from deferring the fn\n      try\n        fn.defer(deferred)\n      catch e\n        deferred.reject(e)\n    \n      return deferred.promise()\n\nA deferred encapsulating a confirm dialog.\n\n    Deferred.Confirm = (message) ->\n      withDeferrence (deferred) ->\n        if window.confirm(message)\n          deferred.resolve()\n        else\n          deferred.reject()\n\nA deferred that may present a confirm dialog, but only if a certain condition is\nmet.\n\n    Deferred.ConfirmIf = (flag, message) ->\n      if flag\n        return Deferred.Confirm(message)\n      else\n        withDeferrence (deferred) ->\n          deferred.resolve()\n\nA deferred that encapsulates a conditional execution of a block that returns a\npromise. If the condition is met the promise returning block is executed,\notherwise the deferred is marked as resolved and the block is not executed.\n\n    Deferred.ExecuteIf = (flag, callback) ->\n      withDeferrence (deferred) ->\n        if flag\n          callback().then deferred.resolve\n        else\n          deferred.resolve()\n",
      "type": "blob"
    },
    "source/duct_tape.coffee.md": {
      "path": "source/duct_tape.coffee.md",
      "mode": "100644",
      "content": "Here we have simple extension and utility methods that should be moved into our framework's environment libraries.\n\n`String#dasherize` should be moved into inflecta.\n\nConvert a string with spaces and mixed case into all lower case with spaces replaced with dashes. This is the style that Github branch names are commonly in.\n\n    String::dasherize = ->\n      @trim()\n        .replace(/\\s+/g, \"-\")\n        .toLowerCase()\n\n`Base64` should be moved into a browser polyfil library.\n\nUTF-8 Enabled base64 encoding and decoding.\n\n    @Base64 =\n      encode: (s) ->\n        btoa(unescape(encodeURIComponent(s)))\n    \n      decode: (s) ->\n        decodeURIComponent(escape(atob(s.replace(/\\s/g, ''))))\n\n`CSON` parses CoffeeScript object literals. This is a big hack, but can be \nformalized later if it proves useful.\n\nAnother downside is that it depends on the CoffeeScript compiler when it should\nbe a simple parser of its own.\n\n    @CSON =\n      parse: (source) ->\n        Function(\"return #{CoffeeScript.compile(source, bare: true)}\")()\n\nThis really needs to be improved. To do it correctly we'd need to detect \nobject/array values and indent while moving them to separate lines. Single\nvalues would exist without newlines or indentation. CSON.stringify would be\ncalled recursively.\n\nThe current hack of using JSON works because JSON is valid CSON.\n\n      stringify: (object) ->\n        representation = JSON.parse(JSON.stringify(obj))\n\n        Object.keys(representation).map (key) ->\n          value = representation[key]\n          \"#{key}: #{JSON.stringify(value)}\"\n        .join(\"\\n\")\n        \nAdds a `render` helper method to HAMLjr. This should work it's way back into the\nHAMLjr runtime.\n\n`render` Looks up a template and renders it with the given object.\n\n    HAMLjr.render = (templateName, object) ->\n      templates = HAMLjr.templates\n      template = templates[templateName] or templates[\"templates/#{templateName}\"]\n\n      if template\n        template(object)\n      else\n        throw \"Could not find template named #{templateName}\"\n",
      "type": "blob"
    },
    "source/file.coffee.md": {
      "path": "source/file.coffee.md",
      "mode": "100644",
      "content": "The `File` model represents a file in a file system. It is populated by data\nreturned from the Github API.\n\n    @File = (I={}) ->\n      I.path ?= I.filename\n      I.filename ?= I.path.split(\"/\").last()\n    \n      self = Model(I).observeAll()\n    \n      self.extend\n      \nThe extension is the last part of the filename after the `.`, for example\n`\"coffee\"` for a file named `\"main.coffee\"` or `\"haml\"` for a file named\n`\"filetree.haml\"`.\n      \n        extension: ->\n          self.filename().extension()\n\nThe `mode` of the file is what editor mode to use for our text editor.\n\n        mode: ->\n          switch extension = self.extension()\n            when \"js\"\n              \"javascript\"\n            when \"md\" # TODO: See about nested markdown code modes for .haml.md, .js.md, and .coffee.md\n              \"markdown\"\n            when \"\"\n              \"text\"\n            else\n              extension\n\nModified tracks whether the file has been changed since it was created.\n\n        modified: Observable(false)\n\nThe `displayName` is how the file appears in views.\n\n        displayName: Observable(self.path())\n\nWhen our content changes we assume we are modified. In the future we may want to\ntrack the original content and compare with that to get a more accurate modified\nstatus.\n\n      self.content.observe ->\n        self.modified(true)\n\nWhen our modified state changes we adjust the file name to provide a visual\nindication.\n\n      self.modified.observe (modified) ->\n        if modified\n          self.displayName(\"*#{self.path()}\")\n        else\n          self.displayName(self.path())\n    \n      return self\n",
      "type": "blob"
    },
    "source/filetree.coffee.md": {
      "path": "source/filetree.coffee.md",
      "mode": "100644",
      "content": "The `Filetree` model represents a tree of files.\n\n    @Filetree = (I={}) ->\n      Object.defaults I,\n        files: []\n    \n      self = Model(I).observeAll()\n\nThe `selectedFile` observable keeps people up to date on what file has been\nselected.\n\n      self.attrObservable \"selectedFile\"\n    \n      self.extend\n        \nLoad files either from an array of file data objects or from an object with\npaths as keys and file data objects as values.\n\nThe files are sorted by name after loading.\n\nTODO: Always maintain the files in a sorted list using some kind of sorted\nobservable.\n\n        load: (fileData) ->\n          if Array.isArray(fileData)\n            files = fileData.sort (a, b) ->\n              if a.path < b.path\n                -1\n              else if b.path < a.path\n                1\n              else\n                0\n            .map File\n    \n          else\n            files = Object.keys(fileData).sort().map (path) ->\n              File fileData[path]\n    \n          self.files(files)\n\nThe `data` method returns an array of file data objects that is compatible with\nthe github tree api.\n\nThe objects have a `path`, `content`, `type`, and `mode`.\n\n        data: ->\n          self.files.map (file) ->\n            path: file.path()\n            mode: \"100644\"\n            content: file.content()\n            type: \"blob\"\n\nThe filetree `hasUnsavedChanges` if any file in the tree is modified.\n\n        hasUnsavedChanges: ->\n          self.files().select (file) ->\n            file.modified()\n          .length\n\nMarking the filetree as saved resets the modification status of each file.\n\nTODO: There can be race conditions since the save is async.\n\nTODO: Use git trees and content shas to robustly manage changed state.\n\n        markSaved: ->\n          self.files().each (file) ->\n            file.modified(false)\n    \n      return self\n",
      "type": "blob"
    },
    "source/gistquire.coffee.md": {
      "path": "source/gistquire.coffee.md",
      "mode": "100644",
      "content": "Gistquire handles our connection to the Github API.\n\n    @Gistquire =\n      accessToken: null\n\nCalling auth will redirect to github for authentication.\n\nTODO: parameterize the method to allow for different `scope`s or `client_id`s.\n\n      auth: ->\n        scope = \"gist,repo,user:email\"\n        url = \"https://github.com/login/oauth/authorize?client_id=bc46af967c926ba4ff87&scope=#{scope}\"\n    \n        window.location = url\n    \nCall onload to check for the code returned from github authentication\nand to get our access token from our authorization app.\n\nTODO: Maybe think about returning a deferred?\n\n      onload: ->\n        # TODO: Namespace local storage key\n    \n        if code = window.location.href.match(/\\?code=(.*)/)?[1]\n          $.getJSON \"https://hamljr-auth.herokuapp.com/authenticate/#{code}\", (data) =>\n            if token = data.token\n              @accessToken = token\n              localStorage.authToken = token\n    \n        if localStorage.authToken\n          @accessToken = localStorage.authToken\n\nMake a call to the github API. The path can be either a relative path such as\n`users/STRd6` or an absolute path like `https://api.github.com/users/octocat` or\n`user.url`.\n\nWe attach our `accessToken` if present.\n\n`api` returns a promise for easy chaining.\n\n      api: (path, options={}) ->\n        if path.match /^http/\n          url = path\n        else\n          url = \"https://api.github.com/#{path}\"\n        \n        options.headers ||= {}\n        \n        if @accessToken\n          options.headers[\"Authorization\"] = \"token #{@accessToken}\"\n    \n        options = Object.extend\n          url: url\n          type: \"GET\"\n          dataType: 'json'\n        , options\n    \n        $.ajax options\n",
      "type": "blob"
    },
    "source/repository.coffee.md": {
      "path": "source/repository.coffee.md",
      "mode": "100644",
      "content": "Repsoitory\n==========\n\n`Repository` wraps the concept of a Github repository. It includes additional \ndata for the local working copy such as the current branch.\n\nAll of the methods return promises to allow for easy chaining and error\nreporting.\n\nConstructor\n-----------\n\nCurrently the only parameter needed to initialize a repository instance is a\n`url`. This url is used as a base for the api calls.\n\n    @Repository = (I={}) ->\n      Object.defaults I,\n        branch: \"master\"\n        defaultBranch: \"master\"\n    \n      self = Model(I).observeAll()\n      \n      # The currently active branch in the working copy\n      self.attrObservable \"branch\"\n      \n      # TODO: Extract all of these methods to an API generator\n      requestOptions = (type, data) ->\n        type: type\n        data: JSON.stringify(data)\n    \n      api = (path, options) ->\n        if path.match /^http/\n          url = path\n        else\n          url = \"#{self.url()}/#{path}\"\n              \n        Gistquire.api url, options\n    \n      get = (path, data) ->\n        api path, data: data\n    \n      put = (path, data) ->\n        api(path, requestOptions(\"PUT\", data))\n        \n      post = (path, data) ->\n        api(path, requestOptions(\"POST\", data))\n        \n      patch = (path, data) ->\n        api path, requestOptions(\"PATCH\", data)\n    \n      self.extend\n        pullRequests: ->\n          get \"pulls\"\n    \n        createPullRequest: ({title}) ->\n          head = title.dasherize()\n    \n          self.switchToBranch(head)\n          .then(self.commitEmpty)\n          .then ->\n            post \"pulls\",\n              base: I.defaultBranch\n              head: head\n              title: title\n    \n        initPagesBranch: ->\n          branch = \"gh-pages\"\n        \n          # Post an empty tree to use for the base commit\n          # TODO: Learn how to post an empty tree\n          post \"git/trees\",\n            tree: [{\n              mode: \"1006444\"\n              path: \"tempest.txt\"\n              content: \"created by strd6.github.io/editor\"\n            }]\n          .then (data) ->\n            # Create the base commit for the branch\n            post \"git/commits\",\n              message: \"Initial gh-pages commit\"\n              tree: data.sha\n          .then (data) ->\n            # Create the branch based on the base commit\n            post \"git/refs\",\n              ref: \"refs/heads/#{branch}\"\n              sha: data.sha\n          \n        writeFile: (params) ->\n          {branch, path, content, message} = params\n    \n          get \"contents/#{path}\",\n            ref: branch\n          .then (data) ->\n            # The file existed, so we update it using the existing sha\n            put \"contents/#{path}\",\n              content: content\n              sha: data.sha\n              message: message\n              branch: branch\n          , (request) ->\n            # If we fail because the gh-pages branch doesn't exist try creating it and retrying\n            if request.responseJSON?.message is \"No commit found for the ref gh-pages\"\n              self.initPagesBranch().then ->\n                # Trying again after creating the gh-pages branch\n                self.writeFile(params)\n            # The file didn't exist so we create a new one\n            else if request.status is 404\n              put \"contents/#{path}\",\n                content: content\n                message: message\n                branch: branch\n            else\n              Deferred().reject(arguments...)\n    \n        latestTree: (branch=self.branch()) ->\n          get(\"git/refs/heads/#{branch}\")\n          .then (data) ->\n            get data.object.url\n          .then (data) ->\n            get \"#{data.tree.url}?recursive=1\"\n          .then (data) ->\n            files = data.tree.select (file) ->\n              file.type is \"blob\"\n      \n            # Gather the data for each file\n            $.when.apply(null, files.map (datum) ->\n              get(datum.url)\n              .then (data) ->\n                Object.extend(datum, data)\n            )\n          .then (results...) -> \n            results\n    \n        commitTree: ({message, tree}) ->\n          branch = self.branch()\n          message ?= \"Updated in browser at strd6.github.io/editor\"\n          \n          unless tree\n            throw Error(\"Must pass in a tree\")\n            \n          # TODO: Is there a cleaner way to pass this through promises?\n          latestCommitSha = null\n    \n          get(\"git/refs/heads/#{branch}\")\n          .then (data) ->\n            latestCommitSha = data.object.sha\n            \n            post \"git/trees\",\n              tree: tree\n          .then (data) ->\n            # Create another commit\n            post \"git/commits\",\n              parents: [latestCommitSha]\n              message: message\n              tree: data.sha\n          .then (data) ->\n            # Update the branch head\n            patch \"git/refs/heads/#{branch}\",\n              sha: data.sha\n        \n        # TODO: this is currently a hack because we can't create a pull request\n        # if there are no different commits\n        commitEmpty: ->\n          branch = self.branch()\n          latestCommit = null\n          \n          get(\"git/refs/heads/#{branch}\")\n          .then (data) ->\n            get data.object.url\n          .then (data) ->\n            # Create another commit\n            post \"git/commits\",\n              parents: [data.sha]\n              message: \"This commit intentionally left blank\"\n              tree: data.tree.sha\n          .then (data) ->\n            # Update the branch head\n            patch \"git/refs/heads/#{branch}\",\n              sha: data.sha\n    \n        switchToBranch: (branch) ->\n          ref = \"refs/heads/#{branch}\"\n          \n          setBranch = (data) ->\n            self.branch(branch)\n            \n            return data\n    \n          get(\"git/#{ref}\")\n          .then setBranch # Success\n          , (request) -> # Failure\n            branchNotFound = (request.status is 404)\n    \n            if branchNotFound\n              # Create branch if it doesn't exist\n              # Use our current branch as a base\n              get(\"git/refs/heads/#{self.branch()}\")\n              .then (data) ->\n                post \"git/refs\",\n                  ref: ref\n                  sha: data.object.sha\n              .then(setBranch)\n            else\n              Deferred().reject(arguments...)\n    \n        mergeInto: (branch=self.defaultBranch()) ->\n          post \"merges\",\n            base: branch\n            head: self.branch()\n            \n        pullFromBranch: (branch=self.defaultBranch()) ->\n          post \"merges\",\n            base: self.branch()\n            head: branch\n    \n        publish: ({html, script}) ->\n          branch = self.branch()\n          message = \"Built #{branch} in browser in strd6.github.io/editor\"\n    \n          if branch is \"master\"\n            path = \"index.html\"\n          else\n            path = \"#{branch}.html\"\n    \n          # Assuming git repo with gh-pages branch\n          publishBranch = \"gh-pages\"\n    \n          # create <branch>.html\n          promise = self.writeFile\n            path: path\n            content: Base64.encode(html)\n            branch: publishBranch\n            message: message\n    \n          # Create <branch>.js\n          if script\n            promise.then self.writeFile\n              path: \"#{branch}.js\"\n              content: Base64.encode(script)\n              branch: publishBranch\n              message: message\n          else\n            promise\n    \n      return self\n",
      "type": "blob"
    },
    "source/runtime.coffee.md": {
      "path": "source/runtime.coffee.md",
      "mode": "100644",
      "content": "The runtime holds utilities to assist with an apps running environment.\n\nIt should me moved into it's own component one day.\n\n    @Runtime = (ENV) ->\n\nReturns the node that is the parent of the script element that contains the code\nthat calls this function. If `document.write` has been called before this then the\nresults may not be accurate. Therefore be sure to call currentNode before\nwriting anything to the document.\n\n      currentNode = ->\n        target = document.documentElement\n      \n        while (target.childNodes.length and target.lastChild.nodeType == 1)\n          target = target.lastChild\n      \n        return target.parentNode\n\n      applyStyleSheet = (root) ->\n        styleClass = \"primary\"\n      \n        # Apply our styles\n        if styleContent = ENV.distribution[\"style.css\"]?.content\n          styleNode = document.createElement(\"style\")\n          styleNode.innerHTML = styleContent\n          styleNode.className = styleClass\n          \n          root.appendChild(styleNode)\n\nDisplay a promo in the console linking back to the creator of this app.\n\n      promo = ->\n        console.log(\"%c You should meet my creator #{ENV.progenitor.url}\", \"\"\"\n          background: #000; \n          color: white; \n          font-size: 2em;\n          line-height: 2em;\n          padding: 40px 100px;\n          margin-bottom: 1em;\n          text-shadow: \n            0 0 0.05em #fff, \n            0 0 0.1em #fff, \n            0 0 0.15em #fff, \n            0 0 0.2em #ff00de, \n            0 0 0.35em #ff00de, \n            0 0 0.4em #ff00de, \n            0 0 0.5em #ff00de, \n            0 0 0.75em #ff00de;'\n        \"\"\")\n\nCall on start to boot up the runtime, get the root node, add styles, display a \npromo.\n\n      boot: ->\n        root = currentNode()\n        applyStyleSheet(root)\n        \n        promo()\n\nReturns the root element, where the app should append all of the elements it\ncreates.\n\n        return root\n",
      "type": "blob"
    },
    "source/text_editor.coffee.md": {
      "path": "source/text_editor.coffee.md",
      "mode": "100644",
      "content": "The `TextEditor` is a model for editing a text file. Currently it uses the Ace\neditor, but we may switch in the future. All the editor specific things live in\nhere.\n\n    @TextEditor = (I) ->\n      Object.reverseMerge I,\n        mode: \"coffee\"\n        text: \"\"\n\n      self = Model(I)\n\nWe can't use ace on a div not in the DOM so we need to be sure to pass one in.\n\n      el = I.el\n\nWe can't serialize DOM elements so we need to be sure to delete it.\n\n      delete I.el\n\nHere we create and configure the Ace text editor.\n\nTODO: Load these options from a preferences somewhere.\n\n      editor = ace.edit(el)\n      editor.setFontSize(\"16px\")\n      editor.setTheme(\"ace/theme/chrome\")\n      editor.getSession().setUseWorker(false)\n      editor.getSession().setMode(\"ace/mode/#{I.mode}\")\n      editor.getSession().setUseSoftTabs(true)\n      editor.getSession().setTabSize(2)\n\n`reset` Sets the content of the editor to the given content and also resets any\ncursor position or selection.\n\n      reset = (content=\"\") ->\n        editor.setValue(content)\n        editor.moveCursorTo(0, 0)\n        editor.session.selection.clearSelection()\n    \n      reset(I.text)\n\nOur text attribute is observable so clients can track changes.\n\n      self.attrObservable \"text\"\n\nWe modify our text by listening to change events from Ace.\n\nTODO: Remove these `updating` hacks.\n\n      updating = false\n      editor.getSession().on 'change', ->\n        updating = true\n        self.text(editor.getValue())\n        updating = false\n\nWe also observe any changes to `text` ourselves to stay up to date with outside\nmodifications. Its a bi-directional binding.\n\n      self.text.observe (newValue) ->\n        unless updating\n          reset(newValue)\n\nWe expose some properties and methods.\n\n      self.extend\n        el: el\n        editor: editor\n        reset: reset\n    \n      return self\n",
      "type": "blob"
    },
    "style.styl": {
      "path": "style.styl",
      "mode": "100644",
      "content": "html, body\n  margin: 0\n  height: 100%\n\n.main\n  position: relative\n  padding-top: 40px\n  padding-left: 200px\n  padding-bottom: 100px\n  box-sizing: border-box\n  height: 100%\n\n.editor-wrap\n  background-color: white\n  width: 100%\n  height: 100%\n  position: relative\n\n  & > div\n    position: absolute\n    top: 0\n    left: 0\n    right: 0\n    bottom: 0\n\n.filetree\n  margin: 0\n  padding: 0\n  width: 200px\n  position: absolute\n  left: 0\n  top: 40px\n  z-index: 2\n\n  li\n    list-style-type: none\n    padding-left: 1em\n    position: relative\n\n    .delete\n      display: none\n      position: absolute\n      right: 0\n\n    &:hover\n      background-color: lightyellow\n\n      .delete\n        display: inline-block\n\n.actions\n  position: absolute\n  top: 0\n  left: 200px\n\n.console-wrap\n  box-sizing: border-box\n  position: absolute\n  bottom: 0\n  left: 0\n  right: 0\n  padding-left: 200px\n  height: 100px\n  width: 100%\n  margin: 0\n  \n  .errors\n    box-sizing: border-box\n    border-top: 1px solid black\n    color: red\n\n.status\n  top: 0\n  right: 0\n  position: absolute\n",
      "type": "blob"
    },
    "templates/actions.haml.md": {
      "path": "templates/actions.haml.md",
      "mode": "100644",
      "content": "The actions bar holds several buttons that can be pressed to perform actions in\nthe editor.\n\n    .actions\n      - actions = @actions\n\nRender a series of buttons, one for each action.\n\n      - Object.keys(actions).each (name) ->\n        %button\n          = name.titleize()\n\nIn our click handler we don't pass any event data to the action.\n\n          - on \"click\", ->\n            - actions[name]()\n\nThe issues selector is also rendered in the actions bar.\n\n      = HAMLjr.render \"issues\", @issues\n",
      "type": "blob"
    },
    "templates/editor.haml.md": {
      "path": "templates/editor.haml.md",
      "mode": "100644",
      "content": "The main editor template renders all the other sub-templates.\n\n    .main\n      = HAMLjr.render \"actions\", actions: @actions, issues: @issues\n      = HAMLjr.render \"filetree\", @filetree\n      = HAMLjr.render \"notices\", this\n",
      "type": "blob"
    },
    "templates/filetree.haml.md": {
      "path": "templates/filetree.haml.md",
      "mode": "100644",
      "content": "Render a list of files as a filetree.\n\n    %ul.filetree\n      - selectedFile = @selectedFile\n      - files = @files\n      - each files, (file) ->\n        %li= file.displayName\n          - on \"click\", (e) -> \n            - selectedFile(file) if $(e.target).is('li')\n          .delete\n            - on \"click\", -> files.remove(file) if confirm(\"Delete #{file.path()}?\")\n            X\n",
      "type": "blob"
    },
    "templates/github_status.haml.md": {
      "path": "templates/github_status.haml.md",
      "mode": "100644",
      "content": "Display information about the current Github api session.\n\n    .status\n      - if @request and @request.getAllResponseHeaders().match(/X-RateLimit-Limit: 5000/)\n        Authenticated Scopes:\n        = @request.getResponseHeader(\"X-OAuth-Scopes\")\n        %br\n        Rate Limit Remaining:\n        = @request.getResponseHeader(\"X-RateLimit-Remaining\")\n        = \" / 5000\"\n      - else\n        %button Auth\n          - on \"click\", Gistquire.auth\n",
      "type": "blob"
    },
    "templates/notices.haml.md": {
      "path": "templates/notices.haml.md",
      "mode": "100644",
      "content": "A simple console to display streams of errors and notices.\n\n    .console-wrap\n      %pre.errors\n        - each @errors, (error) ->\n          = error\n      %pre.notices\n        - each @notices, (notice) ->\n          = notice\n",
      "type": "blob"
    },
    "templates/text_editor.haml.md": {
      "path": "templates/text_editor.haml.md",
      "mode": "100644",
      "content": "A simple wrap to hold a text editor.\n\n    .editor-wrap\n      .editor\n",
      "type": "blob"
    },
    "test/test.coffee.md": {
      "path": "test/test.coffee.md",
      "mode": "100644",
      "content": "Starting with just an assert true to test that testing works at all.\n\n    describe \"editor\", ->\n      it \"should test things\", ->\n        assert true\n",
      "type": "blob"
    },
    "source/runner.coffee.md": {
      "path": "source/runner.coffee.md",
      "mode": "100644",
      "content": "Runner manages running apps in sandboxed windows and passing messages back and \nforth from the parent to the running instances.\n\nWe keep a list of running windows so we can hot-update them when we modify our\nown code.\n\nOne cool example use is if you are modifying your css you can run several \ninstances of your app and navigate to different states. Then you can see in real\ntime how the css changes affect each one.\n\n    runningWindows = []\n\n    @Runner =\n      run: ({config, html}) ->\n        sandbox = Sandbox\n          width: config.width\n          height: config.height\n  \n        sandbox.document.open()\n        sandbox.document.write(html)\n        sandbox.document.close()\n        \n        runningWindows.push sandbox\n\n      hotReloadCSS: (css) ->\n        runningWindows = runningWindows.partition (window) ->\n          return false if window.closed\n          \n          # TODO: Reference this from some other place rather than magic constant\n          styleClass = \"primary\"\n          $(window.document).find(\"style.#{styleClass}\").html(css)\n          \n          return true\n          \n        console.log(css)\n",
      "type": "blob"
    }
  },
  "distribution": {
    "build.js": {
      "path": "build.js",
      "content": "(function() {\n  var commit, publish;\n\n  publish = function(_arg) {\n    var builder, fileData, repository;\n    builder = _arg.builder, fileData = _arg.fileData, repository = _arg.repository;\n    return builder.build(fileData).then(function(build) {\n      var branch;\n      branch = repository.branch();\n      return repository.publish(builder.standAlone(build, branch));\n    });\n  };\n\n  commit = function(_arg) {\n    var fileData, message, repository;\n    fileData = _arg.fileData, repository = _arg.repository, message = _arg.message;\n    return repository.commitTree({\n      tree: fileData,\n      message: message\n    });\n  };\n\n  this.Actions = {\n    save: function(params) {\n      return commit(params).then(function() {\n        return publish(params);\n      });\n    },\n    run: function(_arg) {\n      var builder, filetree;\n      builder = _arg.builder, filetree = _arg.filetree;\n      return builder.runnable(filetree.data()).then(Runner.run);\n    },\n    load: function(_arg) {\n      var filetree, processDirectory, repository;\n      filetree = _arg.filetree, repository = _arg.repository;\n      processDirectory = function(items) {\n        return items.each(function(item) {\n          if (!item.content) {\n            return item;\n          }\n          item.content = Base64.decode(item.content);\n          return item.encoding = \"raw\";\n        });\n      };\n      return repository.latestTree().then(function(results) {\n        var files;\n        files = processDirectory(results);\n        return filetree.load(files);\n      });\n    }\n  };\n\n}).call(this);\n;(function() {\n  var arrayToHash, compileFile, compileStyl, compileTemplate, dependencyScripts, documentFile, makeScript, readConfig, stripMarkdown;\n\n  arrayToHash = function(array) {\n    return array.eachWithObject({}, function(file, hash) {\n      return hash[file.path] = file;\n    });\n  };\n\n  stripMarkdown = function(content) {\n    return content.split(\"\\n\").map(function(line) {\n      var match;\n      if (match = /^([ ]{4}|\\t)/.exec(line)) {\n        return line.slice(match[0].length);\n      } else {\n        return \"\";\n      }\n    }).join(\"\\n\");\n  };\n\n  compileTemplate = function(source, name) {\n    var ast;\n    if (name == null) {\n      name = \"test\";\n    }\n    ast = HAMLjr.parser.parse(source);\n    return HAMLjr.compile(ast, {\n      name: name,\n      compiler: CoffeeScript\n    });\n  };\n\n  compileStyl = function(source) {\n    return styl(source, {\n      whitespace: true\n    }).toString();\n  };\n\n  compileFile = function(_arg) {\n    var content, extension, name, path, result, _ref;\n    path = _arg.path, content = _arg.content;\n    _ref = [path.withoutExtension(), path.extension()], name = _ref[0], extension = _ref[1];\n    result = (function() {\n      switch (extension) {\n        case \"js\":\n          return {\n            code: content\n          };\n        case \"coffee\":\n          return {\n            code: CoffeeScript.compile(content)\n          };\n        case \"haml\":\n          return {\n            code: compileTemplate(content, name)\n          };\n        case \"styl\":\n          return {\n            style: compileStyl(content)\n          };\n        case \"md\":\n          return compileFile({\n            path: name,\n            content: stripMarkdown(content)\n          });\n        default:\n          return {};\n      }\n    })();\n    Object.defaults(result, {\n      name: name,\n      extension: extension\n    });\n    if (path.match(/^test\\//)) {\n      if (result.code) {\n        result.test = \"\" + (result.test || \"\") + \";\" + result.code;\n        delete result.code;\n      }\n    }\n    return Object.extend(result, {\n      path: path\n    });\n  };\n\n  documentFile = function(content, path) {\n    if (path.extension() === \"md\") {\n      return marked(content);\n    } else {\n      return \"\";\n    }\n  };\n\n  makeScript = function(attrs) {\n    return $(\"<script>\", attrs).prop('outerHTML');\n  };\n\n  dependencyScripts = function(build) {\n    var remoteDependencies;\n    remoteDependencies = readConfig(build).remoteDependencies;\n    return (remoteDependencies ? remoteDependencies.map(function(src) {\n      return makeScript({\n        \"class\": \"env\",\n        src: src\n      });\n    }) : $('script.env').map(function() {\n      return this.outerHTML;\n    }).get()).join(\"\\n\");\n  };\n\n  this.Builder = function(I) {\n    var build, postProcessors;\n    if (I == null) {\n      I = {};\n    }\n    compileTemplate = function(source, name) {\n      var ast;\n      if (name == null) {\n        name = \"test\";\n      }\n      ast = HAMLjr.parser.parse(source);\n      return HAMLjr.compile(ast, {\n        name: name,\n        compiler: CoffeeScript\n      });\n    };\n    build = function(fileData) {\n      var data, errors, results, _ref;\n      results = fileData.map(function(_arg) {\n        var content, location, message, path;\n        path = _arg.path, content = _arg.content;\n        try {\n          return compileFile({\n            path: path,\n            content: content\n          });\n        } catch (_error) {\n          location = _error.location, message = _error.message;\n          if (location != null) {\n            message = \"Error on line \" + (location.first_line + 1) + \": \" + message;\n          }\n          return {\n            error: \"\" + path + \" - \" + message\n          };\n        }\n      });\n      _ref = results.partition(function(result) {\n        return result.error;\n      }), errors = _ref[0], data = _ref[1];\n      if (errors.length) {\n        return Deferred().reject(errors.map(function(e) {\n          return e.error;\n        }));\n      } else {\n        return Deferred().resolve(data);\n      }\n    };\n    postProcessors = [];\n    return {\n      I: I,\n      addPostProcessor: function(fn) {\n        return postProcessors.push(fn);\n      },\n      buildDocs: function(fileData) {\n        return fileData.map(function(_arg) {\n          var content, location, message, path;\n          path = _arg.path, content = _arg.content;\n          try {\n            return {\n              path: path,\n              documentation: documentFile(content, path)\n            };\n          } catch (_error) {\n            location = _error.location, message = _error.message;\n            if (location != null) {\n              message = \"Error on line \" + (location.first_line + 1) + \": \" + message;\n            }\n            return {\n              error: \"\" + path + \" - \" + message\n            };\n          }\n        });\n      },\n      build: function(fileData) {\n        return build(fileData).then(function(items) {\n          var dist, distCode, distStyle, distTest, results;\n          results = {\n            code: [],\n            style: [],\n            main: [],\n            test: []\n          };\n          items.eachWithObject(results, function(item, hash) {\n            var code, style, test;\n            if (code = item.code) {\n              if (item.name === \"main\" && (item.extension === \"js\" || item.extension === \"coffee\")) {\n                return hash.main.push(code);\n              } else {\n                return hash.code.push(code);\n              }\n            } else if (style = item.style) {\n              return hash.style.push(style);\n            } else if (test = item.test) {\n              return hash.test.push(test);\n            } else {\n\n            }\n          });\n          distCode = results.code.concat(results.main).join(';').trim();\n          distTest = results.code.concat(results.test).join(';').trim();\n          distStyle = results.style.join('').trim();\n          dist = [];\n          if (!distCode.blank()) {\n            dist.push({\n              path: \"build.js\",\n              content: distCode,\n              type: \"blob\"\n            });\n          }\n          if (!distStyle.blank()) {\n            dist.push({\n              path: \"style.css\",\n              content: distStyle,\n              type: \"blob\"\n            });\n          }\n          if (!distTest.blank()) {\n            dist.push({\n              path: \"test.js\",\n              content: distTest,\n              type: \"blob\"\n            });\n          }\n          return Deferred().resolve(postProcessors.pipeline({\n            source: arrayToHash(fileData),\n            distribution: arrayToHash(dist)\n          }));\n        });\n      },\n      program: function(build) {\n        var distribution, entryPoint, program;\n        distribution = build.distribution;\n        entryPoint = \"build.js\";\n        program = distribution[entryPoint].content;\n        return \"(function (ENV) {\\n\" + program + \"\\n}(\" + (JSON.stringify(build, null, 2)) + \"));\";\n      },\n      buildStyle: function(fileData) {\n        return this.build(fileData).then(function(build) {\n          var content, distribution, _ref;\n          distribution = build.distribution;\n          return content = ((_ref = distribution[\"style.css\"]) != null ? _ref.content : void 0) || \"\";\n        });\n      },\n      testScripts: function(fileData) {\n        return this.build(fileData).then(function(build) {\n          var content, distribution, _ref;\n          distribution = build.distribution;\n          content = ((_ref = distribution[\"test.js\"]) != null ? _ref.content : void 0) || \"\";\n          return \"\" + (dependencyScripts(build)) + \"\\n<script>\" + content + \"<\\/script>\";\n        });\n      },\n      runnable: function(fileData) {\n        var _this = this;\n        return this.build(fileData).then(function(build) {\n          var standAlone;\n          standAlone = _this.standAlone(build);\n          standAlone.config = Builder.readConfig(build);\n          return standAlone;\n        });\n      },\n      standAlone: function(build, ref) {\n        var content, distribution, program, scriptTag, source;\n        source = build.source, distribution = build.distribution;\n        content = [];\n        content.push(\"<!doctype html>\\n<head>\\n<meta http-equiv=\\\"Content-Type\\\" content=\\\"text/html; charset=UTF-8\\\" />\");\n        content = content.concat(dependencyScripts(build));\n        program = this.program(build);\n        scriptTag = ref ? makeScript({\n          src: \"\" + ref + \".js?\" + (+(new Date))\n        }) : \"<script>\\n\" + program + \"\\n<\\/script>\";\n        content.push(\"</head>\\n<body>\\n\" + scriptTag + \"\\n</body>\\n</html>\");\n        return {\n          html: content.join(\"\\n\"),\n          script: program\n        };\n      }\n    };\n  };\n\n  readConfig = function(build) {\n    var configData, _ref, _ref1;\n    if (configData = (_ref = build.source[\"pixie.cson\"]) != null ? _ref.content : void 0) {\n      return CSON.parse(configData);\n    } else if (configData = (_ref1 = build.source[\"pixie.json\"]) != null ? _ref1.content : void 0) {\n      return JSON.parse(configData);\n    } else {\n      return {};\n    }\n  };\n\n  Builder.readConfig = readConfig;\n\n}).call(this);\n;(function() {\n  var withDeferrence;\n\n  this.Deferred = $.Deferred;\n\n  withDeferrence = function(fn) {\n    var deferred, e;\n    deferred = Deferred();\n    try {\n      fn.defer(deferred);\n    } catch (_error) {\n      e = _error;\n      deferred.reject(e);\n    }\n    return deferred.promise();\n  };\n\n  Deferred.Confirm = function(message) {\n    return withDeferrence(function(deferred) {\n      if (window.confirm(message)) {\n        return deferred.resolve();\n      } else {\n        return deferred.reject();\n      }\n    });\n  };\n\n  Deferred.ConfirmIf = function(flag, message) {\n    if (flag) {\n      return Deferred.Confirm(message);\n    } else {\n      return withDeferrence(function(deferred) {\n        return deferred.resolve();\n      });\n    }\n  };\n\n  Deferred.ExecuteIf = function(flag, callback) {\n    return withDeferrence(function(deferred) {\n      if (flag) {\n        return callback().then(deferred.resolve);\n      } else {\n        return deferred.resolve();\n      }\n    });\n  };\n\n}).call(this);\n;(function() {\n  String.prototype.dasherize = function() {\n    return this.trim().replace(/\\s+/g, \"-\").toLowerCase();\n  };\n\n  this.Base64 = {\n    encode: function(s) {\n      return btoa(unescape(encodeURIComponent(s)));\n    },\n    decode: function(s) {\n      return decodeURIComponent(escape(atob(s.replace(/\\s/g, ''))));\n    }\n  };\n\n  this.CSON = {\n    parse: function(source) {\n      return Function(\"return \" + (CoffeeScript.compile(source, {\n        bare: true\n      })))();\n    },\n    stringify: function(object) {\n      var representation;\n      representation = JSON.parse(JSON.stringify(obj));\n      return Object.keys(representation).map(function(key) {\n        var value;\n        value = representation[key];\n        return \"\" + key + \": \" + (JSON.stringify(value));\n      }).join(\"\\n\");\n    }\n  };\n\n  HAMLjr.render = function(templateName, object) {\n    var template, templates;\n    templates = HAMLjr.templates;\n    template = templates[templateName] || templates[\"templates/\" + templateName];\n    if (template) {\n      return template(object);\n    } else {\n      throw \"Could not find template named \" + templateName;\n    }\n  };\n\n}).call(this);\n;(function() {\n  this.File = function(I) {\n    var self;\n    if (I == null) {\n      I = {};\n    }\n    if (I.path == null) {\n      I.path = I.filename;\n    }\n    if (I.filename == null) {\n      I.filename = I.path.split(\"/\").last();\n    }\n    self = Model(I).observeAll();\n    self.extend({\n      extension: function() {\n        return self.filename().extension();\n      },\n      mode: function() {\n        var extension;\n        switch (extension = self.extension()) {\n          case \"js\":\n            return \"javascript\";\n          case \"md\":\n            return \"markdown\";\n          case \"\":\n            return \"text\";\n          default:\n            return extension;\n        }\n      },\n      modified: Observable(false),\n      displayName: Observable(self.path())\n    });\n    self.content.observe(function() {\n      return self.modified(true);\n    });\n    self.modified.observe(function(modified) {\n      if (modified) {\n        return self.displayName(\"*\" + (self.path()));\n      } else {\n        return self.displayName(self.path());\n      }\n    });\n    return self;\n  };\n\n}).call(this);\n;(function() {\n  this.Filetree = function(I) {\n    var self;\n    if (I == null) {\n      I = {};\n    }\n    Object.defaults(I, {\n      files: []\n    });\n    self = Model(I).observeAll();\n    self.attrObservable(\"selectedFile\");\n    self.extend({\n      load: function(fileData) {\n        var files;\n        if (Array.isArray(fileData)) {\n          files = fileData.sort(function(a, b) {\n            if (a.path < b.path) {\n              return -1;\n            } else if (b.path < a.path) {\n              return 1;\n            } else {\n              return 0;\n            }\n          }).map(File);\n        } else {\n          files = Object.keys(fileData).sort().map(function(path) {\n            return File(fileData[path]);\n          });\n        }\n        return self.files(files);\n      },\n      data: function() {\n        return self.files.map(function(file) {\n          return {\n            path: file.path(),\n            mode: \"100644\",\n            content: file.content(),\n            type: \"blob\"\n          };\n        });\n      },\n      hasUnsavedChanges: function() {\n        return self.files().select(function(file) {\n          return file.modified();\n        }).length;\n      },\n      markSaved: function() {\n        return self.files().each(function(file) {\n          return file.modified(false);\n        });\n      }\n    });\n    return self;\n  };\n\n}).call(this);\n;(function() {\n  this.Gistquire = {\n    accessToken: null,\n    auth: function() {\n      var scope, url;\n      scope = \"gist,repo,user:email\";\n      url = \"https://github.com/login/oauth/authorize?client_id=bc46af967c926ba4ff87&scope=\" + scope;\n      return window.location = url;\n    },\n    onload: function() {\n      var code, _ref,\n        _this = this;\n      if (code = (_ref = window.location.href.match(/\\?code=(.*)/)) != null ? _ref[1] : void 0) {\n        $.getJSON(\"https://hamljr-auth.herokuapp.com/authenticate/\" + code, function(data) {\n          var token;\n          if (token = data.token) {\n            _this.accessToken = token;\n            return localStorage.authToken = token;\n          }\n        });\n      }\n      if (localStorage.authToken) {\n        return this.accessToken = localStorage.authToken;\n      }\n    },\n    api: function(path, options) {\n      var url;\n      if (options == null) {\n        options = {};\n      }\n      if (path.match(/^http/)) {\n        url = path;\n      } else {\n        url = \"https://api.github.com/\" + path;\n      }\n      options.headers || (options.headers = {});\n      if (this.accessToken) {\n        options.headers[\"Authorization\"] = \"token \" + this.accessToken;\n      }\n      options = Object.extend({\n        url: url,\n        type: \"GET\",\n        dataType: 'json'\n      }, options);\n      return $.ajax(options);\n    }\n  };\n\n}).call(this);\n;(function() {\n  var __slice = [].slice;\n\n  this.Repository = function(I) {\n    var api, get, patch, post, put, requestOptions, self;\n    if (I == null) {\n      I = {};\n    }\n    Object.defaults(I, {\n      branch: \"master\",\n      defaultBranch: \"master\"\n    });\n    self = Model(I).observeAll();\n    self.attrObservable(\"branch\");\n    requestOptions = function(type, data) {\n      return {\n        type: type,\n        data: JSON.stringify(data)\n      };\n    };\n    api = function(path, options) {\n      var url;\n      if (path.match(/^http/)) {\n        url = path;\n      } else {\n        url = \"\" + (self.url()) + \"/\" + path;\n      }\n      return Gistquire.api(url, options);\n    };\n    get = function(path, data) {\n      return api(path, {\n        data: data\n      });\n    };\n    put = function(path, data) {\n      return api(path, requestOptions(\"PUT\", data));\n    };\n    post = function(path, data) {\n      return api(path, requestOptions(\"POST\", data));\n    };\n    patch = function(path, data) {\n      return api(path, requestOptions(\"PATCH\", data));\n    };\n    self.extend({\n      pullRequests: function() {\n        return get(\"pulls\");\n      },\n      createPullRequest: function(_arg) {\n        var head, title;\n        title = _arg.title;\n        head = title.dasherize();\n        return self.switchToBranch(head).then(self.commitEmpty).then(function() {\n          return post(\"pulls\", {\n            base: I.defaultBranch,\n            head: head,\n            title: title\n          });\n        });\n      },\n      initPagesBranch: function() {\n        var branch;\n        branch = \"gh-pages\";\n        return post(\"git/trees\", {\n          tree: [\n            {\n              mode: \"1006444\",\n              path: \"tempest.txt\",\n              content: \"created by strd6.github.io/editor\"\n            }\n          ]\n        }).then(function(data) {\n          return post(\"git/commits\", {\n            message: \"Initial gh-pages commit\",\n            tree: data.sha\n          });\n        }).then(function(data) {\n          return post(\"git/refs\", {\n            ref: \"refs/heads/\" + branch,\n            sha: data.sha\n          });\n        });\n      },\n      writeFile: function(params) {\n        var branch, content, message, path;\n        branch = params.branch, path = params.path, content = params.content, message = params.message;\n        return get(\"contents/\" + path, {\n          ref: branch\n        }).then(function(data) {\n          return put(\"contents/\" + path, {\n            content: content,\n            sha: data.sha,\n            message: message,\n            branch: branch\n          });\n        }, function(request) {\n          var _ref, _ref1;\n          if (((_ref = request.responseJSON) != null ? _ref.message : void 0) === \"No commit found for the ref gh-pages\") {\n            return self.initPagesBranch().then(function() {\n              return self.writeFile(params);\n            });\n          } else if (request.status === 404) {\n            return put(\"contents/\" + path, {\n              content: content,\n              message: message,\n              branch: branch\n            });\n          } else {\n            return (_ref1 = Deferred()).reject.apply(_ref1, arguments);\n          }\n        });\n      },\n      latestTree: function(branch) {\n        if (branch == null) {\n          branch = self.branch();\n        }\n        return get(\"git/refs/heads/\" + branch).then(function(data) {\n          return get(data.object.url);\n        }).then(function(data) {\n          return get(\"\" + data.tree.url + \"?recursive=1\");\n        }).then(function(data) {\n          var files;\n          files = data.tree.select(function(file) {\n            return file.type === \"blob\";\n          });\n          return $.when.apply(null, files.map(function(datum) {\n            return get(datum.url).then(function(data) {\n              return Object.extend(datum, data);\n            });\n          }));\n        }).then(function() {\n          var results;\n          results = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return results;\n        });\n      },\n      commitTree: function(_arg) {\n        var branch, latestCommitSha, message, tree;\n        message = _arg.message, tree = _arg.tree;\n        branch = self.branch();\n        if (message == null) {\n          message = \"Updated in browser at strd6.github.io/editor\";\n        }\n        if (!tree) {\n          throw Error(\"Must pass in a tree\");\n        }\n        latestCommitSha = null;\n        return get(\"git/refs/heads/\" + branch).then(function(data) {\n          latestCommitSha = data.object.sha;\n          return post(\"git/trees\", {\n            tree: tree\n          });\n        }).then(function(data) {\n          return post(\"git/commits\", {\n            parents: [latestCommitSha],\n            message: message,\n            tree: data.sha\n          });\n        }).then(function(data) {\n          return patch(\"git/refs/heads/\" + branch, {\n            sha: data.sha\n          });\n        });\n      },\n      commitEmpty: function() {\n        var branch, latestCommit;\n        branch = self.branch();\n        latestCommit = null;\n        return get(\"git/refs/heads/\" + branch).then(function(data) {\n          return get(data.object.url);\n        }).then(function(data) {\n          return post(\"git/commits\", {\n            parents: [data.sha],\n            message: \"This commit intentionally left blank\",\n            tree: data.tree.sha\n          });\n        }).then(function(data) {\n          return patch(\"git/refs/heads/\" + branch, {\n            sha: data.sha\n          });\n        });\n      },\n      switchToBranch: function(branch) {\n        var ref, setBranch;\n        ref = \"refs/heads/\" + branch;\n        setBranch = function(data) {\n          self.branch(branch);\n          return data;\n        };\n        return get(\"git/\" + ref).then(setBranch, function(request) {\n          var branchNotFound, _ref;\n          branchNotFound = request.status === 404;\n          if (branchNotFound) {\n            return get(\"git/refs/heads/\" + (self.branch())).then(function(data) {\n              return post(\"git/refs\", {\n                ref: ref,\n                sha: data.object.sha\n              });\n            }).then(setBranch);\n          } else {\n            return (_ref = Deferred()).reject.apply(_ref, arguments);\n          }\n        });\n      },\n      mergeInto: function(branch) {\n        if (branch == null) {\n          branch = self.defaultBranch();\n        }\n        return post(\"merges\", {\n          base: branch,\n          head: self.branch()\n        });\n      },\n      pullFromBranch: function(branch) {\n        if (branch == null) {\n          branch = self.defaultBranch();\n        }\n        return post(\"merges\", {\n          base: self.branch(),\n          head: branch\n        });\n      },\n      publish: function(_arg) {\n        var branch, html, message, path, promise, publishBranch, script;\n        html = _arg.html, script = _arg.script;\n        branch = self.branch();\n        message = \"Built \" + branch + \" in browser in strd6.github.io/editor\";\n        if (branch === \"master\") {\n          path = \"index.html\";\n        } else {\n          path = \"\" + branch + \".html\";\n        }\n        publishBranch = \"gh-pages\";\n        promise = self.writeFile({\n          path: path,\n          content: Base64.encode(html),\n          branch: publishBranch,\n          message: message\n        });\n        if (script) {\n          return promise.then(self.writeFile({\n            path: \"\" + branch + \".js\",\n            content: Base64.encode(script),\n            branch: publishBranch,\n            message: message\n          }));\n        } else {\n          return promise;\n        }\n      }\n    });\n    return self;\n  };\n\n}).call(this);\n;(function() {\n  this.Runtime = function(ENV) {\n    var applyStyleSheet, currentNode, promo;\n    currentNode = function() {\n      var target;\n      target = document.documentElement;\n      while (target.childNodes.length && target.lastChild.nodeType === 1) {\n        target = target.lastChild;\n      }\n      return target.parentNode;\n    };\n    applyStyleSheet = function(root) {\n      var styleClass, styleContent, styleNode, _ref;\n      styleClass = \"primary\";\n      if (styleContent = (_ref = ENV.distribution[\"style.css\"]) != null ? _ref.content : void 0) {\n        styleNode = document.createElement(\"style\");\n        styleNode.innerHTML = styleContent;\n        styleNode.className = styleClass;\n        return root.appendChild(styleNode);\n      }\n    };\n    promo = function() {\n      return console.log(\"%c You should meet my creator \" + ENV.progenitor.url, \"background: #000; \\ncolor: white; \\nfont-size: 2em;\\nline-height: 2em;\\npadding: 40px 100px;\\nmargin-bottom: 1em;\\ntext-shadow: \\n  0 0 0.05em #fff, \\n  0 0 0.1em #fff, \\n  0 0 0.15em #fff, \\n  0 0 0.2em #ff00de, \\n  0 0 0.35em #ff00de, \\n  0 0 0.4em #ff00de, \\n  0 0 0.5em #ff00de, \\n  0 0 0.75em #ff00de;'\");\n    };\n    return {\n      boot: function() {\n        var root;\n        root = currentNode();\n        applyStyleSheet(root);\n        promo();\n        return root;\n      }\n    };\n  };\n\n}).call(this);\n;(function() {\n  this.TextEditor = function(I) {\n    var editor, el, reset, self, updating;\n    Object.reverseMerge(I, {\n      mode: \"coffee\",\n      text: \"\"\n    });\n    self = Model(I);\n    el = I.el;\n    delete I.el;\n    editor = ace.edit(el);\n    editor.setFontSize(\"16px\");\n    editor.setTheme(\"ace/theme/chrome\");\n    editor.getSession().setUseWorker(false);\n    editor.getSession().setMode(\"ace/mode/\" + I.mode);\n    editor.getSession().setUseSoftTabs(true);\n    editor.getSession().setTabSize(2);\n    reset = function(content) {\n      if (content == null) {\n        content = \"\";\n      }\n      editor.setValue(content);\n      editor.moveCursorTo(0, 0);\n      return editor.session.selection.clearSelection();\n    };\n    reset(I.text);\n    self.attrObservable(\"text\");\n    updating = false;\n    editor.getSession().on('change', function() {\n      updating = true;\n      self.text(editor.getValue());\n      return updating = false;\n    });\n    self.text.observe(function(newValue) {\n      if (!updating) {\n        return reset(newValue);\n      }\n    });\n    self.extend({\n      el: el,\n      editor: editor,\n      reset: reset\n    });\n    return self;\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/actions\"] = function(data) {\n    return (function() {\n      var actions, __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"actions\");\n      actions = this.actions;\n      Object.keys(actions).each(function(name) {\n        __element = document.createElement(\"button\");\n        __push(__element);\n        __element = document.createTextNode('');\n        __text(__element, name.titleize());\n        __push(__element);\n        __pop();\n        __on(\"click\", function() {\n          return actions[name]();\n        });\n        return __pop();\n      });\n      __element = document.createTextNode('');\n      __text(__element, HAMLjr.render(\"issues\", this.issues));\n      __push(__element);\n      __pop();\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/editor\"] = function(data) {\n    return (function() {\n      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"main\");\n      __element = document.createTextNode('');\n      __text(__element, HAMLjr.render(\"actions\", {\n        actions: this.actions,\n        issues: this.issues\n      }));\n      __push(__element);\n      __pop();\n      __element = document.createTextNode('');\n      __text(__element, HAMLjr.render(\"filetree\", this.filetree));\n      __push(__element);\n      __pop();\n      __element = document.createTextNode('');\n      __text(__element, HAMLjr.render(\"notices\", this));\n      __push(__element);\n      __pop();\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/filetree\"] = function(data) {\n    return (function() {\n      var files, selectedFile, __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"ul\");\n      __push(__element);\n      __attribute(__element, \"class\", \"filetree\");\n      selectedFile = this.selectedFile;\n      files = this.files;\n      __each(files, function(file) {\n        __element = document.createElement(\"li\");\n        __push(__element);\n        __element = document.createTextNode('');\n        __text(__element, file.displayName);\n        __push(__element);\n        __pop();\n        __on(\"click\", function(e) {\n          if ($(e.target).is('li')) {\n            return selectedFile(file);\n          }\n        });\n        __element = document.createElement(\"div\");\n        __push(__element);\n        __attribute(__element, \"class\", \"delete\");\n        __on(\"click\", function() {\n          if (confirm(\"Delete \" + (file.path()) + \"?\")) {\n            return files.remove(file);\n          }\n        });\n        __element = document.createTextNode('');\n        __text(__element, \"X\\n\");\n        __push(__element);\n        __pop();\n        __pop();\n        return __pop();\n      });\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/github_status\"] = function(data) {\n    return (function() {\n      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"status\");\n      if (this.request && this.request.getAllResponseHeaders().match(/X-RateLimit-Limit: 5000/)) {\n        __element = document.createTextNode('');\n        __text(__element, \"Authenticated Scopes:\\n\");\n        __push(__element);\n        __pop();\n        __element = document.createTextNode('');\n        __text(__element, this.request.getResponseHeader(\"X-OAuth-Scopes\"));\n        __push(__element);\n        __pop();\n        __element = document.createElement(\"br\");\n        __push(__element);\n        __pop();\n        __element = document.createTextNode('');\n        __text(__element, \"Rate Limit Remaining:\\n\");\n        __push(__element);\n        __pop();\n        __element = document.createTextNode('');\n        __text(__element, this.request.getResponseHeader(\"X-RateLimit-Remaining\"));\n        __push(__element);\n        __pop();\n        __element = document.createTextNode('');\n        __text(__element, \" / 5000\");\n        __push(__element);\n        __pop();\n      } else {\n        __element = document.createElement(\"button\");\n        __push(__element);\n        __element = document.createTextNode('');\n        __text(__element, \"Auth\\n\");\n        __push(__element);\n        __pop();\n        __on(\"click\", Gistquire.auth);\n        __pop();\n      }\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/notices\"] = function(data) {\n    return (function() {\n      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"console-wrap\");\n      __element = document.createElement(\"pre\");\n      __push(__element);\n      __attribute(__element, \"class\", \"errors\");\n      __each(this.errors, function(error) {\n        __element = document.createTextNode('');\n        __text(__element, error);\n        __push(__element);\n        return __pop();\n      });\n      __pop();\n      __element = document.createElement(\"pre\");\n      __push(__element);\n      __attribute(__element, \"class\", \"notices\");\n      __each(this.notices, function(notice) {\n        __element = document.createTextNode('');\n        __text(__element, notice);\n        __push(__element);\n        return __pop();\n      });\n      __pop();\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/text_editor\"] = function(data) {\n    return (function() {\n      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"editor-wrap\");\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"editor\");\n      __pop();\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var runningWindows;\n\n  runningWindows = [];\n\n  this.Runner = {\n    run: function(_arg) {\n      var config, html, sandbox;\n      config = _arg.config, html = _arg.html;\n      sandbox = Sandbox({\n        width: config.width,\n        height: config.height\n      });\n      sandbox.document.open();\n      sandbox.document.write(html);\n      sandbox.document.close();\n      return runningWindows.push(sandbox);\n    },\n    hotReloadCSS: function(css) {\n      runningWindows = runningWindows.partition(function(window) {\n        var styleClass;\n        if (window.closed) {\n          return false;\n        }\n        styleClass = \"primary\";\n        $(window.document).find(\"style.\" + styleClass).html(css);\n        return true;\n      });\n      return console.log(css);\n    }\n  };\n\n}).call(this);\n;(function() {\n  var $root, actions, branch, builder, classicError, confirmUnsaved, distribution, errors, files, filetree, fullName, hotReloadCSS, issues, notices, notify, owner, repo, repository, repositoryLoaded, _ref;\n\n  files = ENV.source, distribution = ENV.distribution;\n\n  window.ENV = ENV;\n\n  classicError = function(request) {\n    var message;\n    notices([]);\n    if (request.responseJSON) {\n      message = JSON.stringify(request.responseJSON, null, 2);\n    } else {\n      message = \"Error\";\n    }\n    return errors([message]);\n  };\n\n  notify = function(message) {\n    notices([message]);\n    return errors([]);\n  };\n\n  $root = $(Runtime(ENV).boot());\n\n  Gistquire.onload();\n\n  _ref = ENV.repository, owner = _ref.owner, repo = _ref.repo, branch = _ref.branch, fullName = _ref.full_name;\n\n  fullName || (fullName = \"\" + owner + \"/\" + repo);\n\n  repository = Repository({\n    url: \"repos/\" + fullName\n  });\n\n  errors = Observable([]);\n\n  notices = Observable([\"Loaded!\"]);\n\n  builder = Builder({\n    errors: errors,\n    notices: notices\n  });\n\n  repositoryLoaded = function(repository) {\n    issues.repository = repository;\n    repository.pullRequests().then(issues.reset);\n    return notices([\"Finished loading!\"]);\n  };\n\n  confirmUnsaved = function() {\n    return Deferred.ConfirmIf(filetree.hasUnsavedChanges(), \"You will lose unsaved changes in your current branch, continue?\");\n  };\n\n  issues = Issues();\n\n  builder.addPostProcessor(function(data) {\n    data.repository = {\n      full_name: fullName,\n      branch: branch\n    };\n    return data;\n  });\n\n  builder.addPostProcessor(function(data) {\n    data.progenitor = {\n      url: \"http://strd6.github.io/editor/\"\n    };\n    return data;\n  });\n\n  actions = {\n    save: function() {\n      notices([\"Saving...\"]);\n      return Actions.save({\n        repository: repository,\n        fileData: filetree.data(),\n        builder: builder\n      }).then(function() {\n        filetree.markSaved();\n        return notices([\"Saved and published!\"]);\n      });\n    },\n    run: function() {\n      return Actions.run({\n        builder: builder,\n        filetree: filetree\n      }).fail(errors);\n    },\n    test: function() {\n      notify(\"Running tests...\");\n      return builder.testScripts(filetree.data()).then(function(testScripts) {\n        return TestRunner.launch(testScripts);\n      }).fail(errors);\n    },\n    new_file: function() {\n      var name;\n      if (name = prompt(\"File Name\", \"newfile.coffee\")) {\n        return filetree.files.push(File({\n          filename: name,\n          content: \"\"\n        }));\n      }\n    },\n    load_repo: function(skipPrompt) {\n      return confirmUnsaved().then(function() {\n        if (!skipPrompt) {\n          fullName = prompt(\"Github repo\", fullName);\n        }\n        if (fullName) {\n          repository = Repository({\n            url: \"repos/\" + fullName\n          });\n        } else {\n          errors([\"No repo given\"]);\n          return;\n        }\n        notices([\"Loading repo...\"]);\n        return Actions.load({\n          repository: repository,\n          filetree: filetree\n        }).then(function() {\n          return repositoryLoaded(repository);\n        }).fail(function() {\n          return errors([\"Error loading \" + (repository.url())]);\n        });\n      });\n    },\n    new_feature: function() {\n      var title;\n      if (title = prompt(\"Description\")) {\n        notices([\"Creating feature branch...\"]);\n        return repository.createPullRequest({\n          title: title\n        }).then(function(data) {\n          var issue;\n          issue = Issue(data);\n          issues.issues.push(issue);\n          issues.silent = true;\n          issues.currentIssue(issue);\n          issues.silent = false;\n          return notices.push(\"Created!\");\n        }, classicError);\n      }\n    },\n    pull_master: function() {\n      return confirmUnsaved().then(function() {\n        notify(\"Merging in default branch...\");\n        return repository.pullFromBranch();\n      }, classicError).then(function() {\n        var branchName;\n        notices.push(\"Merged!\");\n        branchName = repository.branch();\n        notices.push(\"\\nReloading branch \" + branchName + \"...\");\n        return Actions.load({\n          repository: repository,\n          filetree: filetree\n        }).then(function() {\n          return notices.push(\"Loaded!\");\n        });\n      });\n    }\n  };\n\n  filetree = Filetree();\n\n  filetree.load(files);\n\n  filetree.selectedFile.observe(function(file) {\n    var editor, root;\n    root = $root.children(\".main\");\n    root.find(\".editor-wrap\").hide();\n    if (file.editor) {\n      return file.editor.trigger(\"show\");\n    } else {\n      root.append(HAMLjr.render(\"text_editor\"));\n      file.editor = root.find(\".editor-wrap\").last();\n      editor = TextEditor({\n        text: file.content(),\n        el: file.editor.find('.editor').get(0),\n        mode: file.mode()\n      });\n      file.editor.on(\"show\", function() {\n        file.editor.show();\n        return editor.editor.focus();\n      });\n      return editor.text.observe(function(value) {\n        file.content(value);\n        if (file.path().match(/\\.styl$/)) {\n          return hotReloadCSS();\n        }\n      });\n    }\n  });\n\n  hotReloadCSS = (function() {\n    return builder.buildStyle(filetree.data()).then(Runner.hotReloadCSS);\n  }).debounce(500);\n\n  repositoryLoaded(repository);\n\n  issues.currentIssue.observe(function(issue) {\n    var changeBranch;\n    if (issues.silent) {\n      return;\n    }\n    changeBranch = function(branchName) {\n      var previousBranch;\n      previousBranch = repository.branch();\n      return confirmUnsaved().then(function() {\n        return repository.switchToBranch(branchName).then(function() {\n          notices.push(\"\\nLoading branch \" + branchName + \"...\");\n          return Actions.load({\n            repository: repository,\n            filetree: filetree\n          }).then(function() {\n            return notices.push(\"Loaded!\");\n          });\n        });\n      }, function() {\n        repository.branch(previousBranch);\n        return errors([\"Error switching to \" + branchName + \", still on \" + previousBranch]);\n      });\n    };\n    if (issue) {\n      notify(issue.fullDescription());\n      return changeBranch(issue.branchName());\n    } else {\n      notify(\"Default branch selected\");\n      return changeBranch(repository.defaultBranch());\n    }\n  });\n\n  $root.append(HAMLjr.render(\"editor\", {\n    filetree: filetree,\n    actions: actions,\n    notices: notices,\n    errors: errors,\n    issues: issues\n  }));\n\n  Gistquire.api(\"rate_limit\").then(function(data, status, request) {\n    return $root.append(HAMLjr.render(\"github_status\", {\n      request: request\n    }));\n  });\n\n  window.onbeforeunload = function() {\n    if (filetree.hasUnsavedChanges()) {\n      return \"You have some unsaved changes, if you leave now you will lose your work.\";\n    }\n  };\n\n}).call(this);",
      "type": "blob"
    },
    "style.css": {
      "path": "style.css",
      "content": "html,\nbody {\n  margin: 0;\n  height: 100%;\n}\n\n.main {\n  position: relative;\n  padding-top: 40px;\n  padding-left: 200px;\n  padding-bottom: 100px;\n  height: 100%;\n  -ms-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n.editor-wrap {\n  background-color: white;\n  width: 100%;\n  height: 100%;\n  position: relative;\n}\n\n.editor-wrap > div {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n}\n\n.filetree {\n  margin: 0;\n  padding: 0;\n  width: 200px;\n  position: absolute;\n  left: 0;\n  top: 40px;\n  z-index: 2;\n}\n\n.filetree li .delete {\n  display: none;\n  position: absolute;\n  right: 0;\n}\n\n.filetree li:hover .delete {\n  display: inline-block;\n}\n\n.filetree li:hover {\n  background-color: lightyellow;\n}\n\n.filetree li {\n  list-style-type: none;\n  padding-left: 1em;\n  position: relative;\n}\n\n.actions {\n  position: absolute;\n  top: 0;\n  left: 200px;\n}\n\n.console-wrap {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  padding-left: 200px;\n  height: 100px;\n  width: 100%;\n  margin: 0;\n  -ms-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n.console-wrap .errors {\n  border-top: 1px solid black;\n  color: red;\n  -ms-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n.status {\n  top: 0;\n  right: 0;\n  position: absolute;\n}",
      "type": "blob"
    },
    "test.js": {
      "path": "test.js",
      "content": "(function() {\n  var commit, publish;\n\n  publish = function(_arg) {\n    var builder, fileData, repository;\n    builder = _arg.builder, fileData = _arg.fileData, repository = _arg.repository;\n    return builder.build(fileData).then(function(build) {\n      var branch;\n      branch = repository.branch();\n      return repository.publish(builder.standAlone(build, branch));\n    });\n  };\n\n  commit = function(_arg) {\n    var fileData, message, repository;\n    fileData = _arg.fileData, repository = _arg.repository, message = _arg.message;\n    return repository.commitTree({\n      tree: fileData,\n      message: message\n    });\n  };\n\n  this.Actions = {\n    save: function(params) {\n      return commit(params).then(function() {\n        return publish(params);\n      });\n    },\n    run: function(_arg) {\n      var builder, filetree;\n      builder = _arg.builder, filetree = _arg.filetree;\n      return builder.runnable(filetree.data()).then(Runner.run);\n    },\n    load: function(_arg) {\n      var filetree, processDirectory, repository;\n      filetree = _arg.filetree, repository = _arg.repository;\n      processDirectory = function(items) {\n        return items.each(function(item) {\n          if (!item.content) {\n            return item;\n          }\n          item.content = Base64.decode(item.content);\n          return item.encoding = \"raw\";\n        });\n      };\n      return repository.latestTree().then(function(results) {\n        var files;\n        files = processDirectory(results);\n        return filetree.load(files);\n      });\n    }\n  };\n\n}).call(this);\n;(function() {\n  var arrayToHash, compileFile, compileStyl, compileTemplate, dependencyScripts, documentFile, makeScript, readConfig, stripMarkdown;\n\n  arrayToHash = function(array) {\n    return array.eachWithObject({}, function(file, hash) {\n      return hash[file.path] = file;\n    });\n  };\n\n  stripMarkdown = function(content) {\n    return content.split(\"\\n\").map(function(line) {\n      var match;\n      if (match = /^([ ]{4}|\\t)/.exec(line)) {\n        return line.slice(match[0].length);\n      } else {\n        return \"\";\n      }\n    }).join(\"\\n\");\n  };\n\n  compileTemplate = function(source, name) {\n    var ast;\n    if (name == null) {\n      name = \"test\";\n    }\n    ast = HAMLjr.parser.parse(source);\n    return HAMLjr.compile(ast, {\n      name: name,\n      compiler: CoffeeScript\n    });\n  };\n\n  compileStyl = function(source) {\n    return styl(source, {\n      whitespace: true\n    }).toString();\n  };\n\n  compileFile = function(_arg) {\n    var content, extension, name, path, result, _ref;\n    path = _arg.path, content = _arg.content;\n    _ref = [path.withoutExtension(), path.extension()], name = _ref[0], extension = _ref[1];\n    result = (function() {\n      switch (extension) {\n        case \"js\":\n          return {\n            code: content\n          };\n        case \"coffee\":\n          return {\n            code: CoffeeScript.compile(content)\n          };\n        case \"haml\":\n          return {\n            code: compileTemplate(content, name)\n          };\n        case \"styl\":\n          return {\n            style: compileStyl(content)\n          };\n        case \"md\":\n          return compileFile({\n            path: name,\n            content: stripMarkdown(content)\n          });\n        default:\n          return {};\n      }\n    })();\n    Object.defaults(result, {\n      name: name,\n      extension: extension\n    });\n    if (path.match(/^test\\//)) {\n      if (result.code) {\n        result.test = \"\" + (result.test || \"\") + \";\" + result.code;\n        delete result.code;\n      }\n    }\n    return Object.extend(result, {\n      path: path\n    });\n  };\n\n  documentFile = function(content, path) {\n    if (path.extension() === \"md\") {\n      return marked(content);\n    } else {\n      return \"\";\n    }\n  };\n\n  makeScript = function(attrs) {\n    return $(\"<script>\", attrs).prop('outerHTML');\n  };\n\n  dependencyScripts = function(build) {\n    var remoteDependencies;\n    remoteDependencies = readConfig(build).remoteDependencies;\n    return (remoteDependencies ? remoteDependencies.map(function(src) {\n      return makeScript({\n        \"class\": \"env\",\n        src: src\n      });\n    }) : $('script.env').map(function() {\n      return this.outerHTML;\n    }).get()).join(\"\\n\");\n  };\n\n  this.Builder = function(I) {\n    var build, postProcessors;\n    if (I == null) {\n      I = {};\n    }\n    compileTemplate = function(source, name) {\n      var ast;\n      if (name == null) {\n        name = \"test\";\n      }\n      ast = HAMLjr.parser.parse(source);\n      return HAMLjr.compile(ast, {\n        name: name,\n        compiler: CoffeeScript\n      });\n    };\n    build = function(fileData) {\n      var data, errors, results, _ref;\n      results = fileData.map(function(_arg) {\n        var content, location, message, path;\n        path = _arg.path, content = _arg.content;\n        try {\n          return compileFile({\n            path: path,\n            content: content\n          });\n        } catch (_error) {\n          location = _error.location, message = _error.message;\n          if (location != null) {\n            message = \"Error on line \" + (location.first_line + 1) + \": \" + message;\n          }\n          return {\n            error: \"\" + path + \" - \" + message\n          };\n        }\n      });\n      _ref = results.partition(function(result) {\n        return result.error;\n      }), errors = _ref[0], data = _ref[1];\n      if (errors.length) {\n        return Deferred().reject(errors.map(function(e) {\n          return e.error;\n        }));\n      } else {\n        return Deferred().resolve(data);\n      }\n    };\n    postProcessors = [];\n    return {\n      I: I,\n      addPostProcessor: function(fn) {\n        return postProcessors.push(fn);\n      },\n      buildDocs: function(fileData) {\n        return fileData.map(function(_arg) {\n          var content, location, message, path;\n          path = _arg.path, content = _arg.content;\n          try {\n            return {\n              path: path,\n              documentation: documentFile(content, path)\n            };\n          } catch (_error) {\n            location = _error.location, message = _error.message;\n            if (location != null) {\n              message = \"Error on line \" + (location.first_line + 1) + \": \" + message;\n            }\n            return {\n              error: \"\" + path + \" - \" + message\n            };\n          }\n        });\n      },\n      build: function(fileData) {\n        return build(fileData).then(function(items) {\n          var dist, distCode, distStyle, distTest, results;\n          results = {\n            code: [],\n            style: [],\n            main: [],\n            test: []\n          };\n          items.eachWithObject(results, function(item, hash) {\n            var code, style, test;\n            if (code = item.code) {\n              if (item.name === \"main\" && (item.extension === \"js\" || item.extension === \"coffee\")) {\n                return hash.main.push(code);\n              } else {\n                return hash.code.push(code);\n              }\n            } else if (style = item.style) {\n              return hash.style.push(style);\n            } else if (test = item.test) {\n              return hash.test.push(test);\n            } else {\n\n            }\n          });\n          distCode = results.code.concat(results.main).join(';').trim();\n          distTest = results.code.concat(results.test).join(';').trim();\n          distStyle = results.style.join('').trim();\n          dist = [];\n          if (!distCode.blank()) {\n            dist.push({\n              path: \"build.js\",\n              content: distCode,\n              type: \"blob\"\n            });\n          }\n          if (!distStyle.blank()) {\n            dist.push({\n              path: \"style.css\",\n              content: distStyle,\n              type: \"blob\"\n            });\n          }\n          if (!distTest.blank()) {\n            dist.push({\n              path: \"test.js\",\n              content: distTest,\n              type: \"blob\"\n            });\n          }\n          return Deferred().resolve(postProcessors.pipeline({\n            source: arrayToHash(fileData),\n            distribution: arrayToHash(dist)\n          }));\n        });\n      },\n      program: function(build) {\n        var distribution, entryPoint, program;\n        distribution = build.distribution;\n        entryPoint = \"build.js\";\n        program = distribution[entryPoint].content;\n        return \"(function (ENV) {\\n\" + program + \"\\n}(\" + (JSON.stringify(build, null, 2)) + \"));\";\n      },\n      buildStyle: function(fileData) {\n        return this.build(fileData).then(function(build) {\n          var content, distribution, _ref;\n          distribution = build.distribution;\n          return content = ((_ref = distribution[\"style.css\"]) != null ? _ref.content : void 0) || \"\";\n        });\n      },\n      testScripts: function(fileData) {\n        return this.build(fileData).then(function(build) {\n          var content, distribution, _ref;\n          distribution = build.distribution;\n          content = ((_ref = distribution[\"test.js\"]) != null ? _ref.content : void 0) || \"\";\n          return \"\" + (dependencyScripts(build)) + \"\\n<script>\" + content + \"<\\/script>\";\n        });\n      },\n      runnable: function(fileData) {\n        var _this = this;\n        return this.build(fileData).then(function(build) {\n          var standAlone;\n          standAlone = _this.standAlone(build);\n          standAlone.config = Builder.readConfig(build);\n          return standAlone;\n        });\n      },\n      standAlone: function(build, ref) {\n        var content, distribution, program, scriptTag, source;\n        source = build.source, distribution = build.distribution;\n        content = [];\n        content.push(\"<!doctype html>\\n<head>\\n<meta http-equiv=\\\"Content-Type\\\" content=\\\"text/html; charset=UTF-8\\\" />\");\n        content = content.concat(dependencyScripts(build));\n        program = this.program(build);\n        scriptTag = ref ? makeScript({\n          src: \"\" + ref + \".js?\" + (+(new Date))\n        }) : \"<script>\\n\" + program + \"\\n<\\/script>\";\n        content.push(\"</head>\\n<body>\\n\" + scriptTag + \"\\n</body>\\n</html>\");\n        return {\n          html: content.join(\"\\n\"),\n          script: program\n        };\n      }\n    };\n  };\n\n  readConfig = function(build) {\n    var configData, _ref, _ref1;\n    if (configData = (_ref = build.source[\"pixie.cson\"]) != null ? _ref.content : void 0) {\n      return CSON.parse(configData);\n    } else if (configData = (_ref1 = build.source[\"pixie.json\"]) != null ? _ref1.content : void 0) {\n      return JSON.parse(configData);\n    } else {\n      return {};\n    }\n  };\n\n  Builder.readConfig = readConfig;\n\n}).call(this);\n;(function() {\n  var withDeferrence;\n\n  this.Deferred = $.Deferred;\n\n  withDeferrence = function(fn) {\n    var deferred, e;\n    deferred = Deferred();\n    try {\n      fn.defer(deferred);\n    } catch (_error) {\n      e = _error;\n      deferred.reject(e);\n    }\n    return deferred.promise();\n  };\n\n  Deferred.Confirm = function(message) {\n    return withDeferrence(function(deferred) {\n      if (window.confirm(message)) {\n        return deferred.resolve();\n      } else {\n        return deferred.reject();\n      }\n    });\n  };\n\n  Deferred.ConfirmIf = function(flag, message) {\n    if (flag) {\n      return Deferred.Confirm(message);\n    } else {\n      return withDeferrence(function(deferred) {\n        return deferred.resolve();\n      });\n    }\n  };\n\n  Deferred.ExecuteIf = function(flag, callback) {\n    return withDeferrence(function(deferred) {\n      if (flag) {\n        return callback().then(deferred.resolve);\n      } else {\n        return deferred.resolve();\n      }\n    });\n  };\n\n}).call(this);\n;(function() {\n  String.prototype.dasherize = function() {\n    return this.trim().replace(/\\s+/g, \"-\").toLowerCase();\n  };\n\n  this.Base64 = {\n    encode: function(s) {\n      return btoa(unescape(encodeURIComponent(s)));\n    },\n    decode: function(s) {\n      return decodeURIComponent(escape(atob(s.replace(/\\s/g, ''))));\n    }\n  };\n\n  this.CSON = {\n    parse: function(source) {\n      return Function(\"return \" + (CoffeeScript.compile(source, {\n        bare: true\n      })))();\n    },\n    stringify: function(object) {\n      var representation;\n      representation = JSON.parse(JSON.stringify(obj));\n      return Object.keys(representation).map(function(key) {\n        var value;\n        value = representation[key];\n        return \"\" + key + \": \" + (JSON.stringify(value));\n      }).join(\"\\n\");\n    }\n  };\n\n  HAMLjr.render = function(templateName, object) {\n    var template, templates;\n    templates = HAMLjr.templates;\n    template = templates[templateName] || templates[\"templates/\" + templateName];\n    if (template) {\n      return template(object);\n    } else {\n      throw \"Could not find template named \" + templateName;\n    }\n  };\n\n}).call(this);\n;(function() {\n  this.File = function(I) {\n    var self;\n    if (I == null) {\n      I = {};\n    }\n    if (I.path == null) {\n      I.path = I.filename;\n    }\n    if (I.filename == null) {\n      I.filename = I.path.split(\"/\").last();\n    }\n    self = Model(I).observeAll();\n    self.extend({\n      extension: function() {\n        return self.filename().extension();\n      },\n      mode: function() {\n        var extension;\n        switch (extension = self.extension()) {\n          case \"js\":\n            return \"javascript\";\n          case \"md\":\n            return \"markdown\";\n          case \"\":\n            return \"text\";\n          default:\n            return extension;\n        }\n      },\n      modified: Observable(false),\n      displayName: Observable(self.path())\n    });\n    self.content.observe(function() {\n      return self.modified(true);\n    });\n    self.modified.observe(function(modified) {\n      if (modified) {\n        return self.displayName(\"*\" + (self.path()));\n      } else {\n        return self.displayName(self.path());\n      }\n    });\n    return self;\n  };\n\n}).call(this);\n;(function() {\n  this.Filetree = function(I) {\n    var self;\n    if (I == null) {\n      I = {};\n    }\n    Object.defaults(I, {\n      files: []\n    });\n    self = Model(I).observeAll();\n    self.attrObservable(\"selectedFile\");\n    self.extend({\n      load: function(fileData) {\n        var files;\n        if (Array.isArray(fileData)) {\n          files = fileData.sort(function(a, b) {\n            if (a.path < b.path) {\n              return -1;\n            } else if (b.path < a.path) {\n              return 1;\n            } else {\n              return 0;\n            }\n          }).map(File);\n        } else {\n          files = Object.keys(fileData).sort().map(function(path) {\n            return File(fileData[path]);\n          });\n        }\n        return self.files(files);\n      },\n      data: function() {\n        return self.files.map(function(file) {\n          return {\n            path: file.path(),\n            mode: \"100644\",\n            content: file.content(),\n            type: \"blob\"\n          };\n        });\n      },\n      hasUnsavedChanges: function() {\n        return self.files().select(function(file) {\n          return file.modified();\n        }).length;\n      },\n      markSaved: function() {\n        return self.files().each(function(file) {\n          return file.modified(false);\n        });\n      }\n    });\n    return self;\n  };\n\n}).call(this);\n;(function() {\n  this.Gistquire = {\n    accessToken: null,\n    auth: function() {\n      var scope, url;\n      scope = \"gist,repo,user:email\";\n      url = \"https://github.com/login/oauth/authorize?client_id=bc46af967c926ba4ff87&scope=\" + scope;\n      return window.location = url;\n    },\n    onload: function() {\n      var code, _ref,\n        _this = this;\n      if (code = (_ref = window.location.href.match(/\\?code=(.*)/)) != null ? _ref[1] : void 0) {\n        $.getJSON(\"https://hamljr-auth.herokuapp.com/authenticate/\" + code, function(data) {\n          var token;\n          if (token = data.token) {\n            _this.accessToken = token;\n            return localStorage.authToken = token;\n          }\n        });\n      }\n      if (localStorage.authToken) {\n        return this.accessToken = localStorage.authToken;\n      }\n    },\n    api: function(path, options) {\n      var url;\n      if (options == null) {\n        options = {};\n      }\n      if (path.match(/^http/)) {\n        url = path;\n      } else {\n        url = \"https://api.github.com/\" + path;\n      }\n      options.headers || (options.headers = {});\n      if (this.accessToken) {\n        options.headers[\"Authorization\"] = \"token \" + this.accessToken;\n      }\n      options = Object.extend({\n        url: url,\n        type: \"GET\",\n        dataType: 'json'\n      }, options);\n      return $.ajax(options);\n    }\n  };\n\n}).call(this);\n;(function() {\n  var __slice = [].slice;\n\n  this.Repository = function(I) {\n    var api, get, patch, post, put, requestOptions, self;\n    if (I == null) {\n      I = {};\n    }\n    Object.defaults(I, {\n      branch: \"master\",\n      defaultBranch: \"master\"\n    });\n    self = Model(I).observeAll();\n    self.attrObservable(\"branch\");\n    requestOptions = function(type, data) {\n      return {\n        type: type,\n        data: JSON.stringify(data)\n      };\n    };\n    api = function(path, options) {\n      var url;\n      if (path.match(/^http/)) {\n        url = path;\n      } else {\n        url = \"\" + (self.url()) + \"/\" + path;\n      }\n      return Gistquire.api(url, options);\n    };\n    get = function(path, data) {\n      return api(path, {\n        data: data\n      });\n    };\n    put = function(path, data) {\n      return api(path, requestOptions(\"PUT\", data));\n    };\n    post = function(path, data) {\n      return api(path, requestOptions(\"POST\", data));\n    };\n    patch = function(path, data) {\n      return api(path, requestOptions(\"PATCH\", data));\n    };\n    self.extend({\n      pullRequests: function() {\n        return get(\"pulls\");\n      },\n      createPullRequest: function(_arg) {\n        var head, title;\n        title = _arg.title;\n        head = title.dasherize();\n        return self.switchToBranch(head).then(self.commitEmpty).then(function() {\n          return post(\"pulls\", {\n            base: I.defaultBranch,\n            head: head,\n            title: title\n          });\n        });\n      },\n      initPagesBranch: function() {\n        var branch;\n        branch = \"gh-pages\";\n        return post(\"git/trees\", {\n          tree: [\n            {\n              mode: \"1006444\",\n              path: \"tempest.txt\",\n              content: \"created by strd6.github.io/editor\"\n            }\n          ]\n        }).then(function(data) {\n          return post(\"git/commits\", {\n            message: \"Initial gh-pages commit\",\n            tree: data.sha\n          });\n        }).then(function(data) {\n          return post(\"git/refs\", {\n            ref: \"refs/heads/\" + branch,\n            sha: data.sha\n          });\n        });\n      },\n      writeFile: function(params) {\n        var branch, content, message, path;\n        branch = params.branch, path = params.path, content = params.content, message = params.message;\n        return get(\"contents/\" + path, {\n          ref: branch\n        }).then(function(data) {\n          return put(\"contents/\" + path, {\n            content: content,\n            sha: data.sha,\n            message: message,\n            branch: branch\n          });\n        }, function(request) {\n          var _ref, _ref1;\n          if (((_ref = request.responseJSON) != null ? _ref.message : void 0) === \"No commit found for the ref gh-pages\") {\n            return self.initPagesBranch().then(function() {\n              return self.writeFile(params);\n            });\n          } else if (request.status === 404) {\n            return put(\"contents/\" + path, {\n              content: content,\n              message: message,\n              branch: branch\n            });\n          } else {\n            return (_ref1 = Deferred()).reject.apply(_ref1, arguments);\n          }\n        });\n      },\n      latestTree: function(branch) {\n        if (branch == null) {\n          branch = self.branch();\n        }\n        return get(\"git/refs/heads/\" + branch).then(function(data) {\n          return get(data.object.url);\n        }).then(function(data) {\n          return get(\"\" + data.tree.url + \"?recursive=1\");\n        }).then(function(data) {\n          var files;\n          files = data.tree.select(function(file) {\n            return file.type === \"blob\";\n          });\n          return $.when.apply(null, files.map(function(datum) {\n            return get(datum.url).then(function(data) {\n              return Object.extend(datum, data);\n            });\n          }));\n        }).then(function() {\n          var results;\n          results = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n          return results;\n        });\n      },\n      commitTree: function(_arg) {\n        var branch, latestCommitSha, message, tree;\n        message = _arg.message, tree = _arg.tree;\n        branch = self.branch();\n        if (message == null) {\n          message = \"Updated in browser at strd6.github.io/editor\";\n        }\n        if (!tree) {\n          throw Error(\"Must pass in a tree\");\n        }\n        latestCommitSha = null;\n        return get(\"git/refs/heads/\" + branch).then(function(data) {\n          latestCommitSha = data.object.sha;\n          return post(\"git/trees\", {\n            tree: tree\n          });\n        }).then(function(data) {\n          return post(\"git/commits\", {\n            parents: [latestCommitSha],\n            message: message,\n            tree: data.sha\n          });\n        }).then(function(data) {\n          return patch(\"git/refs/heads/\" + branch, {\n            sha: data.sha\n          });\n        });\n      },\n      commitEmpty: function() {\n        var branch, latestCommit;\n        branch = self.branch();\n        latestCommit = null;\n        return get(\"git/refs/heads/\" + branch).then(function(data) {\n          return get(data.object.url);\n        }).then(function(data) {\n          return post(\"git/commits\", {\n            parents: [data.sha],\n            message: \"This commit intentionally left blank\",\n            tree: data.tree.sha\n          });\n        }).then(function(data) {\n          return patch(\"git/refs/heads/\" + branch, {\n            sha: data.sha\n          });\n        });\n      },\n      switchToBranch: function(branch) {\n        var ref, setBranch;\n        ref = \"refs/heads/\" + branch;\n        setBranch = function(data) {\n          self.branch(branch);\n          return data;\n        };\n        return get(\"git/\" + ref).then(setBranch, function(request) {\n          var branchNotFound, _ref;\n          branchNotFound = request.status === 404;\n          if (branchNotFound) {\n            return get(\"git/refs/heads/\" + (self.branch())).then(function(data) {\n              return post(\"git/refs\", {\n                ref: ref,\n                sha: data.object.sha\n              });\n            }).then(setBranch);\n          } else {\n            return (_ref = Deferred()).reject.apply(_ref, arguments);\n          }\n        });\n      },\n      mergeInto: function(branch) {\n        if (branch == null) {\n          branch = self.defaultBranch();\n        }\n        return post(\"merges\", {\n          base: branch,\n          head: self.branch()\n        });\n      },\n      pullFromBranch: function(branch) {\n        if (branch == null) {\n          branch = self.defaultBranch();\n        }\n        return post(\"merges\", {\n          base: self.branch(),\n          head: branch\n        });\n      },\n      publish: function(_arg) {\n        var branch, html, message, path, promise, publishBranch, script;\n        html = _arg.html, script = _arg.script;\n        branch = self.branch();\n        message = \"Built \" + branch + \" in browser in strd6.github.io/editor\";\n        if (branch === \"master\") {\n          path = \"index.html\";\n        } else {\n          path = \"\" + branch + \".html\";\n        }\n        publishBranch = \"gh-pages\";\n        promise = self.writeFile({\n          path: path,\n          content: Base64.encode(html),\n          branch: publishBranch,\n          message: message\n        });\n        if (script) {\n          return promise.then(self.writeFile({\n            path: \"\" + branch + \".js\",\n            content: Base64.encode(script),\n            branch: publishBranch,\n            message: message\n          }));\n        } else {\n          return promise;\n        }\n      }\n    });\n    return self;\n  };\n\n}).call(this);\n;(function() {\n  this.Runtime = function(ENV) {\n    var applyStyleSheet, currentNode, promo;\n    currentNode = function() {\n      var target;\n      target = document.documentElement;\n      while (target.childNodes.length && target.lastChild.nodeType === 1) {\n        target = target.lastChild;\n      }\n      return target.parentNode;\n    };\n    applyStyleSheet = function(root) {\n      var styleClass, styleContent, styleNode, _ref;\n      styleClass = \"primary\";\n      if (styleContent = (_ref = ENV.distribution[\"style.css\"]) != null ? _ref.content : void 0) {\n        styleNode = document.createElement(\"style\");\n        styleNode.innerHTML = styleContent;\n        styleNode.className = styleClass;\n        return root.appendChild(styleNode);\n      }\n    };\n    promo = function() {\n      return console.log(\"%c You should meet my creator \" + ENV.progenitor.url, \"background: #000; \\ncolor: white; \\nfont-size: 2em;\\nline-height: 2em;\\npadding: 40px 100px;\\nmargin-bottom: 1em;\\ntext-shadow: \\n  0 0 0.05em #fff, \\n  0 0 0.1em #fff, \\n  0 0 0.15em #fff, \\n  0 0 0.2em #ff00de, \\n  0 0 0.35em #ff00de, \\n  0 0 0.4em #ff00de, \\n  0 0 0.5em #ff00de, \\n  0 0 0.75em #ff00de;'\");\n    };\n    return {\n      boot: function() {\n        var root;\n        root = currentNode();\n        applyStyleSheet(root);\n        promo();\n        return root;\n      }\n    };\n  };\n\n}).call(this);\n;(function() {\n  this.TextEditor = function(I) {\n    var editor, el, reset, self, updating;\n    Object.reverseMerge(I, {\n      mode: \"coffee\",\n      text: \"\"\n    });\n    self = Model(I);\n    el = I.el;\n    delete I.el;\n    editor = ace.edit(el);\n    editor.setFontSize(\"16px\");\n    editor.setTheme(\"ace/theme/chrome\");\n    editor.getSession().setUseWorker(false);\n    editor.getSession().setMode(\"ace/mode/\" + I.mode);\n    editor.getSession().setUseSoftTabs(true);\n    editor.getSession().setTabSize(2);\n    reset = function(content) {\n      if (content == null) {\n        content = \"\";\n      }\n      editor.setValue(content);\n      editor.moveCursorTo(0, 0);\n      return editor.session.selection.clearSelection();\n    };\n    reset(I.text);\n    self.attrObservable(\"text\");\n    updating = false;\n    editor.getSession().on('change', function() {\n      updating = true;\n      self.text(editor.getValue());\n      return updating = false;\n    });\n    self.text.observe(function(newValue) {\n      if (!updating) {\n        return reset(newValue);\n      }\n    });\n    self.extend({\n      el: el,\n      editor: editor,\n      reset: reset\n    });\n    return self;\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/actions\"] = function(data) {\n    return (function() {\n      var actions, __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"actions\");\n      actions = this.actions;\n      Object.keys(actions).each(function(name) {\n        __element = document.createElement(\"button\");\n        __push(__element);\n        __element = document.createTextNode('');\n        __text(__element, name.titleize());\n        __push(__element);\n        __pop();\n        __on(\"click\", function() {\n          return actions[name]();\n        });\n        return __pop();\n      });\n      __element = document.createTextNode('');\n      __text(__element, HAMLjr.render(\"issues\", this.issues));\n      __push(__element);\n      __pop();\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/editor\"] = function(data) {\n    return (function() {\n      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"main\");\n      __element = document.createTextNode('');\n      __text(__element, HAMLjr.render(\"actions\", {\n        actions: this.actions,\n        issues: this.issues\n      }));\n      __push(__element);\n      __pop();\n      __element = document.createTextNode('');\n      __text(__element, HAMLjr.render(\"filetree\", this.filetree));\n      __push(__element);\n      __pop();\n      __element = document.createTextNode('');\n      __text(__element, HAMLjr.render(\"notices\", this));\n      __push(__element);\n      __pop();\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/filetree\"] = function(data) {\n    return (function() {\n      var files, selectedFile, __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"ul\");\n      __push(__element);\n      __attribute(__element, \"class\", \"filetree\");\n      selectedFile = this.selectedFile;\n      files = this.files;\n      __each(files, function(file) {\n        __element = document.createElement(\"li\");\n        __push(__element);\n        __element = document.createTextNode('');\n        __text(__element, file.displayName);\n        __push(__element);\n        __pop();\n        __on(\"click\", function(e) {\n          if ($(e.target).is('li')) {\n            return selectedFile(file);\n          }\n        });\n        __element = document.createElement(\"div\");\n        __push(__element);\n        __attribute(__element, \"class\", \"delete\");\n        __on(\"click\", function() {\n          if (confirm(\"Delete \" + (file.path()) + \"?\")) {\n            return files.remove(file);\n          }\n        });\n        __element = document.createTextNode('');\n        __text(__element, \"X\\n\");\n        __push(__element);\n        __pop();\n        __pop();\n        return __pop();\n      });\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/github_status\"] = function(data) {\n    return (function() {\n      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"status\");\n      if (this.request && this.request.getAllResponseHeaders().match(/X-RateLimit-Limit: 5000/)) {\n        __element = document.createTextNode('');\n        __text(__element, \"Authenticated Scopes:\\n\");\n        __push(__element);\n        __pop();\n        __element = document.createTextNode('');\n        __text(__element, this.request.getResponseHeader(\"X-OAuth-Scopes\"));\n        __push(__element);\n        __pop();\n        __element = document.createElement(\"br\");\n        __push(__element);\n        __pop();\n        __element = document.createTextNode('');\n        __text(__element, \"Rate Limit Remaining:\\n\");\n        __push(__element);\n        __pop();\n        __element = document.createTextNode('');\n        __text(__element, this.request.getResponseHeader(\"X-RateLimit-Remaining\"));\n        __push(__element);\n        __pop();\n        __element = document.createTextNode('');\n        __text(__element, \" / 5000\");\n        __push(__element);\n        __pop();\n      } else {\n        __element = document.createElement(\"button\");\n        __push(__element);\n        __element = document.createTextNode('');\n        __text(__element, \"Auth\\n\");\n        __push(__element);\n        __pop();\n        __on(\"click\", Gistquire.auth);\n        __pop();\n      }\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/notices\"] = function(data) {\n    return (function() {\n      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"console-wrap\");\n      __element = document.createElement(\"pre\");\n      __push(__element);\n      __attribute(__element, \"class\", \"errors\");\n      __each(this.errors, function(error) {\n        __element = document.createTextNode('');\n        __text(__element, error);\n        __push(__element);\n        return __pop();\n      });\n      __pop();\n      __element = document.createElement(\"pre\");\n      __push(__element);\n      __attribute(__element, \"class\", \"notices\");\n      __each(this.notices, function(notice) {\n        __element = document.createTextNode('');\n        __text(__element, notice);\n        __push(__element);\n        return __pop();\n      });\n      __pop();\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var _base;\n\n  this.HAMLjr || (this.HAMLjr = {});\n\n  (_base = this.HAMLjr).templates || (_base.templates = {});\n\n  this.HAMLjr.templates[\"templates/text_editor\"] = function(data) {\n    return (function() {\n      var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;\n      _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;\n      __push(document.createDocumentFragment());\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"editor-wrap\");\n      __element = document.createElement(\"div\");\n      __push(__element);\n      __attribute(__element, \"class\", \"editor\");\n      __pop();\n      __pop();\n      return __pop();\n    }).call(data);\n  };\n\n}).call(this);\n;(function() {\n  var runningWindows;\n\n  runningWindows = [];\n\n  this.Runner = {\n    run: function(_arg) {\n      var config, html, sandbox;\n      config = _arg.config, html = _arg.html;\n      sandbox = Sandbox({\n        width: config.width,\n        height: config.height\n      });\n      sandbox.document.open();\n      sandbox.document.write(html);\n      sandbox.document.close();\n      return runningWindows.push(sandbox);\n    },\n    hotReloadCSS: function(css) {\n      runningWindows = runningWindows.partition(function(window) {\n        var styleClass;\n        if (window.closed) {\n          return false;\n        }\n        styleClass = \"primary\";\n        $(window.document).find(\"style.\" + styleClass).html(css);\n        return true;\n      });\n      return console.log(css);\n    }\n  };\n\n}).call(this);\n;;(function() {\n  describe(\"editor\", function() {\n    return it(\"should test things\", function() {\n      return assert(true);\n    });\n  });\n\n}).call(this);",
      "type": "blob"
    }
  },
  "repository": {
    "full_name": "STRd6/editor",
    "branch": "master"
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  }
}));