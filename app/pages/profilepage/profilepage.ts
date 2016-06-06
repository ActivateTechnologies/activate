import {Page, IonicApp, NavController, ViewController, NavParams, Platform}
 from 'ionic-angular';
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';
import {UIMessages} from '../../helpers/uimessages';
import {NgZone} from '@angular/core';
import {Http, Headers} from '@angular/http';
//import {CordovaOauth, Meetup} from 'ng2-cordova-oauth/core';

@Page({
  templateUrl: 'build/pages/profilepage/profilepage.html'
})
export class ProfilePage {

  nav:any;viewController:any; user:any; currentUser:any; zone:any; platform:any; http:any
  message:string; friendStatus:any; respondToRequest:boolean;
  userRelationshipNumber:number; friends:any[]; relationship:any; arrangedDayLabels:string[];
  walkingTimeAve:number; runningTimeAve:number;
  cyclingTimeAve:number; sleepTimeAve:number;
  walkingTimeWeek:number[]; runningTimeWeek:number[]; cyclingTimeWeek:number[];
  sleepTimeWeek:number[]; aveDataLoading:boolean; weekDataLoading:boolean;
  walkingData:number[]; walkingDataLoading:boolean;
  kJData:number[]; cyclingData:any; runningData:any;
  kJDataLoading:boolean; cyclingDataLoading:boolean; runningDataLoading:boolean;
  heartData:number[][]; heartDataLoading:boolean;
  walkingChartHandle:any; heartChartHandle:any; cyclingChartHandle:any; kJChartHandle:any;
  sleepData:number[]; sleepDataLoading:boolean; sleepChartHandle: any; foodStrings: string[]; 
  foodArray: any[]; moodData:any[]; moodDataLoading:boolean;

  constructor(ionicApp: IonicApp, navController: NavController, navParams: NavParams,
   viewController: ViewController, zone: NgZone, platform: Platform, http: Http) {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.nav = navController;
    this.viewController = viewController;
    this.zone = zone;
    this.platform = platform;
    this.http = http; 
    this.user = navParams.data;
    this.currentUser = Parse.User.current();
    this.aveDataLoading = false;
    this.weekDataLoading = false;
    this.walkingDataLoading = true;
    this.kJDataLoading = false;
    this.cyclingDataLoading = true;
    this.runningDataLoading = true;
    this.heartDataLoading = false;
    this.sleepDataLoading = true;
    this.moodDataLoading = true;
    this.foodStrings = [];
    this.foodArray = [];
    this.moodData = [];
  }

  onPageDidEnter() {
    this.initialize();
  }

  initialize() {
    //Initialize arrangedDayLabels
    let days:string[] = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    this.arrangedDayLabels = [];
    let day = new Date().getDay() - 1;
    day = (day == -1) ? 6 : day;
    for (let i = 0; i < 8; i++) {
      this.arrangedDayLabels.push(days[(i+day) % 7]);
    }

    if (localStorage['healthApiAccessGranted']) {
      this.initWalkingData(() => {
        this.initStravaData();
      });
      this.initKjData();
      this.initSleepData();
    } else if (navigator.health) {
      navigator.health.isAvailable(() => {
        navigator.health.requestAuthorization(['steps', 'distance', 'activity'],
          () => {
            localStorage['healthApiAccessGranted'] = true;
            this.initWalkingData(() => {
              this.initStravaData();
            });
            this.initKjData();
            this.initSleepData();
          }, (err) => {
            localStorage['healthApiAccessGranted'] = false;
            console.log('Health auth error', err);
            this.walkingDataLoading = false;
            this.kJDataLoading = false;
            this.initStravaData();
          }
        )
      }, () => {
        console.log('Health not available');
        this.walkingDataLoading = false;
        this.kJDataLoading = false;
        this.initStravaData();
      });
    }

    if(!this.platform.is('ios') && !this.platform.is('android')) {
      this.initStravaData();
    }

    this.foodData();
    this.initMoodData();
    this.initHeartData();
  }

