import {WeatherData} from "./WeatherData"
import $ = require("jquery");

$(document).ready(function () {
    var deg = 'c';
    var weatherDiv = $('#weather');
    var location = $('p.location');

    getLocation();

    // $("#findWeatherButton").click(function () {
    //     getLocation();
    // });

    /**
     * called when the user clicks the "find weather" button
     * get the user's current location, shows an error if the browser does not support Geolocation
     */
    function getLocation() {
        document.getElementById("filler").innerHTML = "is this showing up?";
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
        } else {
            showError("Your browser does not support Geolocation!");
        }
    }

    /**
     * callback function for when getting the geolocation (ie. lat and lon) succeed
     * @param position
     * @returns {Promise<void>}
     */
    function locationSuccess(position: any): WeatherData {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        try {
            return new Promise(function (resolve: any, reject: any) {
                // instead of caching the results and maybe using old data,
                // I want to call the api every time someone wants to see the weather

                $.getJSON("api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon, function (weatherResponse) {
                    resolve(weatherResponse);
                });

            }).then(function (weatherResponse: any) {
                var weatherData = new WeatherData();
                var assignedWeatherData: WeatherData = setWeatherDataHelper(weatherData, weatherResponse);
                displayCurrentCity(assignedWeatherData);
                //displayWeatherData(assignedWeatherData);
            });
        } catch (err) {
            showError("We can't find information about your city!");
        }
    };

    /**
     * Helper function to set the weather data to their variables
     * @param {WeatherData} weatherData the data structure that holds all the data related to weather
     * @param {string} weatherResponse the JSON string that we are returned from the GET request
     * @returns {WeatherData} the data structure with it's variables assigned
     */
    function setWeatherDataHelper(weatherData: WeatherData, weatherResponse: any): WeatherData {
        var date = new Date();
        console.log("created a new Date object");
        weatherData.date = formatTimeIntoAMPM(date);
        weatherData.city = weatherResponse.city.name;
        weatherData.country = weatherResponse.country;
        weatherData.temperature = weatherResponse.list.main.temp;
        weatherData.minTemperature = weatherResponse.list.main.temp_min;
        weatherData.maxTemperature = weatherResponse.list.main.temp_max;
        weatherData.weather = weatherResponse.list.weather.id;
        weatherData.weatherIcon = weatherResponse.list.weather.icon;
        return weatherData;
    }

    /**
     * error handling functions
     * @param error
     */
    function locationError(error: any): void {
        switch (error.code) {
            case error.TIMEOUT:
                showError("A timeout occurred! Please try again!");
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

    function showError(msg: any) {
        weatherDiv.addClass('error').html(msg);
    };

    /**
     * formats the time from 24hr to 12hr with AM / PM
     * @returns {string} the current day and time in DAY_OF_THE_WEEK MONTH DAY HOUR MINS AMPM
     */
    function formatTimeIntoAMPM(date: Date): string {
        console.log("got into format time method");
        var minutes: string|number = date.getMinutes.toString().length === 1 ? '0' + date.getMinutes() : date.getMinutes();
        var hours: string|number = date.getHours().toString().length == 1 ? '0' + date.getHours() : date.getHours();
        var ampm: string = date.getHours() >= 12 ? 'pm' : 'am';
        var months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        var combinedDate: string = date.getDay() + ' ' + months[date.getMonth()] + ' ' + date.getDate() + ' ' + hours + minutes + ampm;
        return combinedDate;

    };

    function displayWeatherData(assignedWeatherData: WeatherData): void {
        // don't actually have to display all the fields of WeatherData ds, just want some of them

    };

    function displayCurrentCity(assignedWeatherData: WeatherData): void {
        console.log("got into displayCurrentCity method")
        var element = document.getElementById("currentCity");
        element.innerHTML = assignedWeatherData.city + ", " + assignedWeatherData.country ;
    }
});
// An id should be unique within a page,
// so you should use the #id selector when you want to find a single, unique element.