install-nodejs:
	curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
	sudo apt-get install -y nodejs

install-modules:
	cd /usr/local/mappy
	npm install
	cd /usr/local/mappy/osm-edit-feed
	npm install

secret:
	export SHARED_SECRET=`openssl rand -base64 32`
	export UPDATE_URL="http://localhost:3816/update"
	echo
	echo "1. Start the osm-edit-feed listener:"
	echo "   cd /usr/local/mappy/osm-edit-feed"
	echo "   nodejs app.js"
	echo "2. In a new terminal start the Mappy front-end server:"
	echo "   export SHARED_SECRET=\"$SHARED_SECRET\""
	echo "   cd /usr/local/mappy"
	echo "   nodejs app.js"

all:
	install-nodejs install-modules secret
