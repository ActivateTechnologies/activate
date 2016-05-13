import {Page, IonicApp, NavController, ViewController, NavParams, Platform} from 'ionic-angular';
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';
import {NgZone} from 'angular2/core';
//import {CordovaOauth, Meetup} from 'ng2-cordova-oauth/core';

@Page({
  templateUrl: 'build/pages/profilepage/profilepage.html'
})
export class ProfilePage {

  nav:any;viewController:any; user:any; currentUser:any; zone:any; platform:any;
  message:string; friendStatus:any; respondToRequest:boolean;
  userRelationshipNumber:number; friends:any[]; relationship:any;
  walkingTimeAve:number; runningTimeAve:number;
  cyclingTimeAve:number; sleepTimeAve:number;
  walkingTimeWeek:number[]; runningTimeWeek:number[]; cyclingTimeWeek:number[];
  sleepTimeWeek:number[]; aveDataLoading:boolean; weekDataLoading:boolean;
  distanceData:number[]; distanceDataLoading:boolean;
  caloriesData:number[]; caloriesDataLoading:boolean;
  heartData:number[]; heartDataLoading:boolean;
  distanceChartHandle:any; heartChartHandle:any;

  constructor(ionicApp: IonicApp, navController: NavController, navParams: NavParams,
   viewController: ViewController, zone: NgZone, platform: Platform) {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.nav = navController;
    this.viewController = viewController;
    this.zone = zone;
    this.platform = platform;
    this.user = navParams.data;
    this.currentUser = Parse.User.current();
    this.aveDataLoading = true;
    this.weekDataLoading = true;
    this.distanceDataLoading = true;
    this.caloriesDataLoading = true;
    this.heartDataLoading = true;
  }

  onPageDidEnter() {
    this.initialize();
  }

  initialize() {
    //this.initAveData();
    //this.initWeekData();
    if (localStorage['healthApiAccessGranted']) {
      this.initDistanceData();
      this.initCaloriesData();
    } else if (navigator.health) {
      navigator.health.isAvailable(() => {
        navigator.health.requestAuthorization(['steps', 'distance', 'activity'],
          () => {
            localStorage['healthApiAccessGranted'] = true;
            this.initDistanceData();
            this.initCaloriesData();
          }, (err) => {
            localStorage['healthApiAccessGranted'] = false;
            console.log('Health auth error', err);
            this.distanceDataLoading = false;
            this.caloriesDataLoading = false;
          }
        )
      }, () => {
        console.log('Health not available');
        this.distanceDataLoading = false;
        this.caloriesDataLoading = false;
      });
    }
    
    this.initHeartData();
  }

  initAveData() {
    let noDays:number = 30;
    let beginning:Date = new Date((new Date()).getTime() - (7 * 86400 * 1000));
    let endtemp:Date = new Date((new Date()).getTime() - (0 * 86400 * 1000));
    let timeNow:number = (new Date()).getTime();
    navigator.health.queryAggregated({
      startDate: beginning,
      endDate: endtemp, //new Date(), // now
      dataType: 'activity'
    }, (data) => {
      console.log('Query time', (new Date()).getTime() - timeNow);
      console.log('Got activity:', data);
      //this.activityDataOut = data;
      /*let durationWalking:number = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i].value == 'walking') {
          durationWalking += (data[i].endDate.getTime() - data[i].startDate.getTime());
          console.log(data[i].endDate.getTime() - data[i].startDate.getTime())
        }
      }
      console.log('Total walking:' + durationWalking);*/
      if (data.value.walking) {
        this.walkingTimeAve = data.value.walking.duration/noDays;
      }  
      if (data.value.running) {
        this.runningTimeAve = data.value.running.duration/noDays;  
      }
      if (data.value.biking) {
        this.cyclingTimeAve = data.value.biking.duration/noDays;
      }
      if (data.value.sleep) {
        this.sleepTimeAve = data.value.sleep.duration/noDays;
      }
      this.zone.run(() => {
        this.aveDataLoading = false;
      })
    }, (error) => {
      console.log('Error:', error);
      this.zone.run(() => {
        this.aveDataLoading = false;
      })
    });
  }

