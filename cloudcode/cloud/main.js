var Image = require("parse-image");

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
        var deltaMilliseconds = new Date(stravaData[i].start_date_local).getTime() - past.getTime();
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
  var callbackFunction = function (error) {
    if (error) {
      console.log('Error with api calls: ' + error);
      response.success();
    } else {
      response.success();
    }
  }
  //microsoftImageRecog(request.object, callbackFunction);
  googleImageRecog(request.object, callbackFunction);
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
  console.log(imageUri);
  //var imageUri = "http://www.medicalnewstoday.com/content/images/articles/266/266765/two-heads-of-broccoli.jpg";
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
    console.log(httpResponse.text);
    nutritionObject.set("microsoftResponse", JSON.stringify(httpResponse.text));
    nutritionixSearch(httpResponse.text, nutritionObject, callbackFunction);
  }, function(httpResponse) {
    console.error('microsoftImageRec Request failed with response code ' + httpResponse.status
      + ' and response text: ' + httpResponse.text);
    callbackFunction('microsoftImageRec request failed with response code ' + httpResponse.status);
  });
}

function googleImageRecog(nutritionObject, callbackFunction) {
  var imageUrl = nutritionObject.get("image").url();
  console.log('Image URL: ' + imageUrl);
  Parse.Cloud.httpRequest({url: imageUrl}).then(function(httpResponse) {
    console.log({log:'Calling Google1'});
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
          }, {
            "type":"LOGO_DETECTION",
          }]
        }]
      },
      headers: {
        "Content-type": "application/json"
      }
    }).then(function(httpResponse) {
      console.log({log:"Google's data", data: httpResponse.data});
      //callbackFunction(httpResponse.data.responses);
      nutritionObject.set("googleResponse", httpResponse.data);
      findFoodObject(httpResponse.data, nutritionObject, callbackFunction);
    }, function(httpResponse) {
      var errorMessage = 'Google Request failed with response code ' + httpResponse.status
        + ' and response text: ' + httpResponse.text;
      console.error(errorMessage);
      callbackFunction({}, {message: errorMessage});
    });
  }, function(httpResponse) {
    var errorMessage = 'Error getting file from url with response code ' + httpResponse.status
     + ' and response text: ' + httpResponse.text;
    console.log(errorMessage);
    callbackFunction({}, {message: errorMessage});
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
    console.error('nutritionixSearch Request failed with response code ' + httpResponse.status 
      + ' and response text' + httpResponse.text);
    callbackFunction('nutritionixSearch request failed with response code ' + httpResponse.status)
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
    callbackFunction('nutritionixInfo request failed with response code ' + httpResponse.status)
  });
}

function findFoodObject(googleData, nutritionObject, callbackFunction) {
  var textString = googleData.responses[0].textAnnotations[0].description;
  console.log("findFoodObject() with text: " + textString);
  var usefulWords = getUsefulWords(textString);
  
  var FoodData = Parse.Object.extend("FoodData");
  var query = new Parse.Query(FoodData);
  query.contains("descriptionWords", usefulWords);
  query.find({
    success: function(parseObjects) {
      if (parseObjects.length == 0) {
        console.log('No FoodObjects found');
      } else {
        nutritionObject.set("foodObject", identifyBestFoodObject(parseObject), usefulWords);
      }
      callbackFunction({data:"success"});
    },
    error: function(error) {
      var errorMessage = "Error querying FoodData objects: " + error.message;
      console.log(errorMessage);
      callbackFunction({}, {message: errorMessage});
    }
  });
  callbackFunction({data: textString});
}

/*Uses google's text recognition response as a string input and
  returns array of useful words in lower case */
function getUsefulWords(textString) {
  var googleInfoString = 'P RRP 99p RRP\nLipton\nPEACH\nICE TEA\n';

    var googleInfoStringLowercase = googleInfoString.toLowerCase();

    var googleInfoStringFlattened = googleInfoStringLowercase.replace(/[^\x20-\x7E]/gmi, " ");

    var googleInfoArray = googleInfoStringFlattened.split(" ");

    var uselessInfo = ['99p','p','rrp','difference','taste','refrigerated', '£'];

    var i = 0;

    for (i = 0; i < uselessInfo.length; i++) {
      var y = googleInfoArray.includes(uselessInfo[i]);
      
      if (y) {
        //https://davidwalsh.name/remove-item-array-javascript
        console.log(i);
        var indexOfUseless = googleInfoArray.indexOf(uselessInfo[i])
        console.log("Index of useless: "+ indexOfUseless);

        for(var x = googleInfoArray.length-1; x >= 0; x--){
          if (googleInfoArray[x] === uselessInfo[i]) googleInfoArray.splice(x, 1);
        }

      }
  
    }

    var finalArray = [];
    for (var i = 0; i < googleInfoArray.length; i++) {
      googleInfoArray[i] = googleInfoArray[i].trim();
      if (googleInfoArray[i].length > 0) {
        finalArray.push(googleInfoArray[i]);
      }
    }
    
    return finalArray;

  }
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