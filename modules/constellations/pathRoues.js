var express = require('express');
var Path = require('./schema');

var router = express.Router();

router.post('/', function(req,res, next) {
	var path = new Path(req.body);
	path.validate(function(err, validPath) {
		if (err) { res.send('Invalid path'); }

		path.save(function(err, result) {
			if (err) { next(err); }
			res.json(result);
		});
	});
});

router.get('/', function(req, res, next) {
	console.log('getting all paths');
	Path.find(function(err, paths) {
		if (err) { next(err); }
		res.json(paths);
	});

});

router.get('/:id', function(req, res, next) {
	console.log('getting path ' + req.params.id);
	var pathId = req.params.id;
	Path.findById(pathId, function(err, path) {
		if (err) { next(err); }
		res.json(path);
	});
});

router.put('/:id', function(req, res, next) {
	console.log('updating path ' + req.params.id);
	Path.update({"_id": req.params.id}, {$set: req.body}, function(err, result) {
		if (err) { return next(err); }
		Path.findById(req.params.id, function(err, path) {
			res.json(path);
		});
	});
});

router.delete('/:id', function(req, res, next) {
	console.log('deleting path ' + req.params.id);
	var pathId = req.params.id;
	Path.findOneAndRemove({"_id": pathId}, function(err, removed_path) {
		if (err) { next(err); }
		res.json(removed_path);
	});
});

module.exports = router;
