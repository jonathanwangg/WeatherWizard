import {WeatherData} from "./WeatherData"
import $ = require("jquery");

const months: string[]    = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const daysShort: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const appid: string = "178e8d4180edebe4e2c02fcad75b72fd";


$(document).ready(function () {
    var deg = '&#176';
    var celsius = 'C';
    var weatherDiv = $('#weather');

    getLocation();

    /**
     * Callback function for custom location searches
     * @returns {Promise<void>}
     */
    function customSearch() {
        var searchParameter:string = (<HTMLInputElement>document.getElementById("searchBox")).value;
        try {
            return new Promise(function (resolve: any, reject: any) {
                if (searchParameter !== "") {
                    $.getJSON("https://api.openweathermap.org/data/2.5/forecast?q=" + searchParameter + "&appid=" + appid, function (weatherResponse) {
                        resolve(weatherResponse);
                    });
                } else {
                    alert("Please enter a city and it's ISO country code.")
                }

            }).then(function (weatherResponse: any) {
                // Don't have to create a new WeatherData here, just call set general
                var weatherData = new WeatherData();
                var generalWeatherData = setGeneralInformation(weatherData, weatherResponse);
            });
        } catch (err) {
            showError("We can't find information about your city!");
        }
    }

    $("#searchButton").click(customSearch);

    /**
     * handler for when the enter key is pressed, do a custom search for location and disallow refresh
     */
    $(document).keypress(function (event: any) {
        if(event.keyCode === 13) {
            event.preventDefault();
            customSearch();
        }
    });

    /**
     * called when the user clicks the "Search" button
     * get the user's current location and calls the appropriate callback function,
     * shows an error if the browser does not support Geolocation
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
     * @param position the fulfilled value from the promise
     * @returns {Promise<void>}
     */
    function locationSuccess(position: any) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        try {
            return new Promise(function (resolve: any, reject: any) {
                $.getJSON("https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon +
                    "&appid=" + appid, function (weatherResponse) {
                    resolve(weatherResponse);
                });

            }).then(function (weatherResponse: any) {
                // Don't have to create a new WeatherData here, just call set general
                var weatherData = new WeatherData();
                var generalWeatherData = setGeneralInformation(weatherData, weatherResponse);
            });
        } catch (err) {
            showError("We can't find information about your city!");
        }
    };

    /**
     *
     * @param {WeatherData} weatherData
     * @param weatherResponse the JSON response from API call
     * @param {string[]} uniqueWeek the week of the forecast
     * @returns {WeatherData}
     */
    function setSingleDateWeatherDataHelper(weatherData: WeatherData, weatherResponse: any, uniqueWeek: string[]): WeatherData {
        // TODO: Keep this here since I'm not sure if I can refactor this into using multiple WeatherData data strucures instead.
        // weatherData.temperature = weatherResponse.list.main.temp;
        // weatherData.minTemperature = weatherResponse.list.main.temp_min;
        // weatherData.maxTemperature = weatherResponse.list.main.temp_max;
        // weatherData.weather = weatherResponse.list.weather.description;
        // weatherData.weatherIcon = weatherResponse.list.weather.icon;

        var currentTempWeek: number[] = determineCurrentTemp(weatherResponse, uniqueWeek);
        var minTempWeek: number[] = determineMinTemp(weatherResponse, uniqueWeek);
        var maxTempWeek: number[] = determineMaxTemp(weatherResponse, uniqueWeek);
        var weatherDescriptions: string[] = determineWeatherDescriptions(weatherResponse, uniqueWeek);
        var weatherIconIds: string[] = determineWeatherIconIDs(weatherResponse, uniqueWeek);
        setCurrentTempWeekIntoHTML(currentTempWeek);
        setMinTempWeekIntoHTML(minTempWeek);
        setMaxTempWeekIntoHTML(maxTempWeek);
        setWeatherDescWeekIntoHTML(weatherDescriptions);
        setWeatherIconWeekIntoHTML(weatherIconIds);

        return weatherData;
    }

    /**
     * Sets general information into HTML
     * @param {WeatherData} weatherData
     * @param weatherResponse the JSON response from API call
     * @returns {WeatherData}
     */
    function setGeneralInformation(weatherData: WeatherData, weatherResponse: any): WeatherData {
        var uniqueWeek: string[] = createWeek(weatherResponse);
        var daysOfTheWeek: string[] = createDaysOfTheWeek(uniqueWeek);
        var datesOfTheWeek: string[] = createDatesOfTheWeek(uniqueWeek);
        var city = determineCity(weatherResponse);
        var country = determineCountry(weatherResponse);
        setDayOfTheWeekIntoHTML(daysOfTheWeek);
        setDatesOfTheWeekIntoHTML(datesOfTheWeek);
        setCityAndCountryIntoHTML(city, country);

        setSingleDateWeatherDataHelper(weatherData, weatherResponse, uniqueWeek);
        return weatherData; // TODO: currently there is no point of even returning a WeatherData since it's never used
    }

    /**
     * error handling functions for location errors
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

    // TODO: Not sure how this is being used
    /**
     *
     * @param msg
     */
    function showError(msg: any) {
        weatherDiv.addClass('error').html(msg);
    };

    /**
     * Determines the minimum temperature of each day for a given week
     * @param weatherResponse the JSON response from API call
     * @param {string[]} uniqueWeek the week of the forecast
     * @returns {number[]} the array of minimum temperatures (in Celsius) where 1st element is 1st day, 2nd element is 2nd day, ...
     */
    function determineMinTemp(weatherResponse: any, uniqueWeek: string[]): number[] {
        var arrayOfMinTempsWeek: number[] = [];
        for (let j = 0; j < uniqueWeek.length; j++) {
            let arrayOfMinTempsSingleDay: number[] = [];
            for (let i = 0; i < weatherResponse.list.length; i++) {
                if (weatherResponse.list[i].dt_txt.includes(uniqueWeek[j])) {
                    arrayOfMinTempsSingleDay.push(weatherResponse.list[i].main.temp_min);
                }
            };

            let trueMinTemp: number = arrayOfMinTempsSingleDay[0];
            for (let i = 1; i < arrayOfMinTempsSingleDay.length; i++) {
                if (arrayOfMinTempsSingleDay[i] < trueMinTemp) {
                    trueMinTemp = arrayOfMinTempsSingleDay[i];
                }
            };
            arrayOfMinTempsWeek.push(trueMinTemp);
        }

        var arrayOfMinTempsCelsiusWeek: number[] = arrayOfMinTempsWeek.map(kelvinToCelsius);
        var arrayOfMinTempsCelsiusIntegerWeek: number[] = arrayOfMinTempsCelsiusWeek.map(currentTempKelvin => Math.floor(currentTempKelvin));
        return arrayOfMinTempsCelsiusIntegerWeek;
    };

    /**
     * Determines the maximum temperature of each day for a given week
     * @param weatherResponse the JSON response from API call
     * @param {string[]} uniqueWeek the week of the forecast
     * @returns {number[]} the array of maximum temperatures (in Celsius) where 1st element is 1st day, 2nd element is 2nd day, ...
     */
    function determineMaxTemp(weatherResponse: any, uniqueWeek: string[]): number[] {
        var arrayOfMaxTempsWeek: number[] = [];
        for (let j = 0; j < uniqueWeek.length; j++) {
            let arrayOfMaxTempsSingleDay: number[] = [];
            for (let i = 0; i < weatherResponse.list.length; i++) {
                if (weatherResponse.list[i].dt_txt.includes(uniqueWeek[j])) {
                    arrayOfMaxTempsSingleDay.push(weatherResponse.list[i].main.temp_max);
                }
            };

            let trueMaxTemp: number = arrayOfMaxTempsSingleDay[0];
            for (let i = 1; i < arrayOfMaxTempsSingleDay.length; i++) {
                if (arrayOfMaxTempsSingleDay[i] > trueMaxTemp) {
                    trueMaxTemp = arrayOfMaxTempsSingleDay[i];
                }
            };
            arrayOfMaxTempsWeek.push(trueMaxTemp);
        }

        var arrayOfMaxTempsCelsiusWeek: number[] = arrayOfMaxTempsWeek.map(kelvinToCelsius);
        var arrayOfMaxTempsCelsiusIntegerWeek: number[] = arrayOfMaxTempsCelsiusWeek.map(currentTempKelvin => Math.floor(currentTempKelvin));
        return arrayOfMaxTempsCelsiusIntegerWeek;
    };

    /**
     * Determines the first temperature for the same time of each day for a given week
     * @param weatherResponse the JSON response from API call
     * @param {string[]} uniqueWeek the week of the forecast
     * @returns {number[]} the array of current temperatures (in Celsius) where 1st element is 1st day, 2nd element is 2nd day, ...
     */
    function determineCurrentTemp(weatherResponse: any, uniqueWeek: string[]): number[] {
        var arrayOfCurrentTempsWeek: number[] = [];
        for (let j = 0; j < uniqueWeek.length; j++) {
            for (let i = 0; i < weatherResponse.list.length; i++) {
                if (weatherResponse.list[i].dt_txt.includes(uniqueWeek[j])) {
                    arrayOfCurrentTempsWeek.push(weatherResponse.list[i].main.temp);
                    break;
                }
            };
        }

        var arrayOfCurrentTempsCelsiusWeek: number[] = arrayOfCurrentTempsWeek.map(kelvinToCelsius);
        var arrayOfCurrentTempsCelsiusIntegerWeek: number[] = arrayOfCurrentTempsCelsiusWeek.map(currentTempKelvin => Math.floor(currentTempKelvin));
        return arrayOfCurrentTempsCelsiusIntegerWeek;
    };

    /**
     * Determines the weather descriptions at a specific time of each day for a given week
     * @param weatherResponse the JSON response from API call
     * @param {string[]} uniqueWeek the week of the forecast
     * @returns {string[]} the array of weather descriptions
     */
    function determineWeatherDescriptions(weatherResponse: any, uniqueWeek: string[]): string[] {
        var timeOfDay =  " 09:00:00";
        var arrayOfWeatherDesc: string[] = [];
        for (let i = 0; i < uniqueWeek.length; i++) {
            for(let j = 0; j < weatherResponse.list.length; j++) {
                if (weatherResponse.list[j].dt_txt.includes(uniqueWeek[i] + timeOfDay)) {
                    let weatherDesc = weatherResponse.list[j].weather[0].description;
                    arrayOfWeatherDesc.push(weatherDesc);
                    break;
                }
            }
        }
        return arrayOfWeatherDesc;
    };

    /**
     * Determines the weather icon id's at a specific time of each day for a given week
     * @param weatherResponse the JSON response from API call
     * @param {string[]} uniqueWeek the week of the forecast
     * @returns {string[]} the array of weather icon id's
     */
    function determineWeatherIconIDs(weatherResponse: any, uniqueWeek: string[]): string[] {
        var arrayOfWeatherIconIds: string[] = [];
        var timeOfDay =  " 09:00:00";
        for (let i = 0; i < uniqueWeek.length; i++) {
            for(let j = 0; j < weatherResponse.list.length; j++) {
                if (weatherResponse.list[j].dt_txt.includes(uniqueWeek[i] + timeOfDay)) {
                    let weatherIconId = weatherResponse.list[j].weather[0].icon;
                    arrayOfWeatherIconIds.push(weatherIconId);
                    break;
                }
            }
        }
        return arrayOfWeatherIconIds;
    };

    /**
     * Determines the city of which the API call made it to
     * @param weatherResponse the JSON response from API call
     * @returns {string} the city corresponding to the weather response
     */
    function determineCity(weatherResponse: any): string {
        return weatherResponse.city.name;
    };

    /**
     * Determines the country of which the API call made it to
     * @param weatherResponse the JSON response from API call
     * @returns {string} the country corresponding to the weather response
     */
    function determineCountry(weatherResponse: any): string {
        return weatherResponse.city.country;
    };

    /**
     * Create a week with 5 consecutive and unique days given an array of date/time calculations (has the date values)
     * of UTC in strings
     * @param {string[]} setOfDates set of dates for the week
     */
    function createWeek(weatherResponse: any): string[] {
        var arrayOfDates: string[] = [];
        for (let j = 0; j < weatherResponse.list.length; j++) {
            let slicedDate = weatherResponse.list[j].dt_txt.slice(0,10);
            if (!(arrayOfDates.includes(slicedDate))) {
                arrayOfDates.push(slicedDate);
            }
        }
        return arrayOfDates;
    };

    /**
     * Creates the (numbers) days of the week that correspond to the correct date
     * eg. Dec.25th 1995 is a 1 which correspoinds to a Monday
     * @param {string[]} weekDates the array of 5 consecutive dates in UTC format with only Year-Month-Date
     * @returns {string[]} the array of the (word) days of the week in abbreviated form (eg. Monday = Mon)
     */
    function createDaysOfTheWeek(weekDates: string[]): string[] {
        var daysOfTheWeek: string[] = [];
        weekDates.forEach(function (date: string) {
            let year = date.slice(0,4);
            let month = date.slice(5,7);
            let day = date.slice(8,10);
            let d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            let wordDayOfTheWeek = daysShort[d.getDay()];
            daysOfTheWeek.push(wordDayOfTheWeek);
        });
        return daysOfTheWeek;
    };

    /**
     * Sets the HTML for each (word) day of the week to the correct day
     * @param {string[]} wordDayOfTheWeek the days of the week in the correct order
     */
    function setDayOfTheWeekIntoHTML(wordDayOfTheWeek: string[]) {
        for (let i = 0; i < 5; i++) {
            document.getElementById("wordDay" + i).innerHTML = wordDayOfTheWeek[i];
        };
    };

    /**
     * Creates the (string) month-days of the month that correspond to the correct upcoming next
     * 5 days
     * (eg of a month-day Jan. 1)
     * @param {string[]} weekDates the array of 5 consectuve dates in UTC format with only Year-Month-Date
     * @returns {string[]} the array of the (string) month-days of the week
     */
    function createDatesOfTheWeek(weekDates: string[]): string[] {
        var datesOfTheWeek: string[] = [];
        weekDates.forEach(function (date: string) {
            let year = date.slice(0,4);
            let month = date.slice(5,7);
            let day = date.slice(8,10);
            let d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            let monthDay: string = months[d.getMonth()] + ". " + d.getDate();
            datesOfTheWeek.push(monthDay);
        });
        return datesOfTheWeek;
    };

    /**
     * Sets the HTML for each date of the week to the correct date
     * (eg. Dec 30)
     * @param {string[]} datesOfTheWeek
     */
    function setDatesOfTheWeekIntoHTML(datesOfTheWeek: string[]) {
        for (var i = 0; i < 5; i++) {
            document.getElementById("monthDay" + i).innerHTML = datesOfTheWeek[i];
        };
    };

    /**
     * Sets the HTML for the city and country corresponding to the weather response
     * @param {string} city
     * @param {string} country
     */
    function setCityAndCountryIntoHTML(city: string, country: string) {
        document.getElementById("currentCityAndCountry").innerText = "Location: " + city + ", " + country;
    };

    /**
     * Sets the HTML for the current temperature for each day of the week
     * @param {number[]} currentTempWeek
     */
    function setCurrentTempWeekIntoHTML(currentTempWeek: number[]) {
        for (let i = 0; i < 5; i++) {
            document.getElementById("currentTemp" + i).innerHTML = currentTempWeek[i] + " " + deg + celsius;
        }
    };

    /**
     * Sets the HTML for the minimum temperature for each day of the week
     * @param {number[]} minTempWeek
     */
    function setMinTempWeekIntoHTML(minTempWeek: number[]) {
        for (let i = 0; i < 5; i++) {
            document.getElementById("minTemp" + i).innerHTML = "Low: " + minTempWeek[i] + " " + deg + celsius;
        }
    };

    /**
     * Sets the HTML for the maximum temperature for each day of the week
     * @param {number[]} maxTempWeek
     */
    function setMaxTempWeekIntoHTML(maxTempWeek: number[]) {
        for (let i = 0; i < 5; i++) {
            document.getElementById("maxTemp" + i).innerHTML = "High: " + maxTempWeek[i] + " " + deg + celsius;
        }
    };

    /**
     * Sets the HTML for the weather descriptions for each day of the week
     * @param {string[]} weatherDescriptions
     */
    function setWeatherDescWeekIntoHTML(weatherDescriptions: string[]) {
        for (let i = 0; i < 5; i++) {
            document.getElementById("forecast" + i).innerHTML = weatherDescriptions[i];
        }
    }

    /**
     * Sets the HTML for the weather icons for each day of the week
     * @param {string[]} weatherIconIds
     */
    function setWeatherIconWeekIntoHTML(weatherIconIds: string[]) {
        for (let i = 0; i < weatherIconIds.length; i++) {
            document.getElementById("icon" + i).setAttribute("src","http://openweathermap.org/img/w/" + weatherIconIds[i] + ".png");
        }
    }

    /**
     * Converts a temperature from Kelvin to Celsius
     * @param {number} kelvin
     * @returns {number} the same temperature in degrees Celsius
     */
    function kelvinToCelsius(kelvin: number): number {
        return kelvin - 273.15;
    };

});
