# vim: set expandtab tabstop=2 shiftwidth=2 softtabstop=2
require "@babel/polyfill"

DEBUG = true

log = (x...) -> if DEBUG then try console.log x...

_ = require 'lodash'
{nanoid} = require 'nanoid'

##
module.exports = class Client
  IFRAME: null
  IFRAME_URL: null

  READY: false
  SESSION: null

  constructor: ((@IFRAME_URL) ->

    # setup frame function interfaces
    for x in [
      'set'
      'setItem'
      'get'
      'getItem'
      'get_all'
      'del'
      'removeItem'
      'clear'
    ]
      do (x) =>
        this[x] = (args...) =>
          if typeof _.last(args) is 'function'
            _cb = args.pop()
          @_send {fn:x,args:args ? []}, _cb

    return @
  )

  ready: ((cb) ->
    _create_frame = ((next) =>
      if !document.querySelector('#__xdls')

        addEventListener('message',((e) =>
          data = e.data
          data = JSON.parse(e.data)
          if data?.response?.message is 'rdy'
            @SESSION = @session = data.response.session
            @READY = true
            return next()
        ),false)

        ifr = document.createElement 'iframe'
        ifr.id = '__xdls'
        ifr.src = @IFRAME_URL

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
  sync: ((cb) ->
    await @_send {fn:'get_all',args:[true]}, defer e,r
    if e then return cb e

    if r
      for k,v of r
        if typeof v is 'object'
          v = JSON.stringify(v)
        localStorage[k] = v

    return cb null, _.size(r)
  )

  _send: ((data,cb=null) ->
    if !cb then cb = -> 1

    packet = {
      request: data
    }

    packet.id = request_id = nanoid()

    @IFRAME.contentWindow.postMessage JSON.stringify(packet), '*'

    addEventListener('message',((e) ->
      data = JSON.parse(e.data)
      if data.id is request_id
        return cb null, data.response
    ),false)
  )


##
if !module.parent
  log 'client loaded', '`window.XDLS`', new Date
  window.XDLS = Client

