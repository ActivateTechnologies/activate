var Image = require("parse-image");
var Buffer = require('buffer').Buffer;

Parse.Cloud.define("initConversation", function(request, response) {
  var TreeObjects = Parse.Object.extend("TreeObjects");
  var query = new Parse.Query(TreeObjects);
  query.equalTo('notes', 'activateRoot');
  query.find({
    success: function(parseObject) {
      console.log({log:'Called initConversation'});
      response.success({
        status: 'Ok',
        treeObject: parseObject[0]
      })
    },
    error: function(error) {
      console.log({error: "Error getting root TreeObject: "+error.message});
      response.error(error)
    }
  });
});

Parse.Cloud.define("updateFriends", function(request, response) {
  if (!request.params.friendsFbIdArray 
    || request.params.friendsFbIdArray.length == 0) {
    response.success('No friendsFbIdArray specified');
  }
  //received fb friend ids list from device
  var newFriendsList = request.params.friendsFbIdArray;
  //existing friends (who have fb) ids list
  getFriends(function(currentFriendsList, error) {
    if (error) {
      response.error(error);
    } else {
      //list of fb friend ids to add
      var friendsToAdd = [];
      for (var i = 0; i < newFriendsList.length; i++) {
        if (currentFriendsList.indexOf(newFriendsList[i]) == -1) {
          friendsToAdd.push(newFriendsList[i]);
        }
      }
      var objectsToSave = [];
      var currentUser = Parse.User.current();
      var query = new Parse.Query(Parse.User);
      query.containedIn("facebookId", friendsToAdd);
      query.find({
        success: function(users) {
          for (var i = 0; i < users.length; i++) {
            var Relationships = Parse.Object.extend("Relationships");
            var relationship = new Relationships();
            relationship.set("user1", currentUser);
            relationship.set("user2", users[i]);
            relationship.set("status", 4);
            objectsToSave.push(relationship);
          }
          Parse.Object.saveAll(objectsToSave, {
            success: function (objets) {
              response.success({});
            },
            error: function (error) {
              var errorMessage = 
                'Error saving all WalkingData objects: ' + error.message;
              console.log(errorMessage);
              response.error({error: error, message: errorMessage});
            }
          });
        },
        error: function(error) {
          var errorMessage = 
            "Error finding users in updateFriends: " + error.message;
          console.log(errorMessage);
          response.error({error: error, message: errorMessage});
        }
      });
    }
  });
});

//Returns list of facebook friend facebookIds.
function getFriends(callback) {
  var Relationships = Parse.Object.extend("Relationships");
  var query1 = new Parse.Query(Relationships);
  query1.equalTo('user1', Parse.User.current());

  var query2 = new Parse.Query(Relationships);
  query2.equalTo('user2', Parse.User.current());

  var friends = [];
  var query = Parse.Query.or(query1, query2);
  query.include('user1');
  query.include('user2');
  query.find({
    success: function (relationships) {
      for (var i = 0; i < relationships.length; i++) {
        var friendObject = 
          (relationships[i].get('user1').id != Parse.User.current().id) ?
            relationships[i].get('user1') :
              relationships[i].get('user2');
        if (friendObject.get('facebookId')) {
          friends.push(friendObject.get('facebookId'));
        }
      }
      callback(friends);
    },
    error: function (error) {
      var message = "Error querying relationships" + error.message;
      console.log(message);
      callback(null, {message: message, error: error});
    }
  });
}

