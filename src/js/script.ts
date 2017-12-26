import {WeatherData} from "./WeatherData"
import $ = require("jquery");

const months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const daysShort: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


$(document).ready(function () {
    var deg = 'c';
    var weatherDiv = $('#weather');
    var location = $('p.location');

    getLocation();

    // TODO: implement button functionality when everything ELSE is implemented
    // $("#findWeatherButton").click(function () {
    //     getLocation();
    // });

    /**
     * called when the user clicks the "find weather" button
     * get the user's current location, shows an error if the browser does not support Geolocation
     */
    function getLocation() {
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
    function locationSuccess(position: any) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        try {
            return new Promise(function (resolve: any, reject: any) {
                // instead of caching the results and maybe using old data,
                // I want to call the api every time someone wants to see the weather

                $.getJSON("https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon +
                    "&appid=178e8d4180edebe4e2c02fcad75b72fd", function (weatherResponse) {
                    console.log("weatherResponse is: ");
                    console.log(weatherResponse);
                    resolve(weatherResponse);
                });

            }).then(function (weatherResponse: any) {
                var weatherData = new WeatherData();
                var generalWeatherData = setGeneralInformation(weatherData, weatherResponse);
                var assignedWeatherData: WeatherData = setSingleDateWeatherDataHelper(generalWeatherData, weatherResponse);
                console.log(".then weatherResponse is: ");
                console.log(weatherResponse);
                console.log(".then assingedWeatherData is: ");
                console.log(assignedWeatherData);


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
    function setSingleDateWeatherDataHelper(weatherData: WeatherData, weatherResponse: any): WeatherData {
        weatherData.temperature = weatherResponse.list.main.temp;
        weatherData.minTemperature = weatherResponse.list.main.temp_min;
        weatherData.maxTemperature = weatherResponse.list.main.temp_max;
        weatherData.weather = weatherResponse.list.weather.id;
        weatherData.weatherIcon = weatherResponse.list.weather.icon;
        return weatherData;
    }

    /**
     * Sets the general information that is the same for all days of the week such as city and country
     * @param {WeatherData} weatherData
     * @param weatherResponse
     * @returns {WeatherData}
     */
    function setGeneralInformation(weatherData: WeatherData, weatherResponse: any): WeatherData {
        var date = new Date();  // Don't think I should be creating a date since each date is different, need to use UTC thing
        console.log("created a new Date object");
        var uniqueWeek: Set<string> = createWeek(weatherResponse);
        var daysOfTheWeek: string[] = createDaysOfTheWeek(uniqueWeek);
        setDayOfTheWeekIntoHTML(daysOfTheWeek);
        weatherData.date = formatTimeIntoAMPM(date);
        weatherData.city = weatherResponse.city.name;
        weatherData.country = weatherResponse.city.country;
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
        // var months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
    };

    /**
     * Determines the minimum temperature for a specific day
     * @param {number[]} minTempArray
     */
    function determineMinTemp(minTempArray: number[]) {
        var min = minTempArray[0];
        for (var i = 1; i < minTempArray.length - 1; i++) {
            if (minTempArray[i] < min) {
                min = minTempArray[i];
            }
        };
        return min;
    }

    /**
     * Determines the maximum temperature for a specific day
     * @param {number[]} minTempArray
     */
    function determineMaxTemp(maxTempArray: number[]) {
        var max = maxTempArray[0];
        for (var i = 1; i < maxTempArray.length - 1; i++) {
            if (maxTempArray[i] > max) {
                max = maxTempArray[i];
            }
        };
        return max;
    };

    /**
     * Create a week with 5 consecutive and unique days given an array of date/time calculations (has the date values)
     * of UTC in strings
     * @param {Set<string>} setOfDates set of dates for the week
     */
    function createWeek(weatherResponse: any): Set<string> {
        var setOfDates = new Set();
        for (var i = 0; i < weatherResponse.list.length; i++) {
            var slicedDate = weatherResponse.list[i].dt_txt.slice(0,10);
            setOfDates.add(slicedDate);
        };
        return setOfDates;
    };

    /**
     * Creates the (numbers) days of the week that correspond to the correct date
     * eg. Dec.25th 1995 is a 1 which correspoinds to a Monday
     * @param {Set<string>} weekDates the set of 5 consecutive dates in UTC format with only Year-Month-Date
     * @returns {string[]} the array of the (word) days of the week in abbreviated form (eg. Monday = Mon)
     */
    function createDaysOfTheWeek(weekDates: Set<string>): string[] {
        var daysOfTheWeek: string[] = [];
        weekDates.forEach(function (date: string) {
            var d = new Date(date);
            var numberOfDayOfWeek = d.getDay();
            var wordDayOfTheWeek = daysShort[numberOfDayOfWeek];
            daysOfTheWeek.push(wordDayOfTheWeek);
        });
        // console.log("daysOfTheWeek is:");
        // console.log(daysOfTheWeek);
        return daysOfTheWeek;
    }

    /**
     * Sets the HTML for each (word) day of the week to the correct day
     * @param {string[]} wordDayOfTheWeek the days of the week in the correct order
     */
    function setDayOfTheWeekIntoHTML(wordDayOfTheWeek: string[]) {
        for (var i = 0; i < wordDayOfTheWeek.length; i++) {
            document.getElementById("wordDay" + i).innerHTML = wordDayOfTheWeek[i];
        };
    };
});
