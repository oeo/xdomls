```

db    db d8888b. db      .d8888.
`8b  d8' 88  `8D 88      88'  YP
 `8bd8'  88   88 88      `8bo.
 .dPYb.  88   88 88        `Y8b.
.8P  Y8. 88  .8D 88booo. db   8D
YP    YP Y8888D' Y88888P `8888Y'

```

*xdomls* is a cross-domain localstorage implementation that uses `postMessage` to communicate with a child frame to achieve consistent
storage across domains.

## usage:
- upload `iframe/build/index.html` to a common domain or public s3 bucket

## install via npm
```
npm install xdomls
```

use in bundled apps
```javascript
XDLS = require('xdomls')
```

or simply include `client/build/module.min.js` in your browser which exports `window.XDLS`

```javascript
var iframe_url = 'http://yourcdn.com/iframe.html'

// init client, this will automatically wait for `document.readyState`
// to either be 'interactive' or 'complete' and then append the iframe
var client = new XDLS(iframe_url);

// not ready, will return e
client.ping(function(e,r){
  console.log(e)
})

// wait for ready
client.ready(function(){

  // client will automatically be given a persistent uuid available in `client.session.uuid`
  console.log('Client ready, session details:',client.session)

  // ping the frame
  client.ping(function(e,r){
    console.log('`ping()` result:',r)
  })

  // set a value that expires in 30 seconds (doesn't require callback)
  client.set('hello-temp','temp-value',30);

  // delete a value (doesn't require callback)
  client.del('hello')

  // get all values
  client.get_all(function(e,r){
    console.log('`get_all()` result:',r)
  })

})
```

see example usage in `test/example/`

### api
|fn|description|alias|
|-|-|-|
|`setItem(key,val,[expires_secs=0],[cb)`|set item into cross-domain storage, allows for optional expiration time|`set`|
|`getItem(key,cb)`|retrieve item from cross-domain storage|`get`|
|`get_all([simple=true],cb)`|retrieve all items from cross-domain storage|none|
|`removeItem(key,[cb])`|remove item from cross-domain storage|`del`|
|`clear([cb])`|clears all items from storage including the user's unique id|none|
|`sync([cb])`|syncs all items from frame-storage into the top documents localStorage object|none|

`client.session` is available containing the user's unique id and unix time of original session creation always after `client.ready` has returned.

#### @todo:
- [ ] cookie fallbacks
- [ ] hash location parsing fallback for devices without `postMessage`
- [ ] option to automatically sync to iframe when localStorage is changed on the parent
- [ ] remove dependancy on lodash, reduce size