Parse.Cloud.define("saveWalkingData", function (request, response) {
  var walkingDataArray = request.params;
  var walkingDataKeys = Object.keys(walkingDataArray);
  console.log('walkingDataKeys.length: ' + walkingDataKeys.length);

  if (walkingDataKeys.length > 0) {
    var maxTime = walkingDataArray[0].startDate;
    var minTime = walkingDataArray[0].startDate;
    var mainArray = [];
    var firstWeekStartDate;

    var firstObjectProcessed = false, otherObjectsProcessed = false;

    //Find maxTime, minTime and firstWeekStartDate
    for (var i = 0; i < walkingDataKeys.length; i++) {
      var time = walkingDataArray[walkingDataKeys[i]].startDate;
      maxTime = (time > maxTime) ? time : maxTime;
      minTime = (time < minTime) ? time : minTime;
    }
    firstWeekStartDate = new Date(minTime);
    firstWeekStartDate.setTime(minTime - minTime % (86400 * 1000));
    firstWeekStartDate.setTime(firstWeekStartDate.getTime()
      - firstWeekStartDate.getDay() * 86400 * 1000);

    //Initialise mainArray based on number of weeks of data
    var numOfWeeks = Math.ceil(
      (maxTime - firstWeekStartDate.getTime()) / (7 * 86400 * 1000));
    for (var i = 0; i < numOfWeeks; i++) {
      mainArray.push([]);
    }

    //Fill objects in the array with the location objects
    for (var i = 0; i < walkingDataKeys.length; i++) {
      var mainArrayIndex = (walkingDataArray[walkingDataKeys[i]].startDate
       - firstWeekStartDate.getTime());
      mainArrayIndex = Math.floor(mainArrayIndex / 604800000); //(7 * 86400 * 1000)
      mainArray[mainArrayIndex].push(walkingDataArray[walkingDataKeys[i]]);
    }
    
    //Save first week object (update if necessary)
    var WalkingData = Parse.Object.extend("WalkingData");
    var query = new Parse.Query(WalkingData);
    query.equalTo('user', Parse.User.current());
    query.equalTo('weekStartDate', firstWeekStartDate);
    query.first({
      success: function(parseObject) {
        if (parseObject) {
          parseObject.set("walkingArray", mainArray[0]);
          parseObject.save({
            success: function (parseObject) {
              saveAllWeeks(true);
            }, error: function (parseObject, error) {
              console.log('Error saving updated first week parse object');
              saveAllWeeks(false);
            }
          });
        } else {
          saveAllWeeks(false);
        }
      },
      error: function(error) {
        console.log("Error getting firstWeekStartDate object");
        saveAllWeeks(false);
      }
    });
  } else {
    response.success({});
  }
    
  function saveAllWeeks(firstWeekSaved) {
    var objectsToSave = [];
    for (var i = (firstWeekSaved) ? 1 : 0; i < mainArray.length; i++) {
      console.log(i);
      var weekStartDate = new Date(firstWeekStartDate.getTime() 
        + (i * 7 * 86400 * 1000));
      var WalkingData = Parse.Object.extend("WalkingData");
      var walkingData = new WalkingData();
      walkingData.set("user", Parse.User.current());
      walkingData.set("weekStartDate", weekStartDate);
      walkingData.set("walkingArray", mainArray[i]);
      objectsToSave.push(walkingData);
    }

    Parse.Object.saveAll(objectsToSave, {
      success: function (objets) {
        response.success({});
      },
      error: function (error) {
        var errorMessage = 
          'Error saving all WalkingData objects: ' + error.message;
        console.log(errorMessage);
        response.error({error: error, message: errorMessage});
      }
    });
  }

});

