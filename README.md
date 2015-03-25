meteor edgee:fastly
===================

Serves your meteor app through the [Fastly CDN](http://fastly.com)

## Install

```bash
meteor add edgee:fastly
```

## Benefits

This package caches your apps' static and dynamic resources on datacenters
accross the world using the Fastly CDN to maximise response time of your app
as well as reduce greatly your server load.

In typical Meteor app the client side code base can exceed 1MB for which a
nodejs http server is not best suited to serve it. By caching it on a CDN that
burden is significantly reduced.

## Setup

### Websockets / DDP
On deployment run the app with the `DDP_DEFAULT_CONNECTION_URL` set to the back
end URL so that meteor will bypass the CDN for DDP connections (websockets):

```bash
# Example:
export DDP_DEFAULT_CONNECTION_URL=//my-meteor-app.herokuapp.com
```

### Purge Cache on Update

Purge cache whenever you push a new release of your App:

```JavaScript
//Instantiate the fastly client:
var fastly = new Fastly(Meteor.settings.fastly.apiKey);

//Automatically purge cache for old app versions:
fastly.autoupdate(Meteor.settings.fastly.serviceId);
```

### Auto-Configure Fastly Service with domain and SSL

If you don't want to configure your fastly instance manually you can do use:

```JavaScript
fastly.configure(Meteor.settings.fastly.serviceId, options);
```

Options is optional and takes following keys:

`forceSSL`: Boolean if ssl is forced for the client and backend connection.
default value is false unless the "force-ssl" package is enabled.

`httpsPort`: Port at which https runs on the backend. Default is "443".

`domain`: The domain that the CDN is to use. Default is `ROOT_URL`.

`backendUrl`: The url at which meteor is hosted. The default is
`process.env.DDP_DEFAULT_CONNECTION_URL`.

`requestSettingsName`: Name of request Settings set to create.
The default is `"Default"`.

If you were to skip this step then your meteor app will keep refreshing the
client until the CDN cache is invalided after an update.

## Fastly Client

The package provides the [node client for fastly](https://github.com/thisandagain/fastly).

The entire api of that client has been decorated to allow synchronous runs:

Asynchronous run:

```JavaScript
var fastly = new Fastly('yourapikey');

fastly.request('GET', '/content/edge_check?url=mysite.com/foo', function (err, obj) {
    if (err) return console.dir(err);   // Oh no!
    console.dir(obj);                   // Response body from the fastly API
});
```

Synchronous run:

```JavaScript
var fastly = new Fastly('yourapikey');

// (throws error on failure)
var obj = fastly.request('GET', '/content/edge_check?url=mysite.com/foo');

console.dir(obj); // Response body from the fastly API
```

## Fast-Render

This package works well with
[meteorhacks:fast-render](https://atmospherejs.com/meteorhacks/fast-render).

Fast render publishes data directly to the boilerplate, which in turn will be
cached on the Fastly CDN. That means that visitors will see content even before
the Mongo Database is ever hit.

However at this point this package does will not automatically invalidate the
cache for when the data published by fast-render is updated. Normally this is
not a problem, as the content will then be updated once the DDP connection is
established.

By default cache will expire after 1 hour when fast-render is enabled.

## Cache-Control

By default the package sends out the following header for all html pages, when
`autoupdate()` is applied:

```
Cache-Control: public, max-age=86400
```

This tells fastly to keep the page in cache for 24 hours.

If fast-render is enabled, that default is automatically reduced to 1 hour.

You can change it age by providing a second argument to the `autoupdate`
function:

```JavaScript
fastly.autoupdate(yourFastlyServiceId, 5*3600); //cache for 5 hours
```

In a more advanced setup where you want to have different cache-control headers,
you can disble this package from serving the header by setting it to null:

```JavaScript
fastly.autoupdate(yourFastlyServiceId, null); //Do not send cache-control headers
```

Now you can use add your custom headers like this:

```JavaScript
WebApp.connectHandlers.use("/someurl", function (request, response, next) {
   //Tell the CDN to not cache this page (proxy it instead)
   res.setHeader("Cache-Control", "no-store");
   next();
});
```

You could also use a server-side router such as
[meteorhacks:picker](https://atmospherejs.com/meteorhacks/picker).
