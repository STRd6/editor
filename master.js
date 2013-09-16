(function() {
  var $root, Actions, Builder, File, Filetree, Gistquire, Issue, Issues, Repository, Runner, Runtime, TextEditor, actions, branch, builder, classicError, confirmUnsaved, distribution, errors, files, filetree, fullName, hotReloadCSS, issues, issuesTemplate, notices, notify, owner, repo, repository, repositoryLoaded, rootNode, runtime, templates, _ref, _ref1, _ref2, _ref3,
    __slice = [].slice;

  files = ENV.source, distribution = ENV.distribution;

  window.ENV = ENV;

  global.Sandbox = require('sandbox');

  require("./source/duct_tape");

  require("./source/deferred");

  templates = (HAMLjr.templates || (HAMLjr.templates = {}));

  ["actions", "editor", "filetree", "github_status", "notices", "text_editor"].each(function(name) {
    var template;
    template = require("./templates/" + name);
    if (typeof template === "function") {
      return templates[name] = template;
    }
  });

  Actions = require("./source/actions");

  Builder = require("./source/builder");

  Runner = require("./source/runner");

  Runtime = require("./source/runtime");

  Gistquire = require("./source/gistquire");

  Repository = require("./source/repository");

  Filetree = require("./source/filetree");

  File = require("./source/file");

  TextEditor = require("./source/text_editor");

  classicError = function(request, error, message) {
    debugger;
    notices([]);
    if (request.responseJSON) {
      message = JSON.stringify(request.responseJSON, null, 2);
    } else {
      if (message == null) {
        message = request;
      }
    }
    return errors([message]);
  };

  notify = function(message) {
    notices([message]);
    return errors([]);
  };

  runtime = Runtime(ENV);

  rootNode = runtime.boot();

  try {
    runtime.applyStyleSheet(rootNode, '/style');
  } catch (_error) {}

  $root = $(rootNode);

  Gistquire.onload();

  _ref = ENV.repository, owner = _ref.owner, repo = _ref.repo, branch = _ref.branch, fullName = _ref.full_name;

  fullName || (fullName = "" + owner + "/" + repo);

  repository = Repository({
    url: "repos/" + fullName,
    branch: branch
  });

  errors = Observable([]);

  notices = Observable([]);

  builder = Builder();

  repositoryLoaded = function(repository) {
    issues.repository = repository;
    repository.pullRequests().then(issues.reset);
    return notify("Finished loading!");
  };

  confirmUnsaved = function() {
    return Deferred.ConfirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?");
  };

  _ref1 = require("issues"), (_ref2 = _ref1.models, Issue = _ref2.Issue, Issues = _ref2.Issues), (_ref3 = _ref1.templates, issuesTemplate = _ref3.issues);

  templates["issues"] = issuesTemplate;

  issues = Issues();

  builder.addPostProcessor(function(data) {
    data.repository = {
      full_name: fullName,
      branch: repository.branch()
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
      notify("Saving...");
      return Actions.save({
        repository: repository,
        fileData: filetree.data(),
        builder: builder
      }).then(function() {
        filetree.markSaved();
        return notify("Saved and published!");
      }).fail(function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return errors(args);
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
      return Actions.test({
        builder: builder,
        filetree: filetree
      }).fail(errors);
    },
    new_file: function() {
      var file, name;
      if (name = prompt("File Name", "newfile.coffee")) {
        file = File({
          filename: name,
          content: ""
        });
        filetree.files.push(file);
        return filetree.selectedFile(file);
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
        notify("Loading repo...");
        return Actions.load({
          repository: repository,
          filetree: filetree
        }).then(function() {
          var root;
          repositoryLoaded(repository);
          root = $root.children(".main");
          return root.find(".editor-wrap").remove();
        }).fail(classicError);
      });
    },
    new_feature: function() {
      var title;
      if (title = prompt("Description")) {
        notify("Creating feature branch...");
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
        }).fail(function() {
          return errors(["Error loading " + (repository.url())]);
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
          return hotReloadCSS(file);
        }
      });
    }
  });

  hotReloadCSS = (function(file) {
    var css;
    css = styl(file.content(), {
      whitespace: true
    }).toString();
    return Runner.hotReloadCSS(css, file.path());
  }).debounce(500);

  repositoryLoaded(repository);

  if (issues != null) {
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
  }

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
