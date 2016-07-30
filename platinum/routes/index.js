var express = require('express');
var router = express.Router();


var changelog = { "0.2" :
[
	"Added changelog and versioning!",
	"Added throttles on updates on the mobile version",
	"About that, did you know we were pulling 500kb each second? Yikes.",
	""
]}

router.get('/', function(req, res, next) {
  res.render('index', { pageData: { changelog: changelog } });
});

module.exports = router;
