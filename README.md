# osm-updates

A simple web sockets-enabled map, to show recent submissions to OpenStreetMap. Made with [Node.js](https://nodejs.org/en/), [Socket.io](https://socket.io/) and [Tangram](https://mapzen.com/projects/tangram/) for the [Inclusive Maps Mapathon](https://mapzen.com/blog/inclusive-maps-event).

```
cd path/to/osm-updates
npm install
node index.js
```

Now you can load this in a browser at: http://localhost:3000/

There is also an API endpoint to receive incoming updates, which this curl command is using to update the location:

```
curl -d '{"lat":40.761041, "lng":-73.976784, "marker": "NYC"}' -H "Content-Type: application/json" http://localhost:3000/update
```
