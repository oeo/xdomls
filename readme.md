![xdomls](https://raw.githubusercontent.com/tosadvisor/xdomls/master/readme.svg?raw=true&sanitize=true "xdomls")

`xdomls` is a localStorage augmentation that uses `postMessage` to communicate with a child frame to achieve persistent
storage across domains. it has the ability to automatically sync between the cross browser frame and the top `localStorage` object
without any configuration, making native use of `localStorage` across different domains frictionless.

## install
```
npm install xdomls
```

- upload `iframe/build/index.html` to a common domain or public s3 bucket

### use in bundled apps
```javascript
XDOMLS = require('xdomls')
```

### use in browser
or simply include `client/build/module.min.js` in your browser which exposes `window.XDOMLS`

```javascript
// simple usage
var iframe_url = 'http://yourcdn.com/iframe.html'

// init client, this will automatically wait for `document.readyState`
// to either be 'interactive' or 'complete' and then append the iframe
var client = new XDOMLS(iframe_url);

client.ready(function(){
  client.sync()

  // now simply set an item into normal `localStorage` and it will automatically
  // sync into cross-domain frame storage.

  // similarly, if you set an item into the cross domain storage directly it will automatically
  // propogate up to your top level `localStorage` object.

  // note: if you set an item in cross domain storage with an expiration, it will also be removed
  // automatically in your `localStorage` object as well as it expires (and without refreshing!)
})
```

```javascript
// additional functionality (can be used with or without sync)
client.ready(function(){

  // client will automatically be assigned a persistent unique identifier
  console.log('Client ready, session details:',client.SESSION)

  // set a persistent value into the frame
  client.set('hello-perma','perma-value')

  // set a value that expires in 30s
  client.set('hello-temp','temp-value',30);

  // delete a value
  client.del('hello')

  // get all values from frame
  client.get_all(function(e,r){
    console.log(r)
  })

})
```

```javascript
// instantiation options
new XDOMLS('http://www.taky.com/un/xdomls/iframe/build/index.html',{

  // prefix for all keys within the cross browser frame
  prefix: 'tracking'

  // console logging for client
  debug: true,

  // console logging for cross browser frame
  debug_frame: true,

  // shows iframe instead of applying styles to hide it
  show_frame: true,

  // keys to skip auto-syncing for
  sync_ignore_keys: [
    'private-key'
  ],

  // sync interval between window.top and cross browser frame
  sync_polling_ms: 100,

  // cross browser from element id
  frame_id: 'persistent-storage',

})

// defaults
{
  prefix: 'xd'
  debug: false
  debug_frame: false
  show_frame: false
  sync_ignore_keys: []
  sync_polling_ms: 100
  frame_id: '__xdomls'
}
```

see example usage in `test/example/`


## @todo:
- [ ] hash location frame communication fallback (safari7+ circumvent)

## api
|fn|args|description|alias|
|-|-|-|-|
|`set`|`(key,val,[expires_secs=0],[cb])`|set item into cross-domain storage, allows for optional expiration time|`setItem`|
|`get`|`(key,cb)`|retrieve item from cross-domain storage|`getItem`|
|`get_all`|`([simple=true],cb)`|retrieve all items from cross-domain storage|none|
|`del`|`(key,[cb])`|remove item from cross-domain storage|`removeItem`|
|`clear`|`([cb])`|clears all items from xdomls and localStorage (besides the user's session/uuid)|none|
|`get_expired`|`([simple=true],cb)`|retrieve list of any keys expired this session|none|
|`session`|`([refresh=false],[cb])`|get session information, reset session if refresh is true|none|
|`sync`|none|syncs top.localStorage and cross browser storage automatically|none|