Parse.Cloud.define("saveLocationData", function(request, response) {
  var timeNow = (new Date()).getTime();

  var locations = request.params;
  var locationsKeys = Object.keys(locations);
  var mainArray = [];
  var maxTime = parseInt(locationsKeys[0]);
  var minTime = parseInt(locationsKeys[0]);
  var firstWeekStartDate;

  //console.log("1 Time: " + ((new Date()).getTime() - timeNow));
  //Find maxTime, minTime and firstWeekStartDate
  for (var i = 0; i < locationsKeys.length; i++) {
    var time = parseInt(locationsKeys[i]);
    maxTime = (time > maxTime) ? time : maxTime;
    minTime = (time < minTime) ? time : minTime;
  }
  firstWeekStartDate = new Date(minTime);
  firstWeekStartDate.setTime(minTime - minTime % (86400 * 1000));
  firstWeekStartDate.setTime(firstWeekStartDate.getTime()
    - firstWeekStartDate.getDay() * 86400 * 1000);

  //console.log("2 Time: " + ((new Date()).getTime() - timeNow));
  //Initialise mainArray based on number of weeks of data
  var numOfWeeks = Math.ceil(
    (maxTime - firstWeekStartDate.getTime()) / (7 * 86400 * 1000));
  for (var i = 0; i < numOfWeeks; i++) {
    mainArray.push({});
  }

  //console.log("3 Time: " + ((new Date()).getTime() - timeNow));
  //Fill objects in the array with the location objects
  for (var i = 0; i < locationsKeys.length; i++) {
    var mainArrayIndex = (locationsKeys[i] - firstWeekStartDate.getTime());
    mainArrayIndex = Math.floor(mainArrayIndex / 604800000); //(7 * 86400 * 1000)
    mainArray[mainArrayIndex][locationsKeys[i]] = locations[locationsKeys[i]];
  }

  //console.log("4 Time: " + ((new Date()).getTime() - timeNow));
  //Retrieve current week object and merge
  var objectsToSave = [];
  var fileToDelete = "";
  var LocationData = Parse.Object.extend("LocationData");
  var query = new Parse.Query(LocationData);
  query.equalTo('user', Parse.User.current());
  query.equalTo('weekStartDate', firstWeekStartDate);
  query.first({
    success: function (parseObject) {
      //console.log("5 Time: " + ((new Date()).getTime() - timeNow));
      if (parseObject) {
        Parse.Cloud.httpRequest({
          url: parseObject.get("locationFile").url()
        }).then(function(fileResponse) {
          fileToDelete = parseObject.get("locationFile").name();
          //console.log("6 Time: " + ((new Date()).getTime() - timeNow));
          var currentLocationsObject = JSON.parse(fileResponse.buffer.toString('utf8'));
          var currentLocationsObjectKeys = Object.keys(currentLocationsObject);
          for (var i = 0; i < currentLocationsObjectKeys.length; i++) {
            mainArray[0][currentLocationsObjectKeys[i]] = 
              currentLocationsObject[currentLocationsObjectKeys[i]];
          }
          saveAllWeeksLocationData(function (error) {
            if (error) {
              response.error(error);
            } else {
              //TODO - Delete file here
              parseObject.destroy({
                success: function (object) {
                  //console.log("11 Time: " + ((new Date()).getTime() - timeNow));
                  Parse.Cloud.httpRequest({
                    method: 'DELETE',
                    url: 'https://api.parse.com/1/files/' + fileToDelete,
                    headers: {
                      "X-Parse-Application-Id": "v3NS4xBCONYmIqqtwASz1e3TuX9p1WDZod6dUxA7",
                      "X-Parse-Master-Key": "lTfiVyxxddFhbaCbs9NhvZTBdjmTw8ldWRmv5KoH"
                    }
                  }).then(function() {
                    //console.log("12 Time: " + ((new Date()).getTime() - timeNow));
                    console.log("File Deleted Successfully");
                    response.success({});
                  }, function(error) {
                    console.log("Error deleting file: " + JSON.stringify(error));
                    response.success({});
                  });
                },
                error: function (object, error) {
                  console.log("Error deleting current week parse object: "
                    + error.message);
                  response.success({});
                }
              });
            }
          });
        }, function (error) {
          console.log("Error reading current week locationFile: "
            + error.message);
        });
      } else {
        saveAllWeeksLocationData(function (error) {
          if (error) {
            response.error(error);
          } else {
            response.success({});
          }
        });
      }
    },
    error: function (error) {
      console.log("Error finding current week parse object: "
        + error.message);
      saveAllWeeksLocationData(function (error) {
        if (error) {
          response.error(error);
        } else {
          response.success({});
        }
      });
    }
  });

  //Save all weeks
  function saveAllWeeksLocationData(callback) {
    filesToSave = [];
    var objectsToSave = [];
    var fileSavePromises = [];
    for (var i = 0; i < mainArray.length; i++) {
      (function(i) {
        var base64text = new Buffer(JSON.stringify(mainArray[i])).toString('base64');
        var file = new Parse.File("locationFile.txt", { base64: base64text });
        fileSavePromises.push(
          file.save().then(function () {
            var weekStartDate = new Date(firstWeekStartDate.getTime() 
              + (i * 7 * 86400 * 1000));
            var LocationData = Parse.Object.extend("LocationData");
            var locationData = new LocationData();
            locationData.set("user", Parse.User.current());
            locationData.set("weekStartDate", weekStartDate);
            locationData.set("locationFile", file);
            objectsToSave.push(locationData);
          })
        );
      })(i);
    }
    Parse.Promise.when(fileSavePromises).then(
      function() {
        Parse.Object.saveAll(objectsToSave, {
          success: function (objets) {
            //console.log("10 Time: " + ((new Date()).getTime() - timeNow));
            callback();
          },
          error: function (error) {
            var errorMessage = 
              'Error saving all LocationData objects: ' + error.message;
            console.log(errorMessage);
            callback({error: error, message: errorMessage});
          }
        });
      }, function(error) {
        var errorMessage = "Error saving all LocationFile files "
          + "(message from Parse.Promise.when): " + error.message;
        console.log(errorMessage);
        callback({error: error, message: errorMessage});
      }
    );
  }
});

