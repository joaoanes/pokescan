var MongoClient = require('mongodb').MongoClient


function pokeMongo(url)
{
	this.url = url || 'mongodb://localhost:27017/pokemon';
	MongoClient.connect(this.url).then(function(db, err) {
		this.db = db;
		db.collection('locations').findAndModify(

				{ shorthand: "Areosa" }, {},
				{ $setOnInsert: {location: "Igreja da Areosa, Porto, Portugal", shorthand: "Areosa", latLng: [41.1760511, -8.586719]}},
				{ new: true,
				upsert: true }
			)
		db.collection('locations').findAndModify(

				{shorthand: "FEUP" }, {},
				{ $setOnInsert: {location: "Faculdade de Engenharia, Porto, Portugal", shorthand: "FEUP", latLng: [41.1785734, -8.5962233]}},
				{ new: true,
				upsert: true }
			)
		db.collection('locations').findAndModify(

				{ shorthand: "Aliados" }, {},
				{ $setOnInsert: { location: "Avenida dos Aliados, Porto, Portugal", shorthand: "Aliados", latLng: [41.1484572, -8.6107464] }},
				{ new: true,
				upsert: true }
			)
	})
}

pokeMongo.prototype.addLocation = function(location) {

	return db.collection('locations').findAndModify(

				location, {},
				{ $setOnInsert: location},
				{ new: true,
				upsert: true }
			)
};

pokeMongo.prototype.getLocationFromShorthand = function(shorthand) {
	return db.collection('locations').findOne({shorthand: shorthand}, {location: 1, latLng: 1, _id: 0})
}

pokeMongo.prototype.getAllScanningLocations = function()
{
	return db.collection('locations').find({}, {location: 1, shorthand: 1, latLng: 1}).toArray()
}

pokeMongo.prototype.getAllPokemonNearby = function(latLng)
{

	return db.collection('pokemon').find( { location: { $nearSphere: latLng, $maxDistance: 0} },{ location: 1, pokemon_data: 1, _id: 0 }).toArray()
}

pokeMongo.prototype.getLivePokemonNearby = function(latLng)
{
	console.log("Searching for pokemon near " + latLng)
	var now = Date.now()/1000
	return db.collection('pokemon').find( { location: { $nearSphere: latLng, $maxDistance: 1/6378.1}, hides_at: { $gte: now } },
	 									  { location: 1, pokemon_data: 1, hides_at: 1, _id: 0 , pokekey: 1}
	 									).toArray()

}


module.exports = pokeMongo
