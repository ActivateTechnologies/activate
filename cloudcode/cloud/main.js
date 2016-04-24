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
  query.greaterThan('tempWhen', start);
  query.lessThan('tempWhen', end);
  query.find({
    success: function(parseObjects) {
      console.log({log:'Found heartData', 'obj':parseObjects.length});
      var heartBeats = [];
      for (var i = 0; i < 7; i++) {
        heartBeats.push([]);
      }
      for (var i = 0; i < parseObjects.length; i++) {
        var time = parseObjects[i].get('tempWhen').getTime() - start.getTime();
        var day = Math.floor(time/(86400*1000))
        console.log({log:"1Going to work on day" + day});
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
      response.error(error)
    }
  });
});