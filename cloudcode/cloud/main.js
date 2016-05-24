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
      console.log({error: "Error getting root TreeObject: "+error.message});
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

    /*
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {

      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        alert(xmlhttp.responseText);

        Parse.User.current().set(Consts.USER_STRAVACTIVITIESLASTWEEK, xmlhttp.responseText);
        (<Parse.Object> Parse.User.current()).save();
      }
    }

    

    xmlhttp.open("GET", "https://www.strava.com/api/v3/athlete/activities?after="+Math.round(past.getTime()/1000), true);
    xmlhttp.setRequestHeader("Content-type", "application/json;"); 
     xmlhttp.setRequestHeader("Authorization", "Bearer "+stravaAccessToken); 
    xmlhttp.send();
    */
});