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
var core_1 = require('@angular/core');
var consts_1 = require('../../helpers/consts');
var core_2 = require('@angular/core');
var helperfunctions_1 = require('../../helpers/helperfunctions');
var Health = (function () {
    function Health(platform, zone) {
        this.loading = false;
        this.healthApiAvailable = false;
        this.healthApiAccessGranted = false;
        Parse.initialize(consts_1.Consts.PARSE_APPLICATION_ID, consts_1.Consts.PARSE_JS_KEY);
        this.currentUser = Parse.User.current();
        this.loading = true;
        this.platform = platform;
        this.zone = zone;
    }
    Health.prototype.ngOnInit = function () {
        var _this = this;
        //Types: initHealth, showData, measureHeart
        this.widgetType = this.options.type;
        this.initializeStatusVars(function () {
            if (!_this.isReply && _this.widgetType == 'initHealth') {
                _this.initHealthString = _this.constructInitHealthString();
            }
            if (!_this.isReply && _this.widgetType == 'showData') {
                _this.showData();
            }
            if (!_this.isReply && _this.widgetType == 'recentActivity') {
                _this.recentActivity();
            }
            if (!_this.isReply && _this.widgetType == 'recentSleep') {
                _this.recentSleep();
            }
            /*if (!this.isReply && this.widgetType == 'measureHeart') {
              this.measureHeart();
            }*/
        });
        if (!this.isReply) {
            setTimeout(function () {
                var arrayOfElements = document.getElementsByClassName("health");
                var html = arrayOfElements[arrayOfElements.length - 1].innerHTML;
                html.replace('<!--template bindings={}-->', ' ')
                    .replace('<!--template bindings={}-->', ' '); //two occurances
                html = '<div class="health">' + html + '</div>';
                if (_this.widgetType == 'showData' || _this.widgetType == 'recentActivity') {
                    _this.callbackFunction(_this.chatObject, _this.isReply, null, html, false);
                }
                else {
                    _this.callbackFunction(_this.chatObject, _this.isReply, null, html, true);
                }
            });
        }
    };
    //Initialize various status variables incluring platformId and health api statuses
    Health.prototype.initializeStatusVars = function (callback) {
        var _this = this;
        if (this.platform.is('android')) {
            this.platformId = 'android';
        }
        else if (this.platform.is('ios')) {
            this.platformId = 'ios';
        }
        else {
            this.platformId = 'browser';
        }
        if (localStorage['healthApiAccessGranted']) {
            this.healthApiAccessGranted = localStorage['healthApiAccessGranted'];
        }
        if (this.platformId != 'browser' && navigator.health) {
            navigator.health.isAvailable(function () {
                _this.healthApiAvailable = true;
                _this.loading = false;
                callback();
            }, function () {
                console.log('Health not available');
                _this.loading = false;
                callback();
            });
        }
        else {
            this.loading = false;
        }
    };
    //Called when user clicks to grant access to Health Apis
    Health.prototype.initHealth = function () {
        var _this = this;
        if (this.platformId != 'browser') {
            this.loading = true;
            navigator.health.requestAuthorization(['steps', 'distance', 'activity'], function () {
                localStorage['healthApiAccessGranted'] = true;
                _this.callbackFunction(_this.chatObject, _this.isReply, null, null, true);
            }, function (err) {
                localStorage['healthApiAccessGranted'] = false;
                console.log('Health auth error', err);
                _this.callbackFunction(_this.chatObject, _this.isReply, null, null, true);
            });
        }
        else {
            this.callbackFunction(this.chatObject, this.isReply, null, null, true);
        }
    };
    //Constructs the appropriate message to display after user has been asked to grant access
    Health.prototype.constructInitHealthString = function () {
        if (this.platformId == 'browser') {
            return 'Health api not available in browser.';
        }
        else {
            if (!this.healthApiAvailable) {
                return (this.platformId == 'android') ?
                    'Google Fit is not available on your device.'
                    : 'HealthKit is not available on your device.';
            }
            else {
                if (this.healthApiAccessGranted) {
                    return (this.platformId == 'android') ?
                        'Google Fit is all set!'
                        : 'HealthKit is all set!';
                }
                else {
                    return (this.platformId == 'android') ?
                        'Google Fit permission deined.'
                        : 'HealthKit permission denied.';
                }
            }
        }
    };
    //Get all data and call processShowData. If even one has error,
    //call callback function with no data
    Health.prototype.showData = function () {
        var _this = this;
        var steps;
        var distance;
        var activity;
        if (localStorage['healthApiAccessGranted']) {
            Parse.User.current();
            this.loading = true;
            navigator.health.queryAggregated({
                startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                dataType: 'steps'
            }, function (data) {
                //console.log('Got steps:', data)
                steps = data;
                _this.processShowData(steps, distance, activity);
            }, function (error) {
                console.log('Error:', error);
                _this.callbackFunction(_this.chatObject, _this.isReply, {
                    error: "Error accessing steps"
                }, null, false);
            });
            navigator.health.queryAggregated({
                startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                dataType: 'distance'
            }, function (data) {
                //console.log('Got distance:', data)
                distance = data;
                _this.processShowData(steps, distance, activity);
            }, function (error) {
                console.log('Error:', error);
                _this.callbackFunction(_this.chatObject, _this.isReply, {
                    error: "Error accessing distance"
                }, null, false);
            });
            navigator.health.queryAggregated({
                startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                dataType: 'activity'
            }, function (data) {
                //console.log('Got activity:', data);
                activity = data;
                _this.processShowData(steps, distance, activity);
            }, function (error) {
                console.log('Error:', error);
                _this.callbackFunction(_this.chatObject, _this.isReply, {
                    error: "Error accessing activity"
                }, null, false);
            });
        }
    };
    //Called by showData
    Health.prototype.processShowData = function (steps, distance, activity) {
        if (steps != null && distance != null && activity != null) {
            var summaryString = 'You walked ' + Math.round(steps.value)
                + ' steps yesterday ' + 'which covered ' + Math.round(distance.value) + distance.unit;
            this.loading = false;
            this.summaryString = summaryString;
        }
    };
    //Get recent data as per specified options
    Health.prototype.recentActivity = function () {
        var _this = this;
        if (localStorage['healthApiAccessGranted']) {
            Parse.User.current();
            this.loading = true;
            var endDate = new Date();
            //endDate.setSeconds(0);
            var startDate = new Date();
            startDate.setMinutes(0);
            startDate.setSeconds(0);
            startDate.setHours(0);
            navigator.health.query({
                startDate: startDate,
                endDate: endDate,
                dataType: 'distance'
            }, function (data) {
                _this.processRecentActivity(data);
            }, function (error) {
                console.log('Error:', error);
                _this.callbackFunction(_this.chatObject, _this.isReply, {
                    error: "Error accessing distance"
                }, null, false);
            });
        }
        else {
            this.loading = false;
            alert('Health API Not Available');
            this.summaryString = 'Recent Activity Statement (Health Api Not Available)';
        }
    };
    Health.prototype.processRecentActivity = function (distanceArray) {
        var _this = this;
        var ACCEPTED_INTERVAL = 1 * 5000; //seconds
        var ACCEPTED_MIN_DISTANCE = 100;
        if (distanceArray != null) {
            var distanceArrayCombined = helperfunctions_1.HelperFunctions.combineHealthDate(distanceArray, ACCEPTED_INTERVAL, ACCEPTED_MIN_DISTANCE, true);
            var lastTrip_1 = distanceArrayCombined[distanceArrayCombined.length - 1];
            lastTrip_1.startDate = new Date(lastTrip_1.startDate);
            lastTrip_1.endDate = new Date(lastTrip_1.endDate);
            //console.log('Last Trip', lastTrip);
            /*console.log(Parse.User.current().get(Consts.USER_LASTNOTIFIEDRECENTACTIVITY),
             lastTrip.endDate);*/
            Parse.User.current().fetch({
                success: function (object) {
                    if (Parse.User.current().get(consts_1.Consts.USER_LASTNOTIFIEDRECENTACTIVITY) &&
                        Parse.User.current().get(consts_1.Consts.USER_LASTNOTIFIEDRECENTACTIVITY)
                            > lastTrip_1.endDate) {
                        _this.summaryString = 'Time to get movin!';
                        _this.loading = false;
                    }
                    else {
                        var startMin_1 = lastTrip_1.startDate.getMinutes();
                        startMin_1 = (startMin_1 > 9) ? startMin_1 : "0" + startMin_1;
                        var startHour_1 = lastTrip_1.startDate.getHours() % 12;
                        startHour_1 = startHour_1 ? startHour_1 : 12;
                        var startAmPm_1 = (lastTrip_1.startDate.getHours() < 12) ? "am" : "pm";
                        var endMin_1 = lastTrip_1.endDate.getMinutes();
                        endMin_1 = (endMin_1 > 9) ? endMin_1 : "0" + endMin_1;
                        var endHour_1 = lastTrip_1.endDate.getHours() % 12;
                        endHour_1 = endHour_1 ? endHour_1 : 12;
                        var endAmPm_1 = (lastTrip_1.endDate.getHours() < 12) ? "am" : "pm";
                        _this.zone.run(function () {
                            _this.summaryString = 'Nice ' + Math.round(lastTrip_1.value / 10) / 100
                                + 'km walk you did from ' + startHour_1 + ':' + startMin_1 + startAmPm_1 + ' to '
                                + endHour_1 + ':' + endMin_1 + endAmPm_1;
                            _this.loading = false;
                        });
                        //Parse.User.current().set(Consts.USER_LASTNOTIFIEDRECENTACTIVITY, new Date());
                        Parse.User.current().save();
                    }
                },
                error: function (object, error) {
                    console.log('Error fetching user object: ' + error.message);
                    _this.summaryString = 'Time to get movin!';
                    _this.loading = false;
                }
            });
        }
    };
    Health.prototype.recentSleep = function () {
        var _this = this;
        if (localStorage['healthApiAccessGranted']) {
            Parse.User.current();
            this.loading = true;
            var endDate = new Date();
            //endDate.setSeconds(0);
            var startDate = new Date();
            startDate.setTime(startDate.getTime() - (86400 * 1000));
            navigator.health.queryAggregated({
                startDate: startDate,
                endDate: new Date(),
                dataType: 'activity'
            }, function (data) {
                if (data.value.sleep) {
                    _this.processRecentSleep(Math.round(data.value.sleep.duration * 10 / 3600) / 10);
                }
            }, function (error) {
                console.log('Error:', error);
                _this.callbackFunction(_this.chatObject, _this.isReply, {
                    error: "Error accessing sleep data"
                }, null, false);
            });
        }
        else {
            this.loading = false;
            alert('Health API Not Available');
            this.summaryString = 'Recent Sleep Statement (Health Api Not Available)';
        }
    };
    //Called by showData
    Health.prototype.processRecentSleep = function (sleepNumber) {
        var _this = this;
        var SLEEP_MEAN = 8; //seconds
        var SLEEP_TROLERANCE = 0.75;
        if (sleepNumber && sleepNumber > 0) {
            Parse.User.current().fetch({
                success: function (object) {
                    var date5MinAgo = new Date();
                    date5MinAgo.setTime(date5MinAgo.getTime() - 5 * 60000);
                    if (Parse.User.current().get(consts_1.Consts.USER_LASTOPENED) &&
                        Parse.User.current().get(consts_1.Consts.USER_LASTOPENED) < date5MinAgo) {
                        if (sleepNumber < (SLEEP_MEAN - SLEEP_TROLERANCE)) {
                        }
                        else if (sleepNumber > (SLEEP_MEAN + SLEEP_TROLERANCE)) {
                        }
                        else {
                        }
                        var startMin_2 = lastTrip.startDate.getMinutes();
                        startMin_2 = (startMin_2 > 9) ? startMin_2 : "0" + startMin_2;
                        var startHour_2 = lastTrip.startDate.getHours() % 12;
                        startHour_2 = startHour_2 ? startHour_2 : 12;
                        var startAmPm_2 = (lastTrip.startDate.getHours() < 12) ? "am" : "pm";
                        var endMin_2 = lastTrip.endDate.getMinutes();
                        endMin_2 = (endMin_2 > 9) ? endMin_2 : "0" + endMin_2;
                        var endHour_2 = lastTrip.endDate.getHours() % 12;
                        endHour_2 = endHour_2 ? endHour_2 : 12;
                        var endAmPm_2 = (lastTrip.endDate.getHours() < 12) ? "am" : "pm";
                        _this.zone.run(function () {
                            _this.summaryString = 'Nice ' + Math.round(lastTrip.value / 10) / 100
                                + 'km walk you did from ' + startHour_2 + ':' + startMin_2 + startAmPm_2 + ' to '
                                + endHour_2 + ':' + endMin_2 + endAmPm_2;
                            _this.loading = false;
                        });
                        //Parse.User.current().set(Consts.USER_LASTNOTIFIEDRECENTACTIVITY, new Date());
                        Parse.User.current().save();
                    }
                },
                error: function (object, error) {
                    console.log('Error fetching user object: ' + error.message);
                    _this.summaryString = 'Time to get movin!';
                    _this.loading = false;
                }
            });
        }
    };
    Health.prototype.measureHeart = function () {
        var _this = this;
        this.loading = true;
        var props = {
            seconds: 10,
            fps: 30
        };
        if (window.heartbeat) {
            window.heartbeat.take(props, function (bpm) {
                console.log("Your heart beat per minute is: " + bpm);
                _this.saveHeartRate(bpm, function () {
                    _this.loading = false;
                    _this.callbackFunction(_this.chatObject, _this.isReply, {
                        summaryString: "Your heart beat per minute is: " + bpm,
                        bmpCount: bpm
                    }, null, true);
                });
            }, function (error) {
                _this.summaryString = "Error measuring heart rate";
                _this.loading = false;
                console.log("Error measuring heart beat", error);
                _this.callbackFunction(_this.chatObject, _this.isReply, {
                    summaryString: "Error measuring heart rate"
                }, null, true);
            });
        }
        else {
            console.log('Heartbeat plugin not found, simulating');
            setTimeout(function () {
                _this.loading = false;
                var bpm = 60;
                _this.saveHeartRate(bpm, function () {
                    _this.callbackFunction(_this.chatObject, _this.isReply, {
                        summaryString: "Your heart beat per minute is: " + bpm,
                        bmpCount: bpm
                    }, null, true);
                });
            }, 2000);
        }
    };
    Health.prototype.saveHeartRate = function (bpm, callback) {
        var HeartData = Parse.Object.extend(consts_1.Consts.HEARTDATA_CLASS);
        var heartData = new HeartData();
        heartData.set(consts_1.Consts.HEARTDATA_USER, Parse.User.current());
        heartData.set(consts_1.Consts.HEARTDATA_HEARTRATE, bpm);
        heartData.set(consts_1.Consts.HEARTDATA_REFERENCE, 1);
        heartData.save({
            success: function (parseObject) {
                callback();
            },
            error: function (parseObject, error) {
                console.log("Error saving HeartData:", error.message);
                callback();
            }
        });
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], Health.prototype, "chatObject", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], Health.prototype, "options", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], Health.prototype, "data", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Boolean)
    ], Health.prototype, "isReply", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Function)
    ], Health.prototype, "callbackFunction", void 0);
    Health = __decorate([
        core_1.Component({
            selector: 'Health',
            templateUrl: 'build/widgets/health/health.html'
        }), 
        __metadata('design:paramtypes', [ionic_angular_1.Platform, core_2.NgZone])
    ], Health);
    return Health;
}());
exports.Health = Health;
