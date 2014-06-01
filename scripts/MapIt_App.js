/*

  Statements that begin with the token function are 
    always considered to be function declarations. 
  Including () creates a function expression instead

 */
var MapIt = MapIt || {};

MapIt.App = (function($, _, ko) {

  var viewModel;

  var _init = function (options) {
    _initAirportRefData(options);

    viewModel = new MapIt.ViewModel();

    // If geolocation is available in this browser, set the initial marker to that person's location
    // Otherwise, set location to Manhattan
    if ('geolocation' in navigator) {
      console.log('MapModel.init: Found Geolocation!');
      navigator.geolocation.getCurrentPosition(_geoLocationCallback);
    } else {
      console.log('MapModel.init: Geolocation not available!');
    }

    console.log('Creating initial position for map');
    var _initialLatLong = new google.maps.LatLng(40.7056308,-73.9780035);
    viewModel.initialPosition(_initialLatLong);
    viewModel.mapMarkers()[0].marker.setPosition(viewModel.initialPosition());

    console.log('Initializing map!');
    viewModel.map().setZoom(10);
    viewModel.map().setCenter(viewModel.initialPosition());
    console.log('Initialized map with default position in Manhattan: ' + viewModel.mapMarkers()[0].marker.position);//+ viewModel.initialPosition());

    ko.applyBindings(viewModel);
    options.domEls.appContainer.fadeIn(50);
  };

  var _initAirportRefData = function(options) {
    console.log('Initializing airport datalist and appending elements to dropdown selects');

    _.each(options.airportsJSON, function(airport) {
      options.domEls.departureAirportsList.append('<option>' + airport.name + '</option>');
      options.domEls.arrivalAirportsList.append('<option>' + airport.name + '</option>');
    });
    console.log('Completed airport datalist initialization');
  };

  var _geoLocationCallback = function(position) {
    console.log('MapModel.GeoLocationCallback: Retrieved initial position via geolocation!');
    if(!viewModel.anyAirportSelected()) {
      var _geoLocatedPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      viewModel.mapMarkers()[0].marker.setPosition(_geoLocatedPosition);

      viewModel.initialPosition(_geoLocatedPosition);
      console.log('MapModel.GeoLocationCallback: Your current location is: ' + viewModel.initialPosition() + '!');

      console.log('MapModel.GeoLocationCallback: Moving center of map to: ' + viewModel.initialPosition());
      viewModel.map().panTo(viewModel.initialPosition());
    } else {
      console.log('MapModel.GeoLocationCallback: User has already selected an airport, will not update default position with geolocation.');
    }
  };

  return { init: _init };
})(jQuery, _, ko);
