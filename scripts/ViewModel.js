
MapIt.ViewModel = function(options) {
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
        console.log('No initialCoords provided');
        return null;
      } else {
        var _Marker = new google.maps.Marker({ position: self.initialCoords(), title: 'Let\'s plot some maps!'});
        console.log('initialCoords.initialMarker: New Marker for initialCoords: ' + _Marker.getPosition().lat().toFixed(2) + ', ' + _Marker.getPosition().lng().toFixed(2));
        return _Marker;
      }
    },
    owner: self,
    deferEvaluation: true
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

  console.log('ViewModel: Defining marker rendering helper and main functions');

  self.displaySingleMarkerOnMap = function(newMarker, idx) {
    console.log('ViewModel.displaySingleMarkerOnMap: Displaying single marker!');
    self.flightPath().setMap(null);

    var i;
    for(i = 0; i < self.mapMarkers().length; i++) {
      if(i === idx && newMarker !== null) {
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

  self.renderMapMarkers = function(newAirportData) {
    console.log('ViewModel.renderMapMarkers: RENDERING MAP MARKERS');
    if(newAirportData === self.departureAirport.emptyData) {
      // Handle removing an airportMarker from the map
      if(self.departureAirport().currentSelectionObj() === self.departureAirport().emptyData && self.arrivalAirport().currentSelectionObj() === self.arrivalAirport().emptyData) {
        self.displaySingleMarkerOnMap(self.initialMarker(), 0);
      } else if(self.departureAirport().currentSelectionObj() === newAirportData) {//self.departureAirport().emptyData) {
        self.displaySingleMarkerOnMap(self.arrivalAirport().airportMarker(), 1);
      } else if(self.arrivalAirport().currentSelectionObj() === newAirportData) {//self.arrivalAirport().emptyData) {
        self.displaySingleMarkerOnMap(self.departureAirport().airportMarker(), 2);
      } else {
        console.log('App really shouldn\'t have gotten here..... there\'s no combination of logic that would yield this result...');
      }
    } else {
      // Handle an airportMarker being added to the map
      if(self.departureAirport().currentSelectionObj() !== self.departureAirport().emptyData && self.arrivalAirport().currentSelectionObj() !== self.arrivalAirport().emptyData) {
        self.displayTwoAirportsAndRouteOnMap(self.departureAirport().airportMarker(), self.arrivalAirport().airportMarker(), 1, 2);
      } else if(self.departureAirport().currentSelectionObj() === newAirportData) {
        self.displaySingleMarkerOnMap(self.departureAirport().airportMarker(), 1);
      } else if(self.arrivalAirport().currentSelectionObj() === newAirportData) {
        self.displaySingleMarkerOnMap(self.arrivalAirport().airportMarker(), 2);
      } else {
        console.log('App really shouldn\'t have gotten here...... there\'s no combination of logic that would yield this result....');
      }
    }
  };

  // Bind airportMarker events so that viewModel map markers are updated and rerendered on the map
  console.log('ViewModel: Setting DepartureAirport subscribe callback function bound to departureAirport.airportData');
  self.departureAirport = ko.observable(new MapIt.Airport(self.map(), {name: 'Departure Airport'})).extend({ rateLimit: 0 });
  self.departureAirport().currentSelectionObj.subscribe(self.renderMapMarkers);

  console.log('ViewModel: Setting ArrivalAirport subscribe callback function bound to arrivalAirport.airportData');
  self.arrivalAirport = ko.observable(new MapIt.Airport(self.map(), {name: 'Arrival Airport'})).extend({ rateLimit: 0 });
  self.arrivalAirport().currentSelectionObj.subscribe(self.renderMapMarkers);


  // Define the typeahead options for both departure and arrival airports
  console.log('ViewModel: Defining typeahead options');
  var departureGenericTypeAheadOptions = {
    //hint: true,
    highlight: true,
    minLength: 2,
    highlighter: function (item) {
      var regex = new RegExp( '(' + this.query + ')', 'gi' );
      return item.replace( regex, '<mark>$1</mark>' );
    }
  };
  var departureSpecificTypeAheadOptions = {
    // `ttAdapter` wraps the suggestion engine in an adapter that
    // is compatible with the typeahead jQuery plugin
    source: self.departureAirport().airportSearch.ttAdapter(),
    name: 'departureAirports',
    displayKey: 'value',
    hint: false,
    engine: Handlebars,
    templates: {
      empty: [
        '<div class="empty-message">',
        'unable to find any Airports that match the search term',
        '</div>'
      ].join('\n'),
      suggestion: Handlebars.compile([
        '<div>',
        '<span class=\'typeahead-airport-name\'>{{name}} - ({{code}})</span>',
        '</div>',
        '<div>',
        '<span class=\'typeahead-airport-state\'>{{city}}, {{state}}</span> - <span class=\'typeahead-airport-country\'>{{country}}</span>',
        '</div>'
      ].join('\n')),
      header: '<h4>Airports</h4>'
    }
  };
  var arrivalGenericTypeAheadOptions = {
    //hint: true,
    highlight: true,
    minLength: 2/*\\,
    updater: function(item) {
      console.log('TypeAhead.ArrivalAirportSelector.Updater: Updated typeahead serach term! Setting viewmodel search term.');
      console.log(item);
      self.arrivalAirport().airportSearchTerm(item.value);
      return item;
    }*/,
    highlighter: function (item) {
      var regex = new RegExp( '(' + this.query + ')', 'gi' );
      return item.replace( regex, '<mark>$1</mark>' );
    }
  };
  var arrivalSpecificTypeAheadOptions = {
    // `ttAdapter` wraps the suggestion engine in an adapter that
    // is compatible with the typeahead jQuery plugin
    source: self.arrivalAirport().airportSearch.ttAdapter(),
    name: 'arrivalAirports',
    displayKey: 'value',
    engine: Handlebars,
    templates: {
      empty: [
        '<div class="empty-message">',
        'unable to find any Airports that match the search term',
        '</div>'
      ].join('\n'),
      suggestion: Handlebars.compile([
        '<div>',
        '<span class=\'typeahead-airport-name\'>{{name}} - ({{code}})</span>',
        '</div>',
        '<div>',
        '<span class=\'typeahead-airport-state\'>{{city}}, {{state}}</span> - <span class=\'typeahead-airport-country\'>{{country}}</span>',
        '</div>'
      ].join('\n')),
      header: '<h3>Airports</h3>'
    }
  };

  console.log('ViewModel: Initializing typeaheads');
  // Initialize the typeahead search inputs
  options.domEls.departureSearch.typeahead(departureGenericTypeAheadOptions, departureSpecificTypeAheadOptions)
    .on('typeahead:opened', self.departureAirport().onOpened)
    .on('typeahead:selected', self.departureAirport().onSelected)
    .on('typeahead:autocompleted', self.departureAirport().onAutocompleted)
    .on('typeahead:closed', self.departureAirport().onClosed);
  options.domEls.arrivalSearch.typeahead(arrivalGenericTypeAheadOptions, arrivalSpecificTypeAheadOptions)
    .on('typeahead:opened', self.arrivalAirport().onOpened)
    .on('typeahead:selected', self.arrivalAirport().onSelected)
    .on('typeahead:autocompleted', self.arrivalAirport().onAutocompleted)
    .on('typeahead:closed', self.arrivalAirport().onClosed);


  self.departureAirport().registerEnterKeyAutocomplete(options.domEls.departureSearch);
  self.arrivalAirport().registerEnterKeyAutocomplete(options.domEls.arrivalSearch);


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

  self.twoAirportsSelected.subscribe(function(newVal){
    if(newVal === true) {
      console.log('ViewModel.twoAirportsSelectedSusbscriber: Two airports are selected! Add flight path to map!');
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

        var p1 = new LatLon(self.departureAirport().airportData().lat, self.departureAirport().airportData().lng);
        var p2 = new LatLon(self.arrivalAirport().airportData().lat, self.arrivalAirport().airportData().lng);
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
