
selectedLocation = null
pokemans = {}
markerPokemonsMap = {}
locations = []
markersOnMap = []
positionCircle = null


function drawCurrentLocation()
{
  if ( navigator.geolocation )
      navigator.geolocation.getCurrentPosition( centerOnPosition );
}

function centerOnPosition(position)
{
  if (positionCircle)
    positionCircle.setMap(null)

  positionCircle = new google.maps.Circle({
      strokeColor: '#0000FF',
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: '#0000AA',
      fillOpacity: 0.85,
      map: map,
      center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
      radius: 25
    });
}

function update()
{
  drawCurrentLocation()

  $.get("/locations/" + selectedLocation.shorthand + "/pokemon", function(allPokemon){
    pokemonValues = Object.keys(pokemans).map(key => pokemans[key]);

    _.filter(pokemonValues, (pokevalue) =>
      {
        return pokevalue.pokemon.hides_at*1000 < Date.now()
    }).forEach( (val) => {
      val.marker.setMap(null)
      delete pokemans[val.pokemon.pokekey]
    })

    allPokemon.forEach(function(pokemon){
      if (pokemans[pokemon.pokekey])
        return true

      var latLng = new google.maps.LatLng(pokemon.location.coordinates[0], pokemon.location.coordinates[1])

        var marker = new google.maps.Marker({
          position: latLng,
          icon: "http://localhost:27015/images/pokemon/" + pokemon.pokemon_data.pokemon_id + ".png",
          animation: google.maps.Animation.DROP
        });
        var contentString = '<div id="iw-container">' +
                    '<div class="iw-title">' + pokemon.pokemon_data.pokemon_id + '</div>' +
                    '<div class="iw-content">' +
                      '<div class="iw-subTitle">Data</div>' +
                      '<span>Despawns in roughly ' + Math.round((new Date(pokemon.hides_at * 1000) - Date.now())/1000/60, 1) + ' minutes </div>' +
                    '</div>' +
                    '<div class="iw-bottom-gradient"></div>' +
                  '</div>';

        var infowindow = new google.maps.InfoWindow({
          content: contentString
        });

        google.maps.event.addListener(marker, 'click', function() {
          infowindow = new google.maps.InfoWindow({
          content: contentString
        });
          infowindow.open(map,marker);
        });

        google.maps.event.addListener(map, 'click', function() {
          infowindow.close();
        });

        pokemans[pokemon.pokekey] = {pokemon: pokemon, marker: marker}
    })

    renderMarkers()
  })
}

function renderMarkers()
{

  Object.keys(pokemans).forEach(function(pokekey){
    var marker = pokemans[pokekey].marker
    if (marker.map != map)
    {
      marker.setMap(map)
      markersOnMap.push(marker)
    }
  })
}

$(document).ready(function(){/* google maps -----------------------------------------------------*/




google.maps.event.addDomListener(window, 'load', initialize);



function initialize()
{
  $.get('/locations/all/', function(res){
    locations = res
    res.forEach(function(loc){
      if (!selectedLocation)
      {
        selectedLocation = loc
        map.panTo(new google.maps.LatLng(selectedLocation.latLng[0], selectedLocation.latLng[1]))
        $('body').addClass('loaded');
        $('h1').css('color','#222222');
        $('#sidebar-wrapper > ul.locations').append('<a class="list-group-item active"><i class="material-icons">near_me</i><div class="bmd-list-group-col"><p class="list-group-item-heading">' + loc.shorthand + '</p><p class="list-group-item-text">location</p></div><i class="material-icons">face</i></a>')
      }
      else
      {
        $('#sidebar-wrapper > ul.locations').append('<a class="list-group-item"><i class="material-icons">near_me</i><div class="bmd-list-group-col"><p class="list-group-item-heading">' + loc.shorthand + '</p><p class="list-group-item-text">location</p></div><i class="material-icons">face</i></a>')
      }
    })

    $('body').bootstrapMaterialDesign()

    $('.sidebar-nav.locations a').on('click', function(e){
      var selectedShorthand = $(this).find('.list-group-item-heading').text()
      $('.list-group-item.active').toggleClass('active')
      $(this).toggleClass('active')
      var location = _.find(locations, function(loc){return loc.shorthand === selectedShorthand})
      selectedLocation = location
      map.panTo(new google.maps.LatLng(location.latLng[0], location.latLng[1]))

      pokemonValues = Object.keys(pokemans).map(key => pokemans[key]);
      pokemonValues.forEach(function(obj){
        obj.marker.setMap(null)
      })
      pokemans = {}
      markerPokemonsMap = {}

      update()
    })


    update()
    setInterval(update, 5000)
  })

  var latlng = new google.maps.LatLng(0, 0);

  var mapOptions = {
    center: latlng,
    scrollWheel: true,
    disableDefaultUI: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoom: 13
  };


  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);



  $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
        $(this).toggleClass("active")
    });
};

/* end google maps -----------------------------------------------------*/



});
