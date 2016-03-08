var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', function(socket) {
	socket.on('update', function(update) {
		console.log('update: ' + update.lat + ', ' + update.lng);
		io.emit('update', update);
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
