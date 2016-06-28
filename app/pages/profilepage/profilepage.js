"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ionic_angular_1 = require('ionic-angular');
var consts_1 = require('../../helpers/consts');
var cloudfunctions_1 = require('../../helpers/cloudfunctions');
var uimessages_1 = require('../../helpers/uimessages');
var core_1 = require('@angular/core');
var http_1 = require('@angular/http');
//import {CordovaOauth, Meetup} from 'ng2-cordova-oauth/core';
var ProfilePage = (function () {
    function ProfilePage(ionicApp, navController, navParams, viewController, zone, platform, http) {
        Parse.initialize(consts_1.Consts.PARSE_APPLICATION_ID, consts_1.Consts.PARSE_JS_KEY);
        this.nav = navController;
        this.viewController = viewController;
        this.zone = zone;
        this.platform = platform;
        this.http = http;
        this.user = navParams.data;
        this.currentUser = Parse.User.current();
        this.aveDataLoading = false;
        this.weekDataLoading = false;
        this.walkingDataLoading = true;
        this.kJDataLoading = false;
        this.cyclingDataLoading = true;
        this.runningDataLoading = true;
        this.heartDataLoading = false;
        this.sleepDataLoading = true;
        this.moodDataLoading = true;
        this.foodStrings = [];
        this.foodArray = [];
        this.moodData = [];
    }
    ProfilePage.prototype.onPageDidEnter = function () {
        this.initialize();
    };
    ProfilePage.prototype.initialize = function () {
        var _this = this;
        //Initialize arrangedDayLabels
        var days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
        this.arrangedDayLabels = [];
        var day = new Date().getDay() - 1;
        day = (day == -1) ? 6 : day;
        for (var i = 0; i < 8; i++) {
            this.arrangedDayLabels.push(days[(i + day) % 7]);
        }
        if (localStorage['healthApiAccessGranted']) {
            this.initWalkingData(function () {
                _this.initStravaData();
            });
            this.initKjData();
            this.initSleepData();
        }
        else if (navigator.health) {
            navigator.health.isAvailable(function () {
                navigator.health.requestAuthorization(['steps', 'distance', 'activity'], function () {
                    localStorage['healthApiAccessGranted'] = true;
                    _this.initWalkingData(function () {
                        _this.initStravaData();
                    });
                    _this.initKjData();
                    _this.initSleepData();
                }, function (err) {
                    localStorage['healthApiAccessGranted'] = false;
                    console.log('Health auth error', err);
                    _this.walkingDataLoading = false;
                    _this.kJDataLoading = false;
                    _this.initStravaData();
                });
            }, function () {
                console.log('Health not available');
                _this.walkingDataLoading = false;
                _this.kJDataLoading = false;
                _this.initStravaData();
            });
        }
        if (!this.platform.is('ios') && !this.platform.is('android')) {
            this.initStravaData();
        }
        this.foodData();
        this.initMoodData();
        this.initHeartData();
    };
    //Walking, running, biking and sleep data for last week from Health Plugin - Android only
    ProfilePage.prototype.initAveData = function () {
        var _this = this;
        var noDays = 30;
        var beginning = new Date((new Date()).getTime() - (7 * 86400 * 1000));
        var endtemp = new Date((new Date()).getTime() - (0 * 86400 * 1000));
        var timeNow = (new Date()).getTime();
        navigator.health.queryAggregated({
            startDate: beginning,
            endDate: endtemp,
            dataType: 'activity'
        }, function (data) {
            console.log('Query time', (new Date()).getTime() - timeNow);
            console.log('Got activity:', data);
            //this.activityDataOut = data;
            /*let durationWalking:number = 0;
            for (let i = 0; i < data.length; i++) {
              if (data[i].value == 'walking') {
                durationWalking += (data[i].endDate.getTime() - data[i].startDate.getTime());
                console.log(data[i].endDate.getTime() - data[i].startDate.getTime())
              }
            }
            console.log('Total walking:' + durationWalking);*/
            if (data.value.walking) {
                _this.walkingTimeAve = data.value.walking.duration / noDays;
            }
            if (data.value.running) {
                _this.runningTimeAve = data.value.running.duration / noDays;
            }
            if (data.value.biking) {
                _this.cyclingTimeAve = data.value.biking.duration / noDays;
            }
            if (data.value.sleep) {
                _this.sleepTimeAve = data.value.sleep.duration / noDays;
            }
            _this.zone.run(function () {
                _this.aveDataLoading = false;
            });
        }, function (error) {
            console.log('Error:', error);
            _this.zone.run(function () {
                _this.aveDataLoading = false;
            });
        });
    };
    ProfilePage.prototype.initMoodData = function () {
        var _this = this;
        cloudfunctions_1.CloudFunctions.getWeekMoodsData(function (data, error) {
            if (!error) {
                _this.moodDataLoading = false;
                _this.moodData = [];
                for (var i = data.averageMoods.length - 1; i >= 0; i--) {
                    _this.moodData.push({
                        dayLabel: _this.arrangedDayLabels[i],
                        mood: Math.ceil(data.averageMoods[i])
                    });
                }
            }
            else {
                console.log('Error getting moods data', error.message);
            }
        });
    };
    //-------CHARTS--------
    ProfilePage.prototype.initHeartData = function () {
        var _this = this;
        if (localStorage['healthApiAccessGranted']) {
            this.heartData = [[], []];
            for (var i = 0; i < 8; i++) {
                this.heartData[0].push(999);
                this.heartData[1].push(0);
            }
            var start_1 = new Date();
            start_1.setHours(0);
            start_1.setMinutes(0);
            start_1.setSeconds(0);
            start_1 = new Date(start_1.getTime() - 7 * 86400 * 1000);
            var callbacksRemaining_1 = 8;
            for (var i = 0; i < 8; i++) {
                (function (i) {
                    navigator.health.query({
                        startDate: new Date(start_1.getTime() + i * 86400 * 1000),
                        endDate: new Date(start_1.getTime() + (i + 1) * 86400 * 1000),
                        dataType: 'heart_rate'
                    }, function (data) {
                        callbacksRemaining_1--;
                        for (var j = 0; j < data.length; j++) {
                            if (data[j].value < _this.heartData[0][i]) {
                                _this.heartData[0][i] = data[j].value;
                            }
                            if (data[j].value > _this.heartData[1][i]) {
                                _this.heartData[1][i] = data[j].value;
                            }
                        }
                        if (_this.heartData[0][i] == 999) {
                            _this.heartData[0][i] = 0;
                        }
                        //console.log('Activity', i, data);
                        /*if (data.value.sleep) {
                          this.sleepData[i]
                           = Math.round(data.value.sleep.duration * 10 / 3600) / 10;
                        }
                        */
                        if (callbacksRemaining_1 == 0) {
                            //console.log("Heart data:");
                            //console.log(this.heartData);
                            _this.initHeartChart();
                        }
                    }, function (error) {
                        callbacksRemaining_1--;
                        console.log('Error:', error);
                        if (callbacksRemaining_1 == 0) {
                            _this.initHeartChart();
                        }
                    });
                })(i);
            }
        }
    };
    ProfilePage.prototype.initHeartChart = function () {
        var _this = this;
        this.zone.run(function () {
            _this.heartDataLoading = false;
        });
        var ctx = document.getElementById("heartChart")
            .getContext("2d");
        /*console.log("Min Heart:");
        console.log(this.heartData[0]);
        console.log("Max Heart:");
        console.log(this.heartData[1]);*/
        var heartData = {
            labels: this.arrangedDayLabels,
            datasets: [{
                    label: "bpm min",
                    backgroundColor: "rgb(224, 224, 224)",
                    borderColor: "rgb(235, 110, 123)",
                    highlightFill: "rgba(224, 224, 224,0.75)",
                    highlightStroke: "rgba(235, 110, 123,1)",
                    data: this.heartData[0]
                },
                {
                    label: "bpm max",
                    backgroundColor: "rgb(235, 110, 123)",
                    borderColor: "rgb(235, 110, 123)",
                    highlightFill: "rgba(224, 224, 224,0.75)",
                    highlightStroke: "rgba(235, 110, 123,1)",
                    data: this.heartData[1]
                }
            ]
        };
        this.heartChartHandle = new Chart(ctx, {
            type: 'line',
            data: heartData,
            options: {
                legend: {
                    display: false,
                    labels: {
                        display: true,
                    },
                },
                scales: {
                    xAxes: [{
                            gridLines: {
                                display: false
                            }
                        }],
                    yAxes: [{
                            gridLines: {
                                display: false
                            }
                        }]
                }
            }
        });
    };
    //Walking and running data for last week from Health Plugin
    ProfilePage.prototype.initWalkingData = function (callback) {
        var _this = this;
        this.walkingData = [];
        for (var i = 0; i < 8; i++) {
            this.walkingData.push(0);
        }
        var start = new Date();
        start.setHours(0);
        start.setMinutes(0);
        start.setSeconds(0);
        start = new Date(start.getTime() - 7 * 86400 * 1000);
        var callbacksRemaining = 8;
        for (var i = 0; i < 8; i++) {
            (function (i) {
                var endDate = new Date(start.getTime() + (i + 1) * 86400 * 1000);
                if (i == 7) {
                    endDate = new Date();
                }
                navigator.health.queryAggregated({
                    startDate: new Date(start.getTime() + i * 86400 * 1000),
                    endDate: endDate,
                    dataType: 'distance'
                }, function (data) {
                    callbacksRemaining--;
                    //console.log('distance', i, data);
                    if (data.value) {
                        var val = Math.round(data.value / 10) / 100;
                        if (_this.platform && _this.platform.is('ios')) {
                            val *= 0.5;
                        }
                        _this.walkingData[i] = val;
                    }
                    if (callbacksRemaining == 0) {
                        //this.getDetailedWalkingData(start);
                        callback();
                    }
                }, function (error) {
                    callbacksRemaining--;
                    console.log('Error:', error);
                    if (callbacksRemaining == 0) {
                        callback();
                    }
                });
            })(i);
        }
    };
    ProfilePage.prototype.initWalkingChart = function () {
        var _this = this;
        this.zone.run(function () {
            _this.walkingDataLoading = false;
        });
        var ctx = document.getElementById("walkingChart")
            .getContext("2d");
        var walkingData = {
            labels: this.arrangedDayLabels,
            datasets: [{
                    label: "km",
                    backgroundColor: "rgb(104, 143, 206)",
                    borderColor: "rgb(104, 143, 206)",
                    highlightFill: "rgba(104,143,206,0.75)",
                    highlightStroke: "rgba(104,143,206,1)",
                    data: this.walkingData
                }]
        };
        var options = {
            scaleShowGridLines: false
        };
        this.walkingChartHandle = new Chart(ctx, {
            type: 'bar',
            data: walkingData,
            options: {
                legend: {
                    display: false,
                },
                scales: {
                    xAxes: [{
                            gridLines: {
                                display: false
                            }
                        }],
                    yAxes: [{
                            gridLines: {
                                display: false
                            }
                        }]
                }
            }
        });
    };
    ProfilePage.prototype.initRunningChart = function () {
        var _this = this;
        var dataInKm;
        dataInKm = [];
        for (var i = 0; i < this.runningData.distance.length; i++) {
            dataInKm.push(Math.round(this.runningData.distance[i] / 1000));
        }
        var runningDataObject = {
            labels: this.arrangedDayLabels,
            datasets: [{
                    label: "km",
                    backgroundColor: "rgb(96, 208, 227)",
                    borderColor: "rgb(96, 208, 227)",
                    highlightFill: "rgba(96, 208, 227,0.75)",
                    highlightStroke: "rgba(96, 208, 227,1)",
                    data: dataInKm
                }]
        };
        this.zone.run(function () {
            _this.runningDataLoading = false;
            var ctx = document.getElementById("runningChart")
                .getContext("2d");
            _this.cyclingChartHandle = new Chart(ctx, {
                type: 'bar',
                data: runningDataObject,
                options: {
                    legend: {
                        display: false,
                    },
                    scales: {
                        xAxes: [{
                                gridLines: {
                                    display: false
                                }
                            }],
                        yAxes: [{
                                gridLines: {
                                    display: false
                                }
                            }]
                    }
                }
            });
        });
    };
    ProfilePage.prototype.initCyclingChart = function () {
        var _this = this;
        var dataInKm;
        dataInKm = [];
        for (var i = 0; i < this.cyclingData.distance.length; i++) {
            dataInKm.push(Math.round(this.cyclingData.distance[i] / 1000));
        }
        var cyclingDataObject = {
            labels: this.arrangedDayLabels,
            datasets: [{
                    label: "km",
                    backgroundColor: "rgb(117, 223, 152)",
                    borderColor: "rgb(117, 223, 152)",
                    highlightFill: "rgba(117, 223, 152,0.75)",
                    highlightStroke: "rgba(117, 223, 152,1)",
                    data: dataInKm
                }]
        };
        var options = {
            scaleShowGridLines: false
        };
        this.zone.run(function () {
            _this.cyclingDataLoading = false;
            var ctx = document.getElementById("cyclingChart")
                .getContext("2d");
            _this.cyclingChartHandle = new Chart(ctx, {
                type: 'bar',
                data: cyclingDataObject,
                options: {
                    legend: {
                        display: false,
                    },
                    scales: {
                        xAxes: [{
                                gridLines: {
                                    display: false
                                }
                            }],
                        yAxes: [{
                                gridLines: {
                                    display: false
                                }
                            }]
                    }
                }
            });
        });
    };
    ProfilePage.prototype.initSleepData = function () {
        var _this = this;
        this.sleepData = [];
        for (var i = 0; i < 8; i++) {
            this.sleepData.push(0);
        }
        var start = new Date();
        start.setHours(0);
        start.setMinutes(0);
        start.setSeconds(0);
        start = new Date(start.getTime() - 7 * 86400 * 1000);
        var callbacksRemaining = 8;
        for (var i = 0; i < 8; i++) {
            (function (i) {
                navigator.health.queryAggregated({
                    startDate: new Date(start.getTime() + i * 86400 * 1000),
                    endDate: new Date(start.getTime() + (i + 1) * 86400 * 1000),
                    dataType: 'activity'
                }, function (data) {
                    callbacksRemaining--;
                    //console.log('Activity', i, data);
                    if (data.value.sleep) {
                        _this.sleepData[i]
                            = Math.round(data.value.sleep.duration * 10 / 3600) / 10;
                    }
                    if (callbacksRemaining == 0) {
                        _this.initSleepChart();
                    }
                }, function (error) {
                    callbacksRemaining--;
                    console.log('Error:', error);
                    if (callbacksRemaining == 0) {
                        _this.initSleepChart();
                    }
                });
            })(i);
        }
    };
    ProfilePage.prototype.initSleepChart = function () {
        var _this = this;
        this.zone.run(function () {
            _this.sleepDataLoading = false;
        });
        var ctx = document.getElementById("sleepChart")
            .getContext("2d");
        var sleepData = {
            labels: this.arrangedDayLabels,
            datasets: [{
                    label: "km",
                    backgroundColor: "rgb(217, 153, 222)",
                    borderColor: "rgb(217, 153, 222)",
                    highlightFill: "rgba(217, 153, 222,0.75)",
                    highlightStroke: "rgba(217, 153, 222,1)",
                    data: this.sleepData
                }]
        };
        var options = {
            scaleShowGridLines: false
        };
        this.sleepChartHandle = new Chart(ctx, {
            type: 'bar',
            data: sleepData,
            options: {
                legend: {
                    display: false,
                },
                scales: {
                    xAxes: [{
                            gridLines: {
                                display: false
                            }
                        }],
                    yAxes: [{
                            gridLines: {
                                display: false
                            }
                        }]
                }
            }
        });
    };
    ProfilePage.prototype.initKjData = function () {
        var _this = this;
        this.kJData = [];
        for (var i = 0; i < 8; i++) {
            this.kJData.push(0);
        }
        var start = new Date();
        start.setHours(0);
        start.setMinutes(0);
        start.setSeconds(0);
        start = new Date(start.getTime() - 7 * 86400 * 1000);
        var callbacksRemainingBasal = 8;
        var basalProcessed = false, activeProcessed = false;
        for (var i = 0; i < 8; i++) {
            (function (i) {
                navigator.health.queryAggregated({
                    startDate: new Date(start.getTime() + i * 86400 * 1000),
                    endDate: new Date(start.getTime() + (i + 1) * 86400 * 1000),
                    dataType: 'calories.basal'
                }, function (data) {
                    callbacksRemainingBasal--;
                    //console.log('Activity', i, data);
                    if (data.value) {
                        _this.kJData[i] += data.value * 4.184;
                    }
                    if (callbacksRemainingBasal == 0) {
                        basalProcessed = true;
                        if (activeProcessed) {
                            _this.initKjChart();
                        }
                    }
                }, function (error) {
                    callbacksRemainingBasal--;
                    console.log('Error:', error);
                    if (callbacksRemainingBasal == 0) {
                        basalProcessed = true;
                        if (activeProcessed) {
                            _this.initKjChart();
                        }
                    }
                });
            })(i);
        }
        var callbacksRemainingActive = 8;
        for (var i = 0; i < 8; i++) {
            (function (i) {
                navigator.health.queryAggregated({
                    startDate: new Date(start.getTime() + i * 86400 * 1000),
                    endDate: new Date(start.getTime() + (i + 1) * 86400 * 1000),
                    dataType: 'calories.active'
                }, function (data) {
                    callbacksRemainingActive--;
                    //console.log('Activity', i, data);
                    if (data.value) {
                        _this.kJData[i] += data.value * 4.184;
                    }
                    if (callbacksRemainingActive == 0) {
                        activeProcessed = true;
                        if (basalProcessed) {
                            _this.initKjChart();
                        }
                    }
                }, function (error) {
                    callbacksRemainingActive--;
                    console.log('Error:', error);
                    if (callbacksRemainingActive == 0) {
                        activeProcessed = true;
                        if (basalProcessed) {
                            _this.initKjChart();
                        }
                    }
                });
            })(i);
        }
    };
    ProfilePage.prototype.initKjChart = function () {
        var _this = this;
        this.zone.run(function () {
            _this.kJDataLoading = false;
        });
        var ctx = document.getElementById("kJChart").getContext("2d");
        var kJData = {
            labels: this.arrangedDayLabels,
            datasets: [{
                    label: "km",
                    backgroundColor: "rgb(243, 162, 115)",
                    borderColor: "rgb(243, 162, 115)",
                    highlightFill: "rgba(243, 162, 115,0.75)",
                    highlightStroke: "rgba(243, 162, 115,1)",
                    data: this.kJData
                }]
        };
        var options = {
            scaleShowGridLines: false
        };
        this.kJChartHandle = new Chart(ctx, {
            type: 'bar',
            data: kJData,
            options: {
                legend: {
                    display: false,
                },
                scales: {
                    xAxes: [{
                            gridLines: {
                                display: false
                            }
                        }],
                    yAxes: [{
                            gridLines: {
                                display: false
                            }
                        }]
                }
            }
        });
    };
    ProfilePage.prototype.foodData = function () {
        var _this = this;
        var start = new Date();
        start.setHours(0);
        start.setMinutes(0);
        start.setSeconds(0);
        start = new Date(start.getTime() - 7 * 86400 * 1000);
        var query = new Parse.Query(consts_1.Consts.NUTRITION_CLASS);
        query.equalTo(consts_1.Consts.NUTRITION_USER, Parse.User.current());
        query.greaterThan(consts_1.Consts.CREATED_AT, start);
        query.ascending(consts_1.Consts.CREATED_AT);
        query.find({
            success: function (results) {
                // Do something with the returned Parse.Object values
                /*Structure: foodArray = [
                  {
                    dayString:"Mo",
                    array:[
                      {
                        microsoft: newMsObj,
                        nutritionix: newNutObj,
                        createdAt: hour+":"+min
                      },
                      {
                        microsoft: newMsObj,
                        nutritionix: newNutObj,
                        createdAt: hour+":"+min
                      },
                      ...
                    ]
                  },
                  ...
                ]*/
                _this.foodArray = [];
                //Initialise foodArray with labels
                for (var i_1 = 0; i_1 < 8; i_1++) {
                    _this.foodArray.push({
                        dayString: _this.arrangedDayLabels[i_1],
                        array: []
                    });
                }
                //Set the day labels inside foodArray
                var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                var day = new Date().getDay() - 1;
                day = (day == -1) ? 6 : day;
                for (var i_2 = 0; i_2 < 8; i_2++) {
                    _this.foodArray[7 - i_2].dayString = days[(i_2 + day) % 7];
                }
                for (var i = 0; i < results.length; i++) {
                    var parseObject = results[i];
                    var msObject = parseObject.get(consts_1.Consts.NUTRITION_MICROSOFT_RESPONSE);
                    var nutritionObject = parseObject.get(consts_1.Consts.NUTRITION_NUTRITIONIX_INFO);
                    var nutCreatedAt = parseObject.get(consts_1.Consts.CREATED_AT);
                    //Calculating dayIndex, position in foodArray that this food object will go into
                    var timeDifference = (new Date()).getTime()
                        - results[i].get(consts_1.Consts.CREATED_AT).getTime();
                    var dayIndex = Math.floor(timeDifference / (86400 * 1000));
                    if (msObject && nutritionObject) {
                        var microsoftDescription = JSON.parse(JSON.parse(msObject))
                            .description.captions[0].text;
                        console.log(microsoftDescription);
                        var nutritionixCalories = JSON.parse(JSON.parse(nutritionObject)).nf_calories;
                        //console.log(newNutObj);
                        var hour = (nutCreatedAt.getHours() < 10)
                            ? '0' + nutCreatedAt.getHours() : nutCreatedAt.getHours();
                        var min = (nutCreatedAt.getMinutes() < 10)
                            ? '0' + nutCreatedAt.getMinutes() : nutCreatedAt.getMinutes();
                        //Creating and pushing the food object into foodArray
                        _this.foodArray[dayIndex].array.push({
                            microsoft: microsoftDescription,
                            nutritionix: nutritionixCalories,
                            createdAt: hour + ":" + min
                        });
                    }
                }
            },
            error: function (error) {
                console.log("Error querying food data:", error.message);
            }
        });
    };
    //STRAVA
    ProfilePage.prototype.connectStravaButton = function () {
        var _this = this;
        var browserRef = window.cordova.InAppBrowser.open("https://www.strava.com/oauth/authorize?"
            + "client_id=11012&response_type=code&response_type=code"
            + "&redirect_uri=http://localhost&approval_prompt=force", "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
        browserRef.addEventListener("loadstart", function (event) {
            if ((event.url).indexOf("http://localhost") === 0) {
                browserRef.removeEventListener("exit", function (event) { });
                browserRef.close();
                var url = event.url;
                var accessCode = url.substring(30, url.length);
                _this.stravaAPIPOST(accessCode);
                _this.stravaStats();
                _this.stravaActivities();
                _this.initStravaData();
            }
        });
        browserRef.addEventListener("exit", function (event) {
            alert("Congratulations your Strava account is connected!"); //TODO: WHAT IF IT ISN'T??
        });
    };
    ProfilePage.prototype.stravaAPIPOST = function (access_code) {
        var c_id = "11012";
        var c_secret = "1d5dc79c5adbaaefcc6eeb2b2c9ddb584085ecfc";
        var objParam = {
            client_id: c_id,
            client_secret: c_secret,
            code: access_code
        };
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                var idTest = JSON.parse(xmlhttp.responseText).athlete.id;
                Parse.User.current().set(consts_1.Consts.USER_STRAVADATA, JSON.parse(xmlhttp.responseText));
                Parse.User.current().set(consts_1.Consts.USER_STRAVAAUTHORIZATIONCODE, access_code);
                Parse.User.current().set(consts_1.Consts.USER_STRAVAACCESSTOKEN, JSON.parse(xmlhttp.responseText).access_token);
                Parse.User.current().set(consts_1.Consts.USER_STRAVAID, idTest);
                Parse.User.current().save();
            }
        };
        xmlhttp.open("POST", "https://www.strava.com/oauth/token", true);
        xmlhttp.setRequestHeader("Content-type", "application/json;");
        xmlhttp.send(JSON.stringify(objParam));
    };
    //STRAVA: GET OVERALL STATS
    ProfilePage.prototype.stravaStats = function () {
        var stravaId = Parse.User.current().get(consts_1.Consts.USER_STRAVAID);
        var stravaAccessToken = Parse.User.current().get(consts_1.Consts.USER_STRAVAACCESSTOKEN);
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                //alert(xmlhttp.responseText);
                Parse.User.current().set(consts_1.Consts.USER_STRAVASTATS, xmlhttp.responseText);
                Parse.User.current().save();
            }
        };
        xmlhttp.open("GET", "https://www.strava.com/api/v3/athletes/" + stravaId + "/stats", true);
        xmlhttp.setRequestHeader("Content-type", "application/json;");
        xmlhttp.setRequestHeader("Authorization", "Bearer " + stravaAccessToken);
        xmlhttp.send();
    };
    //STRAVA: LIST ATHLETE ACTIVITIES
    ProfilePage.prototype.stravaActivities = function () {
        //var stravaId = Parse.User.current().get(Consts.USER_STRAVAID);
        var stravaAccessToken = Parse.User.current().get(consts_1.Consts.USER_STRAVAACCESSTOKEN);
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                //alert(xmlhttp.responseText);
                Parse.User.current().set(consts_1.Consts.USER_STRAVACTIVITIES, xmlhttp.responseText);
                Parse.User.current().save();
            }
        };
        xmlhttp.open("GET", "https://www.strava.com/api/v3/athlete/activities", true);
        xmlhttp.setRequestHeader("Content-type", "application/json;");
        xmlhttp.setRequestHeader("Authorization", "Bearer " + stravaAccessToken);
        xmlhttp.send();
    };
    //Running and cycling data for last week retrieved from Strava
    ProfilePage.prototype.initStravaData = function () {
        var _this = this;
        cloudfunctions_1.CloudFunctions.stravaActivitiesLastWeek(function (data, error) {
            if (error == null) {
                //console.log('stravaActivitiesLastWeek done!');
                _this.cyclingData = data.data.cycling;
                _this.initCyclingChart();
                _this.runningData = data.data.running;
                _this.initRunningChart();
                if (_this.walkingData) {
                    for (var i = 0; i < _this.runningData.distance.length; i++) {
                        _this.walkingData[i] -= _this.runningData.distance[i] / 1000;
                    }
                    _this.initWalkingChart();
                }
            }
            else {
                alert('stravaActivitiesLastWeek error');
                console.log(error);
            }
        });
    };
    //MOVES
    ProfilePage.prototype.connectMoves = function () {
        var _this = this;
        var browserRef = window.cordova.InAppBrowser.open("https://api.moves-app.com/oauth/v1/"
            + "authorize?response_type=code&client_id=95C57N4Gt5t9l5uir45i0P6RcNd1DN6v"
            + "&scope=activity%20location", "_blank", "location=no,clearsessioncache=yes,"
            + "clearcache=yes");
        browserRef.addEventListener("loadstart", function (event) {
            if ((event.url).indexOf("http://localhost") === 0) {
                browserRef.removeEventListener("exit", function (event) { });
                browserRef.close();
                var url = event.url;
                var urlMinus = url.length - 7;
                var movesAuthorizationCode = url.substring(23, urlMinus);
                console.log(movesAuthorizationCode);
                _this.movesAPIPOST(movesAuthorizationCode);
            }
        });
        browserRef.addEventListener("exit", function (event) {
            alert("Congratulations your Moves account is connected!"); //TODO: WHAT IF IT ISN'T??
        });
    };
    ProfilePage.prototype.movesAPIPOST = function (movesAuthorizationCode) {
        alert('movesApIPOST');
        /*
        var c_id = "95C57N4Gt5t9l5uir45i0P6RcNd1DN6v";
        var c_secret = "I_47yeKyJqqdgVJYcv5vka3vtqDSTGN6nHx7510TX3QN6w7gw3Rj62fRJ6UXVqrj"
        var redirect_uri = "http://localhost";
        var objParam = {
          code: movesAuthorizationCode,
          client_id: c_id,
          client_secret: c_secret,
          reidrect_uri: redirect_uri
        };
        */
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                alert(3);
                alert(xmlhttp.responseText); //TODO: REMOVE FOR PROD
            }
        };
        xmlhttp.open("POST", "https://api.moves-app.com/oauth/v1", true);
        alert(2);
        xmlhttp.setRequestHeader("Content-type", "application/json;");
        alert(3);
        //xmlhttp.send(JSON.stringify(objParam));
        alert(4);
    };
    ProfilePage.prototype.showSettings = function () {
        uimessages_1.UIMessages.showConfirmation({
            title: "Logout",
            message: "The only setting option currently is to logout. Are you sure?"
        }, this.nav, function () {
            Parse.User.logOut().then(function () {
                //alert('The user has logged out');
                location.reload();
            });
        });
    };
    //MEETUP
    ProfilePage.prototype.connectMeetup = function () {
        /*this.cordovaOauth = new CordovaOauth(new Meetup({
          clientId: "5mmt4kfgh5mc469f43hj8t5rh6",
          appScope: ["email"]
        }));
        this.cordovaOauth.login().then((success) => {
          alert(JSON.stringify(success));
            }, (error) => {
          alert(JSON.stringify(error));
        });*/
    };
    ProfilePage = __decorate([
        ionic_angular_1.Page({
            templateUrl: 'build/pages/profilepage/profilepage.html'
        }), 
        __metadata('design:paramtypes', [ionic_angular_1.IonicApp, ionic_angular_1.NavController, ionic_angular_1.NavParams, ionic_angular_1.ViewController, core_1.NgZone, ionic_angular_1.Platform, http_1.Http])
    ], ProfilePage);
    return ProfilePage;
}());
exports.ProfilePage = ProfilePage;
