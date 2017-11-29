$(function () {
    var deg = 'c';
    var weatherDiv = $('#weather');
    var location = $('p.location');


    /**
     * get the user's current location, shows an error if the browser does not support Geolocation
     */
    function getLocation(): void {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(locationSuccess, locationError)
        } else {
            showError("Your browser does not support Geolocation!");
        }
    }

    function locationSuccess(position) {
        try {
            // instead of caching the results and maybe using old data,
            // I want to call the api everytime someone wants to see the weather
            var cache:boolean = sessionStorage.weatherCache && JSON.parse(sessionStorage.weatherCache);
            var date:Date = new Date();

        }
    };


    /**
     * error handling functions
     * @param error
     */
    function locationError(error):void {
        switch (error.code) {
            case error.TIMEOUT:
                showError("A timeout occured! Please try again!");
                break;
            case error.POSITION_UNAVAILABLE:
                showError('We can\'t detect your location. Sorry!');
                break;
            case error.PERMISSION_DENIED:
                showError('Please allow geolocation access for this to work.');
                break;
            case error.UNKNOWN_ERROR:
                showError('An unknown error occured!');
                break;
        }
    };

    function showError(msg) {
        weatherDiv.addClass('error').html(msg);
    };

    /**
     * formats the time from 24hr to 12hr with AM / PM
     * @returns {string} the current day and time in DAY_OF_THE_WEEK MONTH DAY HOUR MINS AMPM
     */
    function formatTimeIntoAMPM():string {
      var date:Date         = new Date();
      var minutes:number    = date.getMinutes.toString().length === 1 ? '0' + date.getMinutes() : date.getMinutes();
      var hours:number      = date.getHours().toString().length == 1 ? '0' + date.getHours() : date.getHours();
      var ampm:string       = date.getHours() >= 12 ? 'pm' : 'am';
      var months:string     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var days:string       = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

      var combinedDate:string = days[date.getDay() + ' ' + months[date.getMonth()] + ' ' + date.getDate() + ' ' + hours + minutes + ampm]

      return combinedDate;

    };
})