Parse.Cloud.define("saveLocationDataOriginal", function(request, response) {
  var timeNow = (new Date()).getTime();
  console.log("saveLocationData called");

  var locations = request.params;
  var locationsKeys = Object.keys(locations);
  var mainArray = [];
  var maxTime = parseInt(locationsKeys[0]);
  var minTime = parseInt(locationsKeys[0]);
  var firstWeekStartDate;

  //Find maxTime, minTime and firstWeekStartDate
  for (var i = 0; i < locationsKeys.length; i++) {
    var time = parseInt(locationsKeys[i]);
    maxTime = (time > maxTime) ? time : maxTime;
    minTime = (time < minTime) ? time : minTime;
  }
  firstWeekStartDate = new Date(minTime);
  firstWeekStartDate.setTime(minTime - minTime % (86400 * 1000));
  firstWeekStartDate.setTime(firstWeekStartDate.getTime()
    - firstWeekStartDate.getDay() * 86400 * 1000);

  //Initialise mainArray based on number of weeks of data
  var numOfWeeks = Math.ceil(
    (maxTime - firstWeekStartDate.getTime()) / (7 * 86400 * 1000));
  for (var i = 0; i < numOfWeeks; i++) {
    mainArray.push({});
  }

  //Fill objects in the array with the location objects
  for (var i = 0; i < locationsKeys.length; i++) {
    var mainArrayIndex = (locationsKeys[i] - firstWeekStartDate.getTime());
    mainArrayIndex = Math.floor(mainArrayIndex / (7 * 86400 * 1000));
    mainArray[mainArrayIndex][locationsKeys[i]] = locations[locationsKeys[i]];
  }

  //Retrieve current week object and merge
  var objectsToSave = [];
  var LocationData = Parse.Object.extend("LocationData");
  var query = new Parse.Query(LocationData);
  query.equalTo('user', Parse.User.current());
  query.equalTo('weekStartDate', firstWeekStartDate);
  query.first({
    success: function (parseObject) {
      var currentLocationsObject = parseObject.get("locationsObject");
      var currentLocationsObjectKeys = Object.keys(currentLocationsObject);
      for (var i = 0; i < currentLocationsObjectKeys.length; i++) {
        mainArray[0][currentLocationsObjectKeys[i]] = 
          currentLocationsObject[currentLocationsObjectKeys[i]];
      }
      parseObject.destroy({
        success: function (object) {

        },
        error: function (object, error) {
          console.log("Error deleting current week parse object: "
            + error.message);
        }
      })
      saveAllWeeksLocationData();
    },
    error: function (error) {
      console.log("Error finding current week parse object: "
        + error.message);
      saveAllWeeksLocationData();
    }
  });

  //Save all weeks
  function saveAllWeeksLocationData() {
    var objectsToSave = [];
    for (var i = 0; i < mainArray.length; i++) {
      var weekStartDate = new Date(firstWeekStartDate.getTime() + (i * 7 * 86400 * 1000));
      var LocationData = Parse.Object.extend("LocationData");
      var locationData = new LocationData();
      locationData.set("user", Parse.User.current());
      locationData.set("weekStartDate", weekStartDate);
      locationData.set("locationsObject", mainArray[i]);
      objectsToSave.push(locationData);
    }
    Parse.Object.saveAll(objectsToSave, {
      success: function (objets) {
        response.success({});
      },
      error: function (error) {
        console.log('Error saving all objects: ' + error.message)
        response.error({
          error: error, 
          message: 'Error saving all objects: ' + error.message
        });
      }
    });
  }
});

Parse.Cloud.define("getWeekHeartData", function(request, response) {
  var HeardData = Parse.Object.extend("HeartData");
  var query = new Parse.Query(HeardData);
  query.equalTo('user', Parse.User.current());
  var start = new Date();
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);
  var end = start;
  start = new Date(start.getTime() - 7 * 86400 * 1000);
  query.greaterThan('createdAt', start);
  query.lessThan('createdAt', end);
  query.find({
    success: function(parseObjects) {
      console.log({log:'Found heartData', 'obj':parseObjects.length});
      var heartBeats = [];
      for (var i = 0; i < 8; i++) {
        heartBeats.push([]);
      }
      for (var i = 0; i < parseObjects.length; i++) {
        var time = parseObjects[i].get('createdAt').getTime() - start.getTime();
        var day = Math.floor(time/(86400*1000))
        heartBeats[day].push(parseObjects[i].get('heartRate'));
      }
      var averageHeartBeats = [];
      for (var i = 0; i < heartBeats.length; i++) {
        var sum = 0;
        for (var j = 0; j < heartBeats[i].length; j++) {
          sum += heartBeats[i][j];
        }
        var ave = (heartBeats[i].length == 0) ? 0 : sum/heartBeats[i].length;
        averageHeartBeats.push(ave);
      }
      response.success({
        status: 'Ok',
        averageHeartBeats: averageHeartBeats
      })
    },
    error: function(error) {
      console.log({error: "Error querying heart data: "+error.message});
      response.error(error);
    }
  });
});

