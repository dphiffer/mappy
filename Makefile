install-nodejs:
	curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
	sudo apt-get install -y nodejs

install-modules:
	cd /usr/local/mappy
	npm install
	cd /usr/local/mappy/osm-edit-feed
	npm install

next-steps:
	# 1. Set environment vars
	#    export SHARED_SECRET=`openssl rand -base64 32`
	#    export UPDATE_URL="http://localhost:3816/update"
	# 2. Start the osm-edit-feed listener:"
	#    cd /usr/local/mappy/osm-edit-feed"
	#    nodejs app.js"
	# 3. In a new terminal start the Mappy front-end server:"
	#    (export the same SHARED_SECRET env var)
	#    cd /usr/local/mappy"
	#    nodejs app.js"
	# 4. Load up http://localhost:3816/ to see the map.

all:
	install-nodejs install-modules next-steps
