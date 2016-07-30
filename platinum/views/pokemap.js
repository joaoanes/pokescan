
var selectedLocation = null
var pokemans = {}
var markerPokemonsMap = {}
var locations = []
var markersOnMap = []
var positionCircle = null
var map
var pokemonValues

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
    pokemonValues = Object.keys(pokemans).map( key => pokemans[key]);

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

        if (loc.scan.status == "scanning")
          {
            var text = "scanning (" + loc.scan.payload.percentage + "%)"
          }
          else if (loc.scan.status == "scanned")
          {
            var date = new Date(loc.scan.last_scan)
            var text = "last scanned at " + date.getHours() + ":" + date.getMinutes()
          }
          else if (!loc.scan.status) {
            var text = "no data"
          }
          else
          {
            var text = loc.scan.status
          }

        $('#sidebar-wrapper > ul.locations').append('<span class="list-group-item active loc-' + loc.location.shorthand + (loc.location.persist ? ' persist' : '') + '"><a class="scan-button" href="#" data-href="/locations/' + loc.location.shorthand + '/engage/"><i class="material-icons">near_me</i></a><div class="bmd-list-group-col"><p class="list-group-item-heading">' + loc.location.shorthand + '</p><p class="list-group-item-text">' + text + '</p></div><i class="material-icons">gps_fixed</i></span>')

        clearStatusClasses($('ul.locations .loc-' + loc.location.shorthand),loc.scan.status)

      }
      else
      {
        if ($('ul.locations .loc-' + loc.location.shorthand).length > 0)
        {
          clearStatusClasses($('ul.locations .loc-' + loc.location.shorthand),loc.scan.status)


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
          $('#sidebar-wrapper > ul.locations').append('<span class="list-group-item loc-' + loc.location.shorthand + " " + (loc.location.persist ? ' persist' : '') + '"><a class="scan-button" data-toggle="tooltip" data-placement="right" title="" data-original-title="Scan" href="#" data-href="/locations/' + loc.location.shorthand + '/engage/"><i class="material-icons">near_me</i></a><div class="bmd-list-group-col"><p class="list-group-item-heading">' + loc.location.shorthand + '</p><p class="list-group-item-text">' + text + '</p></div><i class="material-icons">gps_fixed</i></span>')
          $('ul.locations .loc-' + loc.location.shorthand).addClass(loc.scan.status)
        }
      }
    })
  })
}

function clearStatusClasses($element,className)
{
  $element.removeClass("scanning")
  $element.removeClass("finishing")
  $element.removeClass("scanned")
  $element.removeClass("starting")
  if (className !== null)
  {
    $element.addClass(className);
  }
}

$(document).ready(function(){

  $(document).on("click", "a.scan-button", function(ev) {
    var $a=$(this);
    $.getJSON($a.data("href"),function(data)
    {
      clearStatusClasses($a.parent(),"starting")
    });
  });


/* google maps -----------------------------------------------------*/

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
    var updateInterval = 5000;
    var updateLocationsInterval = 500;
    if (window.mobilecheck())
    {
      updateInterval = 7500;
      updateLocationsInterval = 5000;
      //TODO: maybe make /locations/all 250kb in size?
    }
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


window.mobilecheck = function() {
  var check = false;
  //this shit is fucking ridiculous, I bet it adds like 2mb to the js payload
  //Some people, when confronted with a problem, think "I know, I'll use regular expressions." Now they have two problems. -- Jamie Zawinski
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}