Parse.Cloud.define("getWeekMoodData", function(request, response) {
  var Mood = Parse.Object.extend("Mood");
  var query = new Parse.Query(Mood);
  query.equalTo('user', Parse.User.current());
  var start = new Date();
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);
  //var end = start;
  start = new Date(start.getTime() - 7 * 86400 * 1000);
  query.greaterThan('createdAt', start);
  //query.lessThan('createdAt', end);
  query.find({
    success: function(parseObjects) {
      //console.log({log:'Found mood', 'obj':parseObjects.length});
      var moods = [];
      for (var i = 0; i < 8; i++) {
        moods.push([]);
      }
      for (var i = 0; i < parseObjects.length; i++) {
        var time = parseObjects[i].get('createdAt').getTime() - start.getTime();
        var day = Math.floor(time/(86400*1000))
        moods[day].push(parseObjects[i].get('happiness'));
      }
      var averageMoods = [];
      for (var i = 0; i < moods.length; i++) {
        var sum = 0;
        for (var j = 0; j < moods[i].length; j++) {
          sum += moods[i][j];
        }
        var ave = (moods[i].length == 0) ? 0 : sum/moods[i].length;
        averageMoods.push(ave);
      }
      response.success({
        status: 'Ok',
        averageMoods: averageMoods
      })
    },
    error: function(error) {
      console.log({error: "Error querying moods: "+error.message});
      response.error(error);
    }
  });
});

Parse.Cloud.afterSave("FoodDatabase", function(request) {
  Parse.Cloud.useMasterKey();
  var parseObject = request.object;
  if (parseObject && parseObject.get('name')) {
    var wordsArray = parseObject.get('name').toLowerCase().split(' ');
    parseObject.set('descriptionWords', wordsArray);
    parseObject.save(null, {
      success: function(object) {
        //console.log({log: 'search terms saved successfully'});
      },
      error: function(object, error) {
        console.log({log: 'Error saving description words for FoodDatabase object terms: '
         + error.message});
      }
    });
  } else {
    //console.log({log: 'FoodDatabase Name field not defined'});
  }
});

Parse.Cloud.define("stravaActivitiesLastWeek", function(request, response) {
  var stravaAccessToken = Parse.User.current().get("stravaAccessToken");

    var past = new Date(new Date().getTime() - 7 * 86400 * 1000)
    past.setHours(0);
    past.setMinutes(0);
    past.setSeconds(0);

    console.log({log: "params: "+'after=' + Math.round(past.getTime()/1000)})

    Parse.Cloud.httpRequest({
      url: 'https://www.strava.com/api/v3/athlete/activities',
      //params: 'after=' + Math.round(past.getTime()/1000),
      params: {
        after: Math.round(past.getTime()/1000) + ''
      },
      headers: {
        "Content-type": "application/json;",
        "Authorization": "Bearer "+stravaAccessToken
      }
    }).then(function(httpResponse) {
      console.log(httpResponse.text);
      Parse.User.current().set("stravaActivitiesLastWeek", httpResponse.text);
      Parse.User.current().save();

      var stravaData = JSON.parse(httpResponse.text);

      console.log({log: "number of activities: "+stravaData.length});

      var dataObj = {
        cycling: {
          time: [0, 0, 0, 0, 0, 0, 0, 0],
          distance: [0, 0, 0, 0, 0, 0, 0, 0],
          kjoules: [0, 0, 0, 0, 0, 0, 0, 0]
        },
        running: {
          time: [0, 0, 0, 0, 0, 0, 0, 0],
          distance: [0, 0, 0, 0, 0, 0, 0, 0],
          kjoules: [0, 0, 0, 0, 0, 0, 0, 0]
        }
      }

      for (var i = 0; i < stravaData.length; i++) {
        var deltaMilliseconds = new Date(stravaData[i].start_date_local).getTime() 
          - past.getTime();
        var day = Math.floor(deltaMilliseconds/(86400*1000));
        var type = stravaData[i].type;
        if (type == "Ride") {
          if (stravaData[i].moving_time) {
            dataObj.cycling.time[day] += stravaData[i].moving_time;
          }
          if (stravaData[i].distance) {
            dataObj.cycling.distance[day] += stravaData[i].distance;
          }
          if (stravaData[i].kilojoules) {
            dataObj.cycling.kjoules[day] += stravaData[i].kilojoules;
          }
        } else if (type == "Run") {
          if (stravaData[i].moving_time) {
            dataObj.running.time[day] += stravaData[i].moving_time;
          }
          if (stravaData[i].distance) {
            dataObj.running.distance[day] += stravaData[i].distance;
          }
          if (stravaData[i].kilojoules) {
            dataObj.running.kjoules[day] += stravaData[i].kilojoules;
          }
        }
      }

      console.log(dataObj);

      response.success({
        status: 'Ok',
        data: dataObj
      });
    }, function(httpResponse) {
      console.error('Request failed with response code ' + httpResponse.status);
      response.error({
        message: 'Request failed with response code ' + httpResponse.status
      });
    });
});

