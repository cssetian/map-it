
MapIt.ViewModel = function() {
  var self = this;

  self.map = ko.observable(new google.maps.Map(document.getElementById('map-canvas'), {}));

  self.airportSearchInput = ko.observable('');
  self.airportList = ko.observableArray([]);
  self.initialPosition = ko.observable();
  self.flightPath = ko.observable();

  // Initialize an array of map markers to keep track of all 3 markers on the map.
  // Google Maps API does not automatically keep track of and clean up markers on a map.
  // That must be done manually by either updating existing markers' positions or remove/readding them.
  self.mapMarkers = ko.observableArray([
    {id: 0, marker: new google.maps.Marker({map: self.map()})},
    {id: 1, marker: new google.maps.Marker({map: self.map()})},
    {id: 2, marker: new google.maps.Marker({map: self.map()})}
  ]);

  self.mapMarkers.subscribe(function(){
    if(self.anyAirportSelected()) {
      console.log('REMOVED INITIAL MAP MARKER');
      self.mapMarkers()[0].marker.setMap(null);
    } else {
      console.log('INTIIAL MAP MARKER GETTIN\' PUT BACK IN');
      self.mapMarkers()[0].marker.setMap(self.map());
      self.map().panTo(self.mapMarkers()[0].marker.position);
    }
  });

  /********************* Departure and Arrival Airport Variables **********************/
  self.departureAirportUpdateHandler = function (newAirportMarker) {
    console.log('ViewModel.DepartureAirportUpdateHandler: Updated Departure Airport!');
    if(typeof newAirportMarker === 'undefined' || newAirportMarker === null || typeof newAirportMarker.title === 'undefined') {
      self.mapMarkers()[1].marker.setMap(null);
      console.log('ViewModel.DeptUpdateHandler: No Departure Airport to plot!');
    } else {
      console.log('ViewModel.DeptUpdateHandler: Plotting new Departure Airport ' + newAirportMarker.title + ' at: (k: ' + newAirportMarker.position.k + ', A: ' + newAirportMarker.position.A + ')');
      self.mapMarkers()[1].marker.setMap(self.map());
      self.mapMarkers()[1].marker.setPosition(newAirportMarker.position);
      self.map().panTo(newAirportMarker.position);
    }
  };

  self.departureAirport = ko.observable(new MapIt.Airport(self.map(), {name: 'Departure Airport'}));
  self.departureAirport().airportMarker.subscribe(self.departureAirportUpdateHandler);
  console.log('ViewModel: Map-updating callback function for departureAirport bound to departureAirport.airportData');

  self.arrivalAirportUpdateHandler = function (newAirportMarker) {
    console.log('ViewModel.ArrivalAirportUpdateHandler: Updated Arrival Airport!');
    if(typeof newAirportMarker === 'undefined' || newAirportMarker === null || typeof newAirportMarker.title === 'undefined') {
      self.mapMarkers()[2].marker.setMap(null);
      console.log('ViewModel.ArrUpdateHandler: No Arrival Airport to plot!');
    } else {
      console.log('ViewModel.ArrUpdateHandler: Plotting new Arrival Airport ' + newAirportMarker.title + ' at: (k: ' + newAirportMarker.position.k + ', A: ' + newAirportMarker.position.A + ')');
      self.mapMarkers()[2].marker.setMap(self.map());
      self.mapMarkers()[2].marker.setPosition(newAirportMarker.position);
      self.map().panTo(newAirportMarker.position);
    }
  };

  self.arrivalAirport = ko.observable(new MapIt.Airport(self.map(), {name: 'Arrival Airport'}));
  self.arrivalAirport().airportMarker.subscribe(self.arrivalAirportUpdateHandler);
  console.log('ViewModel: Map-updating callback function for arrialAirport bound to arrivalAirport.airportData');
  /**************************************************************************************/

  /********************** Airport Existance Conditions and Helpers **********************/
  self.departureAirportSelected = ko.computed({
    read: function() {
      var _departureAirportSelected = (self.departureAirport().airportData() !== self.departureAirport().emptyData);
      console.log('DepartureAirportSelected: ' + _departureAirportSelected);
      return _departureAirportSelected;
    },
    owner: self
  });
  self.arrivalAirportSelected = ko.computed({
    read: function() {
      var _arrivalAirportSelected = (self.arrivalAirport().airportData() !== self.arrivalAirport().emptyData);
      console.log('ArrivalAirportSelected: ' + _arrivalAirportSelected);
      return _arrivalAirportSelected;
    },
    owner: self
  });
  self.anyAirportSelected = ko.computed({
    read: function() {
      var _anyAirportSelected = (self.departureAirportSelected() || self.arrivalAirportSelected());
      console.log ('AnyAirportSelected: ' + _anyAirportSelected);
      return _anyAirportSelected;
    },
    owner: self
  });
  self.twoAirportsSelected = ko.computed({
    read: function() {
      var _bothAirportsSelected = (self.arrivalAirportSelected() && self.departureAirportSelected());
      console.log('BothAirportsSelected: ' + _bothAirportsSelected);
      return _bothAirportsSelected;
    },
    owner: self
  });
  /****************************************************************************************/

  /*************************** Airport Existance Event Handlers ***************************/
  self.anyAirportSelected.subscribe(function(newVal){
    if(!self.twoAirportsSelected()) {
      if(newVal === true) {
        console.log('ViewModel.AnyAirportSelectedSubscriber: An airport was selected, removing default marker.');
        self.mapMarkers()[0].marker.setMap(null);
      } else {
        console.log('ViewModel.AnyAirportSelectedSubscriber: No airports are selected, adding default marker back into map.');
        self.mapMarkers()[0].marker.setMap(self.map());
        self.map().panTo(self.mapMarkers()[0].marker.position);
      }
    } else {
      console.log('ViewModel.AnyAirportsSelectedSubscriber: Two airports are selected. anyAirportsSelected subscriber unnecessary.');
    }
  });

  self.twoAirportsSelected.subscribe(function(newVal){
    if(newVal === true) {
      console.log('ViewModel.twoAirportsSelectedSusbscriber: Two airports are selected! Calculate route!');

      self.flightPath(new google.maps.Polyline({
        path: [self.departureAirport().airportCoords(), self.arrivalAirport().airportCoords()],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      }));
      self.flightPath().setMap(self.map());
      var bounds = new google.maps.LatLngBounds();
      bounds.extend(self.departureAirport().airportCoords());
      bounds.extend(self.arrivalAirport().airportCoords());
      self.map().fitBounds(bounds);
    } else {
      self.flightPath().setMap(null);
      if(self.departureAirportSelected()) {
        self.map().panTo(self.mapMarkers()[1].marker.position);
      } else if(self.arrivalAirportSelected()) {
        self.map().panTo(self.mapMarkers()[2].marker.position);
      }
      console.log('ViewModel.twoAirportsSelectedSubscriber: Two airports are not selected. Deal with any data updates needed.');
    }
  });

  self.distBtwnAirports = function(unit) {
    return ko.computed({
      read: function() {
        //console.log('ViewModel.distBtwnAirports: Calculating the distance between airport 1: ' 
        // + self.departureAirport().airportData().name + ' and airport 2: ' 
        // + self.arrivalAirport().airportData().name);
        if(!self.twoAirportsSelected()) {
          //console.log('ViewModel.distBtwnAirports: Error calculating distance: Make sure departure airport, arrival airport, and units are specified!');
          return '';
        }

        var p1 = new LatLon(self.departureAirport().airportData().lat, self.departureAirport().airportData().lon);
        var p2 = new LatLon(self.arrivalAirport().airportData().lat, self.arrivalAirport().airportData().lon);
        var dist = p1.distanceTo(p2);

        var distanceToReturn = dist;
        if(unit === 'M') {
          distanceToReturn = dist * 0.621371;
        } else if (unit === 'NM') {
          distanceToReturn = dist * 0.539957;
        } else if (unit === 'Km') {
          distanceToReturn = dist;
        } else {
          console.log('ViewModel.distBtwnAirports: No unit of length supplied, providing distance in Kilometers.');
        }
        var distanceToReturnTrimmed =  parseFloat(distanceToReturn).toFixed(0);
        
        // This is getting repeated multiple times because whenever departureAirport or arrivalAirport are updated/touched at all, this recomputes
        // That incldues the tests in the HTML where it checks to see if they exist before displaying the computed distances
        //console.log('ViewModel.distBtwnAirports: Distance between ' + self.departureAirport().airportData().name + ' and ' + self.arrivalAirport().airportData().name + ' is approximately: ' + distanceToReturnTrimmed + ' ' + unit);
        return distanceToReturnTrimmed;
      },

      deferEvaluation: true
    }, this);
  };
  /***************************************************************************************/

};
