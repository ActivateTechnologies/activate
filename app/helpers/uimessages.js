"use strict";
var ionic_angular_1 = require('ionic-angular');
var UIMessages = (function () {
    function UIMessages() {
    }
    //Shows a message to user (TODO: cordova alert)
    UIMessages.showMessage = function (strings, nav, callback) {
        if (!strings.message) {
            strings = {
                message: strings,
                title: ''
            };
        }
        var alertObject = ionic_angular_1.Alert.create({
            title: strings.title,
            message: strings.message,
            buttons: [{
                    text: 'Ok',
                    handler: function (data) {
                        if (callback) {
                            callback();
                        }
                    }
                }]
        });
        nav.present(alertObject);
    };
    //Shows an unintrusive message to user (TODO: cordova alert)
    UIMessages.showSmallMessage = function (message, nav, callback) {
        UIMessages.showMessage(message, nav, callback);
    };
    //Shows a confirmation to the user (TODO: cordova confirmation)
    UIMessages.showConfirmation = function (strings, nav, okCallback, cancelCallback, okString, cancelString) {
        /*if(!buttonStrings) {
          console.log('dont have buttonStrings');
          buttonStrings = {
            okString: 'Yes',
            cancelString: 'Cancel'
        } else {
          console.log('have buttonStrings');
        }*/
        if (!okString || !cancelString) {
            okString = 'Yes';
            cancelString = 'Cancel';
        }
        var alertObject = ionic_angular_1.Alert.create({
            title: strings.title,
            message: strings.message,
            buttons: [
                {
                    text: cancelString,
                    handler: function () {
                        if (cancelCallback) {
                            cancelCallback();
                        }
                    }
                },
                {
                    text: okString,
                    handler: function () {
                        okCallback();
                    }
                }
            ]
        });
        nav.present(alertObject);
    };
    return UIMessages;
}());
exports.UIMessages = UIMessages;
