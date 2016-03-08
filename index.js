var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

var jsonParser = bodyParser.json();
app.use(express.static('public'));

app.post('/update', jsonParser, function(req, res) {
	if (! req.body) {
		return res.sendStatus(400);
	}
	console.log(req.body);
	io.emit('update', req.body);
	res.sendStatus(200);
});

io.on('connection', function(socket) {
	socket.on('update', function(update) {
		console.log(update);
		io.emit('update', update);
	});
});

http.listen(3816, function(){
	console.log('listening on *:3816');
});
