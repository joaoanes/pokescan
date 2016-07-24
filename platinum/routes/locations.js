var express = require('express')
var router = express.Router()
var Docker = require('dockerode');

var geocoder = require('node-geocoder')({
		provider: 'google',
		httpAdapter: 'https',
		apiKey: process.env.GOOGLE_MAPS_API,
		formatter: null
});

var pokeMongo = require('./pokeMongo.js')
pokeMongo = new pokeMongo()
var scanQueue = require('./scanQueue.js')
var locationsHash = scanQueue.hash


router.get('/all', (req, res, next) => {
	pokeMongo.getAllScanningLocations().then(function(pk){res.send(pk)})
});



router.get('/:location/scan', (req, res, next) => {
	pokeMongo.getLocationFromShorthand(req.params.location).then( function(loc) {
		scanQueue.start_scan(loc.location)
		res.send("A-OK!")
	})

})

router.get('/:location/pokemon/all', (req, res, next) => {
	pokeMongo.getLocationFromShorthand(req.params.location).then(function(loc)
	{

			pokeMongo.getAllPokemonNearby(loc.latLng).then(function(pk){res.send(pk)})

	})
})

router.get('/:location/pokemon/', (req, res, next) => {

	pokeMongo.getLocationFromShorthand(req.params.location).then(function(location)
	{

		pokeMongo.getLivePokemonNearby(location.latLng).then(function(pk){res.send(pk)})

	})
})


/* GET users listing. */
router.get('/:location', (req, res, next) => {
	pokeMongo.getLocationFromShorthand(req.params.location).then(function(location)
	{
		res.send(locationsHash[location.location]) //TODO: this is retarded, I'm saving locations on the database and maintaining caches with full locations as keys
	})
});

router.post('/', (req, res, next) => {
	geocoder.geocode({address: req.body.location}, function(err, geo) {
		req.body.latLng = [geo[0].latitude, geo[0].longitude]
		pokeMongo.addLocation(req.body)
		res.redirect(301, '/')
	});
})

/* GET users listing. */



// actual logic goes here

module.exports = router;
