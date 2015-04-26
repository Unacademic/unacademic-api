var mongoose = require('mongoose');

var Path;

var PathSchema = new mongoose.Schema({
	curator: {type: String, required: true},
	title: {type: String, required: true},
	version: {type: String, required: true},
	image_url: {type: String},
	summary: {type: String},
	description: {type: String},
	license: {type: String},
	keywords: {type: [String]},
	forks: {type: [String]},
	forked_from: {type: String},
	learners: {type: [String]},
	waypoints: {type: [String]},
	created: {type: Date, required: true, default: Date.now}
});

// Convert model to API-safe object

PathSchema.methods.toAPI = function(cb) {
	var ret = this;
	delete ret._id;
	delete ret.__v;
	cb(null, ret);
};

PathSchema.methods.validate = function(cb) {
	// check that keywords are lowercase
	var validPath = this;
	validPath.keywords = this.keywords.map(function(value) {
		return value.toLowerCase();
	});
	cb(null, validPath);
};

Path = mongoose.model("path", PathSchema);

PathSchema.methods.updateConflict = function updateConflict (updateId) {
	if (this._id === undefined) { return false; }
	if (this._id === updateId) { return true; }
	return false;
};

module.exports = Path;
