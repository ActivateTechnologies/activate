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
var widget_1 = require('../../widgets/widget');
var cloudfunctions_1 = require('../../helpers/cloudfunctions');
var helperfunctions_1 = require('../../helpers/helperfunctions');
var core_2 = require('@angular/core');
var profilepage_1 = require('../profilepage/profilepage');
var http_1 = require('@angular/http');
//import {File} from 'ionic-native';
var HomePage = (function () {
    function HomePage(nav, app, zone, platform, http) {
        this.dev = true;
        this.loadingMessages = true;
        Parse.initialize(consts_1.Consts.PARSE_APPLICATION_ID, consts_1.Consts.PARSE_JS_KEY);
        this.nav = nav;
        this.app = app;
        this.zone = zone;
        this.http = http;
        this.platform = platform;
        this.chatMessages = [];
        this.recentMessagesTemp = [];
        this.initialize();
        this.THINKING_DELAY = (this.dev) ? 0 : 1000;
        this.TYPING_DELAY = (this.dev) ? 500 : 1500;
        this.SCROLL_DELAY = (this.dev) ? 0 : 3000;
        this.widgetBoundCallback = this.widgetCallback.bind(this);
    }
    HomePage.prototype.initialize = function () {
        var _this = this;
        this.startLocationTracking();
        this.uploadDetailedWalkingData();
        if (Parse.User.current()) {
            this.retrieveArchieveMessages();
            //this.navigateTreeTo('start', false); //healthApi
            return;
        }
        else {
            this.loadingMessages = false;
        }
        this.typing = true;
        cloudfunctions_1.CloudFunctions.initConversation(function (data, error) {
            if (!error) {
                _this.processReceivedTreeObject(data.treeObject);
            }
            else {
                console.log('Error', error.message);
                alert('There was a network error, please try again.');
            }
        });
    };
    HomePage.prototype.onPageDidEnter = function () {
        //this.openUserProfile();
    };
    //Set state of typing, controls display of typing indicator
    HomePage.prototype.setTyping = function (typing) {
        var _this = this;
        this.zone.run(function () {
            _this.typing = typing;
        });
        this.scrollToBottom();
    };
    //Retrieve past user messages
    HomePage.prototype.retrieveArchieveMessages = function () {
        var _this = this;
        this.loadingMessages = true;
        var Messages = Parse.Object.extend("Messages");
        var query = new Parse.Query(Messages);
        query.equalTo(consts_1.Consts.MESSAGES_USER, Parse.User.current());
        query.descending(consts_1.Consts.MESSAGES_TIMESTAMP);
        query.limit(100);
        query.find({
            success: function (parseObjects) {
                for (var i = 0; i < parseObjects.length; i++) {
                    var messageObject = {};
                    if (parseObjects[i].get(consts_1.Consts.MESSAGES_MESSAGE).widgetName) {
                        messageObject.isWidget = true;
                        messageObject.widget = parseObjects[i].get(consts_1.Consts.MESSAGES_MESSAGE);
                    }
                    else {
                        messageObject.isWidget = false;
                        messageObject.message = parseObjects[i].get(consts_1.Consts.MESSAGES_MESSAGE);
                    }
                    if (parseObjects[i].get(consts_1.Consts.MESSAGES_TYPE)) {
                        messageObject.type = parseObjects[i].get(consts_1.Consts.MESSAGES_TYPE);
                    }
                    messageObject.usersMessage = parseObjects[i].get(consts_1.Consts.MESSAGES_USERSMESSAGE);
                    //this.chatMessages.push(messageObject);
                    _this.chatMessages.splice(0, 0, messageObject);
                }
                _this.scrollToBottom();
                _this.loadingMessages = false;
                _this.navigateTreeTo('loggedIn', true);
            },
            error: function (error) {
                console.log('Error retrieving past messages:', error);
            }
        });
    };
    //Called when a treeObject is received
    HomePage.prototype.processReceivedTreeObject = function (treeObject) {
        var _this = this;
        //console.log('processReceivedTreeObject', treeObject);
        this.setTyping(false);
        var treeObjectMessages = treeObject.get(consts_1.Consts.TREEOBJECTS_MESSAGES);
        var treeObjectChildConnectors = treeObject.get(consts_1.Consts.TREEOBJECTS_CHILDRENCONNECTORS);
        var randIndexMessages = Math.floor(Math.random() * treeObjectMessages.length);
        var randIndexChildren = Math.floor(Math.random() * treeObjectChildConnectors.length);
        var messageObject = {
            usersMessage: false
        };
        if (treeObjectMessages.length == 1 && treeObjectMessages[0].widgetName) {
            messageObject.isWidget = true;
            messageObject.widget = treeObjectMessages[0];
        }
        else {
            messageObject.isWidget = false;
            messageObject.message = this.processMessage(treeObjectMessages[randIndexMessages]);
        }
        //If it is widget, the widget callback will save the message
        if (!messageObject.isWidget) {
            this.saveMessageToParse(messageObject, treeObject, false);
        }
        this.zone.run(function () {
            _this.chatMessages.push(messageObject);
        });
        this.scrollToBottom();
        if (treeObjectChildConnectors[randIndexChildren].length > 0) {
            this.zone.run(function () {
                _this.replyOptions = [];
            });
            var _loop_1 = function(i) {
                var replyOption = {
                    pointer: treeObject.get(consts_1.Consts.TREEOBJECTS_CHILDREN)[i]
                };
                if (treeObjectChildConnectors[randIndexChildren][i].widgetName) {
                    replyOption.isWidget = true;
                    replyOption.widget = treeObjectChildConnectors[randIndexChildren][i];
                }
                else {
                    replyOption.isWidget = false;
                    replyOption.message = treeObjectChildConnectors[randIndexChildren][i];
                }
                //console.log('Reply Option', treeObject, replyOption);
                this_1.zone.run(function () {
                    _this.replyOptions.push(replyOption);
                });
            };
            var this_1 = this;
            for (var i = 0; i < treeObjectChildConnectors[0].length; i++) {
                _loop_1(i);
            }
        }
        else {
            this.setTyping(true);
            setTimeout(function () {
                _this.fetchAndProcessPointer(treeObject.get(consts_1.Consts.TREEOBJECTS_CHILDREN)[0]);
            }, this.TYPING_DELAY);
        }
    };
    HomePage.prototype.saveMessageToParse = function (messageObject, treeObject, usersMessage) {
        var _this = this;
        var Message = Parse.Object.extend(consts_1.Consts.MESSAGES_CLASS);
        var message = new Message();
        message.set(consts_1.Consts.MESSAGES_USERSMESSAGE, usersMessage);
        message.set(consts_1.Consts.MESSAGES_TIMESTAMP, new Date());
        if (messageObject.type) {
            message.set(consts_1.Consts.MESSAGES_TYPE, messageObject.type);
        }
        if (treeObject) {
            message.set(consts_1.Consts.MESSAGES_TREEOBJECT, treeObject);
        }
        if (messageObject.message) {
            message.set(consts_1.Consts.MESSAGES_MESSAGE, messageObject.message);
        }
        else {
            console.log('No message found');
        }
        if (Parse.User.current() == null) {
            this.recentMessagesTemp.push(message);
            return;
        }
        if (!usersMessage) {
            this.recentMessagesTemp.push(message);
        }
        else if (this.recentMessagesTemp.length == 0) {
            message.set(consts_1.Consts.MESSAGES_USER, Parse.User.current());
            message.save();
        }
        else {
            this.recentMessagesTemp.push(message);
            for (var i = 0; i < this.recentMessagesTemp.length; i++) {
                this.recentMessagesTemp[i].set(consts_1.Consts.MESSAGES_USER, Parse.User.current());
            }
            Parse.Object.saveAll(this.recentMessagesTemp, {
                success: function (objects) {
                    _this.recentMessagesTemp = [];
                    message.save();
                },
                error: function (error) {
                    console.log('Error saving recent messages:', error.message);
                }
            });
        }
    };
    //Replaces hot keywords with dynamic data
    HomePage.prototype.processMessage = function (message) {
        var editedString = message;
        editedString = editedString.replace("#~user_firstname~#", (Parse.User.current()) ? Parse.User.current().get(consts_1.Consts.USER_FIRSTNAME) : "Stranger");
        editedString = editedString.replace("#~nativeHealthApi~#", (this.platform.is('android')) ? "Google Fit" :
            (this.platform.is('ios')) ? "HealthKit" : "Health Api");
        return editedString;
    };
    //Fetches a parse object from server when given one, and calls processReceivedTreeObject
    HomePage.prototype.fetchAndProcessPointer = function (pointer) {
        var _this = this;
        //console.log('Going to fetch:', pointer);
        if (pointer == null || typeof pointer.fetch !== "function") {
            //console.log('Pointer is null, likely end of tree.');
            /*this.chatMessages.push({
              message: "- End of tree -",
              usersMessage: false,
              isWidget: false
            });*/
            this.setTyping(false);
            return;
        }
        pointer.fetch({
            success: function (parseObject) {
                _this.processReceivedTreeObject(parseObject);
            },
            error: function (parseObject, error) {
                alert('There was a network error, please try again later.');
            }
        });
    };
    //Adds user choice to conversation and calls to fetch next treeObject
    HomePage.prototype.replyWithMessage = function (option) {
        var _this = this;
        //console.log('replyWithMessage', message);
        if (!option.isWidget) {
            var messageObject_1 = {
                message: option.message,
                usersMessage: true,
                isWidget: false
            };
            this.saveMessageToParse(messageObject_1, option.pointer, true);
            this.zone.run(function () {
                _this.chatMessages.push(messageObject_1);
            });
            this.scrollToBottom();
            this.zone.run(function () {
                _this.replyOptions = [];
            });
            setTimeout(function () {
                _this.setTyping(true);
                setTimeout(function () {
                    _this.fetchAndProcessPointer(option.pointer);
                }, _this.TYPING_DELAY);
            }, this.THINKING_DELAY);
        }
    };
    /*Passed as a callback function to widgets that were in replies
      option: option object of selected reply
      isReply: is this call from reply section
      data: any data to be saved along with this message in chatMessages
      html: static html version of widget's current state to be archived on parse*/
    HomePage.prototype.widgetCallback = function (option, isReply, data, html, usersMessage) {
        var _this = this;
        //console.log('data', data);
        var messageObject = {
            usersMessage: usersMessage,
            isWidget: true,
            widget: option.widget
        };
        if (data) {
            messageObject.data = data;
        }
        if (html) {
            messageObject.message = html;
        }
        if (isReply) {
            this.zone.run(function () {
                _this.chatMessages.push(messageObject);
                _this.scrollToBottom();
                _this.replyOptions = [];
            });
            setTimeout(function () {
                _this.setTyping(true);
                setTimeout(function () {
                    _this.zone.run(function () {
                        _this.fetchAndProcessPointer(option.pointer);
                    });
                }, _this.TYPING_DELAY);
            }, this.THINKING_DELAY);
        }
        else {
            this.saveMessageToParse(messageObject, option.pointer, usersMessage);
        }
    };
    //Scroll to bottom of ion-content with defined scroll time animation
    HomePage.prototype.scrollToBottom = function () {
        var _this = this;
        setTimeout(function () {
            _this.content.scrollToBottom();
        }, 200);
    };
    HomePage.prototype.navigateTreeTo = function (notesString, insertDate) {
        var _this = this;
        var TreeObjects = Parse.Object.extend(consts_1.Consts.TREEOBJECTS_CLASS);
        var query = new Parse.Query(TreeObjects);
        query.equalTo(consts_1.Consts.TREEOBJECTS_NOTES, notesString);
        query.first({
            success: function (treeObject) {
                //console.log('Got treeObject', treeObject)
                if (insertDate) {
                    _this.zone.run(function () {
                        var now = new Date();
                        var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                        var hour = (now.getHours() < 10) ? '0' + now.getHours() : now.getHours();
                        var min = (now.getMinutes() < 10) ? '0' + now.getMinutes() : now.getMinutes();
                        var dateString = now.getDay() + " " + months[now.getMonth()] + ", "
                            + hour + ":" + min;
                        var messageObject = {
                            type: 'dateMessage',
                            date: now,
                            message: dateString
                        };
                        _this.chatMessages.push(messageObject);
                        _this.saveMessageToParse(messageObject, null, false);
                    });
                }
                setTimeout(function () {
                    _this.setTyping(true);
                    setTimeout(function () {
                        _this.processReceivedTreeObject(treeObject);
                    }, _this.TYPING_DELAY);
                }, 0); //this.THINKING_DELAY
            },
            error: function (error) {
                console.log("Error getting root TreeObject", error.message);
                alert('There was an network error, please try again.');
            }
        });
    };
    HomePage.prototype.openUserProfile = function () {
        /*
          CloudFunctions.testGoogle((data, error) => {
            console.log('Google test data: ', data);
          });
        */
        if (Parse.User.current() != null) {
            this.nav.push(profilepage_1.ProfilePage);
        }
    };
    HomePage.prototype.uploadDetailedWalkingData = function () {
        console.log('getDetailedWalkingData called');
        var WalkingData = Parse.Object.extend("WalkingData");
        var query = new Parse.Query(WalkingData);
        query.equalTo('user', Parse.User.current());
        query.descending('weekStartDate');
        query.first({
            success: function (parseObject) {
                if (parseObject) {
                    process(parseObject.get('weekStartDate').getTime());
                }
                else {
                    process(0);
                }
            }, error: function (error) {
                process(0);
            }
        });
        function process(lastWeekStartDate) {
            var MAX_HISTORY_WEEKS = 10;
            var weekStart = new Date();
            weekStart.setTime(weekStart.getTime() //Start of today
                - weekStart.getTime() % (86400 * 1000));
            weekStart.setTime(weekStart.getTime() //Start of this week
                - weekStart.getDay() * 86400 * 1000);
            weekStart.setTime(weekStart.getTime() //Start of MAX_HISTORY_WEEKS ago
                - MAX_HISTORY_WEEKS * 7 * 86400 * 1000);
            weekStart.setTime(Math.max(lastWeekStartDate, weekStart.getTime()));
            navigator.health.query({
                startDate: weekStart,
                endDate: new Date(),
                dataType: 'distance'
            }, function (data) {
                console.log('Data received');
                var combinedHealthData = helperfunctions_1.HelperFunctions.combineHealthDate(data, 1000, 30, false);
                cloudfunctions_1.CloudFunctions.saveWalkingData(combinedHealthData, function (data, error) {
                    if (!error) {
                        console.log('Walking data saved to cloud');
                    }
                });
            }, function (error) {
                console.log('Error getting detailed walking data: ', error);
            });
        }
    };
    HomePage.prototype.startLocationTracking = function () {
        var _this = this;
        backgroundGeolocation.stop();
        var config = {
            desiredAccuracy: 0,
            stationaryRadius: 30,
            distanceFilter: 1,
            debug: false,
            interval: 2 * 1000,
            stopOnTerminate: false,
            activityType: "Fitness"
        };
        backgroundGeolocation.configure(function (location) {
            console.log(location);
        }, function (error) { }, config);
        backgroundGeolocation.start();
        backgroundGeolocation.getLocations(function (locations) {
            console.log('Got stored locations, count: ', locations.length);
            if (locations.length > 0) {
                _this.saveLocationsToParse(locations);
            }
        }, function () {
            console.log('Error getting locations');
        });
    };
    HomePage.prototype.saveLocationsToParse = function (locations) {
        var keys = Object.keys(locations);
        var locationsToSend = {};
        for (var i = 0; i < keys.length; i++) {
            locationsToSend[locations[keys[i]].time] = {
                accuracy: locations[keys[i]].accuracy,
                lat: locations[keys[i]].latitude,
                lng: locations[keys[i]].longitude,
                provider: locations[keys[i]].provider,
                debug: locations[keys[i]].debug
            };
        }
        cloudfunctions_1.CloudFunctions.saveLocationData(locationsToSend, function (data, error) {
            if (!error) {
            }
        });
    };
    HomePage.prototype.saveLocationsToParseOriginal = function (locations) {
        var keys = Object.keys(locations);
        var locationsToSend = [];
        for (var i = 0; i < keys.length; i++) {
            locationsToSend.push({
                accuracy: locations[keys[i]].accuracy,
                lat: locations[keys[i]].latitude,
                lng: locations[keys[i]].longitude,
                provider: locations[keys[i]].provider,
                time: locations[keys[i]].time,
                debug: locations[keys[i]].debug
            });
        }
        cloudfunctions_1.CloudFunctions.saveLocationData(locationsToSend, function (data, error) {
            if (!error) {
            }
        });
    };
    __decorate([
        core_1.ViewChild(ionic_angular_1.Content), 
        __metadata('design:type', ionic_angular_1.Content)
    ], HomePage.prototype, "content", void 0);
    HomePage = __decorate([
        ionic_angular_1.Page({
            templateUrl: 'build/pages/homepage/homepage.html',
            directives: [widget_1.Widget]
        }), 
        __metadata('design:paramtypes', [ionic_angular_1.NavController, ionic_angular_1.IonicApp, core_2.NgZone, ionic_angular_1.Platform, http_1.Http])
    ], HomePage);
    return HomePage;
}());
exports.HomePage = HomePage;
