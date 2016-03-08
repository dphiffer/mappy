$(document).ready(function() {
	mapzen.whosonfirst.leaflet.tangram.scenefile('/tangram/refill.yaml');
	var socket = io();
	var map, marker, queue = [], timeout, waiting = false;
	$.get('http://ip.dev.mapzen.com/?raw=1', function(rsp) {
		var bbox = rsp.geom_bbox.split(',');
		map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map',
			parseFloat(bbox[1]), parseFloat(bbox[0]),
			parseFloat(bbox[3]), parseFloat(bbox[2])
		);
		map.on('click', function(e) {
			socket.emit('update', {
				lat: e.latlng.lat.toFixed(6),
				lng: e.latlng.lng.toFixed(6)
			});
		});

		socket.on('update', function(update) {
			queue.push(update);
			checkQueue();
		});
	});

	function setMarker() {
		if (queue.length == 0) {
			console.log('nothing in the queue');
			return;
		}
		var update = queue.shift();
		console.log('setMarker', update);
		if (! marker) {
			marker = L.marker([update.lat, update.lng]).addTo(map);
		} else {
			marker.setLatLng(update);
		}
		marker.bindPopup((update.lat) + ', ' + (update.lng)).openPopup();
		waiting = true;
		setTimeout(function() {
			waiting = false;
			checkQueue();
		}, 5000);
	}

	function checkQueue() {
		if (! waiting) {
			if (queue.length > 0) {
				setMarker();
			}
		}
	}

});
