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
      __attribute(__element, "class", "console-wrap");
      __element = document.createElement("pre");
      __push(__element);
      __attribute(__element, "class", "errors");
      __each(this.errors, function(error) {
        __element = document.createTextNode('');
        __text(__element, error.stack);
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
      __text(__element, HAMLjr.templates.errors(this));
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
          } else if (name.extension() === "js") {
            if (name === "main.js") {
              return main = source;
            } else if (name === "build.js") {

            } else {
              return models.push(source);
            }
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
  this.Gistquire = {
    accessToken: null,
    auth: function() {
      var url;
      url = 'https://github.com/login/oauth/authorize?client_id=bc46af967c926ba4ff87&scope=gist,user:email';
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
    update: function(id, _arg) {
      var data, error, success, url;
      data = _arg.data, success = _arg.success, error = _arg.error;
      url = "https://api.github.com/gists/" + id;
      if (this.accessToken) {
        url += "?access_token=" + this.accessToken;
      }
      return $.ajax({
        url: url,
        type: "PATCH",
        dataType: 'json',
        data: JSON.stringify(data),
        success: success,
        error: error
      });
    },
    create: function(data, callback) {
      var url;
      url = "https://api.github.com/gists";
      if (this.accessToken) {
        url += "?access_token=" + this.accessToken;
      }
      return $.ajax({
        url: url,
        type: "POST",
        dataType: 'json',
        data: JSON.stringify(data),
        success: callback
      });
    },
    get: function(id, callback) {
      return this.api("gists/" + id, {
        success: callback
      });
    },
    api: function(path, options) {
      var data;
      if (options == null) {
        options = {};
      }
      if (this.accessToken) {
        data = {
          access_token: this.accessToken
        };
      } else {
        data = {};
      }
      options = Object.extend({
        url: "https://api.github.com/" + path,
        type: "GET",
        data: data,
        dataType: 'json'
      }, options);
      return $.ajax(options);
    }
  };

}).call(this);

(function() {
  this.Sandbox = function(_arg) {
    var height, methods, name, sandbox, width, _ref;
    _ref = _arg != null ? _arg : {}, name = _ref.name, width = _ref.width, height = _ref.height, methods = _ref.methods;
    if (name == null) {
      name = "sandbox" + new Date;
    }
    if (width == null) {
      width = 800;
    }
    if (height == null) {
      height = 600;
    }
    if (methods == null) {
      methods = {};
    }
    sandbox = window.open("", name, "width=" + width + ",height=" + height);
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

// Github.js 0.8.0
// (c) 2013 Michael Aufreiter, Development Seed
// Github.js is freely distributable under the MIT license.
// For all details and documentation:
// http://substance.io/michael/github

(function() {

  // Initial Setup
  // -------------

  var XMLHttpRequest, Base64, _;
  if (typeof exports !== 'undefined') {
      XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
      _ = require('underscore');
      Base64 = require('./lib/base64.js');
  }else{
      _ = window._;
      Base64 = window.Base64;
  }
  //prefer native XMLHttpRequest always
  if (typeof window !== 'undefined' && typeof window.XMLHttpRequest !== 'undefined'){
      XMLHttpRequest = window.XMLHttpRequest;
  }

  
  var API_URL = 'https://api.github.com';

  var Github = function(options) {

    // HTTP Request Abstraction
    // =======
    // 
    // I'm not proud of this and neither should you be if you were responsible for the XMLHttpRequest spec.

    function _request(method, path, data, cb, raw) {
      function getURL() {
        var url = API_URL + path;
        return url + ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime();
      }

      var xhr = new XMLHttpRequest();
      if (!raw) {xhr.dataType = "json";}

      xhr.open(method, getURL());
      xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
          if (this.status >= 200 && this.status < 300 || this.status === 304) {
            cb(null, raw ? this.responseText : this.responseText ? JSON.parse(this.responseText) : true);
          } else {
            cb({request: this, error: this.status});
          }
        }
      };
      xhr.setRequestHeader('Accept','application/vnd.github.raw');
      xhr.setRequestHeader('Content-Type','application/json');
      if (
         (options.auth == 'oauth' && options.token) ||
         (options.auth == 'basic' && options.username && options.password)
         ) {
           xhr.setRequestHeader('Authorization',options.auth == 'oauth'
             ? 'token '+ options.token
             : 'Basic ' + Base64.encode(options.username + ':' + options.password)
           );
         }
      data ? xhr.send(JSON.stringify(data)) : xhr.send();
    }



    // User API
    // =======

    Github.User = function() {
      this.repos = function(cb) {
        _request("GET", "/user/repos?type=all&per_page=1000&sort=updated", null, function(err, res) {
          cb(err, res);
        });
      };

      // List user organizations
      // -------

      this.orgs = function(cb) {
        _request("GET", "/user/orgs", null, function(err, res) {
          cb(err, res);
        });
      };

      // List authenticated user's gists
      // -------

      this.gists = function(cb) {
        _request("GET", "/gists", null, function(err, res) {
          cb(err,res);
        });
      };

      // Show user information
      // -------

      this.show = function(username, cb) {
        var command = username ? "/users/"+username : "/user";

        _request("GET", command, null, function(err, res) {
          cb(err, res);
        });
      };

      // List user repositories
      // -------

      this.userRepos = function(username, cb) {
        _request("GET", "/users/"+username+"/repos?type=all&per_page=1000&sort=updated", null, function(err, res) {
          cb(err, res);
        });
      };

      // List a user's gists
      // -------

      this.userGists = function(username, cb) {
        _request("GET", "/users/"+username+"/gists", null, function(err, res) {
          cb(err,res);
        });
      };

      // List organization repositories
      // -------

      this.orgRepos = function(orgname, cb) {
        _request("GET", "/orgs/"+orgname+"/repos?type=all&per_page=1000&sort=updated&direction=desc", null, function(err, res) {
          cb(err, res);
        });
      };

      // Follow user
      // -------

      this.follow = function(username, cb) {
        _request("PUT", "/user/following/"+username, null, function(err, res) {
          cb(err, res);
        });
      };

      // Unfollow user
      // -------

      this.unfollow = function(username, cb) {
        _request("DELETE", "/user/following/"+username, null, function(err, res) {
          cb(err, res);
        });
      };
    };


    // Repository API
    // =======

    Github.Repository = function(options) {
      var repo = options.name;
      var user = options.user;
      
      var that = this;
      var repoPath = "/repos/" + user + "/" + repo;

      var currentTree = {
        "branch": null,
        "sha": null
      };

      // Uses the cache if branch has not been changed
      // -------

      function updateTree(branch, cb) {
        if (branch === currentTree.branch && currentTree.sha) return cb(null, currentTree.sha);
        that.getRef("heads/"+branch, function(err, sha) {
          currentTree.branch = branch;
          currentTree.sha = sha;
          cb(err, sha);
        });
      }

      // Get a particular reference
      // -------

      this.getRef = function(ref, cb) {
        _request("GET", repoPath + "/git/refs/" + ref, null, function(err, res) {
          if (err) return cb(err);
          cb(null, res.object.sha);
        });
      };

      // Create a new reference
      // --------
      //
      // {
      //   "ref": "refs/heads/my-new-branch-name",
      //   "sha": "827efc6d56897b048c772eb4087f854f46256132"
      // }

      this.createRef = function(options, cb) {
        _request("POST", repoPath + "/git/refs", options, cb);
      };

      // Delete a reference
      // --------
      // 
      // repo.deleteRef('heads/gh-pages')
      // repo.deleteRef('tags/v1.0')

      this.deleteRef = function(ref, cb) {
        _request("DELETE", repoPath + "/git/refs/"+ref, options, cb);
      };

      // List all branches of a repository
      // -------

      this.listBranches = function(cb) {
        _request("GET", repoPath + "/git/refs/heads", null, function(err, heads) {
          if (err) return cb(err);
          cb(null, _.map(heads, function(head) { return _.last(head.ref.split('/')); }));
        });
      };

      // Retrieve the contents of a blob
      // -------

      this.getBlob = function(sha, cb) {
        _request("GET", repoPath + "/git/blobs/" + sha, null, cb, 'raw');
      };

      // For a given file path, get the corresponding sha (blob for files, tree for dirs)
      // -------

      this.getSha = function(branch, path, cb) {
        // Just use head if path is empty
        if (path === "") return that.getRef("heads/"+branch, cb);
        that.getTree(branch+"?recursive=true", function(err, tree) {
          var file = _.select(tree, function(file) {
            return file.path === path;
          })[0];
          cb(null, file ? file.sha : null);
        });
      };

      // Retrieve the tree a commit points to
      // -------

      this.getTree = function(tree, cb) {
        _request("GET", repoPath + "/git/trees/"+tree, null, function(err, res) {
          if (err) return cb(err);
          cb(null, res.tree);
        });
      };

      // Post a new blob object, getting a blob SHA back
      // -------

      this.postBlob = function(content, cb) {
        if (typeof(content) === "string") {
          content = {
            "content": content,
            "encoding": "utf-8"
          };
        }

        _request("POST", repoPath + "/git/blobs", content, function(err, res) {
          if (err) return cb(err);
          cb(null, res.sha);
        });
      };

      // Update an existing tree adding a new blob object getting a tree SHA back
      // -------

      this.updateTree = function(baseTree, path, blob, cb) {
        var data = {
          "base_tree": baseTree,
          "tree": [
            {
              "path": path,
              "mode": "100644",
              "type": "blob",
              "sha": blob
            }
          ]
        };
        _request("POST", repoPath + "/git/trees", data, function(err, res) {
          if (err) return cb(err);
          cb(null, res.sha);
        });
      };

      // Post a new tree object having a file path pointer replaced
      // with a new blob SHA getting a tree SHA back
      // -------

      this.postTree = function(tree, cb) {
        _request("POST", repoPath + "/git/trees", { "tree": tree }, function(err, res) {
          if (err) return cb(err);
          cb(null, res.sha);
        });
      };

      // Create a new commit object with the current commit SHA as the parent
      // and the new tree SHA, getting a commit SHA back
      // -------

      this.commit = function(parent, tree, message, cb) {
        var data = {
          "message": message,
          "author": {
            "name": options.username
          },
          "parents": [
            parent
          ],
          "tree": tree
        };

        _request("POST", repoPath + "/git/commits", data, function(err, res) {
          currentTree.sha = res.sha; // update latest commit
          if (err) return cb(err);
          cb(null, res.sha);
        });
      };

      // Update the reference of your head to point to the new commit SHA
      // -------

      this.updateHead = function(head, commit, cb) {
        _request("PATCH", repoPath + "/git/refs/heads/" + head, { "sha": commit }, function(err, res) {
          cb(err);
        });
      };

      // Show repository information
      // -------

      this.show = function(cb) {
        _request("GET", repoPath, null, cb);
      };

      // Get contents
      // --------

      this.contents = function(branch, path, cb) {
        _request("GET", repoPath + "/contents?ref=" + branch, { path: path }, cb);
      };

      // Fork repository
      // -------

      this.fork = function(cb) {
        _request("POST", repoPath + "/forks", null, cb);
      };

      // Create pull request
      // --------

      this.createPullRequest = function(options, cb) {
        _request("POST", repoPath + "/pulls", options, cb);
      };

      // Read file at given path
      // -------

      this.read = function(branch, path, cb) {
        that.getSha(branch, path, function(err, sha) {
          if (!sha) return cb("not found", null);
          that.getBlob(sha, function(err, content) {
            cb(err, content, sha);
          });
        });
      };

      // Remove a file from the tree
      // -------

      this.remove = function(branch, path, cb) {
        updateTree(branch, function(err, latestCommit) {
          that.getTree(latestCommit+"?recursive=true", function(err, tree) {
            // Update Tree
            var newTree = _.reject(tree, function(ref) { return ref.path === path; });
            _.each(newTree, function(ref) {
              if (ref.type === "tree") delete ref.sha;
            });

            that.postTree(newTree, function(err, rootTree) {
              that.commit(latestCommit, rootTree, 'Deleted '+path , function(err, commit) {
                that.updateHead(branch, commit, function(err) {
                  cb(err);
                });
              });
            });
          });
        });
      };

      // Move a file to a new location
      // -------

      this.move = function(branch, path, newPath, cb) {
        updateTree(branch, function(err, latestCommit) {
          that.getTree(latestCommit+"?recursive=true", function(err, tree) {
            // Update Tree
            _.each(tree, function(ref) {
              if (ref.path === path) ref.path = newPath;
              if (ref.type === "tree") delete ref.sha;
            });

            that.postTree(tree, function(err, rootTree) {
              that.commit(latestCommit, rootTree, 'Deleted '+path , function(err, commit) {
                that.updateHead(branch, commit, function(err) {
                  cb(err);
                });
              });
            });
          });
        });
      };

      // Write file contents to a given branch and path
      // -------

      this.write = function(branch, path, content, message, cb) {
        updateTree(branch, function(err, latestCommit) {
          if (err) return cb(err);
          that.postBlob(content, function(err, blob) {
            if (err) return cb(err);
            that.updateTree(latestCommit, path, blob, function(err, tree) {
              if (err) return cb(err);
              that.commit(latestCommit, tree, message, function(err, commit) {
                if (err) return cb(err);
                that.updateHead(branch, commit, cb);
              });
            });
          });
        });
      };
    };

    // Gists API
    // =======

    Github.Gist = function(options) {
      var id = options.id;
      var gistPath = "/gists/"+id;

      // Read the gist
      // --------

      this.read = function(cb) {
        _request("GET", gistPath, null, function(err, gist) {
          cb(err, gist);
        });
      };

      // Create the gist
      // --------
      // {
      //  "description": "the description for this gist",
      //    "public": true,
      //    "files": {
      //      "file1.txt": {
      //        "content": "String file contents"
      //      }
      //    }
      // }
      
      this.create = function(options, cb){
        _request("POST","/gists", options, cb);
      };

      // Delete the gist
      // --------

      this.delete = function(cb) {
        _request("DELETE", gistPath, null, function(err,res) {
          cb(err,res);
        });
      };

      // Fork a gist
      // --------

      this.fork = function(cb) {
        _request("POST", gistPath+"/fork", null, function(err,res) {
          cb(err,res);
        });
      };

      // Update a gist with the new stuff
      // --------

      this.update = function(options, cb) {
        _request("PATCH", gistPath, options, function(err,res) {
          cb(err,res);
        });
      };
    };

    // Top Level API
    // -------

    this.getRepo = function(user, repo) {
      return new Github.Repository({user: user, name: repo});
    };

    this.getUser = function() {
      return new Github.User();
    };

    this.getGist = function(id) {
      return new Github.Gist({id: id});
    };
  };


  if (typeof exports !== 'undefined') {
    // Github = exports;
    module.exports = Github;
  } else {
    window.Github = Github;
  }
}).call(this);

(function() {
  var $root, actions, builder, errors, filetree, gist, loadId, notices, request, styleContent, _ref, _ref1;

  $root = ENV.$root, gist = ENV.gist, request = ENV.request;

  if (styleContent = (_ref = gist.files["style.css"]) != null ? _ref.content : void 0) {
    $root.append($("<style>", {
      html: styleContent
    }));
  }

  Gistquire.onload();

  builder = Builder();

  errors = Observable([]);

  notices = Observable(["Loaded!"]);

  actions = {
    save: function() {
      return builder.build(filetree.fileData(), {
        success: function(fileData) {
          Gistquire.update(gist.id, {
            data: {
              files: fileData
            },
            success: function() {
              return notices(["Saved!"]);
            },
            error: function() {
              return errors(["Save Failed :("]);
            }
          });
          notices(["Saving..."]);
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
      return builder.build(filetree.fileData(), {
        success: function(fileData) {
          var config, sandbox;
          if (fileData["pixie.json"]) {
            config = JSON.parse(fileData["pixie.json"].content);
          } else {
            config = {};
          }
          sandbox = Sandbox({
            width: config.width,
            height: config.height
          });
          sandbox.document.open();
          $('script.env').each(function() {
            return sandbox.document.write(this.outerHTML);
          });
          sandbox.document.write("<body><script>\n  ENV = {\n    \"$root\": $('body'), \n    \"gist\": {\n      files: " + (JSON.stringify(fileData)) + "\n    }\n  };\n  \n  " + fileData["build.js"].content + ";\n<\/script>");
          sandbox.document.close();
          notices(["Runnnig!"]);
          return errors([]);
        },
        error: errors
      });
    }).debounce(250),
    load: function(e, id) {
      if (id || (id = prompt("Gist Id", gist.id))) {
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
      return file.editor.trigger("show");
    } else {
      root.append(HAMLjr.templates.editor());
      file.editor = root.find(".editor-wrap").last();
      editor = TextEditor({
        text: file.content(),
        el: file.editor.find('.editor').get(0)
      });
      file.editor.on("show", function() {
        file.editor.show();
        return editor.editor.focus();
      });
      return editor.text.observe(function(value) {
        return file.content(value);
      });
    }
  });

  $root.append(HAMLjr.templates.main({
    filetree: filetree,
    actions: actions,
    notices: notices,
    errors: errors
  }));

  Gistquire.api("rate_limit", {
    complete: function(request, status) {
      return $root.append(HAMLjr.templates.github_status({
        request: request
      }));
    }
  });

  if (loadId = (_ref1 = window.location.href.match(/loadId=(\d+)/)) != null ? _ref1[1] : void 0) {
    actions.load(null, loadId);
  }

}).call(this);