Parse.Cloud.beforeSave("Nutrition", function(request, response) {
  /*var callbackFunction = function (error) {
    if (error) {
      console.log('Error with api calls: ' + JSON.stringify(error));
      response.success();
    } else {
      response.success();
    }
  }
  microsoftImageRecog(request.object, callbackFunction);
  googleImageRecog(request.object, callbackFunction);*/
  response.success();
  /*var callbackFunction = function (error) {
    if (error) {
      console.log('Error with api calls: ' + JSON.stringify(error));
      response.success();
    } else if (request.object.get("microsoftResponse")
        && request.object.get("googleResponse")) {
      findFoodObject2(request.object, function(error) {
        if (error) {
          console.log('Error with FoodDatabase query: ' + error.message);
          resposne.success();
        } else {
          response.success();
        }
      });
    }
  }
  microsoftImageRecog(request.object, callbackFunction);
  googleImageRecog(request.object, callbackFunction);*/
});

Parse.Cloud.define("processNutritionImage", function(request, response) {
  var Nutrition = Parse.Object.extend("Nutrition");
  var query = new Parse.Query(Nutrition);

  query.get(request.params.objectId, {
    success: function(parseObject) {
      var callbackFunction = function (error) {
        if (error) {
          console.log('Error with api calls: ' + JSON.stringify(error));
          response.success({});
        } else if (parseObject.get("microsoftResponse")
            && parseObject.get("googleResponse")) {
          console.log("Microsoft and google responded");
          findFoodObject2(parseObject, function(error) {
            if (error) {
              console.log('Error with FoodDatabase query: ' + error.message);
              response.success({});
            } else {
              parseObject.save({
                success: function(parseObject) {
                  console.log('FoodDatabase object pointer set and Nutrition object saved');
                  response.success({});
                },
                error: function(parseObject, error) {
                  var errorMessage = 'Error saving nutrition object with FoodDatabase pointer'
                    + error.message;
                  console.log(errorMessage);
                  response.success({});
                }
              })
            }
          });
        }
      }
      microsoftImageRecog(parseObject, callbackFunction);
      googleImageRecog(parseObject, callbackFunction);
    },
    error: function(error) {
      console.log("Error querying Nutrition: " + error);
      response.error(error);
    }
  });
});

Parse.Cloud.define("testGoogle", function(request, response) {
  var Nutrition = Parse.Object.extend("Nutrition");
  var query = new Parse.Query(Nutrition);
  query.get("6SvUg1YVya", {
    success: function(parseObject) {
      googleImageRecog(parseObject, function (object, error) {
        if (!error) {
          response.success(object);
        } else {
          response.error(error);
        }
      })
    },
    error: function(error) {
      console.log({error: "Error querying Nutrition: "+error.message});
      response.error(error);
    }
  });
});

function microsoftImageRecog(nutritionObject, callbackFunction) {
  var imageUri = nutritionObject.get("image").url();
  console.log("calling Microsoft");
  var MICROSOFT_IMAGE_KEY = "01aa933905644a99b64b1a1449b0e5c5";

  Parse.Cloud.httpRequest({
    method: 'POST',
    url: 'https://api.projectoxford.ai/vision/v1.0/analyze?visualFeatures=Tags,Description',
    body: {
      url: imageUri
    },
    headers: {
      "Content-type": "application/json",
      "Ocp-Apim-Subscription-Key": MICROSOFT_IMAGE_KEY
    }
  }).then(function(httpResponse) {
    console.log('Microsoft Data returned');
    nutritionObject.set("microsoftResponse", JSON.parse(httpResponse.text));
    callbackFunction();
    //nutritionixSearch(httpResponse.text, nutritionObject, callbackFunction);
  }, function(httpResponse) {
    console.error('microsoftImageRec Request failed with response code '
      + httpResponse.status + ' and response text: ' + httpResponse.text);
    callbackFunction('microsoftImageRec request failed with response code '
      + httpResponse.status);
  });
}

