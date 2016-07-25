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
	pokeMongo.getAllLocations().then(function(pk){
		pk = pk.map((location) => { return { location: location, scan: locationsHash[location.location] || {message: "there is nothing here, shoo"} } })
		res.send(pk)
	})
});

router.get('/all/scan', (req, res, next) => {
	pokeMongo.getAllLocations().then(function(locations){
      locations.forEach(function(loc)
      {
        console.log("starting scanner for " + loc.location)
      	scanQueue.start_scan(loc, true)
      })
      res.send("{message: 'A-OK!'}")
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

router.get('/:location/engage/', (req, res, next) => {
	pokeMongo.getLocationFromShorthand(req.params.location).then( function(loc) {

		scanQueue.start_scan(loc, true)
		res.redirect("http://pokescan.online")
	}).catch(function(err){
		console.log("error!")
	})

})


router.post('/', (req, res, next) => {
	if (req.body.location == "" || req.body.shorthand == "")
	{
		res.redirect('/')
		return
	}


	geocoder.geocode({address: req.body.location}, function(err, geo) {
		if (geo[0] == undefined)
		{
			console.log("MASSIVE ERROR, GEOCODER FAILURE")
			res.redirect(500, '/')
			return
		}

		req.body.latLng = [geo[0].latitude, geo[0].longitude]
		req.body.persist = false
		pokeMongo.addLocation(req.body)
		scanQueue.start_scan(req.body, true)
		res.redirect(301, '/')
	});
})

module.exports = router;
