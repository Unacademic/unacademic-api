var express = require('express');
var Waypoint = require('./schema');
var controller = require('./controller');

var router = express.Router();

router.post('/', function(req,res, next) {
	console.log('posting waypoint:');
	var waypoint = req.body;
	var savePromise = controller.saveWaypoint(waypoint)
		.then(function(savedWaypoint) {
			return res.status(200).json(savedWaypoint);
		});

	savePromise.catch(function(error) {
		return res.status(500).send(error.message);
	});
});

router.get('/', function(req, res, next) {
	console.log('getting all waypoints');
	var query = {};
	controller.getWaypoints(query).then(function(waypoints) {
		return res.json(waypoints);
	});
});

router.get('/user/:user', function(req, res, next) {
	var waypointUser = req.params.user;
	console.log('getting all waypoints for user ' + waypointUser);
	var query = {'curator': waypointUser};
	controller.getWaypoints(query).then(function(waypoints) {
		return res.json(waypoints);
	});
});

router.get('/id/:id', function(req, res, next) {
	console.log('getting waypoint with id ' + req.params.id);
	var query = {'_id': req.params.id};
	var getPromise = controller.getWaypoint(query).then(function(waypoint) {
		return res.status(200).json(waypoint);
	});
	getPromise.catch(function(error) {
		return res.status(500).send(error);
	});
});

router.get('/user/:user/title/:title', function(req, res, next) {
	console.log('getting waypoint of user ' + req.params.user + ' with title ' + req.params.title);
	var query = {'title': req.params.title, 'curator': req.params.user};
	var getPromise = controller.getWaypoint(query).then(function(waypoint) {
		return res.status(200).json(waypoint);
	});
	getPromise.catch(function(error) {
		return res.status(500).send(error);
	});
});

router.put('/id/:id', function(req, res, next) {
	console.log('updating waypoint ' + req.params.id);
	var query = {'_id': req.params.id};
	var updatePromise = controller.updateWaypoint(query, req.body)
		.then(function(updatedWaypoint) {
			return res.status(200).json(updatedWaypoint);
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

	console.log('updating waypoint of user ' + query.curator + ' with title ' + query.title);
	var updatePromise = controller.updateWaypoint(query, req.body)
		.then(function(updatedWaypoint) {
			return res.status(200).json(updatedWaypoint);
		});

	updatePromise.catch(function(error) {
		return res.status(500).send(error.message);
	});
});

router.delete('/id/:id', function(req, res, next) {
	console.log('deleting waypoint with id ' + req.arams.id);
	var query = {"_id": req.params.id};
	Waypoint.findOneAndRemove(query, function(err, removed_waypoint) {
		if (err) { next(err); }
		res.json(removed_waypoint);
	});
});

router.delete('/user/:user/title/:title', function(req, res, next) {
	var query = {
		'curator': req.params.user,
		'title': req.params.title
	};
	console.log('deleting waypoint of user ' + query.curator + ' with title ' + query.title);

	Waypoint.findOneAndRemove(query, function(err, removed_waypoint) {
		if (err) { next(err); }
		res.json(removed_waypoint);
	});
});

module.exports = router;