function googleImageRecog(nutritionObject, callbackFunction) {
  console.log('Calling google');
  var imageUrl = nutritionObject.get("image").url();
  Parse.Cloud.httpRequest({url: imageUrl}).then(function(httpResponse) {
    Parse.Cloud.httpRequest({
      method: 'POST',
      url: 'https://vision.googleapis.com/v1/images:annotate?key='
        + 'AIzaSyBdGJeZg6k0luzsPgoTV2DmLxD2KFka1lY',
      body: {
        "requests":[{
          "image":{
            "content":httpResponse.buffer.toString("base64")
          },
          "features":[{
            "type":"TEXT_DETECTION",
          }/*, {
            "type":"LABEL_DETECTION",
          }*/, {
            "type":"LOGO_DETECTION",
          }],
          "imageContext":{
            "languageHints": [
              "en"
            ],
          }
        }]
      },
      headers: {
        "Content-type": "application/json"
      }
    }).then(function(httpResponse) {
      console.log('Google data returned');
      nutritionObject.set("googleResponse", httpResponse.data);
      callbackFunction();
      //callbackFunction(httpResponse.data.responses);
      //findFoodObject(httpResponse.data, nutritionObject, callbackFunction);
    }, function(httpResponse) {
      var errorMessage = 
        'Google Request failed with response code ' + httpResponse.status
        + ' and response text: ' + httpResponse.text;
      console.error(errorMessage);
      callbackFunction({message: errorMessage});
    });
  }, function(httpResponse) {
    var errorMessage = 
      'Error getting file from url with response code ' + httpResponse.status
      + ' and response text: ' + httpResponse.text;
    console.log(errorMessage);
    callbackFunction({message: errorMessage});
  });
}

/*NUTRITIONIX API KEYS
  APPLICATION ID: 6d4f0049
  APPLICATION KEY: fb6a273d8b2cd2a7f961668f4c8ce5ce*/
function nutritionixSearch(microsoftResponse, nutritionObject, callbackFunction) {
  console.log("Yes nutritionix!");
  var microsoftDescription = JSON.parse(microsoftResponse).description.captions[0].text;
  console.log("Microsoft Description: "+microsoftDescription);
  var microsoftDescriptionSpaces = encodeURIComponent(microsoftDescription.trim());
  console.log(microsoftDescriptionSpaces);

  var urlString = "https://api.nutritionix.com/v1_1/search/" + microsoftDescriptionSpaces
   + "?results=0%3A20&cal_min=0&cal_max=50000&fields=item_name%2Cbrand_name%2Citem_id" 
   + "%2Cbrand_id&appId=6d4f0049&appKey=fb6a273d8b2cd2a7f961668f4c8ce5ce";

  Parse.Cloud.httpRequest({
    method: 'GET',
    url: urlString
  }).then(function(httpResponse) {
    var nutritionixResponse = httpResponse.text;
    console.log(nutritionixResponse);
    nutritionixInfo(nutritionixResponse, nutritionObject, callbackFunction);
  }, function(httpResponse) {
    console.error('nutritionixSearch Request failed with response code '
     + httpResponse.status + ' and response text' + httpResponse.text);
    callbackFunction('nutritionixSearch request failed with response code '
     + httpResponse.status)
  });
}

function nutritionixInfo(nutritionixResponse, nutritionObject, callbackFunction) {
  var info = JSON.parse(nutritionixResponse).hits[0]._id;
  console.log(info);

  var urlString = "https://api.nutritionix.com/v1_1/item?id="+info+
    "&appId=6d4f0049&appKey=fb6a273d8b2cd2a7f961668f4c8ce5ce"
  
  Parse.Cloud.httpRequest({
    method: 'GET',
    url: urlString
  }).then(function(httpResponse) {
    var nutritionixResponse = httpResponse.text;
    console.log(nutritionixResponse);
    nutritionObject.set("nutritionixInformation", JSON.stringify(httpResponse.text));
    callbackFunction();
  }, function(httpResponse) {
    console.error('Request failed with response code ' + httpResponse.status);
    callbackFunction('nutritionixInfo request failed with response code '
      + httpResponse.status)
  });
}

function findFoodObject(googleData, nutritionObject, callbackFunction) {
  var textString = googleData.responses[0].textAnnotations[0].description;
  console.log("findFoodObject() with text: " + textString);
  var usefulWords = getUsefulWords(textString);
  
  var FoodDatabase = Parse.Object.extend("FoodDatabase");
  var query = new Parse.Query(FoodDatabase);
  console.log({log:"useful words", data: usefulWords});
  query.containedIn("descriptionWords", usefulWords);
  query.find({
    success: function(parseObjects) {
      console.log('FoodData query success');
      if (parseObjects.length == 0) {
        console.log('No FoodObjects found');
      } else {
        console.log(1);
        nutritionObject.set("foodObject", identifyBestFoodObject(parseObjects, usefulWords));
      }
      callbackFunction();
    },
    error: function(error) {
      console.log('FoodData query failure');
      var errorMessage = "Error querying FoodData objects: " + error.message;
      console.log(errorMessage);
      callbackFunction({message: errorMessage});
    }
  });
  //callbackFunction({data: textString});
}

