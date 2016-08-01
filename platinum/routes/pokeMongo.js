var MongoClient = require('mongodb').MongoClient
var pokemonList = require('../pokemon.json')
var _ = require('underscore')

function pokeMongo(url)
{
	this.url = url || 'mongodb://localhost:27017/pokemon';
	MongoClient.connect(this.url).then(function(db, err) {
		this.db = db;
		db.collection('locations').findAndModify(

				{ shorthand: "Areosa" }, {},
				{ $setOnInsert: { persist: true, location: "Igreja da Areosa, Porto, Portugal", shorthand: "Areosa", latLng: [41.1760511, -8.586719]}},
				{ new: true,
				upsert: true }
			)
		db.collection('locations').findAndModify(

				{shorthand: "FEUP" }, {},
				{ $setOnInsert: { persist: true, location: "Faculdade de Engenharia, Porto, Portugal", shorthand: "FEUP", latLng: [41.1785734, -8.5962233]}},
				{ new: true,
				upsert: true }
			)
		db.collection('locations').findAndModify(

				{ shorthand: "Aliados" }, {},
				{ $setOnInsert: { persist: true, location: "Avenida dos Aliados, Porto, Portugal", shorthand: "Aliados", latLng: [41.1484572, -8.6107464] }},
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
	return db.collection('locations').findOne({shorthand: shorthand}, {location: 1, latLng: 1, shorthand: 1, persist: 1, _id: 0})
}

pokeMongo.prototype.getAllScanningLocations = function()
{
	return db.collection('locations').find({persist: true}, {location: 1, shorthand: 1, latLng: 1, persist: 1}).toArray()
}

pokeMongo.prototype.getAllLocations = function()
{
	return db.collection('locations').find({}, {location: 1, shorthand: 1, latLng: 1, persist: 1}).toArray()
}

pokeMongo.prototype.getAllPokemonNearby = function(latLng)
{

	return db.collection('pokemon').find( { location: { $nearSphere: latLng, $maxDistance: 1/6378.1} },{ location: 1, pokemon_data: 1, spawn_point_id: 1, _id: 0, pokekey: 1 }).map( (db_pokemon) => {

		db_pokemon.pokemon_name = _.find(pokemonList, (pokemon) => { return pokemon.id == db_pokemon.pokemon_data.pokemon_id } ).identifier
		db_pokemon.pokemon_name = db_pokemon.pokemon_name.charAt(0).toUpperCase() + db_pokemon.pokemon_name.slice(1)
		return db_pokemon

	}).toArray()
}

pokeMongo.prototype.getLivePokemonNearby = function(latLng)
{
	var now = Date.now()/1000
	return db.collection('pokemon').find( { location: { $nearSphere: latLng, $maxDistance: 1/6378.1}, hides_at: { $gte: now } },
	 									  { location: 1, pokemon_data: 1, hides_at: 1, spawn_point_id: 1, _id: 0 , pokekey: 1}
	 									).map( (db_pokemon) => {

		db_pokemon.pokemon_name = _.find(pokemonList, (pokemon) => { return pokemon.id == db_pokemon.pokemon_data.pokemon_id } ).identifier
		db_pokemon.pokemon_name = db_pokemon.pokemon_name.charAt(0).toUpperCase() + db_pokemon.pokemon_name.slice(1)
		return db_pokemon
	}).toArray()

}


module.exports = pokeMongo
