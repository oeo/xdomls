(function() {
  var log, _,
    __slice = [].slice;

  require("@babel/polyfill");

  log = function() {
    var x;
    x = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    try {
      return console.log.apply(console, x);
    } catch (_error) {}
  };

  _ = require('lodash');

  log('ifr rdy', new Date);

}).call(this);
