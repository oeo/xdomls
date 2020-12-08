# vim: set expandtab tabstop=2 shiftwidth=2 softtabstop=2
require "@babel/polyfill"

DEBUG = false

log = (x...) -> if DEBUG then try console.log x...

emitter = new(require('events'))()

_ = require 'lodash'
nanoid = require 'nanoid'
hash_obj = require 'object-hash'

##
module.exports = class Client
  IFRAME: null
  IFRAME_URL: null

  READY: false
  SESSION: null

  HASH: null
  HASH_WATCHING: false

  options: {
    prefix: 'xd'
    debug: false
    debug_frame: false
    show_frame: false
    sync_ignore_keys: []
    sync_polling_ms: 100
    frame_id: '__xdomls'
  }

  constructor: ((@IFRAME_URL,@options={}) ->
    if @options.debug then DEBUG = 1

    @options.sync_ignore_keys.concat([
      '__uuid'
      '__ctime'
      '__prefix'
    ])

    # setup frame function interfaces
    for x in [
      'set'
      'setItem'
      'get'
      'getItem'
      'get_all'
      'get_expired'
      'del'
      'removeItem'
      'clear'
      'session'
    ]
      do (x) =>
        this[x] = (args...) =>
          if typeof _.last(args) is 'function'
            _cb = args.pop()
          @_send {fn:x,args:args ? []}, _cb

    log 'client options', @options

    return @
  )

  ready: ((cb) ->
    _create_frame = ((next) =>
      if !document.querySelector("#" + @options.frame_id)

        addEventListener('message',((e) =>
          data = e.data
          if typeof e.data == 'string'
            data = JSON.parse(e.data)
            if data?.response?.message is 'rdy'
              @SESSION = data.response.session
              @READY = true

              log 'client rdy', @SESSION

              @_listen_expires()

              return next()
        ),false)

        ifr = document.createElement 'iframe'
        ifr.id = @options.frame_id

        @IFRAME_URL += '?'

        if @options.debug_frame
          @IFRAME_URL += '&debug=1'

        if prefix = @options.prefix
          @IFRAME_URL += '&prefix=' + escape(prefix)

        ifr.src = @IFRAME_URL

        if !@options.show_frame
          ifr.style.visibility = 'none'
          ifr.style.display = 'none'

        @IFRAME = ifr
        document.body.appendChild(ifr)
    )

    if document.readyState in ['interactive','complete']
      _create_frame(cb)
    else
      document.addEventListener 'DOMContentLoaded', ->
        _create_frame(cb)
  )

  ping: ((cb) ->
    return cb new Error 'Not ready' if !@READY
    @_send "ping", cb
  )

  # sync all frame ls data to current scope
  sync_from: ((cb) ->
    return cb new Error 'Not ready' if !@READY

    # get all keys
    await @get_all true, defer e,keys
    if e then return cb e

    ret = {}

    if keys
      for k,v of keys
        if typeof v is 'object'
          v = JSON.stringify(v)

        ret[k] = v
        localStorage[k] = v

    # remove expired keys
    await @get_expired true, defer e,expired_keys
    if e then return cb e

    if expired_keys
      for key in expired_keys
        if localStorage[key]
          log 'client expired', key
          delete localStorage[key]

    return cb null, ret
  )

  sync_to: ((cb) ->
    return cb new Error 'Not ready' if !@READY

    await @get_all true, defer e,exists
    if e then return cb e

    ret = {}

    for k,v of @_normalize_ls()
      continue if k in [
        '__session'
      ]
      continue if k in @options.sync_ignore_keys
      continue if exists[k] and exists[k] is v

      ret[k] = v
      @set(k,v)

    return cb null, ret
  )

  sync: (->
    return cb new Error 'Not ready' if !@READY

    await @sync_from defer e
    if e then console.error(e)

    await @sync_to defer e
    if e then console.error(e)

    _poll_from = (=>
      @sync_from (e) ->
        if e then console.error(e)
    )

    @HASH_WATCHING = true

    _poll_to = (=>
      return if !@HASH_WATCHING

      if !@HASH
        @HASH = @_local_hash()
        return

      if @_local_hash() isnt @HASH
        @HASH = @_local_hash()
        emitter.emit 'LOCAL_CHANGE'
    )

    emitter.on 'LOCAL_CHANGE', ((e) =>
      @HASH_WATCHING = false

      await @sync_to defer e
      if e then console.error(e)

      @HASH = null
      @HASH_WATCHING = true
    )

    setInterval _poll_to, @options.sync_polling_ms
    setInterval _poll_from, @options.sync_polling_ms
  )

  ##
  _send: ((data,cb=null) ->
    if !cb then cb = -> 1

    packet = {
      request: data
    }

    packet.id = request_id = nanoid()

    @IFRAME.contentWindow.postMessage JSON.stringify(packet), '*'

    addEventListener('message',((e) ->
      if typeof e.data == 'string'
        data = JSON.parse(e.data)
        if data.id is request_id
          return cb null, data.response
    ),false)
  )

  _listen_expires: (->
    addEventListener('message',((e) =>
      if typeof e.data == 'string'
        data = JSON.parse(e.data)

        if expired_key = data.response?.expire_key
          log 'client expiring key', expired_key

          @HASH_WATCHING = false

          try delete localStorage[expired_key]

          @HASH = null
          @HASH_WATCHING = true

    ),false)
  )

  _local_hash: (->
    return hash_obj(@_normalize_ls(),{
      ignoreUnknown: true
      respectType: false
    })
  )

  _normalize_ls: ->
    JSON.parse(JSON.stringify(localStorage))


##
if !module.parent
  log 'client loaded', '`window.XDOMLS`', new Date
  window.XDOMLS = Client

