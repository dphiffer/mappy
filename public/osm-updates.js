$(document).ready(function() {

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

	mapzen.whosonfirst.leaflet.tangram.scenefile('/tangram/refill.yaml');
	var socket = io();
	var map, marker, queue = [], timeout, waiting = false;
	//$.get('http://ip.dev.mapzen.com/?raw=1', function(rsp) {
		//var bbox = rsp.geom_bbox.split(',');
		var bbox = [-211.9921875, -56.55948248376223,
		            238.0078125, 69.03714171275197];
		map = mapzen.whosonfirst.leaflet.tangram.map_with_bbox('map',
			parseFloat(bbox[1]), parseFloat(bbox[0]),
			parseFloat(bbox[3]), parseFloat(bbox[2])
		);
		window.map = map;

		$.each(updateArchive, function(i, update) {
			showMarker(update, true);
		});

		socket.on('update', function(update) {
			queue.push(update);
			checkQueue();
		});
	//});

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

	function checkQueue() {
		if (! waiting) {
			if (queue.length > 0) {
				showMarker(queue.shift());
			}
		}
	}

	function showMarker(update, isArchived) {
		if (! update.lat || ! update.lng ||
		    ! parseFloat(update.lat) ||
				! parseFloat(update.lng)) {
			console.log('Invalid update', update);
			return;
		}
		if (marker) {
			marker.setStyle(oldStyle);
		}
		var style = isArchived ? oldStyle : newStyle;
		marker = L.circleMarker(update, style);
		marker.addTo(map);

		if (isArchived) {
			marker.update = update;
			marker.on('click', function() {
				if (! this.popupBound) {
					showPopup(this, this.update);
					this.popupBound = true;
				}
			});
		} else {
			showPopup(marker, update);
			map.panTo([update.lat, update.lng]);
			waiting = true;
			setTimeout(function() {
				waiting = false;
				checkQueue();
			}, 5000);
		}
	}

	function showPopup(marker, update) {
		$.get('https://pip.mapzen.com/?latitude=' + update.lat + '&longitude=' + update.lng, function(rsp) {
			var popup = formatPopup(update);
			if (rsp && rsp.length > 0) {
				var where = [];
				$.each(rsp, function(i, pip) {
					if (pip.Placetype == 'country') {
						where.push(pip.Name);
					} else if (pip.Placetype == 'locality') {
						where.unshift(pip.Name);
					}
				});
				if (where.length > 0) {
					popup += '<p class="where">' + where.join(', ') + '</p>';
				}
			}
			marker.bindPopup(popup).openPopup();
		});
	}

	function formatPopup(update) {
		if (update.marker) {
			var popup = update.marker;
		} else if (update.lat && update.lng) {
			var popup = (update.lat + ', ' + update.lng);
		}
		if (update.changestUrl) {
			popup = '<a href="' + update.changestUrl + '">' + popup + '</a>';
		}
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
