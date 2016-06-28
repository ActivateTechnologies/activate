"use strict";
var consts_1 = require('./consts');
var HelperFunctions = (function () {
    function HelperFunctions() {
        Parse.initialize(consts_1.Consts.PARSE_APPLICATION_ID, consts_1.Consts.PARSE_JS_KEY);
    }
    /*Compresses the array of health data by joining records that are
      within a given time interval of eachother and of a minimum distance
      distanceArray: health data
      timeInterval: minimum time in milliseconds between records
      minDistance: distance in meters below which combined records are ignored
      ignoreWatch: if true records with source == "watch" will be ignored
      returns: combinedDistanceArray
      */
    HelperFunctions.combineHealthDate = function (distanceArray, timeInterval, minDistance, ignoreWatch) {
        if (distanceArray != null) {
            var timeNow = (new Date()).getTime();
            distanceArray = distanceArray.sort(function (a, b) {
                return a.startDate - b.startDate;
            });
            //console.log('Raw data size: ', distanceArray.length)
            var combinedTrips = [];
            var lastEndTime = new Date();
            //5 yrs ago, just any date in the past
            lastEndTime.setUTCFullYear(lastEndTime.getFullYear() - 5);
            for (var i = 0; i < distanceArray.length; i++) {
                if (!ignoreWatch || !distanceArray[i].source ||
                    distanceArray[i].source.toLowerCase().search("watch") == -1) {
                    var trip = distanceArray[i];
                    if ((trip.startDate.getTime() - lastEndTime.getTime()) > timeInterval) {
                        combinedTrips.push({
                            startDate: trip.startDate,
                            endDate: trip.endDate,
                            value: trip.value
                        });
                    }
                    else {
                        combinedTrips[combinedTrips.length - 1].value += trip.value;
                        combinedTrips[combinedTrips.length - 1].endDate = trip.endDate;
                    }
                    lastEndTime = trip.endDate;
                }
            }
            var distanceArrayCombined = [];
            for (var i = 0; i < combinedTrips.length; i++) {
                if (combinedTrips[i].value > minDistance) {
                    distanceArrayCombined.push({
                        startDate: combinedTrips[i].startDate.getTime(),
                        endDate: combinedTrips[i].endDate.getTime(),
                        value: Math.round(combinedTrips[i].value * 100) / 100
                    });
                }
            }
            //console.log('Processed data size: ', distanceArrayCombined.length)
            return distanceArrayCombined;
        }
        else {
            return [];
        }
    };
    return HelperFunctions;
}());
exports.HelperFunctions = HelperFunctions;
