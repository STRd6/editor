(function() {
  var $root, Actions, Builder, File, Filetree, Issue, Issues, Runner, Runtime, TextEditor, actions, builder, classicError, closeOpenEditors, confirmUnsaved, errors, files, filetree, github, hotReloadCSS, issues, issuesTemplate, notifications, notify, readSourceConfig, repository, rootNode, runtime, templates, _base, _ref, _ref1, _ref2,
    __slice = [].slice;

  files = PACKAGE.source;

  global.Sandbox = require('sandbox');

  require("./source/duct_tape");

  require("./source/deferred");

  github = require("github")(require("./source/github_auth")());

  templates = (HAMLjr.templates || (HAMLjr.templates = {}));

  ["actions", "editor", "filetree", "github_status", "text_editor", "repo_info"].each(function(name) {
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

  Filetree = require("./source/filetree");

  File = require("./source/file");

  TextEditor = require("./source/text_editor");

  readSourceConfig = require("./source/util").readSourceConfig;

  notifications = require("notifications")();

  templates.notifications = notifications.template;

  classicError = notifications.classicError, notify = notifications.notify, errors = notifications.errors;

  runtime = Runtime(PACKAGE);

  rootNode = runtime.boot();

  try {
    runtime.applyStyleSheet(rootNode, '/style');
  } catch (_error) {}

  $root = $(rootNode);

  _ref = require("issues"), (_ref1 = _ref.models, Issue = _ref1.Issue, Issues = _ref1.Issues), (_ref2 = _ref.templates, issuesTemplate = _ref2.issues);

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

  builder = Builder();

  confirmUnsaved = function() {
    return Deferred.ConfirmIf(filetree.hasUnsavedChanges(), "You will lose unsaved changes in your current branch, continue?");
  };

  builder.addPostProcessor(function(pkg) {
    pkg.repository = repository().toJSON();
    return pkg;
  });

  builder.addPostProcessor(function(pkg) {
    pkg.progenitor = {
      url: "http://strd6.github.io/editor/"
    };
    return pkg;
  });

  closeOpenEditors = function() {
    var root;
    root = $root.children(".main");
    return root.find(".editor-wrap").remove();
  };

  actions = {
    save: function() {
      notify("Saving...");
      return Actions.save({
        repository: repository(),
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
        return Actions.load({
          repository: repositoryInstance,
          filetree: filetree
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
        return Actions.load({
          repository: repository(),
          filetree: filetree
        }).then(function() {
          return notifications.push("Loaded!");
        }).fail(function() {
          return classicError("Error loading " + (repository().url()));
        });
      });
    },
    tag_version: function() {
      notify("Building...");
      return builder.build(filetree.data()).then(function(pkg) {
        var version;
        version = "v" + (readSourceConfig(pkg).version);
        notify("Tagging version " + version + " ...");
        return repository().createRef("refs/tags/" + version).then(function() {
          return notifications.push("Tagged " + version);
        }).then(function() {
          notifications.push("\nPublishing...");
          return repository().publish(packager.standAlone(pkg), version);
        }).then(function() {
          return notifications.push("Published!");
        });
      }).fail(classicError);
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
            return Actions.load({
              repository: repository(),
              filetree: filetree
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

}).call(this);
