import {WeatherData} from "./WeatherData"
import $ = require("jquery");
import {parse} from "ts-node/dist";

const months: string[]    = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const daysShort: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


$(document).ready(function () {
    var deg = '&#176';
    var celsius = 'C';
    var farenheit = 'F';

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
                $.getJSON("https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon +
                    "&appid=178e8d4180edebe4e2c02fcad75b72fd", function (weatherResponse) {
                    console.log("weatherResponse is: ");
                    console.log(weatherResponse);
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
     * Helper function to set the weather data to their variables
     * @param {WeatherData} weatherData the data structure that holds all the data related to weather
     * @param {string} weatherResponse the JSON string that we are returned from the GET request
     * @returns {WeatherData} the data structure with it's variables assigned
     */
    function setSingleDateWeatherDataHelper(weatherData: WeatherData, weatherResponse: any, uniqueWeek: string[]): WeatherData {
        // TODO: Keep this here since I'm not sure if I can refactor this into using multiple WeatherData data strucures instead.
        // weatherData.temperature = weatherResponse.list.main.temp;
        // weatherData.minTemperature = weatherResponse.list.main.temp_min;
        // weatherData.maxTemperature = weatherResponse.list.main.temp_max;
        // weatherData.weather = weatherResponse.list.weather.description;
        // weatherData.weatherIcon = weatherResponse.list.weather.icon;

        var currentTempWeek: number[] = determineCurrentTemp(weatherResponse, uniqueWeek);
        setCurrentTempWeekIntoHTML(currentTempWeek);
        var minTempWeek = determineMinTemp(weatherResponse, uniqueWeek);
        setMinTempWeekIntoHTML(minTempWeek);
        var maxTempWeek = determineMaxTemp(weatherResponse, uniqueWeek);
        setMaxTempWeekIntoHTML(maxTempWeek);
        var weatherDescriptions = determineWeatherDescriptions(weatherResponse, uniqueWeek);
        setWeatherDescWeekIntoHTML(weatherDescriptions);
        var weatherIconIds: string[] = determineWeatherIconIDs(weatherResponse, uniqueWeek);
        setWeatherIconWeekIntoHTML(weatherIconIds);

        return weatherData;
    }

    /**
     * Sets the general information that is the same for all days of the week such as city and country
     * @param {WeatherData} weatherData
     * @param weatherResponse
     * @returns {WeatherData}
     */
    function setGeneralInformation(weatherData: WeatherData, weatherResponse: any): WeatherData {
        var uniqueWeek: string[] = createWeek(weatherResponse);
        console.log("unique week:")
        console.log(uniqueWeek);
        var daysOfTheWeek: string[] = createDaysOfTheWeek(uniqueWeek);
        console.log("daysOfTheWeek: ");
        console.log(daysOfTheWeek);
        var datesOfTheWeek: string[] = createDatesOfTheWeek(uniqueWeek);
        console.log("datesOfTheWeek: ");
        console.log(datesOfTheWeek);
        setDayOfTheWeekIntoHTML(daysOfTheWeek);
        setDatesOfTheWeekIntoHTML(datesOfTheWeek);
        var city = determineCity(weatherResponse);
        var country = determineCountry(weatherResponse);
        setCityAndCountryIntoHTML(city, country);

        setSingleDateWeatherDataHelper(weatherData, weatherResponse, uniqueWeek);
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

        var combinedDate: string = date.getDay() + ' ' + months[date.getMonth()] + ' ' + date.getDate() + ' ' + hours + minutes + ampm;
        return combinedDate;

    };

    // TODO: will need to be changed (refer to GitHub issues)
    function displayCurrentCity(assignedWeatherData: WeatherData): void {
        console.log("got into displayCurrentCity method")
        var element = document.getElementById("currentCity");
        element.innerHTML = assignedWeatherData.city + ", " + assignedWeatherData.country ;
    };

    function determineMinTemp(weatherResponse: any, uniqueWeek: string[]): number[] {
        // for all temps corresponding to a certain Year-mOnth-Date,
        // determine the min temp of all
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

    function determineMaxTemp(weatherResponse: any, uniqueWeek: string[]): number[] {
        // for all temps corresponding to a certain Year-mOnth-Date,
        // determine the max temp of all
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

    // all temps are in kelvin before converting
    function determineCurrentTemp(weatherResponse: any, uniqueWeek: string[]): number[] {
        // for all temps corresponding to a certain Year-mOnth-Date,
        // determine the min temp of all
        var arrayOfCurrentTempsWeek: number[] = [];
        for (let j = 0; j < uniqueWeek.length; j++) {
            let arrayOfCurrentTempsSingleDay: number[] = [];
            for (let i = 0; i < weatherResponse.list.length; i++) {
                if (weatherResponse.list[i].dt_txt.includes(uniqueWeek[j])) {
                    arrayOfCurrentTempsWeek.push(weatherResponse.list[i].main.temp);
                    break;
                }
            };
        }

        var arrayOfCurrentTempsCelsiusWeek: number[] = arrayOfCurrentTempsWeek.map(kelvinToCelsius);
        var arrayOfCurrentTempsCelsiusIntegerWeek: number[] = arrayOfCurrentTempsCelsiusWeek.map(currentTempKelvin => Math.floor(currentTempKelvin));
        //console.log("arrayOfCurrentTempsWeek is:");
        //console.log(arrayOfCurrentTempsWeek);
        return arrayOfCurrentTempsCelsiusIntegerWeek;
    };

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

    function determineCity(weatherResponse: any): string {
        return weatherResponse.city.name;
    };

    function determineCountry(weatherResponse: any): string {
        return weatherResponse.city.country;
    };

    /**
     * Create a week with 5 consecutive and unique days given an array of date/time calculations (has the date values)
     * of UTC in strings
     * @param {Set<string>} setOfDates set of dates for the week
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
     * @param {Set<string>} weekDates the set of 5 consecutive dates in UTC format with only Year-Month-Date
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
     * @param {Set<string>} weekDates the set of 5 consectuve dates in UTC format with only Year-Month-Date
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

    function setCityAndCountryIntoHTML(city: string, country: string) {
        document.getElementById("currentCityAndCountry").innerText = city + ", " + country;
    };

    function setCurrentTempWeekIntoHTML(currentTempWeek: number[]) {
        for (let i = 0; i < 5; i++) {
            document.getElementById("currentTemp" + i).innerHTML = currentTempWeek[i] + " " + deg + celsius;
        }
    };

    function setMinTempWeekIntoHTML(minTempWeek: number[]) {
        for (let i = 0; i < 5; i++) {
            document.getElementById("minTemp" + i).innerHTML = "Low: " + minTempWeek[i] + " " + deg + celsius;
        }
    };

    function setMaxTempWeekIntoHTML(maxTempWeek: number[]) {
        for (let i = 0; i < 5; i++) {
            document.getElementById("maxTemp" + i).innerHTML = "High: " + maxTempWeek[i] + " " + deg + celsius;
        }
    };

    function setWeatherDescWeekIntoHTML(weatherDescriptions: string[]) {
        for (let i = 0; i < 5; i++) {
            document.getElementById("forecast" + i).innerHTML = weatherDescriptions[i];
        }
    }

    // TODO: must cast HTMLElement to HTMLImageElement
    function setWeatherIconWeekIntoHTML(weatherIconIds: string[]) {
        for (let i = 0; i < weatherIconIds.length; i++) {
            document.getElementById("icon" + i).src = "http://openweathermap.org/img/w/" + weatherIconIds[i] + ".png"
        }
    }

    function kelvinToCelsius(kelvin: number): number {
        return kelvin - 273.15;
    };

});
