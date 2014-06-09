
MapIt.ViewModel = function() {
  var self = this;

  self.dummyAirportSearches =  ko.observableArray([
        'Angular',
        'Canjs',
        'Batman',
        'Meteor',
        'Ember',
        'Backbone',
        'Knockout',
        'Knockback',
        'Spine',
        'Sammy',
        'YUI',
        'Closure',
        'jQuery']);


  self.map = ko.observable(new google.maps.Map(document.getElementById('map-canvas'), {}));
  self.bounds = ko.observable(new google.maps.LatLngBounds(null));
  self.airportList = ko.observableArray([]);
  self.initialCoords = ko.observable();
  self.initialMarker = ko.computed({
    read: function () {
      console.log('initialCoords.initialMarker: Recomputing airportMarker for initialCoords');
      if(typeof self.initialCoords() === 'undefined' || self.initialCoords() === null || self.initialCoords() === '') {
        console.log('No intiialCoords provided');
        return null;
      } else {
        var _Marker = new google.maps.Marker({ position: self.initialCoords(), title: 'Let\'s plot some maps!'});
        console.log('initialCoords.initialMarker: New Marker for initialCoords: ' + _Marker.getPosition().lat().toFixed(2) + ', ' + _Marker.getPosition().lng().toFixed(2));
        return _Marker;
      }
    },
    owner: self
  });
  self.flightPath = ko.observable(new google.maps.Polyline());
  self.clientSearchResults = ko.mapping.fromJS([]);

  self.SearchText = ko.computed({
    read: function () {
      var searchableTerms = [];
      ko.utils.arrayForEach(self.departureAirport().airportSearchResults(), function (item) {
        searchableTerms.push(item.name);
      });
      console.log('SearchableTerms:');
      console.log(searchableTerms);
      return searchableTerms;
    },
    owner: self,
    deferEvaluation: true
  });
  // Initialize an array of map markers to keep track of all 3 markers on the map.
  // Google Maps API does not automatically keep track of and clean up markers on a map.
  // That must be done manually by either updating existing markers' positions or remove/readding them.
  self.mapMarkers = ko.observable([
    {id: 0, marker: new google.maps.Marker({map: self.map()})},
    {id: 1, marker: new google.maps.Marker({map: self.map()})},
    {id: 2, marker: new google.maps.Marker({map: self.map()})}
  ]);

  self.displaySingleMarkerOnMap = function(newMarker, idx) {
    console.log('ViewModel.displaySingleMarkerOnMap: Displaying single marker!');
    self.flightPath().setMap(null);

    var i;
    for(i = 0; i < self.mapMarkers().length; i++) {
      if(i === idx) {
        console.log('ViewModel.displaySingleMarkerOnMap: Displaying marker #' + i);
        self.mapMarkers()[i].marker.setPosition(newMarker.position);
        self.mapMarkers()[i].marker.setMap(self.map());
      } else {
        self.mapMarkers()[i].marker.setMap(null);
      }
    }
      console.log('ViewModel.displaySingleMarkerOnMap: Centering on coordinate at ' + self.mapMarkers()[idx].marker.position);
      self.map().setZoom(10);
      self.map().setCenter(self.mapMarkers()[idx].marker.position);
  };

  self.displayTwoAirportsAndRouteOnMap = function(newMarker1, newMarker2, idx1, idx2) {
    console.log('ViewModel.displayTwoAirportsAndRouteOnMap: Two airports are selected! Add flight path to map!');
    self.flightPath().setMap(null);

    var i;
    for(i = 0; i < self.mapMarkers().length; i++) {
      if(i === idx1) {
        self.mapMarkers()[i].marker.setPosition(newMarker1.position);
        self.mapMarkers()[i].marker.setMap(self.map());
      } else if(i === idx2) {
        self.mapMarkers()[i].marker.setPosition(newMarker2.position);
        self.mapMarkers()[i].marker.setMap(self.map());
      } else {
        self.mapMarkers()[i].marker.setMap(null);
      }
    }
  
    self.flightPath(new google.maps.Polyline({
      path: [self.departureAirport().airportCoords(), self.arrivalAirport().airportCoords()],
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    }));
    self.flightPath().setMap(self.map());

    console.log('ViewModel.displayTwoAirportsAndRouteOnMap: Setting view bounds on map to both markers + flight path');
    self.bounds(new google.maps.LatLngBounds(null));
    self.bounds().extend(self.departureAirport().airportCoords());
    self.bounds().extend(self.arrivalAirport().airportCoords());
    console.log('ViewModel.displayTwoAirportsAndRouteOnMap: new bounds: ' + self.bounds());
    self.map().fitBounds(self.bounds());
    self.map().panToBounds(self.bounds());
  };


  /********************* Departure and Arrival Airport Variables **********************/
  // These handlers update the master markers list on the viewmodel, allowing the google map rendering to rerender itself
  // After updating the marker position and map, the other subscription event is triggered to set the bounds and pan to the appropriate window
  self.updateMapDeptMarkersHandler = function (newAirportMarker) {
    console.log('ViewModel.DepartureAirportUpdateHandler: Updated Departure Airport! Value is ----v');
    console.log(newAirportMarker);
    if(self.departureAirport().airportData() !== self.departureAirport().emptyData && self.arrivalAirport().airportData() !== self.arrivalAirport().emptyData) {
      console.log('ViewModel.DepartureAirportUpdateHandler: Two airports selected! Displaying both markers and flight route!');
      self.displayTwoAirportsAndRouteOnMap(newAirportMarker, self.arrivalAirport().airportMarker(), 1, 2);
    } else if(self.departureAirport().airportData() === self.departureAirport().emptyData && self.arrivalAirport().airportData() === self.arrivalAirport().emptyData) {
      console.log('ViewModel.DepartureAirportUpdateHandler: No airports selected! Displaying initial marker!');
      self.displaySingleMarkerOnMap(self.initialMarker(), 0);
    } else if(self.departureAirport().airportData() !== self.departureAirport().emptyData && self.arrivalAirport().airportData() === self.arrivalAirport().emptyData) {
      if(newAirportMarker !== null) {
        console.log('ViewModel.DepartureAirportUpdateHandler: One airport selected! Displaying departure airport marker!');
        self.displaySingleMarkerOnMap(newAirportMarker, 1);
      } else {
        console.log('ViewModel.DepartureAirportUpdateHandler: Departure airport de-selected! Displaying arrival airport marker!');
        self.displaySingleMarkerOnMap(self.mapMarkers()[2].marker.position, 2);
      }
    } else if(self.departureAirport().airportData() === self.departureAirport().emptyData && self.arrivalAirport().airportData() !== self.arrivalAirport().emptyData) {
      if(newAirportMarker !== null) {
        console.log('ViewModel.DepartureAirportUpdateHandler: One airport selected! Displaying arrival airport marker!');
        self.displaySingleMarkerOnMap(newAirportMarker, 2);
      } else {
        console.log('ViewModel.DepartureAirportUpdateHandler: Arrival airport de-selected! Displaying departure airport marker!');
        self.displaySingleMarkerOnMap(self.mapMarkers()[1].marker.position, 1);
      }
    }
    /*
    if(typeof newAirportMarker === 'undefined' || newAirportMarker === null || typeof newAirportMarker.title === 'undefined') {

      self.mapMarkers()[1].marker.setMap(null);
      //self.bounds().
      //self.map().panTo(self.arrivalAirport().position);
      console.log('ViewModel.DeptUpdateHandler: No Departure Airport to plot!');
    } else {
      console.log('ViewModel.DeptUpdateHandler: Plotting new Departure Airport ' + newAirportMarker.title + ' at: (k: ' + newAirportMarker.position.k.toFixed(2) + ', A: ' + newAirportMarker.position.A.toFixed(2) + ')');
      self.mapMarkers()[1].marker.setMap(self.map());
      self.mapMarkers()[1].marker.setPosition(newAirportMarker.position);
      if(self.twoAirportsSelected()) {
        // Set map to both markers
        // 
        // TRY KEEPING A BOUNDS OBJECT MAINTAINED IN THE VIEWMODEL SO THAT ANYTIME AN AIRPORT IS UPDATED, 
        // YOU ADD OR REMOVE AIRPORT COORDINATES FROM THE BOUNDS, AND THE MAP WILL AUTOMATICALLY REPOSITION 
        // ITSELF TO WHATEVER AIRPORTS ARE LEFT IN THE BOUNDS
        // 
        /*
        var bounds = new google.maps.LatLngBounds();
        bounds.extend(self.departureAirport().airportCoords());
        bounds.extend(self.arrivalAirport().airportCoords());
        self.map().fitBounds(bounds);
        *//*
      } else {
        //self.map().panTo(newAirportMarker.position);
      }
    }
    */
  };

  self.updateMapArrMarkersHandler = function (newAirportMarker) {
    console.log('ViewModel.ArrivalAirportUpdateHandler: Updated Arrival Airport! Value is ----v');
    console.log(newAirportMarker);

    if(self.departureAirport().airportData() !== self.departureAirport().emptyData && self.arrivalAirport().airportData() !== self.arrivalAirport().emptyData) {
      console.log('ViewModel.ArrivalAirportUpdateHandler: Two airports selected! Displaying both markers and flight route!');
      self.displayTwoAirportsAndRouteOnMap(self.departureAirport().airportMarker(), newAirportMarker, 1, 2);
    } else if(!self.departureAirportSelected() && !self.arrivalAirportSelected()) {
      console.log('ViewModel.ArrivalAirportUpdateHandler: No airports selected! Displaying initial marker!');
      self.displaySingleMarkerOnMap(self.initialCoords(), 0);
    } else if(self.departureAirport().airportData() !== self.departureAirport().emptyData && self.arrivalAirport().airportData() === self.arrivalAirport().emptyData) {
      if(newAirportMarker !== null) {
        console.log('ViewModel.ArrivalAirportUpdateHandler: One airport selected! Displaying arrival airport marker!');
        self.displaySingleMarkerOnMap(newAirportMarker, 2);
      } else {
        console.log('ViewModel.ArrivalAirportUpdateHandler: Arrival airport de-selected! Displaying departure airport marker!');
        console.log('this should only ever happen when going from 2-1 markers');
        self.displaySingleMarkerOnMap(self.mapMarkers()[1].marker.position, 1);
      }
    } else if(self.departureAirport().airportData() === self.departureAirport().emptyData && self.arrivalAirport().airportData() !== self.arrivalAirport().emptyData) {
      if(newAirportMarker !== null) {
        console.log('ViewModel.ArrivalAirportUpdateHandler: One airport selected! Displaying arrival airport marker!');
        self.displaySingleMarkerOnMap(newAirportMarker, 2);
      } else {
        console.log('ViewModel.ArrivalAirportUpdateHandler: Arrival airport de-selected! Displaying departure airport marker!');
        console.log('this should only ever happen when going from 2-1 markers');
        self.displaySingleMarkerOnMap(self.mapMarkers()[1].marker.position, 1);
      }
    }
  };

  self.renderMapMarkers = function(newAirportMarker) {
    if(newAirportMarker === null) {
      // Handle removing an airportMarker from the map
      if(self.departureAirport().airportData() === self.departureAirport().emptyData && self.arrivalAirport().airportData() === self.arrivalAirport().emptyData) {
        self.displaySingleMarkerOnMap(self.initialMarker(), 0);
      } else if(self.departureAirport().airportMarker() === null) {//self.departureAirport().emptyData) {
        self.displaySingleMarkerOnMap(self.arrivalAirport().airportMarker(), 1);
      } else if(self.arrivalAirport().airportMarker() === null) {//self.arrivalAirport().emptyData) {
        self.displaySingleMarkerOnMap(self.departureAirport().airportMarker(), 2);
      } else {
        console.log('App really shouldn\'t have gotten here..... there\'s no combination of logic that would yield this result...');
      }
    } else {
      // Handle an airportMarker being added to the map
      if(self.departureAirport().airportData() !== self.departureAirport().emptyData && self.arrivalAirport().airportData() !== self.arrivalAirport().emptyData) {
        self.displayTwoAirportsAndRouteOnMap(self.departureAirport().airportMarker(), self.arrivalAirport().airportMarker(), 1, 2);
      } else if(self.departureAirport().airportMarker() === newAirportMarker) {
        self.displaySingleMarkerOnMap(newAirportMarker, 1);
      } else if(self.arrivalAirport().airportMarker() === newAirportMarker) {
        self.displaySingleMarkerOnMap(newAirportMarker, 2);
      } else {
        console.log('App really shouln\'t have gotten here...... there\'s no combination of logic that would yield this result....');
        self.displaySingleMarkerOnMap(self.initialCoords(), 0);
      }
    }
    
    /*
    if(typeof newAirportMarker === 'undefined' || newAirportMarker === null || typeof newAirportMarker.title === 'undefined') {
      self.mapMarkers()[2].marker.setMap(null);
      //self.map().panTo(self.departureAirport().position);
      console.log('ViewModel.ArrUpdateHandler: No Arrival Airport to plot!');
    } else if (newAirportMarker.else {
      console.log('ViewModel.ArrUpdateHandler: Plotting new Arrival Airport ' + newAirportMarker.title + ' at: (k: ' + newAirportMarker.position.k.toFixed(2) + ', A: ' + newAirportMarker.position.A.toFixed(2) + ')');
      self.mapMarkers()[2].marker.setMap(self.map());
      self.mapMarkers()[2].marker.setPosition(newAirportMarker.position);

      if(self.twoAirportsSelected()) {
        // Set map to both markers
        /*
        var bounds = new google.maps.LatLngBounds();
        
        bounds.extend(self.departureAirport().airportCoords());
        bounds.extend(self.arrivalAirport().airportCoords());
        self.map().fitBounds(bounds);
        *//*
      } else {
        //self.map().panTo(newAirportMarker.position);
      }
    }
    */
  };

  //   IT'S BREAKING HERE BCEAUSE I CHANGED THE SUBSCRIPTION TO AIRPORTSEARCHTERM SO IT'S NOT FINDING THE MARKER TO UPDATE RESULTS WHEN IT DOES FIND SOMETHING
  self.departureAirport = ko.observable(new MapIt.Airport(self.map(), {name: 'Departure Airport'})).extend({ rateLimit: 0 });
  //self.departureAirport().airportMarker.subscribe(self.updateMapDeptMarkersHandler);
  self.departureAirport().airportMarker.subscribe(self.renderMapMarkers);
  console.log('ViewModel: Setting DepartureAirport subscribe callback function bound to departureAirport.airportData');

  self.arrivalAirport = ko.observable(new MapIt.Airport(self.map(), {name: 'Arrival Airport'})).extend({ rateLimit: 0 });
  //self.arrivalAirport().airportMarker.subscribe(self.updateMapArrMarkersHandler);
  self.arrivalAirport().airportMarker.subscribe(self.renderMapMarkers);
  console.log('ViewModel: Setting ArrivalAirport subscribe callback function bound to arrivalAirport.airportData');


  /********************** Airport Existance Conditions and Helpers **********************/
  self.departureAirportSelected = ko.computed({
    read: function() {
      var _departureAirportSelected = (self.departureAirport().airportData() !== self.departureAirport().emptyData);
      console.log('DepartureAirportSelected: ' + _departureAirportSelected);
      return _departureAirportSelected;
    },
    owner: self
  }).extend({ rateLimit: 0 });
  self.arrivalAirportSelected = ko.computed({
    read: function() {
      var _arrivalAirportSelected = (self.arrivalAirport().airportData() !== self.arrivalAirport().emptyData);
      console.log('ArrivalAirportSelected: ' + _arrivalAirportSelected);
      return _arrivalAirportSelected;
    },
    owner: self
  }).extend({ rateLimit: 0 });
  self.anyAirportSelected = ko.computed({
    read: function() {
      var _anyAirportSelected = (self.departureAirportSelected() || self.arrivalAirportSelected());
      console.log ('AnyAirportSelected: ' + _anyAirportSelected);
      return _anyAirportSelected;
    },
    owner: self
  }).extend({ rateLimit: 0 });
  self.twoAirportsSelected = ko.computed({
    read: function() {
      var _bothAirportsSelected = (self.arrivalAirportSelected() && self.departureAirportSelected());
      console.log('BothAirportsSelected: ' + _bothAirportsSelected);
      return _bothAirportsSelected;
    },
    owner: self
  }).extend({ rateLimit: 0 });

  self.oneAirportSelected = ko.computed({
    read: function() {
      var _oneAirportSelected = ((self.arrivalAirportSelected() || self.departureAirportSelected()) && !(self.departureAirportSelected() && self.arrivalAirportSelected()));
      console.log('OneAirportSelected: ' + _oneAirportSelected);
      return _oneAirportSelected;
    },
    owner: self
  }).extend({ rateLimit: 0 });
  /****************************************************************************************/


  /*
  function Option(id, name) {
    var self = this;
    self.Id = ko.observable(id);
    self.Name = ko.observable(name);
  };
  self.someOptions = ko.observableArray([
      new Option(1, 'John'),
      new Option(2, 'Johnny'),
      new Option(3, 'This is a defualt option')
  ]);


  self.departureAirport().typeaheadOptions = {
    name: 'Departure Airport Search Box',
    minLength: 0,
    remote: {
      url: self.departureAirport().airportSearchUrl(),
      filter: function(parsedResponse) {
        var dataset = [];
        for (var key in parsedResponse) {
          dataset.push({
            value: parsedResponse[key].firstName + ' ' + parsedResponse[key].surname,
            tokens: [parsedResponse[key].firstName, parsedResponse[key].surname]
          });
        }
        return dataset;
      }
    }
  };
  */
 

  /*************************** Airport Existance Event Handlers ***************************/
  /*
  self.anyAirportSelected.subscribe(function(newVal){
    if(!self.twoAirportsSelected()) {
      if(newVal === true) {
        console.log('ViewModel.AnyAirportSelectedSubscriber: An airport was selected, removing default marker.');
        self.mapMarkers()[0].marker.setMap(null);
      } else {
        console.log('ViewModel.AnyAirportSelectedSubscriber: No airports are selected, adding default marker back into map.');
        self.mapMarkers()[0].marker.setMap(self.map());
        //self.map().panTo(self.mapMarkers()[0].marker.position);
      }
    } else {
      console.log('ViewModel.AnyAirportsSelectedSubscriber: Two airports are selected. anyAirportsSelected subscriber unnecessary.');
    }
  });
  */
 
 self.singleAirportMapZoom = 5;

/*
  self.oneAirportSelected.subscribe(function(newVal){
    console.log('self.mapMarkersSubscribe.subscribe: Real subscribe is to self.oneAirportSelected: Rendering all the current markers!');
    if(self.anyAirportSelected()) {
      console.log('self.mapMarkersSubscribe.subscribe: REMOVED INITIAL MAP MARKER');
      self.mapMarkers()[0].marker.setMap(null);
    } else {
      console.log('self.mapMarkersSubscribe.subscribe: INTIIAL MAP MARKER GETTIN\' PUT BACK IN');
      console.log('self.mapMarkersSubscribe.subscribe: Re-Initializing map!');
      self.map().setZoom(10);
      self.mapMarkers()[0].marker.setMap(self.map());
      self.map().panTo(self.mapMarkers()[0].marker.position);
    }

    if(self.twoAirportsSelected()) {
      console.log('ViewModel.mapMarkersSubscribe: Two airports are selected! Add flight path to map!');

      self.flightPath(new google.maps.Polyline({
        path: [self.departureAirport().airportCoords(), self.arrivalAirport().airportCoords()],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      }));
      self.flightPath().setMap(self.map());

      console.log('ViewModel.mapMarkersSubscribe: Setting view bounds on map to both markers + flight path');
      self.bounds(new google.maps.LatLngBounds(null));
      self.bounds().extend(self.departureAirport().airportCoords());
      self.bounds().extend(self.arrivalAirport().airportCoords());
      console.log('ViewModel.mapMarkersSubscribe: new bounds: ' + self.bounds());
      //var listener = google.maps.event.addListenerOnce(self.map(), 'idle', function() { 
      //  if (self.map().getZoom() > 10) {
      //    self.map().setZoom(10);
      //  }
      //});
      self.map().fitBounds(self.bounds());
      self.map().panToBounds(self.bounds());
    } else if(self.departureAirportSelected()) {
      console.log('ViewModel.mapMarkersSubscribe: Only Departure airport selected! Removing flight path and centering on Arrival airport');
      self.flightPath().setMap(null);
      //self.bounds(new google.maps.LatLngBounds(null));
      //self.bounds().extend(self.departureAirport().airportCoords());
      //self.map().panToBounds(self.bounds());
      //self.map().setZoom(10);
      //self.map().panTo(self.departureAirport().airportCoords());
      
      self.map().setZoom(10);
      self.map().setCenter(self.departureAirport().airportCoords());
    } else if(self.arrivalAirportSelected()) {
      console.log('ViewModel.mapMarkersSubscribe: Only Arrival airport selected! Removing flight path and centering on Departure airport');
      self.flightPath().setMap(null);
      //self.bounds(new google.maps.LatLngBounds(null));
      //self.bounds().extend(self.arrivalAirport().airportCoords());
      //self.map().panToBounds(self.bounds());
      //self.map().setZoom(10);
      //self.map().panTo(self.arrivalAirport().airportCoords());
      
      self.map().setZoom(10);
      self.map().setCenter(self.arrivalAirport().airportCoords());
    } else if(!self.anyAirportSelected()) {
      console.log('ViewModel.mapMarkersSubscribe: No airport selected! Centering on current geolocation or manhattan if geolocation unavailable!');
      self.flightPath().setMap(null);
      //self.bounds(new google.maps.LatLngBounds(null));
      //self.bounds().extend(self.initialCoords());
      //self.map().panToBounds(self.bounds());
      //self.map().setZoom(10);
      //self.map().panTo(self.initialCoords());
      //
      self.map().setZoom(10);
      self.map().setCenter(self.initialCoords());
    }
    /*
    self.map().fitBounds(self.bounds());
    var listener = google.maps.event.addListenerOnce(self.map(), 'idle', function() { 
      if (self.map().getZoom() > 10) {
        self.map().setZoom(10);
      }
    });
    self.map().panToBounds(self.bounds());
    *//*

  });*/





  self.twoAirportsSelected.subscribe(function(newVal){
    if(newVal === true) {
      console.log('ViewModel.twoAirportsSelectedSusbscriber: Two airports are selected! Add flight path to map!');
/*
      self.flightPath(new google.maps.Polyline({
        path: [self.departureAirport().airportCoords(), self.arrivalAirport().airportCoords()],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      }));
      self.flightPath().setMap(self.map());
      
      console.log('ViewModel.twoAirportsSelectedSubscriber: Setting view bounds on map');
      var bounds = new google.maps.LatLngBounds();
      bounds.extend(self.departureAirport().airportCoords());
      bounds.extend(self.arrivalAirport().airportCoords());

      self.map().fitBounds(bounds);
      */
    } else {
      /*
      self.flightPath().setMap(null);

      if(self.departureAirportSelected()) {
        console.log('ViewModel.twoAirportsSelectedSubscriber: Arrival airport has been deselected. Panning to departureAirport!');

        self.map().setZoom(10);
        self.map().panTo(self.mapMarkers()[1].marker.position);

      } else if(self.arrivalAirportSelected()) {
        console.log('ViewModel.twoAirportsSelectedSubscriber: Departure airport has been deselected. Panning to arrivalAirport!');

        self.map().setZoom(10);
        self.map().panTo(self.mapMarkers()[2].marker.position);

      }
      console.log('ViewModel.twoAirportsSelectedSubscriber: Two airports are not selected. Deal with any data updates needed.');
      */
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

        var p1 = new LatLon(self.departureAirport().airportData().geometry.location.lat, self.departureAirport().airportData().geometry.location.lng);
        var p2 = new LatLon(self.arrivalAirport().airportData().geometry.location.lat, self.arrivalAirport().airportData().geometry.location.lng);
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
        
        // This is getting repeated multiple times because whenever departureAirport or arrivalAirport are updated/touched at all, this recomputes
        // That incldues the tests in the HTML where it checks to see if they exist before displaying the computed distances
        //console.log('ViewModel.distBtwnAirports: Distance between ' + self.departureAirport().airportData().name + ' and ' + self.arrivalAirport().airportData().name + ' is approximately: ' + distanceToReturnTrimmed + ' ' + unit);
        var distanceToReturnTrimmed =  parseFloat(distanceToReturn).toFixed(2);
        return distanceToReturnTrimmed;
      },

      deferEvaluation: true
    }, this);
  };
  /***************************************************************************************/

};
