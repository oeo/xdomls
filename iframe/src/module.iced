# vim: set expandtab tabstop=2 shiftwidth=2 softtabstop=2
require "@babel/polyfill"

DEBUG = false

log = (x...) -> if DEBUG then try console.log x...
query = require('querystring').parse(location.search.substr(1))

if query.debug then DEBUG = true

_ = require 'lodash'
{nanoid} = require 'nanoid'

##
module.exports = iframe = {
  PREFIX: 'xdomls'
  SESSION: null

  options: {
    expire_polling_ms: 100
  }
}

# custom prefix
if query.prefix then iframe.PREFIX = query.prefix

iframe.ping = (->
  return {pong:@_time()}
)

iframe.set = iframe.setItem = ((key,val,expires_secs=0) ->
  key = [@PREFIX,key].join('~') if !key.startsWith(@PREFIX)

  obj = {
    key: (simple_key = key.substr("#{@PREFIX}~".length))
    key_verbose: key
    ctime: @_time()
  }

  if expires_secs
    obj.etime = obj.ctime + expires_secs

  obj.value = val

  localStorage[key] = JSON.stringify obj

  log "ifr set", {key:simple_key,val}

  return true
)

iframe.get = iframe.getItem = ((key,simple=true) ->
  key = [@PREFIX,key].join('~') if !key.startsWith(@PREFIX)
  if val = localStorage[key]
    val = JSON.parse(val)
    if simple then return val.value
    return val
  return undefined
)

iframe.get_all = ((simple=true) ->
  data = []

  for k,v of localStorage
    if k.startsWith "#{@PREFIX}~"
      data.push JSON.parse(v)

  if !simple then return data

  ret = {}

  for item in data
    ret[item.key] = item.value

  return ret
)

iframe.get_expired = ((simple=true) ->
  @expire()

  return null if !@_expired_keys

  if simple
    return _.map @_expired_keys, 'key'
  else
    return @_expired_keys
)

iframe.del = iframe.removeItem = ((key) ->
  key = [@PREFIX,key].join('~') if !key.startsWith(@PREFIX)
  try delete localStorage[key]

  log "ifr del", (simple_key = key.substr("#{@PREFIX}~".length))

  return true
)

iframe.del_all = iframe.clear = (->
  i = 0
  for k,v of localStorage
    if k.startsWith(@PREFIX)
      continue if k.substr("#{@PREFIX}~".length) is '__session'
      i += 1
      delete localStorage[k]

  log "ifr clear", i

  return true
)

iframe.expire = (->
  items = @get_all(false)
  just_expired = []

  for x in items
    if !x.etime then continue

    if @_time() > x.etime
      log "ifr expired key", x.key

      @del x.key
      @_expired_keys.push x
      @_send {expire_key:x.key}

  return true
)

iframe.session = ((refresh=false) ->
  if !@get('__session') or refresh
    @set "__session", (session_obj = {
      uuid: nanoid()
      ctime: @_time()
      prefix: @PREFIX
    })

    @SESSION = session_obj

    log 'ifr new session', session_obj

  return @SESSION = @get('__session')
)

##
iframe._init = (->
  @clear() if query.clear
  @session()

  @expire()

  setInterval((=>
    @expire()
  ),@options.expire_polling_ms)
)

iframe._listen = (->
  addEventListener('message',((e) =>
    try
      data = JSON.parse(e.data)
    catch
      return false
    if (fn = data.request?.fn) and this[fn]
      result = this[fn].apply(@,(data.request?.args ? []))
      return @_send(result,data.id)
  ),false)
)

iframe._send = ((data,request_id=null) ->
  if typeof(data) isnt 'object'
    data = {message:data}

  packet = {
    response: data
  }

  if request_id
    packet.id = request_id

  top.postMessage JSON.stringify(packet), '*'
)

iframe._time = -> Math.round(new Date().getTime()/1000)
iframe._expired_keys = []

##
if !module.parent
  iframe._init()
  iframe._listen()
  iframe._send {
    message: 'rdy'
    session: iframe.SESSION
    prefix: iframe.PREFIX
  }

  log "ifr rdy", iframe.SESSION