  initWeekData() {
    this.walkingTimeWeek = [];
    this.runningTimeWeek = [];
    for (let i = 0; i < 7; i++) {
      this.walkingTimeWeek.push(0);
      this.runningTimeWeek.push(0);
    }
    let start:Date = new Date();
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start = new Date(start.getTime() - 7 * 86400 * 1000);
    let callbacksRemaining:number = 7;
    for (let i = 0; i < 7; i++) {
      ((i) => {
        navigator.health.queryAggregated({
          startDate: new Date(start.getTime() + i * 86400 * 1000),
          endDate: new Date(start.getTime() + (i + 1) * 86400 * 1000),
          dataType: 'activity'
        }, (data) => {
          callbacksRemaining--;
          //console.log('Activity', i, data);
          if (data.value.sleep) {
            this.walkingTimeWeek[i]
             = Math.round(data.value.sleep.duration * 10 / 3600) / 10;
          }  
          if (data.value.running) {
            this.runningTimeWeek[i]
             = Math.round(data.value.running.duration * 10 / 3600) / 10;
          }
          if (callbacksRemaining == 0 ) {
            this.initChart();
          }
        }, (error) => {
          callbacksRemaining--;
          console.log('Error:', error);
          if (callbacksRemaining == 0 ) {
            this.initChart();
          }
        });
      })(i);
    }
  }

  initDistanceData() {
    this.distanceData = [];
    for (let i = 0; i < 8; i++) {
      this.distanceData.push(0);
    }
    let start:Date = new Date();
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start = new Date(start.getTime() - 8 * 86400 * 1000);
    let callbacksRemaining:number = 8;
    for (let i = 0; i < 8; i++) {
      ((i) => {
        let endDate:Date = new Date(start.getTime() + (i + 1) * 86400 * 1000);
        if (i == 7) {
          endDate = new Date();
        }
        navigator.health.queryAggregated({
          startDate: new Date(start.getTime() + i * 86400 * 1000),
          endDate: endDate,
          dataType: 'distance'
        }, (data) => {
          callbacksRemaining--;
          //console.log('distance', i, data);
          if (data.value) {
            let val:number = Math.round(data.value / 10) / 100;
            if (this.platform && this.platform.is('ios')) {
              val *= 0.5;
            }
            this.distanceData[i] = val;
          }  
          if (callbacksRemaining == 0 ) {
            this.initDistanceChart();
          }
        }, (error) => {
          callbacksRemaining--;
          console.log('Error:', error);
          if (callbacksRemaining == 0 ) {
            this.initDistanceChart();
          }
        });
      })(i);
    }
  }

  initCaloriesData() {
    this.caloriesData = [];
    for (let i = 0; i < 8; i++) {
      this.caloriesData.push(0);
    }
    let start:Date = new Date();
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start = new Date(start.getTime() - 8 * 86400 * 1000);
    let callbacksRemaining:number = 8;
    for (let i = 0; i < 8; i++) {
      ((i) => {
        navigator.health.queryAggregated({
          startDate: new Date(start.getTime() + i * 86400 * 1000),
          endDate: new Date(start.getTime() + (i + 1) * 86400 * 1000),
          dataType: 'calories'
        }, (data) => {
          callbacksRemaining--;
          //console.log('calories', i, data);
          if (data.value) {
            let val:number = Math.round(data.value / 10) * 10;
            /*if (this.platform && this.platform.is('ios')) {
              val *= 0.5;
            }*/
            this.caloriesData[i] = val;
          }  
          if (callbacksRemaining == 0 ) {
            this.initCaloriesChart();
          }
        }, (error) => {
          callbacksRemaining--;
          console.log('Error:', error);
          if (callbacksRemaining == 0 ) {
            this.initCaloriesChart();
          }
        });
      })(i);
    }
  }

  initHeartData() {
    this.heartData = [];
    CloudFunctions.getWeekHeartData((data, error) => {
      console.log('Got heart data:', data);
      this.zone.run(() => {
        this.heartDataLoading = false;
      });
      setTimeout(() => {
        if (!error) {
          this.heartData = data.averageHeartBeats;
          this.initHeartChart();
        } else {
          alert('Error loading heart data');
          console.log('Error loading heart data', error);
        }
      }, 200);
    });
  }

