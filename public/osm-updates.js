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

	var icons = {
		':hospital:':           '🏥',
		':baby:':               '👶',
		':school:':             '🏫',
		':police_car:':         '🚓',
		':couple:':             '👫',
		':toilet:':             '🚽',
		':syringe:':            '💉',
		':woman:':              '👩',
		':family:':             '👪',
		':house:':              '🏠',
		':bulb:':               '💡',
		':oncoming_bus:':       '🚍',
		':telephone_receiver:': '📞',
		':office:':             '🏢',
		':wheelchair:':         '♿️',
		':womens:':             '🚺'
	};

	// New markers
	var newStyle = {
		"color": "#000",
		"weight": 2,
		"opacity": 1,
		"radius": 6,
		"fillColor": "#fc2302",
		"fillOpacity": 1
	};

	// Old markers
	var oldStyle = {
		"color": "#000",
		"weight": 1,
		"opacity": 1,
		"radius": 4,
		"fillColor": "#ADE66F",
		"fillOpacity": 0.5
	};

	var features = [];

	function addPOI(point) {
		console.log ("Adding:", point);
		features.push({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [point.lon, point.lat]
			},
			properties: {
				name: point.name || "unknown",
				type: point.type || "",
				amenity: point.amenity || "",
				kind: 'diversePOI'
			}
		});

		scene.setDataSource('local', {
			type: 'GeoJSON',
			data: {
				'type': 'FeatureCollection',
				'features': features
			}
		});
	}

	function setMarker() {
		if (queue.length == 0) {
			console.log('nothing in the queue');
			return;
		}

		var update = queue.shift();
		console.log('setMarker', update);
		if (marker) {
			marker.setStyle(oldStyle);
		}
		marker = L.circleMarker(update, newStyle);
		marker.addTo(map);
		var popup = formatPopup(update);
		marker.bindPopup(popup).openPopup();
		/*addPOI({
			lat: update.lat,
			lon: update.lng,
			name: formatText(update.marker)
		});*/
		map.setView([update.lat, update.lng], 14);

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

	function formatPopup(update) {
		var popup = update.marker || (update.lat + ', ' + update.lng);
		for (shortcode in icons) {
			var re = new RegExp(shortcode, 'g');
			var replacement = icons[shortcode];
			if (typeof replacement != 'string') {
				var index = Math.floor(Math.random() * replacement.length);
				replacement = replacement[index];
			}
			popup = popup.replace(re, replacement);
		}
		return popup;
	}

});