function findFoodObject2(nutritionObject, callbackFunction) {
  //google data
  var google = nutritionObject.get("googleResponse");
  var microsoft = nutritionObject.get("microsoftResponse");

  if (google.responses && Object.keys(google.responses[0]).length > 0) {
    useGoogle();
  } else {
    useMicrosoft();
  }

  function useGoogle() {
    console.log('useGoogle');
    if (!google.responses || google.responses.length == 0
     || !google.responses[0].textAnnotations
     || google.responses[0].textAnnotations.length == 0) {
      useMicrosoft();
      return;
    }
    var textString = google.responses[0].textAnnotations[0].description;
    var usefulWords = getUsefulWordsGoogle(textString);
    console.log({usefulWordsGoogle: usefulWords});
    
    var FoodDatabase = Parse.Object.extend("FoodDatabase");
    var query = new Parse.Query(FoodDatabase);
    query.containedIn("descriptionWords", usefulWords);
    query.find({
      success: function(parseObjects) {
        console.log('FoodData query useGoogle success');
        if (parseObjects.length == 0) {
          console.log('No FoodObjects found from google');
          useMicrosoft();
        } else {
          nutritionObject.set("foodObject", identifyBestFoodObject(parseObjects, usefulWords));
          callbackFunction();
        }
      },
      error: function(error) {
        console.log('FoodData query useGoogle failure');
        var errorMessage = "Error querying FoodData objects: " + error.message;
        console.log(errorMessage);
        callbackFunction({message: errorMessage});
      }
    });
  }

  function useMicrosoft() {
    console.log('useMicrosoft');
    var usefulWords = getUsefulWordsMicrosoft(microsoft);
    console.log({usefulWordsMicrosoft: usefulWords});
    
    var FoodDatabase = Parse.Object.extend("FoodDatabase");
    var query = new Parse.Query(FoodDatabase);
    query.containedIn("descriptionWords", usefulWords);
    query.find({
      success: function(parseObjects) {
        console.log('FoodData query useMicrosoft success');
        if (parseObjects.length == 0) {
          console.log('No FoodObjects found from microsoft');
        } else {
          nutritionObject.set("foodObject", identifyBestFoodObject(parseObjects, usefulWords));
        }
        callbackFunction();
      },
      error: function(error) {
        console.log('FoodData query useMicrosoft failure');
        var errorMessage = "Error querying FoodData objects: " + error.message;
        console.log(errorMessage);
        callbackFunction({message: errorMessage});
      }
    });
  }
  
}

/*Uses google's text recognition response as a string input and
  returns array of useful words in lower case */
function getUsefulWordsGoogle(textString) {
  var googleInfoString = textString;

  var googleInfoStringLowercase = googleInfoString.toLowerCase();

  var googleInfoStringFlattened = googleInfoStringLowercase.replace(/[^\x20-\x7E]/gmi, " ");

  var googleInfoArray = googleInfoStringFlattened.split(" ");

  var uselessInfo = ['99p','p','rrp','difference','taste','refrigerated', '£'];

  var i = 0;

  for (i = 0; i < uselessInfo.length; i++) {
    var indexOfUseless = googleInfoArray.indexOf(uselessInfo[i])
    
    if (indexOfUseless != -1) {
      //https://davidwalsh.name/remove-item-array-javascript
      //console.log(i);
      //console.log("Index of useless: "+ indexOfUseless);

      for(var x = googleInfoArray.length-1; x >= 0; x--){
        if (googleInfoArray[x] === uselessInfo[i]) googleInfoArray.splice(x, 1);
      }
    }
  }

  var finalArray = [];
  for (var i = 0; i < googleInfoArray.length && i < 9; i++) {
    googleInfoArray[i] = googleInfoArray[i].trim();
    if (googleInfoArray[i].length > 0) {
      finalArray.push(googleInfoArray[i]);
    }
  }
  
  return finalArray;
}

function getUsefulWordsMicrosoft(microsoftObject) {

  var tags = microsoftObject.tags;

  var uselessTags =["desk","person","computer","laptop","food",
    "indoor","wood","hand","floor","wood","fruit"];

  var tagNames = [];

  var i = 0;
  for (i = 0; i < tags.length; i++) {
    tagNames.push(tags[i].name);
  }

  var finalArray = [];
  var y = 0;
  for (y = 0; y < tagNames.length; y++) {
    var lookAtName = tagNames[y].toLowerCase();
    var z = uselessTags.indexOf(lookAtName);

    if (z == -1) {
      finalArray.push(lookAtName);
    }
  }
  return finalArray;
}

/*Goes through list of foodObjects and finds the best one given the usefulWords*/
function identifyBestFoodObject(foodObjects, usefulWords) {
  if (foodObjects.length == 1) {
    return foodObjects[0];
  } else {
    //Do some actual processing here
    return foodObjects[0];
  }
}