  initChart() {
    this.zone.run(() => {
      this.weekDataLoading = false;
    })
    console.log('Week data loading is false');
    let ctx:any = (<HTMLCanvasElement> document.getElementById("myChart")).getContext("2d");
    let days:string[] = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    let labels:string[] = [];
    let day = new Date().getDay() - 1;
    for (let i = 0; i < 7; i++) {
      labels.push(days[(i+day) % 7]);
    }
    let data:any = {
      labels: labels,
      datasets: [
        {
          label: "Walking",
          fillColor: "rgba(40,40,245,0.5)",
          strokeColor: "rgba(40,40,245,0.8)",
          highlightFill: "rgba(40,40,245,0.75)",
          highlightStroke: "rgba(40,40,245,1)",
          data: this.walkingTimeWeek
        },
        {
          label: "Running",
          fillColor: "rgba(10,184,60,0.5)",
          strokeColor: "rgba(10,184,60,0.8)",
          highlightFill: "rgba(10,184,60,0.75)",
          highlightStroke: "rgba(10,184,60,1)",
          data: this.runningTimeWeek
        }
      ]
    };

    let options:any = {
      scaleShowGridLines: false
    }
    let myNewChart = new Chart(ctx).Bar(data, options);
  }

  initDistanceChart() {
    this.zone.run(() => {
      this.distanceDataLoading = false;
    });
    let ctx:any = (<HTMLCanvasElement> document.getElementById("distanceChart")).getContext("2d");
    let days:string[] = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    let labels:string[] = [];
    let day = new Date().getDay() - 1;
    day = (day == -1) ? 6 : day;
    for (let i = 0; i < 8; i++) {
      labels.push(days[(i+day) % 7]);
    }
    let distanceData:any = {
      labels: labels,
      datasets: [{
        label: "km",
        fillColor: "rgb(54, 162, 235)",
        strokeColor: "rgb(54, 162, 235)",
        highlightFill: "rgba(40,40,245,0.75)",
        highlightStroke: "rgba(40,40,245,1)",
        data: this.distanceData
      }]
    };
    let options:any = {
      scaleShowGridLines: false
    }
    this.distanceChartHandle = new Chart(ctx).Bar(distanceData, options);
  }

  initCaloriesChart() {
    this.zone.run(() => {
      this.caloriesDataLoading = false;
    });
    let ctx:any = (<HTMLCanvasElement> document.getElementById("caloriesChart")).getContext("2d");
    let days:string[] = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    let labels:string[] = [];
    let day = new Date().getDay() - 1;
    day = (day == -1) ? 6 : day;
    for (let i = 0; i < 8; i++) {
      labels.push(days[(i+day) % 7]);
    }
    let caloriesData:any = {
      labels: labels,
      datasets: [{
        label: "km",
        fillColor: "rgba(40,40,245,0.5)",
        strokeColor: "rgba(40,40,245,0.8)",
        highlightFill: "rgba(40,40,245,0.75)",
        highlightStroke: "rgba(40,40,245,1)",
        data: this.caloriesData
      }]
    };
    let options:any = {
      scaleShowGridLines: false
    }
    this.distanceChartHandle = new Chart(ctx).Bar(caloriesData, options);
  }

  initHeartChart() {
    this.zone.run(() => {
      this.heartDataLoading = false;
    })
    let ctx:any = (<HTMLCanvasElement> document.getElementById("heartChart")).getContext("2d");
    let days:string[] = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    let labels:string[] = [];
    let day = new Date().getDay() - 1;
    day = (day == -1) ? 6 : day;
    for (let i = 0; i < this.heartData.length; i++) {
      labels.push(days[(i+day) % 7]);
    }
    let heartData:any = {
      labels: labels,
      datasets: [{
        label: "bpm",
        fillColor: "rgb(255, 99, 132)",
        strokeColor: "rgb(255, 99, 132)",
        highlightFill: "rgba(40,40,245,0.75)",
        highlightStroke: "rgba(40,40,245,1)",
        data: this.heartData
      }]
    };
    let options:any = {
      scaleShowGridLines: false
    }
    this.heartChartHandle = new Chart(ctx).Bar(heartData, options);
  }

  //STRAVA
  connectStravaButton() {
    this.platform.ready().then(() => {
        this.connectStravaFunction().then((success) => {
            alert(success.access_token);
        }, (error) => {
            alert(error);
        });
    });
  }

