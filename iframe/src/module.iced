# vim: set expandtab tabstop=2 shiftwidth=2 softtabstop=2
require "@babel/polyfill"

log = (x...) -> try console.log x...
_ = require 'lodash'

log 'ifr rdy', new Date

