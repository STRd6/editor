(function() {
  var $root, Editor, File, Hygiene, Issue, Issues, Packager, Runtime, TextEditor, actions, builder, classicError, closeOpenEditors, confirmUnsaved, editor, errors, files, filetree, filetreeTemplate, hotReloadCSS, issues, issuesTemplate, notifications, notify, readSourceConfig, repository, rootNode, runtime, templates, _base, _ref, _ref1, _ref2, _ref3,
    __slice = [].slice;

  files = PACKAGE.source;

  global.Sandbox = require('sandbox');

  require("./source/duct_tape");

  require("./source/deferred");

  global.PACKAGE = PACKAGE;

  global.github = require("github")(require("./source/github_auth")());

  templates = (HAMLjr.templates || (HAMLjr.templates = {}));

  ["actions", "editor", "github_status", "text_editor", "repo_info"].each(function(name) {
    var template;
    template = require("./templates/" + name);
    if (typeof template === "function") {
      return templates[name] = template;
    }
  });

  Editor = require("./editor");

  TextEditor = require("./source/text_editor");

  editor = Editor();

  builder = editor.builder();

  filetree = editor.filetree();

  _ref = require("filetree"), File = _ref.File, filetreeTemplate = _ref.template;

  templates["filetree"] = filetreeTemplate;

  Hygiene = require("hygiene");

  Runtime = require("runtime");

  Packager = require("packager");

  readSourceConfig = require("./source/util").readSourceConfig;

  notifications = require("notifications")();

  templates.notifications = notifications.template;

  classicError = notifications.classicError, notify = notifications.notify, errors = notifications.errors;

  runtime = Runtime(PACKAGE);

  rootNode = runtime.boot();

  runtime.applyStyleSheet(require('./style'));

  $root = $(rootNode);

  _ref1 = require("issues"), (_ref2 = _ref1.models, Issue = _ref2.Issue, Issues = _ref2.Issues), (_ref3 = _ref1.templates, issuesTemplate = _ref3.issues);

  templates["issues"] = issuesTemplate;

  issues = Issues();

  repository = Observable();

  repository.observe(function(repository) {
    issues.repository = repository;
    repository.pullRequests().then(issues.reset);
    return notify("Loaded repository: " + (repository.full_name()));
  });

  (_base = PACKAGE.repository).url || (_base.url = "repos/" + PACKAGE.repository.full_name);

  repository(github.Repository(PACKAGE.repository));

  confirmUnsaved = function() {
    return Deferred.ConfirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?");
  };

  closeOpenEditors = function() {
    var root;
    root = $root.children(".main");
    return root.find(".editor-wrap").remove();
  };

  actions = {
    save: function() {
      var repositoryInstance;
      notify("Saving...");
      repositoryInstance = repository();
      return editor.save({
        repository: repositoryInstance
      }).then(function() {
        filetree.markSaved();
        return editor.publish({
          repository: repositoryInstance
        });
      }).then(function() {
        return notify("Saved and published!");
      }).fail(function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return errors(args);
      });
    },
    run: function() {
      notify("Running...");
      return editor.run().fail(classicError);
    },
    test: function() {
      notify("Running tests...");
      return editor.test().fail(errors);
    },
    docs: function() {
      var file;
      notify("Running Docs...");
      if (file = prompt("Docs file", "index")) {
        return editor.runDocs({
          file: file
        }).fail(errors);
      }
    },
    new_file: function() {
      var file, name;
      if (name = prompt("File Name", "newfile.coffee")) {
        file = File({
          path: name,
          content: ""
        });
        filetree.files.push(file);
        return filetree.selectedFile(file);
      }
    },
    load_repo: function(skipPrompt) {
      return confirmUnsaved().then(function() {
        var currentRepositoryName, fullName;
        currentRepositoryName = repository().full_name();
        fullName = prompt("Github repo", currentRepositoryName);
        if (fullName) {
          return github.repository(fullName).then(repository);
        } else {
          return Deferred().reject("No repo given");
        }
      }).then(function(repositoryInstance) {
        notify("Loading files...");
        return editor.load({
          repository: repositoryInstance
        }).then(function() {
          closeOpenEditors();
          return notifications.push("Loaded");
        });
      }).fail(classicError);
    },
    new_feature: function() {
      var title;
      if (title = prompt("Description")) {
        notify("Creating feature branch...");
        return repository().createPullRequest({
          title: title
        }).then(function(data) {
          var issue;
          issue = Issue(data);
          issues.issues.push(issue);
          issues.silent = true;
          issues.currentIssue(issue);
          issues.silent = false;
          return notifications.push("Created!");
        }, classicError);
      }
    },
    pull_master: function() {
      return confirmUnsaved().then(function() {
        notify("Merging in default branch...");
        return repository().pullFromBranch();
      }, classicError).then(function() {
        var branchName;
        notifications.push("Merged!");
        branchName = repository().branch();
        notifications.push("\nReloading branch " + branchName + "...");
        return editor.load({
          repository: repository()
        }).then(function() {
          return notifications.push("Loaded!");
        }).fail(function() {
          return classicError("Error loading " + (repository().url()));
        });
      });
    },
    tag_version: function() {
      notify("Building...");
      return editor.build().then(function(pkg) {
        var version;
        version = "v" + (readSourceConfig(pkg).version);
        notify("Tagging version " + version + " ...");
        return repository().createRef("refs/tags/" + version).then(function() {
          return notifications.push("Tagged " + version);
        }).then(function() {
          notifications.push("\nPublishing...");
          pkg.repository.branch = version;
          return repository().publish(Packager.standAlone(pkg), version);
        }).then(function() {
          return notifications.push("Published!");
        });
      }).fail(classicError);
    }
  };

  filetree.load(files);

  filetree.selectedFile.observe(function(file) {
    var root, textEditor;
    root = $root.children(".main");
    root.find(".editor-wrap").hide();
    if (file.editor) {
      return file.editor.trigger("show");
    } else {
      root.append(HAMLjr.render("text_editor"));
      file.editor = root.find(".editor-wrap").last();
      if (file.path().extension() === "md") {
        file.content(Hygiene.clean(file.content()));
      }
      textEditor = TextEditor({
        text: file.content(),
        el: file.editor.find('.editor').get(0),
        mode: file.mode()
      });
      file.editor.on("show", function() {
        file.editor.show();
        return textEditor.editor.focus();
      });
      return textEditor.text.observe(function(value) {
        file.content(value);
        if (file.path().match(/\.styl$/)) {
          return hotReloadCSS(file);
        }
      });
    }
  });

  hotReloadCSS = (function(file) {
    var css;
    try {
      css = styl(file.content(), {
        whitespace: true
      }).toString();
    } catch (_error) {}
    if (css) {
      return Runner.hotReloadCSS(css, file.path());
    }
  }).debounce(100);

  if (issues != null) {
    issues.currentIssue.observe(function(issue) {
      var changeBranch;
      if (issues.silent) {
        return;
      }
      changeBranch = function(branchName) {
        var previousBranch;
        previousBranch = repository().branch();
        return confirmUnsaved().then(function() {
          closeOpenEditors();
          return repository().switchToBranch(branchName).then(function() {
            notifications.push("\nLoading branch " + branchName + "...");
            return editor.load({
              repository: repository()
            }).then(function() {
              return notifications.push("Loaded!");
            });
          });
        }, function() {
          repository.branch(previousBranch);
          return classicError("Error switching to " + branchName + ", still on " + previousBranch);
        });
      };
      if (issue) {
        notify(issue.fullDescription());
        return changeBranch(issue.branchName());
      } else {
        notify("Default branch selected");
        return changeBranch(repository().defaultBranch());
      }
    });
  }

  $root.append(HAMLjr.render("editor", {
    filetree: filetree,
    actions: actions,
    notifications: notifications,
    issues: issues,
    github: github,
    repository: repository
  }));

  window.onbeforeunload = function() {
    if (filetree.hasUnsavedChanges()) {
      return "You have some unsaved changes, if you leave now you will lose your work.";
    }
  };

  builder.addPostProcessor(function(pkg) {
    pkg.repository = repository().toJSON();
    return pkg;
  });

}).call(this);

//# sourceURL=main.coffee