  connectStravaFunction() {
    return new Promise(function(resolve, reject) {
        var browserRef = window.cordova.InAppBrowser.open("https://www.strava.com/oauth/authorize?client_id=11012&response_type=code" + "&response_type=code&redirect_uri=http://localhost&approval_prompt=force", "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
        browserRef.addEventListener("loadstart", (event) => {
            //alert(1);
            if ((event.url).indexOf("http://localhost") === 0) {
                browserRef.removeEventListener("exit", (event) => {});
                alert(2);
                alert(event.url);
                browserRef.close();
                var url = event.url
                var accessCode = url.substring(30,url.length);
                alert(accessCode);
                console.log(accessCode);
                alert(3);

                //This is the raw javascript version I was talking about. I found other versions, but atm this is the only one that seems to work:
                /*
                var responseParameters = ((event.url).split("#")[1]).split("&");
                alert(4);
                var parsedResponse = {};
                for (var i = 0; i < responseParameters.length; i++) {
                    parsedResponse[responseParameters[i].split("=")[0]] = responseParameters[i].split("=")[1];
                }
                if (parsedResponse["access_token"] !== undefined && parsedResponse["access_token"] !== null) {
                    resolve(parsedResponse);
                } else {
                    reject("Problem authenticating with Strava");
                }
                */
            }
        });
        browserRef.addEventListener("exit", function(event) {
            reject("The Strava sign in flow was cancelled");
        });
    });
  }

  stravaAPIPOST() {
    alert('stravaAPIPOST');
    var c_id = "11012";
    var c_secret = "1d5dc79c5adbaaefcc6eeb2b2c9ddb584085ecfc";
    var access_code = "c420583602c1eb00dd60707dd48c58d46e5c8a83";
    var params = "client_id=" + c_id + "&client_secret=" + c_secret + "&code=" + access_code;
​    
    var xmlhttp = new XMLHttpRequest();
    alert(1);
    xmlhttp.onreadystatechange = function () {
      alert('2');
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        alert(xmlhttp.responseText);
      }
    }
​    alert(3);
    xmlhttp.open("POST", "https://www.strava.com/oauth/token", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.setRequestHeader("Content-length", "3");
    xmlhttp.setRequestHeader("Connection", "close");
    xmlhttp.send(params);
    alert(4);
  }

  //MOVES
  connectMoves() {
    alert(1);
    return new Promise(function(resolve, reject) {
        var browserRef = window.cordova.InAppBrowser.open("https://api.moves-app.com/oauth/v1/authorize?response_type=code&client_id=95C57N4Gt5t9l5uir45i0P6RcNd1DN6v&scope=activity", "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
        browserRef.addEventListener("loadstart", (event) => {
            //alert(1);
            if ((event.url).indexOf("http://localhost") === 0) {
                browserRef.removeEventListener("exit", (event) => {});
                alert(2);
                alert(event.url);
                browserRef.close();
                var url = event.url
                var urlMinus = url.length - 7
                alert(urlMinus);
                var accessCode = url.substring(23,urlMinus);
                alert(accessCode);
                console.log(accessCode);
                alert(3);
            }
        });
        browserRef.addEventListener("exit", function(event) {
            reject("The Moves sign in flow was cancelled");
        });
    });
  }

  MovesAPIPOST() {
    alert('stravaAPIPOST');
    var c_id = "11012";
    var c_secret = "1d5dc79c5adbaaefcc6eeb2b2c9ddb584085ecfc";
    var access_code = "c420583602c1eb00dd60707dd48c58d46e5c8a83";
    var params = "client_id=" + c_id + "&client_secret=" + c_secret + "&code=" + access_code;
​    
    var xmlhttp = new XMLHttpRequest();
    alert(1);
    xmlhttp.onreadystatechange = function () {
      alert('2');
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        alert(xmlhttp.responseText);
      }
    }
​    alert(3);
    xmlhttp.open("POST", "https://www.strava.com/oauth/token", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.setRequestHeader("Content-length", "3");
    xmlhttp.setRequestHeader("Connection", "close");
    xmlhttp.send(params);
    alert(4);
  }









  //MEETUP
  connectMeetup() {
    /*this.cordovaOauth = new CordovaOauth(new Meetup({clientId: "5mmt4kfgh5mc469f43hj8t5rh6", appScope: ["email"]}));
    this.cordovaOauth.login().then((success) => {
      alert(JSON.stringify(success));
        }, (error) => {
      alert(JSON.stringify(error));
    });*/
  }

}
