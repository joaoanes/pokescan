const geocoder = require('./index')('google').geocode('29 rue chevreul').then(console.log);
