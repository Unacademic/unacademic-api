var mongoose = require('mongoose');

var Constellation;

var ConstellationSchema = new mongoose.Schema({
	curator: {type: String, required: true},
	curator_org: {type: String},
	contributors: {type: [String]},
	title: {type: String, required: true},
	version: {type: String, required: true},
	summary: {type: String},
	description: {type: String},
	keywords: {type: [String]},
	forks: {type: [String]},
	forked_from: {type: String},
	checkpoints: [{
		// skipping curator
		// curator: {type: String},
		title: {type: String, required: true},
		description: {type: String},
		id: {type: String},
		instructions: {type: [String]},
		resources: [{
			// skipping curator
			// curator: {type: String},
			title: {type: String, required: true},
			id: {type: String},
			resourceType: {type: String, required: true},
			site_name: {type: String},
			resource_url: {type: String}
		}]
	}],
	created: {type: Date, required: true, default: Date.now}
});

ConstellationSchema.statics.getFields = function getFields() {
	var fields = {
		requiredFields: ['curator','title','version'],
		allFields: [
			'curator',
			'curator_org',
			'contributors',
			'title',
			'version',
			'summary',
			'description',
			'keywords',
			'forks',
			'forked_from',
			'checkpoints',
			'created',
		]
	};
	return fields;
};

Constellation = mongoose.model("constellation", ConstellationSchema);

module.exports = Constellation;