  //Walking, running, biking and sleep data for last week from Health Plugin - Android only
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

  initMoodData() {
    CloudFunctions.getWeekMoodsData((data, error) => {
      if (!error) {
        this.moodDataLoading = false;
        console.log('Got moods data:', data.averageMoods);
        this.moodData = [];
        for (let i = 0; i < data.averageMoods.length; i++) {
          this.moodData.push({
            dayLabel: this.arrangedDayLabels[i],
            mood: Math.ceil(data.averageMoods[i])
          });
        }
      } else {
        console.log('Error getting moods data', error.message);
      }
    })
  }

  //-------CHARTS--------
  initHeartData() {
    if (localStorage['healthApiAccessGranted']) {
      this.heartData = [[], []];
      for (let i = 0; i < 8; i++) {
        this.heartData[0].push(999);
        this.heartData[1].push(0);
      }
      let start:Date = new Date();
      start.setHours(0);
      start.setMinutes(0);
      start.setSeconds(0);
      start = new Date(start.getTime() - 7 * 86400 * 1000);
      let callbacksRemaining:number = 8;
      for (let i = 0; i < 8; i++) {
        ((i) => {
          navigator.health.query({
            startDate: new Date(start.getTime() + i * 86400 * 1000),
            endDate: new Date(start.getTime() + (i + 1) * 86400 * 1000),
            dataType: 'heart_rate'
          }, (data) => {
            callbacksRemaining--;
            for (let j = 0; j < data.length; j++) {
              if (data[j].value < this.heartData[0][i]) {
                this.heartData[0][i] = data[j].value;
              }
              if (data[j].value > this.heartData[1][i]) {
                this.heartData[1][i] = data[j].value;
              }
            }
            if (this.heartData[0][i] == 999) {
              this.heartData[0][i] = 0;
            }
            //console.log('Activity', i, data);
            /*if (data.value.sleep) {
              this.sleepData[i]
               = Math.round(data.value.sleep.duration * 10 / 3600) / 10;
            }
            */  
            if (callbacksRemaining == 0 ) {
              //console.log("Heart data:");
              //console.log(this.heartData);
              this.initHeartChart();
            }
          }, (error) => {
            callbacksRemaining--;
            console.log('Error:', error);
            if (callbacksRemaining == 0 ) {
              this.initHeartChart();
            }
          });
        })(i);
      }
    }
  }

  initHeartChart() {
    this.zone.run(() => {
      this.heartDataLoading = false;
    })
    let ctx:any = (<HTMLCanvasElement> document.getElementById("heartChart"))
      .getContext("2d");
    /*console.log("Min Heart:");
    console.log(this.heartData[0]);
    console.log("Max Heart:");
    console.log(this.heartData[1]);*/
    let heartData:any = {
      labels: this.arrangedDayLabels,
      datasets: [{
        label: "bpm min",
        backgroundColor: "rgb(224, 224, 224)",
        borderColor: "rgb(235, 110, 123)",
        highlightFill: "rgba(224, 224, 224,0.75)",
        highlightStroke: "rgba(235, 110, 123,1)",
        data: this.heartData[0]
      },
      {
        label: "bpm max",
        backgroundColor: "rgb(235, 110, 123)",
        borderColor: "rgb(235, 110, 123)",
        highlightFill: "rgba(224, 224, 224,0.75)",
        highlightStroke: "rgba(235, 110, 123,1)",
        data: this.heartData[1]
      }
      ]
    };
    this.heartChartHandle = new Chart(ctx, {
        type: 'line',
        data: heartData, 
        options: {
          legend: {
              display: false,
              labels: {
                display: true,
              },
          },
          scales : {
              xAxes : [ {
                  gridLines : {
                      display : false
                  }
              } ],
              yAxes : [ {
                  gridLines : {
                      display : false
                  }
              } ]
            }
          }
      }); 
  }

