
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
  $.get('/locations/all/', function(allLocations){
    allLocations.forEach(function(richLocation){

    })
  })

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
          icon: "/images/pokemon/" + pokemon.pokemon_data.pokemon_id + ".png",
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



function updateLocations()
{
  return $.get('/locations/all/', function(res){
    locations = res
    res.forEach(function(loc){
      if (!selectedLocation)
      {
        selectedLocation = loc.location
        map.panTo(new google.maps.LatLng(selectedLocation.latLng[0], selectedLocation.latLng[1]))
        $('body').addClass('loaded');
        $('h1').css('color','#222222');
        $('#sidebar-wrapper > ul.locations').append('<span class="list-group-item active loc-' + loc.location.shorthand + (loc.location.persist ? ' persist' : '') + '"><a href="/locations/' + loc.location.shorthand + '/engage/"><i class="material-icons">near_me</i></a><div class="bmd-list-group-col"><p class="list-group-item-heading">' + loc.location.shorthand + '</p><p class="list-group-item-text">' + loc.scan.status + '</p></div><i class="material-icons">gps_fixed</i></span>')
        $('ul.locations .loc-' + loc.location.shorthand).removeClass("scanning")
        $('ul.locations .loc-' + loc.location.shorthand).removeClass("finishing")
        $('ul.locations .loc-' + loc.location.shorthand).removeClass("scanned")
        $('ul.locations .loc-' + loc.location.shorthand).removeClass("starting")

        $('ul.locations .loc-' + loc.location.shorthand).addClass(loc.scan.status)

      }
      else
      {
        if ($('ul.locations .loc-' + loc.location.shorthand).length > 0)
        {

          $('ul.locations .loc-' + loc.location.shorthand).removeClass("scanning")
          $('ul.locations .loc-' + loc.location.shorthand).removeClass("finishing")
          $('ul.locations .loc-' + loc.location.shorthand).removeClass("scanned")
          $('ul.locations .loc-' + loc.location.shorthand).removeClass("starting")

          $('ul.locations .loc-' + loc.location.shorthand).addClass(loc.scan.status)

          if (loc.scan.status == "scanning")
          {
            var text = "scanning (" + loc.scan.payload.percentage + "%)"
          }
          else if (loc.scan.status == "scanned")
          {
            var date = new Date(loc.scan.last_scan)
            var text = "last scanned at " + date.getHours() + ":" + date.getMinutes()
          }
          else
          {
            var text = loc.scan.status
          }
          $('ul.locations .loc-' + loc.location.shorthand).find('.list-group-item-text').text(text)
        }
        else
        {
          if (loc.scan.status == "scanning")
          {
            var text = "scanning (" + loc.scan.payload.percentage + "%)"
          }
          else if (loc.scan.status == "scanned")
          {
            var text = "last scanned at " + new Date(loc.scan.last_scan)
          }
          else if (!loc.scan.status) {
            var text = "no data"
          }
          else
          {
            var text = loc.scan.status
          }
          $('#sidebar-wrapper > ul.locations').append('<span class="list-group-item loc-' + loc.location.shorthand + " " + (loc.location.persist ? ' persist' : '') + '"><a data-toggle="tooltip" data-placement="right" title="" data-original-title="Scan" href="/locations/' + loc.location.shorthand + '/engage/"><i class="material-icons">near_me</i></a><div class="bmd-list-group-col"><p class="list-group-item-heading">' + loc.location.shorthand + '</p><p class="list-group-item-text">' + text + '</p></div><i class="material-icons">gps_fixed</i></span>')
          $('ul.locations .loc-' + loc.location.shorthand).addClass(loc.scan.status)
        }
      }
    })
  })
}

$(document).ready(function(){/* google maps -----------------------------------------------------*/




google.maps.event.addDomListener(window, 'load', initialize);


function initialize()
{

  updateLocations().then(function(){

    $('body').bootstrapMaterialDesign()

    $('.sidebar-nav.locations span').on('click', function(e){
      var selectedShorthand = $(this).find('.list-group-item-heading').text()
      $('.list-group-item.active').toggleClass('active')
      $(this).toggleClass('active')
      var location = _.find(locations, function(loc){return loc.location.shorthand === selectedShorthand})
      selectedLocation = location.location
      map.panTo(new google.maps.LatLng(location.location.latLng[0], location.location.latLng[1]))

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
    setInterval(updateLocations, 500)
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
