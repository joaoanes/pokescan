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
var locationsHash = []
var scanQueue = new require('./scanQueue.js').factory("normal queue", locationsHash)
var superScanQueue = new require('./scanQueue.js').factory("express queue", locationsHash)





router.get('/all', (req, res, next) => {
	pokeMongo.getAllLocations().then(function(pk){
		pk = pk.map((location) => {
			if (locationsHash[location.location])
				return { location: location, scan: { status: locationsHash[location.location].status, last_scan: locationsHash[location.location].last_scan, percentage: locationsHash[location.location].payload.percentage } }
			return {location: location, scan: { status: "no data" } }
		})
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

		superScanQueue.start_scan(loc, true)
		res.send("{message: 'What do you want, a redirect?'}")
	}).catch(function(err){
		console.log("error!")
	})

})

router.get('/:location/', (req, res, next) => {
	pokeMongo.getLocationFromShorthand(req.params.location).then( function(loc) {
		var json = JSON.stringify({location: loc, scan: locationsHash[loc.location] ? {status: locationsHash[loc.location].status, remaningCoordinates: locationsHash[loc.location].remainingCoordinates, payload: locationsHash[loc.location].payload} : {status: "no data"} })
		res.send(json)
	}).catch(function(err){

		console.log("muh error: " + err)
	})

})


router.post('/', (req, res, next) => {
	if (req.body.location == "" || req.body.shorthand == "" || req.body.shorthand.split(" ").length != 1)
	{
		res.redirect('/')
		return
	}


	geocoder.geocode({address: req.body.location}).then( (geo, err) => {
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
	}).catch( (err) => {
		console.log(err)
	});
})

module.exports = router;