  //Walking and running data for last week from Health Plugin
  initWalkingData(callback) {
    this.walkingData = [];
    for (let i = 0; i < 8; i++) {
      this.walkingData.push(0);
    }
    let start:Date = new Date();
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start = new Date(start.getTime() - 7 * 86400 * 1000);
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
            this.walkingData[i] = val;
          }  
          if (callbacksRemaining == 0 ) {
            callback();
          }
        }, (error) => {
          callbacksRemaining--;
          console.log('Error:', error);
          if (callbacksRemaining == 0 ) {
            callback();
          }
        });
      })(i);
    }
  }

  initWalkingChart() {
    this.zone.run(() => {
      this.walkingDataLoading = false;
    });
    let ctx:any = (<HTMLCanvasElement> document.getElementById("walkingChart"))
      .getContext("2d");
    let walkingData:any = {
      labels: this.arrangedDayLabels,
      datasets: [{
        label: "km",
        backgroundColor: "rgb(104, 143, 206)",
        borderColor: "rgb(104, 143, 206)",
        highlightFill: "rgba(104,143,206,0.75)",
        highlightStroke: "rgba(104,143,206,1)",
        data: this.walkingData
      }]
    };
    let options:any = {
      scaleShowGridLines: false
    }
    this.walkingChartHandle = new Chart(ctx, {
      type: 'bar',
      data: walkingData, 
      options: {
          legend: {
              display: false,
          },
          scales : {
              xAxes : [ {
                  gridLines : {
                      display : false
                  }
              } ],
              yAxes : [ {
                  gridLines : {
                      display : false
                  }
              } ]
            }
          }
    }); 
  }

  initRunningChart() {
    let dataInKm:any[];
    dataInKm = [];
    for (let i = 0; i < this.runningData.distance.length; i++) {
      dataInKm.push(Math.round(this.runningData.distance[i]/1000));
    }
    let runningDataObject:any = {
      labels: this.arrangedDayLabels,
      datasets: [{
        label: "km",
        backgroundColor: "rgb(96, 208, 227)",
        borderColor: "rgb(96, 208, 227)",
        highlightFill: "rgba(96, 208, 227,0.75)",
        highlightStroke: "rgba(96, 208, 227,1)",
        data: dataInKm
      }]
    };
    this.zone.run(() => {
      this.runningDataLoading = false;
      let ctx:any = (<HTMLCanvasElement> document.getElementById("runningChart"))
        .getContext("2d");
      this.cyclingChartHandle = new Chart(ctx, {
        type: 'bar',
        data: runningDataObject,
        options: {
          legend: {
              display: false,
          },
          scales : {
            xAxes : [{
              gridLines : {
                display : false
              }
            }],
            yAxes : [{
              gridLines : {
                display : false
              }
            }]
            }
          }
      });
    })
  }

  initCyclingChart() {
    let dataInKm:any[];
    dataInKm = [];
    for (let i = 0; i < this.cyclingData.distance.length; i++) {
      dataInKm.push(Math.round(this.cyclingData.distance[i]/1000));
    }
    let cyclingDataObject:any = {
      labels: this.arrangedDayLabels,
      datasets: [{
        label: "km",
        backgroundColor: "rgb(117, 223, 152)",
        borderColor: "rgb(117, 223, 152)",
        highlightFill: "rgba(117, 223, 152,0.75)",
        highlightStroke: "rgba(117, 223, 152,1)",
        data: dataInKm
      }]
    };
    let options:any = {
      scaleShowGridLines: false
    }
    this.zone.run(() => {
      this.cyclingDataLoading = false;
      let ctx:any = (<HTMLCanvasElement> document.getElementById("cyclingChart"))
        .getContext("2d");
      this.cyclingChartHandle = new Chart(ctx, {
        type: 'bar',
        data: cyclingDataObject, 
        options: {
          legend: {
              display: false,
          },
          scales : {
              xAxes : [ {
                  gridLines : {
                      display : false
                  }
              } ],
              yAxes : [ {
                  gridLines : {
                      display : false
                  }
              } ]
            }
          }
      }); 
    })
  }

  initSleepData() {
    this.sleepData = [];
    for (let i = 0; i < 8; i++) {
      this.sleepData.push(0);
    }
    let start:Date = new Date();
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start = new Date(start.getTime() - 7 * 86400 * 1000);
    let callbacksRemaining:number = 8;
    for (let i = 0; i < 8; i++) {
      ((i) => {
        navigator.health.queryAggregated({
          startDate: new Date(start.getTime() + i * 86400 * 1000),
          endDate: new Date(start.getTime() + (i + 1) * 86400 * 1000),
          dataType: 'activity'
        }, (data) => {
          callbacksRemaining--;
          //console.log('Activity', i, data);
          if (data.value.sleep) {
            this.sleepData[i]
             = Math.round(data.value.sleep.duration * 10 / 3600) / 10;
          }  
          if (callbacksRemaining == 0 ) {
            this.initSleepChart();
          }
        }, (error) => {
          callbacksRemaining--;
          console.log('Error:', error);
          if (callbacksRemaining == 0 ) {
            this.initSleepChart();
          }
        });
      })(i);
    }
  }

  initSleepChart() {
    this.zone.run(() => {
      this.sleepDataLoading = false;
    });
    let ctx:any = (<HTMLCanvasElement> document.getElementById("sleepChart"))
      .getContext("2d");
    let sleepData:any = {
      labels: this.arrangedDayLabels,
      datasets: [{
        label: "km",
        backgroundColor: "rgb(217, 153, 222)",
        borderColor: "rgb(217, 153, 222)",
        highlightFill: "rgba(217, 153, 222,0.75)",
        highlightStroke: "rgba(217, 153, 222,1)",
        data: this.sleepData
      }]
    };
    let options:any = {
      scaleShowGridLines: false
    }
    this.sleepChartHandle = new Chart(ctx, {
      type: 'bar',
      data: sleepData, 
      options: {
        legend: {
            display: false,
        },
        scales : {
            xAxes : [ {
                gridLines : {
                    display : false
                }
            } ],
            yAxes : [ {
                gridLines : {
                    display : false
                }
            } ]
          }
        }
    }); 
  }

  initKjData() {
    this.kJData = [];
    for (let i = 0; i < 8; i++) {
      this.kJData.push(0);
    }
    let start:Date = new Date();
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start = new Date(start.getTime() - 7 * 86400 * 1000);
    let callbacksRemainingBasal:number = 8;
    let basalProcessed:boolean = false, activeProcessed:boolean = false;
    for (let i = 0; i < 8; i++) {
      ((i) => {
        navigator.health.queryAggregated({
          startDate: new Date(start.getTime() + i * 86400 * 1000),
          endDate: new Date(start.getTime() + (i + 1) * 86400 * 1000),
          dataType: 'calories.basal'
        }, (data) => {
          callbacksRemainingBasal--;
          //console.log('Activity', i, data);
          if (data.value) {
            this.kJData[i] += data.value*4.184;
          }  
          if (callbacksRemainingBasal == 0 ) {
            basalProcessed = true;
            if (activeProcessed) {
              this.initKjChart();
            }
          }
        }, (error) => {
          callbacksRemainingBasal--;
          console.log('Error:', error);
          if (callbacksRemainingBasal == 0 ) {
            basalProcessed = true;
            if (activeProcessed) {
              this.initKjChart();
            }
          }
        });
      })(i);
    }
    let callbacksRemainingActive:number = 8;
    for (let i = 0; i < 8; i++) {
      ((i) => {
        navigator.health.queryAggregated({
          startDate: new Date(start.getTime() + i * 86400 * 1000),
          endDate: new Date(start.getTime() + (i + 1) * 86400 * 1000),
          dataType: 'calories.active'
        }, (data) => {
          callbacksRemainingActive--;
          console.log(data);
          //console.log('Activity', i, data);
          if (data.value) {
            this.kJData[i] += data.value*4.184;
          }  
          if (callbacksRemainingActive == 0 ) {
            activeProcessed = true;
            if (basalProcessed) {
              this.initKjChart();
            }
          }
        }, (error) => {
          callbacksRemainingActive--;
          console.log('Error:', error);
          if (callbacksRemainingActive == 0 ) {
            activeProcessed = true;
            if (basalProcessed) {
              this.initKjChart();
            }
          }
        });
      })(i);
    }
  }

  initKjChart() {
    this.zone.run(() => {
      this.kJDataLoading = false;
    });
    let ctx:any = (<HTMLCanvasElement> document.getElementById("kJChart")).getContext("2d");
    let kJData:any = {
      labels: this.arrangedDayLabels,
      datasets: [{
        label: "km",
        backgroundColor: "rgb(243, 162, 115)",
        borderColor: "rgb(243, 162, 115)",
        highlightFill: "rgba(243, 162, 115,0.75)",
        highlightStroke: "rgba(243, 162, 115,1)",
        data: this.kJData
      }]
    };
    let options:any = {
      scaleShowGridLines: false
    }
    this.kJChartHandle = new Chart(ctx, {
        type: 'bar',
        data: kJData, 
        options: {
          legend: {
              display: false,
          },
          scales : {
              xAxes : [ {
                  gridLines : {
                      display : false
                  }
              } ],
              yAxes : [ {
                  gridLines : {
                      display : false
                  }
              } ]
            }
          }
      }); 
  }

  foodData() {
    console.log('Inside food data')
    let start:Date = new Date();
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start = new Date(start.getTime() - 7 * 86400 * 1000);
    var query = new Parse.Query(Consts.NUTRITION_CLASS);
    query.equalTo(Consts.NUTRITION_USER, Parse.User.current());
    query.greaterThan(Consts.CREATED_AT, start);
    query.ascending(Consts.CREATED_AT);
    query.find({
      success: (results) => {
        console.log("Successfully retrieved " + results.length + " food entries.");
        // Do something with the returned Parse.Object values
        /*Structure: foodArray = [
          {
            dayString:"Mo",
            array:[
              {  
                microsoft: newMsObj,
                nutritionix: newNutObj,
                createdAt: hour+":"+min
              },
              {  
                microsoft: newMsObj,
                nutritionix: newNutObj,
                createdAt: hour+":"+min
              },
              ...
            ]
          },
          ...
        ]*/
        this.foodArray = [];

        //Initialise foodArray with labels
        for (let i = 0; i < 8; i++) {
          this.foodArray.push({
            dayString: this.arrangedDayLabels[i],
            array: []
          });
        }

        for (let i = 0; i < results.length; i++) {
          let parseObject = results[i];
          let msObject = parseObject.get(Consts.NUTRITION_MICROSOFT_RESPONSE);
          let nutritionObject = parseObject.get(Consts.NUTRITION_NUTRITIONIX_INFO);
          let nutCreatedAt = parseObject.get(Consts.CREATED_AT);

          //Calculating dayIndex, position in foodArray that this food object will go into
          let timeDifference = (new Date()).getTime()
            - results[i].get(Consts.CREATED_AT).getTime();
          let dayIndex = Math.floor(timeDifference / (86400 * 1000));
          
          if (msObject && nutritionObject) {
            let microsoftDescription = JSON.parse(JSON.parse(msObject))
              .description.captions[0].text;
            console.log(microsoftDescription);

            let nutritionixCalories = JSON.parse(JSON.parse(nutritionObject)).nf_calories;
            //console.log(newNutObj);

            let hour = (nutCreatedAt.getHours() < 10)
              ? '0' + nutCreatedAt.getHours() : nutCreatedAt.getHours();
            let min = (nutCreatedAt.getMinutes() < 10)
              ? '0' + nutCreatedAt.getMinutes() : nutCreatedAt.getMinutes();

            //Creating and pushing the food object into foodArray
            this.foodArray[dayIndex].array.push({
              microsoft: microsoftDescription,
              nutritionix: nutritionixCalories,
              createdAt: hour + ":" + min
            });
          }
        }
      },
      error: (error) => {
        console.log("Error querying food data:", error.message);
      }
    });
  }

  //STRAVA
  connectStravaButton() {
    var browserRef = window.cordova.InAppBrowser.open("https://www.strava.com/oauth/authorize?"
      + "client_id=11012&response_type=code&response_type=code"
      + "&redirect_uri=http://localhost&approval_prompt=force",
      "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
    browserRef.addEventListener("loadstart", (event) => {
      if ((event.url).indexOf("http://localhost") === 0) {
        browserRef.removeEventListener("exit", (event) => {});
        browserRef.close();
        var url = event.url
        var accessCode = url.substring(30,url.length);
        this.stravaAPIPOST(accessCode);
        this.stravaStats();
        this.stravaActivities();
        this.initStravaData();
      }
    });
    browserRef.addEventListener("exit", function(event) {
      alert("Congratulations your Strava account is connected!"); //TODO: WHAT IF IT ISN'T??
    });
  }

  stravaAPIPOST(access_code) {
    var c_id = "11012";
    var c_secret = "1d5dc79c5adbaaefcc6eeb2b2c9ddb584085ecfc";
    var objParam = {
      client_id: c_id,
      client_secret: c_secret,
      code: access_code
    };
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        var idTest = JSON.parse(xmlhttp.responseText).athlete.id;
        Parse.User.current().set(Consts.USER_STRAVADATA, JSON.parse(xmlhttp.responseText));
        Parse.User.current().set(Consts.USER_STRAVAAUTHORIZATIONCODE, access_code);
        Parse.User.current().set(Consts.USER_STRAVAACCESSTOKEN,
          JSON.parse(xmlhttp.responseText).access_token);
        Parse.User.current().set(Consts.USER_STRAVAID, idTest);
        (<Parse.Object> Parse.User.current()).save();
      }
    }
    xmlhttp.open("POST", "https://www.strava.com/oauth/token", true);
    xmlhttp.setRequestHeader("Content-type", "application/json;"); 
    xmlhttp.send(JSON.stringify(objParam));
  }

  //STRAVA: GET OVERALL STATS
  stravaStats() {
    var stravaId = Parse.User.current().get(Consts.USER_STRAVAID);
    var stravaAccessToken = Parse.User.current().get(Consts.USER_STRAVAACCESSTOKEN);
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        //alert(xmlhttp.responseText);
        Parse.User.current().set(Consts.USER_STRAVASTATS, xmlhttp.responseText);
        (<Parse.Object> Parse.User.current()).save();
      }
    }

    xmlhttp.open("GET", "https://www.strava.com/api/v3/athletes/"+stravaId+"/stats", true);
    xmlhttp.setRequestHeader("Content-type", "application/json;"); 
    xmlhttp.setRequestHeader("Authorization", "Bearer "+stravaAccessToken); 
    xmlhttp.send();
  }

  //STRAVA: LIST ATHLETE ACTIVITIES
  stravaActivities() {
    //var stravaId = Parse.User.current().get(Consts.USER_STRAVAID);
    var stravaAccessToken = Parse.User.current().get(Consts.USER_STRAVAACCESSTOKEN);
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        //alert(xmlhttp.responseText);
        Parse.User.current().set(Consts.USER_STRAVACTIVITIES, xmlhttp.responseText);
        (<Parse.Object> Parse.User.current()).save();
      }
    }
    xmlhttp.open("GET", "https://www.strava.com/api/v3/athlete/activities", true);
    xmlhttp.setRequestHeader("Content-type", "application/json;"); 
    xmlhttp.setRequestHeader("Authorization", "Bearer "+stravaAccessToken); 
    xmlhttp.send();
  }

  //Running and cycling data for last week retrieved from Strava
  initStravaData() {
    CloudFunctions.stravaActivitiesLastWeek((data, error) => {
      if (error == null) {
        console.log('stravaActivitiesLastWeek done!');
        this.cyclingData = data.data.cycling;
        this.initCyclingChart();
        this.runningData = data.data.running;
        this.initRunningChart();
        if (this.walkingData) {
          for (let i = 0; i < this.runningData.distance.length; i++) {
            this.walkingData[i] -= this.runningData.distance[i]/1000;
          }
          this.initWalkingChart();
        }
      } else {
        alert('stravaActivitiesLastWeek error');
        console.log(error)
      }
    })
  }

  //MOVES
  connectMoves() {
    var browserRef = window.cordova.InAppBrowser.open("https://api.moves-app.com/oauth/v1/"
      + "authorize?response_type=code&client_id=95C57N4Gt5t9l5uir45i0P6RcNd1DN6v"
      + "&scope=activity%20location", "_blank", "location=no,clearsessioncache=yes,"
      + "clearcache=yes");
    browserRef.addEventListener("loadstart", (event) => {
        if ((event.url).indexOf("http://localhost") === 0) {
            browserRef.removeEventListener("exit", (event) => {});
            browserRef.close();
            var url = event.url
            var urlMinus = url.length - 7
            var movesAuthorizationCode = url.substring(23,urlMinus);
            console.log(movesAuthorizationCode);
            this.movesAPIPOST(movesAuthorizationCode);
        }
    });
    browserRef.addEventListener("exit", function(event) {
        alert("Congratulations your Moves account is connected!"); //TODO: WHAT IF IT ISN'T??
    });
  }

  movesAPIPOST(movesAuthorizationCode) {
    alert('movesApIPOST');
    /*
    var c_id = "95C57N4Gt5t9l5uir45i0P6RcNd1DN6v";
    var c_secret = "I_47yeKyJqqdgVJYcv5vka3vtqDSTGN6nHx7510TX3QN6w7gw3Rj62fRJ6UXVqrj"
    var redirect_uri = "http://localhost";
    var objParam = {
      code: movesAuthorizationCode,
      client_id: c_id,
      client_secret: c_secret,
      reidrect_uri: redirect_uri
    };
    */
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        alert(3);
        alert(xmlhttp.responseText); //TODO: REMOVE FOR PROD
        //Saving to Parse
        /*
        Parse.User.current().set(Consts.USER_STRAVADATA, JSON.parse(xmlhttp.responseText));
        Parse.User.current().set(Consts.USER_STRAVAAUTHORIZATIONCODE, access_code);
        Parse.User.current().set(Consts.USER_STRAVAACCESSTOKEN,
          JSON.parse(xmlhttp.responseText).access_token);
        (<Parse.Object> Parse.User.current()).save();*/
      }
    }
    
    xmlhttp.open("POST", "https://api.moves-app.com/oauth/v1", true);
    alert(2);
    xmlhttp.setRequestHeader("Content-type", "application/json;"); 
    alert(3);
    //xmlhttp.send(JSON.stringify(objParam));
    alert(4);
  }

  showSettings() {
    UIMessages.showConfirmation({
      title: "Logout",
      message: "The only setting option currently is to logout. Are you sure?"
    }, this.nav, () => {
      Parse.User.logOut().then(() => {
        //alert('The user has logged out');
        location.reload();
      });
    });
  }

  //MEETUP
  connectMeetup() {
    /*this.cordovaOauth = new CordovaOauth(new Meetup({
      clientId: "5mmt4kfgh5mc469f43hj8t5rh6",
      appScope: ["email"]
    }));
    this.cordovaOauth.login().then((success) => {
      alert(JSON.stringify(success));
        }, (error) => {
      alert(JSON.stringify(error));
    });*/
  }



}