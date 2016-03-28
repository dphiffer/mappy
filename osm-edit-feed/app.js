var request = require('request');
var qs = require('qs');
var xml2json = require('xml2json');

var slackChannel = process.env.SLACK_CHANNEL;
var vizChannel = process.env.VIZ_CHANNEL;


console.log(slackChannel, vizChannel);

// presets
var baseUrl = 'https://overpass-api.de/';
var minuteStatePath = 'api/augmented_diff_status';
var changePath = 'api/augmented_diff?';

var previousState = null;

function minuteStateUrl() {
  return baseUrl + minuteStatePath;
}

function changeUrl(id, bbox) {
  return baseUrl + changePath + qs.stringify({
      id: id, info: 'no', bbox: bbox || '-180,-90,180,90'
    });
}

function requestState(cb) {
  request(minuteStateUrl(), function(err, res, body) {

    //console.log('requestState', minuteStateUrl(), body);

    cb(null, parseInt(body, 10));
  });
}

function requestChangeset(state, cb, bbox) {
  request(changeUrl(state, bbox), function(err, res, body) {

    console.log('requestChangeset', changeUrl(state, bbox));

    cb(null, body);
  });
}

var interval = setInterval(function () {
  requestState(function (err, state) {

    if (previousState === state) {
      return;
    }

    previousState = state;

    requestChangeset(state, function (err, xml) {
      var options = {
        object: true,
        reversible: false,
        coerce: false,
        sanitize: true,
        trim: true,
        arrayNotation: true
      };
      var obj = xml2json.toJson(xml, options);

      if (!obj.osm || obj.osm.length === 0) {
        console.log('nothing in this update');
        return;
      }
      var actions = obj.osm[0].action;

      if (!actions) {
        console.log('nothing in this update');
        return;
      }

      console.log('Action count: ', actions.length);

      actions.forEach(function (action) {
        processItem(action);
      });


      /**
       { osm:
   [ { version: '0.6',
       generator: 'Overpass API',
       note: [Object],
       meta: [Object],
       action: [Object],
       remark: [Object] } ] }
       */

    });
  });

//  clearInterval(interval);

}, 1000);


/**
{
 "type": "create",
 "node": [
   {
     "id": "4040989969",
     "lat": "-33.9130852",
     "lon": "151.0683015",
     "version": "1",
     "timestamp": "2016-03-04T22:59:07Z",
     "changeset": "37618611",
     "uid": "46482",
     "user": "Leon K",
     "tag": [
       {
         "k": "traffic_calming",
         "v": "hump"
       }
     ]
   }
 ]
}
 */

var TAGS = {
  'amenity': {
    'hospital': ':hospital:',
    'clinic': ':hospital:',
    'doctors': ':hospital:',
    'baby_hatch': ':baby:',
    'school': ':school:',
    'police': ':police_car:',
    'social_facility': ':couple:',
    'childcare': ':baby:',
    'toilets': ':toilet:'
  },
  'healthcare:specialty': {
    'abortion': ':syringe:',
    'fertility_clinic': ':syringe:',
    'gynaecology': ':woman:',
    'womens_clinic': ':woman:',
    'family_planning': ':family:',
    'maternity_waiting_shelter': ':family:'
  },
  'healthcare': {
    'midwife': 'woman'
  },
  'social_facility': {
    'shelter': ':house:',
    'domestic_violence_facility': ':house:',
    'gender_based_violence_facility': ':house:'
  },
  'social_facility:for': {
    'abuse': ':house:'
  },
  'highway': {
    'street_lamp': ':bulb:',
    'bus_stop': ':oncoming_bus:'
  },
  'emergency': {
    'phone': ':telephone_receiver:'
  },
  'polling_station': {
    'yes': ':office:'
  },
  'wheelchair': {
    'yes': ':wheelchair:'
  },
  'vending': {
    'feminine_hygiene': ':womens:'
  }
};

function processItem(item) {
  var type = item.type;

  var obj = item.node || item.way || item.relation || item.new[0].relation || item.new[0].node || item.new[0].way;

  if (!obj) {
    console.log(item);
    return;
  }

  if (obj[0].tag) {

    var icon = checkTags(obj[0].tag);

    if (!icon) {
      //console.log('nope :(');
      return;
    }

    //console.log(JSON.stringify(item, null, 2)); //, obj[0].tag);

    console.log('yay, inclusive tag!');

    if (slackChannel) {
      request({
          url: slackChannel,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(makeResponse(type, icon, obj[0]))
        },
        function (err, res, body) {
          if (err) {
            console.log('sent update', body)
          }
        });
    }

    if (vizChannel) {
      request({
          url: vizChannel,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(makeJSONResponse(type, icon, obj[0]))
        },
        function (err, res, body) {
          if (err) {
            console.log('sent json update', body);
          }
        });
    }
  }
}

function checkTags(tags) {
  var icon = null;
  tags.forEach(function (tag) {
    if (TAGS.hasOwnProperty(tag.k) && TAGS[tag.k].hasOwnProperty(tag.v)) {
      icon = TAGS[tag.k][tag.v];
    }
  });
  return icon;
}

function makeJSONResponse(type, icon, item) {
  var osm = 'http://www.openstreetmap.org';
  var result = {};

  result.icon = icon;

  result.userUrl = osm + '/user/' + item.user;
  result.user = item.user;
  result.changestUrl = osm + '/changeset/' + item.changeset;
  result.type = type;

  item.tag.forEach(function (tag) {
    if (tag.k === 'name') {
      result.marker = icon + '  ' + tag.v;
    }
  });

  if (!result.hasOwnProperty('marker')) {
    result.marker = icon;
  }

  if (item.hasOwnProperty('lat') && item.hasOwnProperty('lon')) {
    result.lat = parseFloat(item.lat);
    result.lng = parseFloat(item.lon);
  }
  else if (item.bounds && item.bounds[0]) {
    result.lat = (parseFloat(item.bounds[0].minlat) + parseFloat(item.bounds[0].maxlat)) / 2.0;
    result.lng = (parseFloat(item.bounds[0].minlon) + parseFloat(item.bounds[0].maxlon)) / 2.0;
  }
  else {
    console.log(JSON.stringify(item, null, 2));
  }

  console.log(JSON.stringify(result, null, 2));

  return result;
}

function makeResponse(type, icon, item) {
  var osm = 'http://www.openstreetmap.org';
  var text = '';

  text += '~~~~~~~~~~~~~~~~~~~~~ ' + icon + ' ~~~~~~~~~~~~~~~~~~~~~';

  var fields = [];

  fields.push(text);
  fields.push( 'User: <' + osm + '/user/' + item.user + '|' + item.user + '>');
  fields.push( 'Changeset: <' + osm + '/changeset/' + item.changeset + '|' + item.changeset + '>');
  fields.push( 'Type: `' + type + '`' );

  var tags = [];
  tags.push( 'Tags: ' );
  item.tag.forEach(function (tag) {
    tags.push( '> `' + tag.k + '` = `' + tag.v + '`' );
    if (tag.k === 'name') {
      fields.push('Name: *' + tag.v + '*');
    }
  });

  //console.log(JSON.stringify(item, null, 2));

  fields = fields.concat(tags);

  return {
    text: fields.join('\n')
  };
}