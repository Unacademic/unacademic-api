var BPromise = require('bluebird');
var mongoose = require('mongoose');
var Constellation = require('./schema');

var findConstellations = function (query) {
	return BPromise.cast(mongoose.model('constellation').find(query).exec());
};

function toAPI(constellation) {
	return new BPromise(function(resolve) {
		var ret = { 'id': constellation.id };
		var fields = Constellation.getFields();
		for (var prop in constellation) {
			if (fields.allFields.indexOf(prop) > -1) {
				ret[prop] = constellation[prop];
			}
		}
			console.log('toAPI: no error');
		return resolve(ret);
	});
}

function toAPIConstellations(constellations) {
	return new BPromise(function(resolve, reject) {
		var apiSafeConstellations = [];
		constellations.forEach(function(constellation) {
			var constellationPromise = toAPI(constellation);
			constellationPromise.then(function(apiSafeConstellation) {
				apiSafeConstellations.push(apiSafeConstellation);
				if (apiSafeConstellations.length === constellations.length) {
					return resolve(apiSafeConstellations);
				}
			});
			constellationPromise.catch(reject);
		});
	});
}

function testMissingFields(constellation) {
	var missing = [];
	var count = 0;
	var fields = Constellation.getFields();
	return new BPromise(function(resolve, reject) {
		fields.requiredFields.forEach(function(field) {
			if (constellation[field] === undefined) {
				missing.push(field);
			}
			count++;
			if (count === fields.requiredFields.length) {
				if (missing.length > 0) {
					console.log('testMissingFields: missing fields error');
					var message = "Constellation is missing required fields '" + missing.join("' and '") + "'";
					var error = new Error(message);
					console.log(error);
					return reject(error);
				}
				console.log('testMissingFields: no error');
				return resolve(constellation);
			}
		});
	});
}

function testCurator(constellationData, query) {
	return new BPromise(function(resolve, reject) {
		var findPromise = BPromise.cast(mongoose.model('constellation').findOne(query).exec());
		findPromise.then(function(foundConstellation) {
		//mongoose.model('constellation').findById(id, function(err, foundConstellation) {
			if (foundConstellation.curator !== constellationData.curator) {
				var error = new Error('updated constellation has different curator than existing constellation');
				console.log(error);
				return reject(error);
			}
			console.log('testCurator: no error');
			constellationData.id = foundConstellation.id;
			return resolve(constellationData);
		});
	});
}
function testVersionFormat(constellation) {
	return new BPromise(function(resolve, reject) {
		if (!(constellation.version.match(/^[0-9]+\.[0-9]+\.[0-9]+/))) {
			var error = new Error("version is not in SemVer format");
			return reject(error);
			//return reject("version is not in SemVer format");
		}
			console.log('testVersionFormat: no error');
		return resolve(constellation);
	});
}

function lowerKeywords(constellation) {
	return new BPromise(function(resolve) {
		var lowKeywords = [];
		if (!('keywords' in constellation) || constellation.keywords.length === 0) {
			console.log('lowerKeywords: no keywords in constellation');
			return resolve(constellation);
		}

		constellation.keywords.forEach(function(keyword) {
			lowKeywords.push(keyword.toLowerCase());
			if (lowKeywords.length === constellation.keywords.length) {
				constellation.keywords = lowKeywords;
				console.log('lowerKeywords: no error');
				return resolve(constellation);
			}
		});
	});
}

function testForeignKey(constellation) {
	return new BPromise(function(resolve, reject) {
		// find constellations with curator and title as query
		var query = {"curator": constellation.curator, "title": constellation.title};
		mongoose.model('constellation').findOne(query, function(err, result) {
			if (err) { return reject(err); }
			// if constellation is not null, the foreign key is not unique
			if (result) {
				console.log('foreign key ' + query +' already exists');
				err = new Error('Combination of curator and title already exists');
				return reject(err);
			}

			console.log('foreign key ' + query +' is accepted');
			return resolve(constellation);
		});
	});
}

// Convert model to API-safe object

function updateDB(constellationData) {
	return new BPromise(function(resolve, reject) {
		mongoose.model('constellation').update({"_id": constellationData.id}, {$set: constellationData}, function(err, result) {
			if (err) { return reject(err); }
			mongoose.model('constellation').findById(constellationData.id, function(err, updatedConstellation) {
				if (err) {
					var error = new Error ('error updating constellation');
					console.log(error);
					return reject(error);
				}
				console.log('updateDB: no error');
				return resolve(updatedConstellation);
			});
		});
	});
}

function saveToDB(constellation) {
	return new BPromise(function(resolve, reject) {
		constellation.save(function(err, savedConstellation) {
			if (err) {
				return reject(err);
			}
			console.log('constellation saved');
			return resolve(savedConstellation);
		});
	});
}

exports.getConstellation = function(query) {
	console.log('locating constellation with query ' + JSON.stringify(query));
	return new BPromise(function(resolve, reject) {
		BPromise.onPossiblyUnhandledRejection(function(error) {
			return(error);
		});
		var findPromise = BPromise.cast(mongoose.model('constellation').findOne(query).exec());
		findPromise.then(toAPI)
			.then(function(constellation) {
				return resolve(constellation);
			});

		findPromise.catch(function(error) {
			console.log('catching find error');
			if (error.name === 'CastError') {
				var findError = 'Constellation does not exist';
				console.log(findError);
				return reject(findError);
			}
			return reject(error);
		});
	});
};

exports.getConstellations = function(query) {
	console.log('locating constellations with query ' + JSON.stringify(query));
	return new BPromise(function(resolve, reject) {

		var findPromise = findConstellations(query)
			.then(toAPIConstellations)
			.then(resolve);

		findPromise.catch(reject);
	});
};

exports.updateConstellation = function(query, constellationData) {
	console.log('starting update');
	return new BPromise(function(resolve, reject) {
		var updatePromise = testCurator(constellationData, query)
			.then(testMissingFields)
			.then(testVersionFormat)
			.then(lowerKeywords)
			.then(updateDB)
			.then(toAPI)
			.then(function(updatedConstellation) {
				return resolve(updatedConstellation);
			});

		updatePromise.catch(function(error) {
			console.log('updateConstellation catches an error');
			console.log(error);
			return reject(error);
		});
	});
};

exports.saveConstellation = function(constellationData) {
	console.log('starting save');
	var constellation = new Constellation(constellationData);
	return new BPromise(function(resolve, reject) {
		var savePromise = testForeignKey(constellation)
			.then(testMissingFields)
			.then(testVersionFormat)
			.then(lowerKeywords)
			.then(saveToDB)
			.then(toAPI)
			.then(function(savedConstellation) {
				return resolve(savedConstellation);
				//cb(null, savedConstellation);
			});

		savePromise.catch(function(error) {
			console.log('saveConstellation catches an error');
			console.log(error);
			return reject(error);
			//cb(error, null);
		});
	});
};


exports.findConstellations = findConstellations;

