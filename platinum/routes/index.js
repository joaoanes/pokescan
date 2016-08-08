var express = require('express');
var router = express.Router();


var changelogs = [{ version: "0.3.5", changelog:
[
"Fixed scans - and they're actually faster",
"Added blips on the map to symbolize scan passes on selected location"

]},{ version: "0.3", changelog:
[
"Fixed scans - they're slower now, but they work. Thanks niantic.",
"Added contributors, just click the footer!",
"Your position is now a marker, also now works on phones I guess",
"Desktop notifications! Just select a location and let it run on the background.",
"Scan locations are shown as circles appearing while a scanning location is selected",
"Added location selector, just search for the exact shorthand on the header and press enter",
"The app now stores your last selected location and opens it when you visit!",
"Added infobox and new pokemon cards, click on the pokemons on the map!",
"General improvements!"


]}, { version: "0.2", changelog:
[
	"Added changelog and versioning!",
	"Added throttles on updates on the mobile version",
	"About that, did you know we were pulling 500kb each second? Yikes.",
	""
]}]

router.get('/', function(req, res, next) {
  res.render('index', { pageData: { changelogs: changelogs } });
});

module.exports = router;
