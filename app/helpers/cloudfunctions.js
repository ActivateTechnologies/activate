"use strict";
var consts_1 = require('./consts');
var CloudFunctions = (function () {
    function CloudFunctions() {
        Parse.initialize(consts_1.Consts.PARSE_APPLICATION_ID, consts_1.Consts.PARSE_JS_KEY);
    }
    CloudFunctions.initConversation = function (callback) {
        Parse.Cloud.run('initConversation', {}, {
            success: function (data) {
                callback(data);
            },
            error: function (error) {
                console.log('Error calling initConversations:', error.message);
                callback({}, error);
            }
        });
    };
    CloudFunctions.getWeekHeartData = function (callback) {
        Parse.Cloud.run('getWeekHeartData', {}, {
            success: function (data) {
                callback(data);
            },
            error: function (error) {
                console.log('Error calling getWeekHeartData:', error.message);
                callback({}, error);
            }
        });
    };
    CloudFunctions.getWeekMoodsData = function (callback) {
        Parse.Cloud.run('getWeekMoodData', {}, {
            success: function (data) {
                callback(data);
            },
            error: function (error) {
                console.log('Error calling getWeekMoodsData:', error.message);
                callback({}, error);
            }
        });
    };
    CloudFunctions.stravaActivitiesLastWeek = function (callback) {
        Parse.Cloud.run('stravaActivitiesLastWeek', {}, {
            success: function (data) {
                callback(data);
            },
            error: function (error) {
                console.log('Error calling getWeekHeartData:', error.message);
                callback({}, error);
            }
        });
    };
    CloudFunctions.testGoogle = function (callback) {
        Parse.Cloud.run('testGoogle', {}, {
            success: function (data) {
                callback(data);
            },
            error: function (error) {
                console.log('Error calling testGoogle:', error.message);
                callback({}, error);
            }
        });
    };
    CloudFunctions.processNutritionImage = function (requestData, callback) {
        Parse.Cloud.run('processNutritionImage', requestData, {
            success: function (data) {
                //console.log('processNutritionImage success');
                callback(data);
            },
            error: function (error) {
                console.log('Error calling processNutritionImage:', error.message);
                callback({}, error);
            }
        });
    };
    CloudFunctions.saveLocationData = function (requestData, callback) {
        Parse.Cloud.run('saveLocationData', requestData, {
            success: function (data) {
                //console.log('saveLocationData success');
                callback(data);
            },
            error: function (error) {
                console.log('Error calling saveLocationData:', error.message);
                callback({}, error);
            }
        });
    };
    CloudFunctions.saveWalkingData = function (requestData, callback) {
        Parse.Cloud.run('saveWalkingData', requestData, {
            success: function (data) {
                //console.log('saveLocationData success');
                callback(data);
            },
            error: function (error) {
                console.log('Error calling saveWalkingData:', error.message);
                callback({}, error);
            }
        });
    };
    return CloudFunctions;
}());
exports.CloudFunctions = CloudFunctions;
