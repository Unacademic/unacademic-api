var BPromise = require('bluebird');
var mongoose = require('mongoose');
var Waypoint = require('./schema');

var findWaypoints = function (query) {
	return BPromise.cast(mongoose.model('waypoint').find(query).exec());
};

function toAPI(waypoint) {
	return new BPromise(function(resolve) {
		var ret = { 'id': waypoint.id };
		var fields = Waypoint.getFields();
		for (var prop in waypoint) {
			if (fields.allFields.indexOf(prop) > -1) {
				ret[prop] = waypoint[prop];
			}
		}
		console.log('toAPI: no error');
		return resolve(ret);
	});
}

function toAPIWaypoints(waypoints) {
	return new BPromise(function(resolve, reject) {
		var apiSafeWaypoints = [];
		waypoints.forEach(function(waypoint) {
			var waypointPromise = toAPI(waypoint);
			waypointPromise.then(function(apiSafeWaypoint) {
				apiSafeWaypoints.push(apiSafeWaypoint);
				if (apiSafeWaypoints.length === waypoints.length) {
					return resolve(apiSafeWaypoints);
				}
			});
			waypointPromise.catch(reject);
		});
	});
}

function testMissingFields(waypoint) {
	var missing = [];
	var count = 0;
	var fields = Waypoint.getFields();
	return new BPromise(function(resolve, reject) {
		fields.requiredFields.forEach(function(field) {
			if (waypoint[field] === undefined) {
				missing.push(field);
			}
			count++;
			if (count === fields.requiredFields.length) {
				if (missing.length > 0) {
					console.log('testMissingFields: missing fields error');
					var message = "Waypoint is missing required fields '" + missing.join("' and '") + "'";
					var error = new Error(message);
					console.log(error);
					return reject(error);
				}
				console.log('testMissingFields: no error');
				return resolve(waypoint);
			}
		});
	});
}

function testCurator(waypointData, query) {
	return new BPromise(function(resolve, reject) {
		var findPromise = BPromise.cast(mongoose.model('waypoint').findOne(query).exec());
		//mongoose.model('waypoint').findById(id, function(err, foundWaypoint) {
		findPromise.then(function(foundWaypoint) {

			if (foundWaypoint.curator !== waypointData.curator) {
				var error = new Error('updated waypoint has different curator than existing waypoint');
				console.log(error);
				return reject(error);
			}
			console.log('testCurator: no error');
			waypointData.id = foundWaypoint.id;
			return resolve(waypointData);
		});
		findPromise.catch(function(error) {
			console.log(error);
			error = new Error('updating non-existent waypoint');
			return reject(error);
		});
	});
}
function testVersionFormat(waypoint) {
	return new BPromise(function(resolve, reject) {
		if (!(waypoint.version.match(/^[0-9]+\.[0-9]+\.[0-9]+/))) {
			var error = new Error("version is not in SemVer format");
			return reject(error);
			//return reject("version is not in SemVer format");
		}
		console.log('testVersionFormat: no error');
		return resolve(waypoint);
	});
}

function lowerKeywords(waypoint) {
	return new BPromise(function(resolve) {
		var lowKeywords = [];
		if (!('keywords' in waypoint) || waypoint.keywords.length === 0) {
			console.log('lowerKeywords: no keywords in waypoint');
			return resolve(waypoint);
		}

		waypoint.keywords.forEach(function(keyword) {
			lowKeywords.push(keyword.toLowerCase());
			if (lowKeywords.length === waypoint.keywords.length) {
				waypoint.keywords = lowKeywords;
				console.log('lowerKeywords: no error');
				return resolve(waypoint);
			}
		});
	});
}

function testForeignKey(waypoint) {
	return new BPromise(function(resolve, reject) {
		// find waypoints with curator and title as query
		var query = {"curator": waypoint.curator, "title": waypoint.title};
		mongoose.model('waypoint').findOne(query, function(err, result) {
			if (err) { return reject(err); }
			// if waypoint is not null, the foreign key is not unique
			if (result) {
				console.log('foreign key ' + query +' already exists');
				err = new Error('Combination of curator and title already exists');
				return reject(err);
			}

			console.log('foreign key ' + query +' is accepted');
			return resolve(waypoint);
		});
	});
}

// Convert model to API-safe object

function updateDB(waypointData) {
	return new BPromise(function(resolve, reject) {
		mongoose.model('waypoint').update({"_id": waypointData.id}, {$set: waypointData}, function(err, result) {
			if (err) { return reject(err); }
			mongoose.model('waypoint').findById(waypointData.id, function(err, updatedWaypoint) {
				if (err) {
					var error = new Error ('error updating waypoint');
					console.log(error);
					return reject(error);
				}
				console.log('updateDB: no error');
				return resolve(updatedWaypoint);
			});
		});
	});
}

function saveToDB(waypoint) {
	return new BPromise(function(resolve, reject) {
		waypoint.save(function(error, savedWaypoint) {
			if (error) {
				return reject(error);
			}
			return resolve(savedWaypoint);
		});
	});
}

exports.getWaypoint = function(query) {
	console.log('locating waypoint with query ' + JSON.stringify(query));
	return new BPromise(function(resolve, reject) {
		BPromise.onPossiblyUnhandledRejection(function(error) {
			return(error);
		});
		var findPromise = BPromise.cast(mongoose.model('waypoint').findOne(query).exec());
		findPromise.then(toAPI)
			.then(function(waypoint) {
				return resolve(waypoint);
			});

		findPromise.catch(function(error) {
			console.log('catching find error');
			console.log(error);
			if (error.name === 'CastError') {
				console.log(error.name);
				var findError = 'Waypoint does not exist';
				console.log(findError);
				return reject(findError);
			}
			return reject(error);
		});
	});
};

exports.getWaypoints = function(query) {
	console.log('locating waypoints with query ' + JSON.stringify(query));
	return new BPromise(function(resolve, reject) {

		var findPromise = findWaypoints(query)
			.then(toAPIWaypoints)
			.then(resolve);

		findPromise.catch(reject);
	});
};

exports.updateWaypoint = function(query, waypointData) {
	console.log('starting update');
	return new BPromise(function(resolve, reject) {
		var updatePromise = testCurator(waypointData, query)
			.then(testMissingFields)
			.then(testVersionFormat)
			.then(lowerKeywords)
			.then(updateDB)
			.then(toAPI)
			.then(function(updatedWaypoint) {
				return resolve(updatedWaypoint);
			});

		updatePromise.catch(function(error) {
			console.log('updateWaypoint catches an error');
			console.log(error);
			return reject(error);
		});
	});
};

exports.saveWaypoint = function(waypointData) {
	console.log('starting save');
	var waypoint = new Waypoint(waypointData);
	return new BPromise(function(resolve, reject) {
		var savePromise = testForeignKey(waypoint)
			.then(testMissingFields)
			.then(testVersionFormat)
			.then(lowerKeywords)
			.then(saveToDB)
			.then(toAPI)
			.then(function(savedWaypoint) {
				return resolve(savedWaypoint);
				//cb(null, savedWaypoint);
			});

		savePromise.catch(function(error) {
			console.log('saveWaypoint catches an error');
			console.log(error);
			return reject(error);
			//cb(error, null);
		});
	});
};


exports.findWaypoints = findWaypoints;

