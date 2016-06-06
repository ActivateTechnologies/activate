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
  var end = start;
  start = new Date(start.getTime() - 7 * 86400 * 1000);
  query.greaterThan('createdAt', start);
  query.lessThan('createdAt', end);
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
  microsoftImageRecog(request.object, callbackFunction);
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

  //NUTRITIONIX API KEYS
  //APPLICATION ID: 6d4f0049
  //APPLICATION KEY: fb6a273d8b2cd2a7f961668f4c8ce5ce
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