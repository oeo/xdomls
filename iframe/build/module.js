(function() {
  var DEBUG, iframe, log, nanoid, query, _,
    __slice = [].slice;

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

  query = require('querystring').parse(location.search.substr(1));

  if (query.debug) {
    DEBUG = true;
  }

  _ = require('lodash');

  nanoid = require('nanoid').nanoid;

  module.exports = iframe = {
    PREFIX: 'xdomls',
    SESSION: null,
    options: {
      expire_polling_ms: 100
    }
  };

  if (query.prefix) {
    iframe.PREFIX = query.prefix;
  }

  iframe.ping = (function() {
    return {
      pong: this._time()
    };
  });

  iframe.set = iframe.setItem = (function(key, val, expires_secs) {
    var obj, simple_key;
    if (expires_secs == null) {
      expires_secs = 0;
    }
    if (!key.startsWith(this.PREFIX)) {
      key = [this.PREFIX, key].join('~');
    }
    obj = {
      key: (simple_key = key.substr(("" + this.PREFIX + "~").length)),
      key_verbose: key,
      ctime: this._time()
    };
    if (expires_secs) {
      obj.etime = obj.ctime + expires_secs;
    }
    obj.value = val;
    localStorage[key] = JSON.stringify(obj);
    log("ifr set", {
      key: simple_key,
      val: val
    });
    return true;
  });

  iframe.get = iframe.getItem = (function(key, simple) {
    var val;
    if (simple == null) {
      simple = true;
    }
    if (!key.startsWith(this.PREFIX)) {
      key = [this.PREFIX, key].join('~');
    }
    if (val = localStorage[key]) {
      val = JSON.parse(val);
      if (simple) {
        return val.value;
      }
      return val;
    }
    return void 0;
  });

  iframe.get_all = (function(simple) {
    var data, item, k, ret, v, _i, _len;
    if (simple == null) {
      simple = true;
    }
    data = [];
    for (k in localStorage) {
      v = localStorage[k];
      if (k.startsWith("" + this.PREFIX + "~")) {
        data.push(JSON.parse(v));
      }
    }
    if (!simple) {
      return data;
    }
    ret = {};
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      item = data[_i];
      ret[item.key] = item.value;
    }
    return ret;
  });

  iframe.get_expired = (function(simple) {
    if (simple == null) {
      simple = true;
    }
    this.expire();
    if (!this._expired_keys) {
      return null;
    }
    if (simple) {
      return _.map(this._expired_keys, 'key');
    } else {
      return this._expired_keys;
    }
  });

  iframe.del = iframe.removeItem = (function(key) {
    var simple_key;
    if (!key.startsWith(this.PREFIX)) {
      key = [this.PREFIX, key].join('~');
    }
    try {
      delete localStorage[key];
    } catch (_error) {}
    log("ifr del", (simple_key = key.substr(("" + this.PREFIX + "~").length)));
    return true;
  });

  iframe.del_all = iframe.clear = (function() {
    var i, k, v;
    i = 0;
    for (k in localStorage) {
      v = localStorage[k];
      if (k.startsWith(this.PREFIX)) {
        if (k.substr(("" + this.PREFIX + "~").length) === '__session') {
          continue;
        }
        i += 1;
        delete localStorage[k];
      }
    }
    log("ifr clear", i);
    return true;
  });

  iframe.expire = (function() {
    var items, just_expired, x, _i, _len;
    items = this.get_all(false);
    just_expired = [];
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      x = items[_i];
      if (!x.etime) {
        continue;
      }
      if (this._time() > x.etime) {
        log("ifr expired key", x.key);
        this.del(x.key);
        this._expired_keys.push(x);
        this._send({
          expire_key: x.key
        });
      }
    }
    return true;
  });

  iframe.session = (function(refresh) {
    var session_obj;
    if (refresh == null) {
      refresh = false;
    }
    if (!this.get('__session') || refresh) {
      this.set("__session", (session_obj = {
        uuid: nanoid(),
        ctime: this._time(),
        prefix: this.PREFIX
      }));
      this.SESSION = session_obj;
      log('ifr new session', session_obj);
    }
    return this.SESSION = this.get('__session');
  });

  iframe._init = (function() {
    if (query.clear) {
      this.clear();
    }
    this.session();
    this.expire();
    return setInterval(((function(_this) {
      return function() {
        return _this.expire();
      };
    })(this)), this.options.expire_polling_ms);
  });

  iframe._listen = (function() {
    return addEventListener('message', ((function(_this) {
      return function(e) {
        var data, fn, result, _ref, _ref1, _ref2;
        try {
          data = JSON.parse(e.data);
        } catch (_error) {
          return false;
        }
        if ((fn = (_ref = data.request) != null ? _ref.fn : void 0) && _this[fn]) {
          result = _this[fn].apply(_this, (_ref1 = (_ref2 = data.request) != null ? _ref2.args : void 0) != null ? _ref1 : []);
          return _this._send(result, data.id);
        }
      };
    })(this)), false);
  });

  iframe._send = (function(data, request_id) {
    var packet;
    if (request_id == null) {
      request_id = null;
    }
    if (typeof data !== 'object') {
      data = {
        message: data
      };
    }
    packet = {
      response: data
    };
    if (request_id) {
      packet.id = request_id;
    }
    return top.postMessage(JSON.stringify(packet), '*');
  });

  iframe._time = function() {
    return Math.round(new Date().getTime() / 1000);
  };

  iframe._expired_keys = [];

  if (!module.parent) {
    iframe._init();
    iframe._listen();
    iframe._send({
      message: 'rdy',
      session: iframe.SESSION,
      prefix: iframe.PREFIX
    });
    log("ifr rdy", new Date);
  }

}).call(this);
