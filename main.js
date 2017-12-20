var app = angular.module('flightSearchApp', []);

app.service('ftSearchService', ['$http', '$q', '$timeout', function($http, $q, $timeout) {

	this.airportsCodes = [];
	this.flightDataStore = [];
	var ftsService = this;
	this.getAirportCodes = function() {
		var d = $q.defer();
		if ( ftsService.airportsCodes.length > 0 ) {
			$timeout(function() {
				d.resolve(ftsService.airportsCodes);
        	},0);
		} else {
			$http.get("codes.json")
				 .then(function(res) { 
				 	ftsService.airportsCodes = res.data.airports;
				 	d.resolve(ftsService.airportsCodes); 
				 });
		}
		return d.promise;
	}

	this.getFlightsData = function() {
		var d = $q.defer();

		if ( ftsService.flightDataStore.length > 0 ) {
			$timeout(function() {
          		d.resolve(ftsService.flightDataStore);
        	},0);
		} else {
			$http.get("flights.json")
			     .then(function(res) {
			   		if (res && res.data && res.data.flights){
			   			ftsService.flightDataStore = res.data.flights;
						d.resolve(ftsService.flightDataStore);
					}
			      });
		}
		return d.promise;;
	}

}]);

app.controller('mainCtrl', ['$scope', 'ftSearchService', function($scope, ftSearchService) {
	var flightDataStore;
	
	$scope.errors = [];
	$scope.validateDestination = function() {
		if ($scope.ftInput.origin == $scope.ftInput.destination)
			$scope.errors.push('Source and Destination cannot be the same');
		else
			$scope.errors = [];
	};

	$scope.bookFlight = function(){
		alert('Booked!! ;)');
	}

	$scope.searchFlights = function() {
		$scope.flights = _filterFightresults(flightDataStore);
		$scope.flightInfo    = ($scope.ftInput.origin + " > " +	$scope.ftInput.destination)
								+	($scope.ftInput.roundTrip ?  (" > " + $scope.ftInput.origin) : ''); 
	};

	function _filterFightresults(ftData){
		
		if (!ftData || ftData.length < 0)
			return [];

		ipData = $scope.ftInput;

		if( ipData.roundTrip ) {
			let onwardJCode = ipData.origin + '-'+ ipData.destination;
			let onFlights = getThisRouteFlights(onwardJCode, ipData.departureDate, ipData.passengersCnt);

			let retunJCode = ipData.destination + '-'+ ipData.origin;
			let rtFlights = getThisRouteFlights(retunJCode, ipData.returnDate, ipData.passengersCnt);

			let roundTripOptions = [];
			onFlights.forEach(function(oft){
				rtFlights.forEach(function(rft){
					let rTripOption = {
						round_trip : true,
						onward : angular.copy(oft.onward),
						return : angular.copy(rft.onward)
					}
					rTripOption.rt_price = (rTripOption.onward.price + rTripOption.return.price) * 0.95;
					roundTripOptions.push(rTripOption);
				});


			});
			//console.dir(roundTripOptions);
			return roundTripOptions;
			
		} else {
			if (  !ipData.origin || !ipData.destination || !ipData.departureDate)  return [];
			
			let code = ipData.origin + '-'+ ipData.destination;

			return getThisRouteFlights(code, ipData.departureDate, ipData.passengersCnt);	
		}
	}



	function getThisRouteFlights(code, date, count) {
		let flights = []
		if (  !code || !date )  return flights;

		flightDataStore.forEach(function(fts){			
			if (fts.code == code && fts.date == date && fts.available_seats > count ) {
				flights.push({onward : fts});
			}
		});

		return flights;

	}

	function _init(){
		ftSearchService
			.getAirportCodes()
			.then(function(apCodes) { $scope.airportCodes = apCodes });

		ftSearchService
			.getFlightsData()
			.then(function(flights) {
					flightDataStore = flights;
					$scope.flights = _filterFightresults(flightDataStore);
			});
		
		_initInputData();
		$scope.psCountList = [1,2,3,4,5,6,7,8,9];
		$scope.flightInfo    = "Pune > Delhi > Pune";

	}

	function _initInputData() {
        $scope.ftInput = {};
        $scope.ftInput.origin = "PNQ";
        $scope.ftInput.destination = "DEL";
        $scope.ftInput.roundTrip = true;
        $scope.ftInput.departureDate = "05/15/2017";
        $scope.ftInput.returnDate = "05/18/2017";
        $scope.ftInput.passengersCnt = "1";

        $scope.ftInput.minPrice = 1000;
        $scope.ftInput.maxPrice = 8000;
    }

    _init();

}]);

app.directive('ftTile', function () {
	return {
	  templateUrl: 'ft_tile.html',
	  restrict: 'E',
	  scope: {
	       ft : '=info',
	       bookThis : '&bookAction'
	  	}
	};
});


app.filter('applyPriceRange', function() {
  return function(flights,ftInput) {
  	let minPr = parseInt(ftInput.minPrice);
  	let maxPr = parseInt(ftInput.maxPrice);

  	if (!minPr || !maxPr ) return flights;
  	if ( minPr > maxPr || !Array.isArray(flights)) return [];

  	return flights.filter(function(ft) {
  		if (ft.round_trip) 
  			return (minPr < ft.rt_price) && (ft.rt_price < maxPr);
  		else 
  			return (minPr < ft.onward.price) && (ft.onward.price < maxPr);
  	})
    
  };
})


 $(function(){ 
 	$("#departDate").datepicker();
 	$("#returnDate").datepicker();
 }); 
