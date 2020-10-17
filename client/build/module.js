(function() {
  var Client, DEBUG, iced, log, nanoid, _, __iced_k, __iced_k_noop,
    __slice = [].slice;

  iced = {
    Deferrals: (function() {
      function _Class(_arg) {
        this.continuation = _arg;
        this.count = 1;
        this.ret = null;
      }

      _Class.prototype._fulfill = function() {
        if (!--this.count) {
          return this.continuation(this.ret);
        }
      };

      _Class.prototype.defer = function(defer_params) {
        ++this.count;
        return (function(_this) {
          return function() {
            var inner_params, _ref;
            inner_params = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            if (defer_params != null) {
              if ((_ref = defer_params.assign_fn) != null) {
                _ref.apply(null, inner_params);
              }
            }
            return _this._fulfill();
          };
        })(this);
      };

      return _Class;

    })(),
    findDeferral: function() {
      return null;
    },
    trampoline: function(_fn) {
      return _fn();
    }
  };
  __iced_k = __iced_k_noop = function() {};

  require("@babel/polyfill");

  DEBUG = true;

  log = function() {
    var x;
    x = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (DEBUG) {
      try {
        return console.log.apply(console, x);
      } catch (_error) {}
    }
  };

  _ = require('lodash');

  nanoid = require('nanoid').nanoid;

  module.exports = Client = (function() {
    var _class;

    function Client() {
      return _class.apply(this, arguments);
    }

    Client.prototype.IFRAME = null;

    Client.prototype.IFRAME_URL = null;

    Client.prototype.READY = false;

    Client.prototype.SESSION = null;

    _class = (function(IFRAME_URL) {
      var x, _fn, _i, _len, _ref;
      this.IFRAME_URL = IFRAME_URL;
      _ref = ['set', 'setItem', 'get', 'getItem', 'get_all', 'del', 'removeItem', 'clear'];
      _fn = (function(_this) {
        return function(x) {
          return _this[x] = function() {
            var args, _cb;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            if (typeof _.last(args) === 'function') {
              _cb = args.pop();
            }
            return _this._send({
              fn: x,
              args: args != null ? args : []
            }, _cb);
          };
        };
      })(this);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        x = _ref[_i];
        _fn(x);
      }
      return this;
    });

    Client.prototype.ready = (function(cb) {
      var _create_frame, _ref;
      _create_frame = ((function(_this) {
        return function(next) {
          var ifr;
          if (!document.querySelector('#__xdls')) {
            addEventListener('message', (function(e) {
              var data, _ref;
              data = e.data;
              data = JSON.parse(e.data);
              if ((data != null ? (_ref = data.response) != null ? _ref.message : void 0 : void 0) === 'rdy') {
                _this.SESSION = _this.session = data.response.session;
                _this.READY = true;
                return next();
              }
            }), false);
            ifr = document.createElement('iframe');
            ifr.id = '__xdls';
            ifr.src = _this.IFRAME_URL;
            ifr.style.visibility = 'none';
            ifr.style.display = 'none';
            _this.IFRAME = ifr;
            return document.body.appendChild(ifr);
          }
        };
      })(this));
      if ((_ref = document.readyState) === 'interactive' || _ref === 'complete') {
        return _create_frame(cb);
      } else {
        return document.addEventListener('DOMContentLoaded', function() {
          return _create_frame(cb);
        });
      }
    });

    Client.prototype.ping = (function(cb) {
      if (!this.READY) {
        return cb(new Error('Not ready'));
      }
      return this._send("ping", cb);
    });

    Client.prototype.sync = (function(cb) {
      var e, k, r, v, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "/home/taky/www/un/tmp/xdomls/client/src/module.iced",
            funcname: "Client"
          });
          _this._send({
            fn: 'get_all',
            args: [true]
          }, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                e = arguments[0];
                return r = arguments[1];
              };
            })(),
            lineno: 78
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (e) {
            return cb(e);
          }
          if (r) {
            for (k in r) {
              v = r[k];
              if (typeof v === 'object') {
                v = JSON.stringify(v);
              }
              localStorage[k] = v;
            }
          }
          return cb(null, _.size(r));
        };
      })(this));
    });

    Client.prototype._send = (function(data, cb) {
      var packet, request_id;
      if (cb == null) {
        cb = null;
      }
      if (!cb) {
        cb = function() {
          return 1;
        };
      }
      packet = {
        request: data
      };
      packet.id = request_id = nanoid();
      this.IFRAME.contentWindow.postMessage(JSON.stringify(packet), '*');
      return addEventListener('message', (function(e) {
        data = JSON.parse(e.data);
        if (data.id === request_id) {
          return cb(null, data.response);
        }
      }), false);
    });

    return Client;

  })();

  if (!module.parent) {
    log('client loaded', '`window.XDLS`', new Date);
    window.XDLS = Client;
  }

}).call(this);
