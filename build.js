$("body").append((function(data) {
  return (function() {
    var __attribute, __each, __element, __filter, __on, __pop, __push, __render, __text, __with, _ref;
    _ref = HAMLjr.Runtime(this), __push = _ref.__push, __pop = _ref.__pop, __attribute = _ref.__attribute, __filter = _ref.__filter, __text = _ref.__text, __on = _ref.__on, __each = _ref.__each, __with = _ref.__with, __render = _ref.__render;
    __push(document.createDocumentFragment());
    __element = document.createElement("textarea");
    __push(__element);
    __pop();
    __element = document.createElement("button");
    __push(__element);
    __on("click", function() {
      __element = document.createTextNode('');
      __text(__element, "debugger\n");
      __push(__element);
      return __pop();
    });
    __pop();
    return __pop();
  }).call(data);
})());
