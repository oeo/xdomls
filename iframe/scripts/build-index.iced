_ = require('wegweg')(globals:on,shelljs:on)
log = (x...) -> console.log x...

if !_.exists(build_dir = __dirname + '/../build')
  throw new Error "Build dir doesn't exist #{build_dir}"

if !_.exists(module_file = __dirname + '/../build/module.min.js')
  throw new Error "Compiled module file doesn't exist: #{module_file}"

log 'Rendering /build/index.html'
bulk = _.reads module_file
html = _.reads __dirname + '/../src/index.html'
html = html.split('{{bulk}}').join(bulk)

log 'Writing /../build/index.html'
_.writes __dirname + '/../build/index.html', html

log 'Finished building ../build/index.html'
exit 0

