
selectedLocation = null
function update()
{
  debugger
  $.get("/locations/" + selectedLocation.shorthand + "/pokemon", function(res){
    debugger
    res.forEach(function(pokemon){
      var latLng = new google.maps.LatLng(pokemon.location.coordinates[0], pokemon.location.coordinates[1])
        var marker = new google.maps.Marker({
          position: latLng,
          url: '/',
          animation: google.maps.Animation.DROP
        });
        marker.setMap(map)
    })
  })
}


$(document).ready(function(){/* google maps -----------------------------------------------------*/

  function animate() {
    $('body').addClass('loaded');
    $('h1').css('color','#222222');
  }

var locations = []


google.maps.event.addDomListener(window, 'load', initialize);


function initialize()
{
  $.get('/locations/all/', function(res){
    locations = res
    res.forEach(function(loc){
      if (!selectedLocation)
        selectedLocation = loc
      $('#sidebar-wrapper > ul').append('<li><a>' + loc.shorthand + '</a></li')

    })
  })

  /* position Amsterdam */
  var latlng = new google.maps.LatLng(52.3731, 4.8922);

  var mapOptions = {
    center: latlng,
    scrollWheel: false,
    zoom: 13
  };

  var marker = new google.maps.Marker({
    position: latlng,
    url: '/',
    animation: google.maps.Animation.DROP
  });

  $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });


  if ( navigator.geolocation )
      navigator.geolocation.getCurrentPosition( centerOnPosition );

  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  marker.setMap(map);



};

function centerOnPosition(position)
{
  center = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
  map.panTo(center)
  new google.maps.Circle({
      strokeColor: '#0000FF',
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: '#0000AA',
      fillOpacity: 0.85,
      map: map,
      center: center,
      radius: 25
    });


    animate()
}
/* end google maps -----------------------------------------------------*/



});
