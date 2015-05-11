const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const dbHost = process.env.DATABASE_HOST || 'localhost';
const dbName = process.env.DATABASE_NAME || 'unacademic';
const dbPort = process.env.DATABASE_PORT || 27017;

const app = express();
const namespace = '/api/0';

var mongoLocalURL = "mongodb://" + dbHost + ":" + dbPort + "/" + dbName;

/// -------- quick fix -------------------

const port = process.env.PORT || '3000';
const host = process.env.HOST || '0.0.0.0';

var login = {
  "user": "testuser",
  "pass": "blabla"
};

var mongoLabURL = "mongodb://" + login.user + ":" + login.pass + "@ds029051.mongolab.com:29051/unacademic_api";

mongoose.connect(mongoLabURL);

/// -------- quick fix ---------

// mongoose.connect(mongoLocalURL);

var con = mongoose.connection;

con.once('open', function() {
  console.log('connected to mongodb successfully');
});

con.once('error', function() {
  console.log('MongoLab connection error');
  console.error.bind(console, 'connection error:');
});

app.use(cors());

const BODY_LIMIT = '500kb';
app.use(bodyParser.json({ limit:BODY_LIMIT }));
app.use(bodyParser.urlencoded({ limit: BODY_LIMIT, extended: true }));

const router = express.Router();

router.get('/', function(req, res){
  res.send('welcome to unacademic-api');
});

router.use(function(req, res, next) {
  console.log('%s %s %s', req.method, req.url, JSON.stringify(req.body));
  next();
});

var modules = ["constellations", "waypoints"];

modules.forEach(function(module) {
	var routes = require('./modules/' + module + '/routes');
	app.use(namespace + '/' + module, routes);
});

app.use(namespace, router);

app.get('/', function(req,res){
  res.redirect(namespace+'/');
});

app.get(namespace, function(req, res) {
	res.send('respond with API message');
});

/// -------- quick fix ---------

app.listen(port, host);

console.log('Server running on %s:%d...', host, port);

/// ---------------------------

module.exports = app;
