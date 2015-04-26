var express = require('express');
var Constellation = require('./schema');
var controller = require('./controller');

var router = express.Router();

router.post('/', function(req,res, next) {
	console.log(typeof(Constellation));
	//var constellation = new Constellation(req.body);
	var constellation = req.body;
	console.log('posting constellation:');
	var savePromise = controller.saveConstellation(constellation)
		.then(function(savedConstellation) {
			return res.status(200).json(savedConstellation);
		});

	savePromise.catch(function(error) {
		return res.status(500).send(error.message);
	});
});

router.get('/', function(req, res, next) {
	console.log('getting all constellations');
	controller.getConstellations().then(function(constellations) {
		return res.json(constellations);
	});
});

router.get('/user/:user', function(req, res, next) {
	var constellationUser = req.params.user;
	console.log('getting all constellations for user ' + constellationUser);
	var query = {'curator': constellationUser};
	controller.getConstellations(query).then(function(constellations) {
		return res.json(constellations);
	});
});

router.get('/id/:id', function(req, res, next) {
	console.log('getting constellation ' + req.params.id);
	var query = {'_id': req.params.id};
	var getPromise = controller.getConstellation(query).then(function(constellation) {
		return res.status(200).json(constellation);
	});
	getPromise.catch(function(error) {
		return res.status(500).send(error);
	});
});

router.get('/user/:user/title/:title', function(req, res, next) {
	console.log('getting constellation of user ' + req.params.user + ' with title ' + req.params.title);
	var query = {'title': req.params.title, 'curator': req.params.user};
	var getPromise = controller.getConstellation(query).then(function(constellation) {
		return res.status(200).json(constellation);
	});
	getPromise.catch(function(error) {
		return res.status(500).send(error);
	});
});

router.put('/id/:id', function(req, res, next) {
	console.log('updating constellation ' + req.params.id);
	var query = {'_id': req.params.id};
	var updatePromise = controller.updateConstellation(query, req.body)
		.then(function(updatedConstellation) {
			return res.status(200).json(updatedConstellation);
		});

	updatePromise.catch(function(error) {
		return res.status(500).send(error.message);
	});
});

router.put('/user/:user/title/:title', function(req, res, next) {
	var query = {
		'curator': req.params.user,
		'title': req.params.title
	};

	console.log('updating constellation of user ' + query.curator + ' with title ' + query.title);
	var updatePromise = controller.updateConstellation(query, req.body)
		.then(function(updatedConstellation) {
			return res.status(200).json(updatedConstellation);
		});

	updatePromise.catch(function(error) {
		return res.status(500).send(error.message);
	});
});

router.delete('/id/:id', function(req, res, next) {
	console.log('deleting constellation ' + req.params.id);
	var query = {"_id": req.params.id};
	Constellation.findOneAndRemove(query, function(err, removed_constellation) {
		if (err) { next(err); }
		res.json(removed_constellation);
	});
});

router.delete('/user/:user/title/:title', function(req, res, next) {
	var query = {
		'curator': req.params.user,
		'title': req.params.title
	};
	console.log('deleting constellation of user ' + query.curator + ' with title ' + query.title);

	Constellation.findOneAndRemove(query, function(err, removed_constellation) {
		if (err) { next(err); }
		res.json(removed_constellation);
	});
});

module.exports = router;
