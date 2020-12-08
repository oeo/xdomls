(function() {
  var Client, DEBUG, emitter, hash_obj, iced, log, nanoid, _, __iced_k, __iced_k_noop,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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

  DEBUG = false;

  log = function() {
    var x;
    x = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (DEBUG) {
      try {
        return console.log.apply(console, x);
      } catch (_error) {}
    }
  };

  emitter = new (require('events'))();

  _ = require('lodash');

  nanoid = require('nanoid');

  hash_obj = require('object-hash');

  module.exports = Client = (function() {
    var _class;

    function Client() {
      return _class.apply(this, arguments);
    }

    Client.prototype.IFRAME = null;

    Client.prototype.IFRAME_URL = null;

    Client.prototype.READY = false;

    Client.prototype.SESSION = null;

    Client.prototype.HASH = null;

    Client.prototype.HASH_WATCHING = false;

    Client.prototype.options = {
      prefix: 'xd',
      debug: false,
      debug_frame: false,
      show_frame: false,
      sync_ignore_keys: [],
      sync_polling_ms: 100,
      frame_id: '__xdomls'
    };

    _class = (function(IFRAME_URL, options) {
      var x, _fn, _i, _len, _ref;
      this.IFRAME_URL = IFRAME_URL;
      this.options = options != null ? options : {};
      if (this.options.debug) {
        DEBUG = 1;
      }
      this.options.sync_ignore_keys.concat(['__uuid', '__ctime', '__prefix']);
      _ref = ['set', 'setItem', 'get', 'getItem', 'get_all', 'get_expired', 'del', 'removeItem', 'clear', 'session'];
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
      log('client options', this.options);
      return this;
    });

    Client.prototype.ready = (function(cb) {
      var _create_frame, _ref;
      _create_frame = ((function(_this) {
        return function(next) {
          var ifr, prefix;
          if (!document.querySelector("#" + _this.options.frame_id)) {
            addEventListener('message', (function(e) {
              var data, _ref;
              data = e.data;
              if (typeof e.data === 'string') {
                data = JSON.parse(e.data);
                if ((data != null ? (_ref = data.response) != null ? _ref.message : void 0 : void 0) === 'rdy') {
                  _this.SESSION = data.response.session;
                  _this.READY = true;
                  log('client rdy', _this.SESSION);
                  _this._listen_expires();
                  return next();
                }
              }
            }), false);
            ifr = document.createElement('iframe');
            ifr.id = _this.options.frame_id;
            _this.IFRAME_URL += '?';
            if (_this.options.debug_frame) {
              _this.IFRAME_URL += '&debug=1';
            }
            if (prefix = _this.options.prefix) {
              _this.IFRAME_URL += '&prefix=' + escape(prefix);
            }
            ifr.src = _this.IFRAME_URL;
            if (!_this.options.show_frame) {
              ifr.style.visibility = 'none';
              ifr.style.display = 'none';
            }
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

    Client.prototype.sync_from = (function(cb) {
      var e, expired_keys, k, key, keys, ret, v, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      if (!this.READY) {
        return cb(new Error('Not ready'));
      }
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "/home/adam/projects/xdomls/client/src/module.iced",
            funcname: "Client"
          });
          _this.get_all(true, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                e = arguments[0];
                return keys = arguments[1];
              };
            })(),
            lineno: 124
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (e) {
            return cb(e);
          }
          ret = {};
          if (keys) {
            for (k in keys) {
              v = keys[k];
              if (typeof v === 'object') {
                v = JSON.stringify(v);
              }
              ret[k] = v;
              localStorage[k] = v;
            }
          }
          (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "/home/adam/projects/xdomls/client/src/module.iced",
              funcname: "Client"
            });
            _this.get_expired(true, __iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  e = arguments[0];
                  return expired_keys = arguments[1];
                };
              })(),
              lineno: 138
            }));
            __iced_deferrals._fulfill();
          })(function() {
            var _i, _len;
            if (e) {
              return cb(e);
            }
            if (expired_keys) {
              for (_i = 0, _len = expired_keys.length; _i < _len; _i++) {
                key = expired_keys[_i];
                if (localStorage[key]) {
                  log('client expired', key);
                  delete localStorage[key];
                }
              }
            }
            return cb(null, ret);
          });
        };
      })(this));
    });

    Client.prototype.sync_to = (function(cb) {
      var e, exists, k, ret, v, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      if (!this.READY) {
        return cb(new Error('Not ready'));
      }
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "/home/adam/projects/xdomls/client/src/module.iced",
            funcname: "Client"
          });
          _this.get_all(true, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                e = arguments[0];
                return exists = arguments[1];
              };
            })(),
            lineno: 153
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          var _ref;
          if (e) {
            return cb(e);
          }
          ret = {};
          _ref = _this._normalize_ls();
          for (k in _ref) {
            v = _ref[k];
            if (k === '__session') {
              continue;
            }
            if (__indexOf.call(_this.options.sync_ignore_keys, k) >= 0) {
              continue;
            }
            if (exists[k] && exists[k] === v) {
              continue;
            }
            ret[k] = v;
            _this.set(k, v);
          }
          return cb(null, ret);
        };
      })(this));
    });

    Client.prototype.sync = (function() {
      var e, ___iced_passed_deferral, __iced_deferrals, __iced_k, _poll_from, _poll_to;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      if (!this.READY) {
        return cb(new Error('Not ready'));
      }
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "/home/adam/projects/xdomls/client/src/module.iced",
            funcname: "Client"
          });
          _this.sync_from(__iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return e = arguments[0];
              };
            })(),
            lineno: 174
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (e) {
            console.error(e);
          }
          (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "/home/adam/projects/xdomls/client/src/module.iced",
              funcname: "Client"
            });
            _this.sync_to(__iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  return e = arguments[0];
                };
              })(),
              lineno: 177
            }));
            __iced_deferrals._fulfill();
          })(function() {
            if (e) {
              console.error(e);
            }
            _poll_from = (function() {
              return _this.sync_from(function(e) {
                if (e) {
                  return console.error(e);
                }
              });
            });
            _this.HASH_WATCHING = true;
            _poll_to = (function() {
              if (!_this.HASH_WATCHING) {
                return;
              }
              if (!_this.HASH) {
                _this.HASH = _this._local_hash();
                return;
              }
              if (_this._local_hash() !== _this.HASH) {
                _this.HASH = _this._local_hash();
                return emitter.emit('LOCAL_CHANGE');
              }
            });
            emitter.on('LOCAL_CHANGE', (function(e) {
              var ___iced_passed_deferral1, __iced_deferrals, __iced_k;
              __iced_k = __iced_k_noop;
              ___iced_passed_deferral1 = iced.findDeferral(arguments);
              _this.HASH_WATCHING = false;
              (function(__iced_k) {
                __iced_deferrals = new iced.Deferrals(__iced_k, {
                  parent: ___iced_passed_deferral1,
                  filename: "/home/adam/projects/xdomls/client/src/module.iced"
                });
                _this.sync_to(__iced_deferrals.defer({
                  assign_fn: (function() {
                    return function() {
                      return e = arguments[0];
                    };
                  })(),
                  lineno: 202
                }));
                __iced_deferrals._fulfill();
              })(function() {
                if (e) {
                  console.error(e);
                }
                _this.HASH = null;
                return _this.HASH_WATCHING = true;
              });
            }));
            setInterval(_poll_to, _this.options.sync_polling_ms);
            return setInterval(_poll_from, _this.options.sync_polling_ms);
          });
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
        if (typeof e.data === 'string') {
          data = JSON.parse(e.data);
          if (data.id === request_id) {
            return cb(null, data.response);
          }
        }
      }), false);
    });

    Client.prototype._listen_expires = (function() {
      return addEventListener('message', ((function(_this) {
        return function(e) {
          var data, expired_key, _ref;
          if (typeof e.data === 'string') {
            data = JSON.parse(e.data);
            if (expired_key = (_ref = data.response) != null ? _ref.expire_key : void 0) {
              log('client expiring key', expired_key);
              _this.HASH_WATCHING = false;
              try {
                delete localStorage[expired_key];
              } catch (_error) {}
              _this.HASH = null;
              return _this.HASH_WATCHING = true;
            }
          }
        };
      })(this)), false);
    });

    Client.prototype._local_hash = (function() {
      return hash_obj(this._normalize_ls(), {
        ignoreUnknown: true,
        respectType: false
      });
    });

    Client.prototype._normalize_ls = function() {
      return JSON.parse(JSON.stringify(localStorage));
    };

    return Client;

  })();

  if (!module.parent) {
    log('client loaded', '`window.XDOMLS`', new Date);
    window.XDOMLS = Client;
  }

}).call(this);
