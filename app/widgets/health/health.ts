import {NavController, App, Platform} from 'ionic-angular';
import {Component, Input, NgZone} from '@angular/core'
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';
import {HelperFunctions} from '../../helpers/helperfunctions';

@Component({
	selector: 'Health',
  templateUrl: 'build/widgets/health/health.html'
})
export class Health {

  //The entire chat object, to pass back in callback
	@Input() chatObject:any;
  //Options to specify to the widget
  @Input() options:any;
  //Passed back in from plugin, usually specified only when isReply = false
  @Input() data:any;
  //isReply = true if this widget is in the user reply section, false if it's bot's message
  @Input() isReply:boolean;
  //Called after the widget has performed its task
	@Input() callbackFunction:Function;

  zone: any;
	loading:boolean = false; currentUser:any; lastLocation:Parse.GeoPoint;
  platform:any; healthApiAvailable:boolean = false; healthApiAccessGranted:boolean = false;
  platformId:string; widgetType:string; initHealthString:string; summaryString:string;

  constructor(platform: Platform, zone: NgZone) {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.currentUser = Parse.User.current();
    this.loading = true;
    this.platform = platform;
    this.zone = zone;
  }

  ngOnInit() {
    //Types: initHealth, showData, measureHeart
    this.widgetType = this.options.type;

    this.initializeStatusVars(() => {
      if (!this.isReply && this.widgetType == 'initHealth') {
        this.initHealthString = this.constructInitHealthString();
      }
      if (!this.isReply && this.widgetType == 'showData') {
        this.showData();
      }
      if (!this.isReply && this.widgetType == 'recentActivity') {
        this.recentActivity();
      }
      if (!this.isReply && this.widgetType == 'recentSleep') {
        this.recentSleep();
      }
      /*if (!this.isReply && this.widgetType == 'measureHeart') {
        this.measureHeart();
      }*/
    });

    if (!this.isReply) {
      setTimeout(() => {
        let arrayOfElements = document.getElementsByClassName("health");
        let html = arrayOfElements[arrayOfElements.length-1].innerHTML;
        html.replace('<!--template bindings={}-->', ' ')
          .replace('<!--template bindings={}-->', ' '); //two occurances
        html = '<div class="health">' + html + '</div>';
        if (this.widgetType == 'showData' || this.widgetType == 'recentActivity'
           || this.widgetType == 'recentSleep') {
          this.callbackFunction(this.chatObject, this.isReply, null, html, false);
        } else {
          this.callbackFunction(this.chatObject, this.isReply, null, html, true);
        }
      });
    }
  }

  //Initialize various status variables incluring platformId and health api statuses
  initializeStatusVars(callback) {
    if (this.platform.is('android')) {
      this.platformId = 'android';
    } else if (this.platform.is('ios')) {
      this.platformId = 'ios'
    } else {
      this.platformId = 'browser';
    }

    if (localStorage['healthApiAccessGranted']) {
      this.healthApiAccessGranted = localStorage['healthApiAccessGranted'];
    }

    if (this.platformId != 'browser' && navigator.health) {
      navigator.health.isAvailable(() => {
        this.healthApiAvailable = true;
        this.loading = false;
        callback();
      }, () => {
        console.log('Health not available');
        this.loading = false;
        callback();
      });
    } else {
      this.loading = false;
    }
  }

  //Called when user clicks to grant access to Health Apis
  initHealth() {
    if (this.platformId != 'browser') {
      this.loading = true;
      navigator.health.requestAuthorization(['steps', 'distance', 'activity'],
        () => {
          localStorage['healthApiAccessGranted'] = true;
          this.callbackFunction(this.chatObject, this.isReply, null, null, true);
        }, (err) => {
          localStorage['healthApiAccessGranted'] = false;
          console.log('Health auth error', err);
          this.callbackFunction(this.chatObject, this.isReply, null, null, true);
        }
      );
    } else {
      this.callbackFunction(this.chatObject, this.isReply, null, null, true);
    }
  }

  //Constructs the appropriate message to display after user has been asked to grant access
  constructInitHealthString():string {
    if (this.platformId == 'browser') {
      return 'Health api not available in browser.'
    } else {
      if (!this.healthApiAvailable) {
        return (this.platformId == 'android') ?
         'Google Fit is not available on your device.'
          : 'HealthKit is not available on your device.';
      } else {
        if (this.healthApiAccessGranted) {
          return (this.platformId == 'android') ?
           'Google Fit is all set!'
            : 'HealthKit is all set!';
        } else {
          return (this.platformId == 'android') ?
           'Google Fit permission deined.'
            : 'HealthKit permission denied.';
        }
      }
    }
  }

  //Get all data and call processShowData. If even one has error,
  //call callback function with no data
  showData() {
    let steps:any; 
    let distance:any;
    let activity:any;

    if (localStorage['healthApiAccessGranted']) {
      Parse.User.current()
      this.loading = true;
      navigator.health.queryAggregated({
        startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // one day ago
        endDate: new Date(), // now
        dataType: 'steps'
      }, (data) => {
        //console.log('Got steps:', data)
        steps = data;
        this.processShowData(steps, distance, activity);
      }, (error) => {
        console.log('Error:', error);
        this.callbackFunction(this.chatObject, this.isReply, {
          error: "Error accessing steps"
        }, null, false);
      });
      navigator.health.queryAggregated({
        startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // one day ago
        endDate: new Date(), // now
        dataType: 'distance'
      }, (data) => {
        //console.log('Got distance:', data)
        distance = data;
        this.processShowData(steps, distance, activity);
      }, (error) => {
        console.log('Error:', error);
        this.callbackFunction(this.chatObject, this.isReply, {
          error: "Error accessing distance"
        }, null, false);
      });
      navigator.health.queryAggregated({
        startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'activity'
      }, (data) => {
        //console.log('Got activity:', data);
        activity = data;
        this.processShowData(steps, distance, activity);
      }, (error) => {
        console.log('Error:', error);
        this.callbackFunction(this.chatObject, this.isReply, {
          error: "Error accessing activity"
        }, null, false);
      });
      /*navigator.health.query({
        startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'activity'
      }, (data) => {
        console.log('Got activity:', data);
        console.log('Activity JSON:', JSON.stringify(data));
        document.getElementById('activityJsonString').value = JSON.stringify(data);
        activity = data;
        this.processShowData(steps, distance, activity);
      }, (error) => {
        console.log('Error:', error);
        this.callbackFunction(this.chatObject, {error: "Error accessing activity"});
      });*/
    }
  }

  //Called by showData
  processShowData(steps:any, distance:any, activity:any) {
    if (steps != null && distance != null && activity != null) {
      let summaryString:string = 'You walked ' + Math.round(steps.value)
       + ' steps yesterday ' + 'which covered ' + Math.round(distance.value) + distance.unit;
      this.loading = false;
      this.summaryString = summaryString;
      /*this.callbackFunction(this.chatObject, {
        summaryString: summaryString,
        steps: steps,
        distance: distance,
        activity: activity
      });*/
    }
  }

  //Get recent data as per specified options
  recentActivity() {
    if (localStorage['healthApiAccessGranted']) {
      Parse.User.current()
      this.loading = true;
      let endDate = new Date();
      //endDate.setSeconds(0);
      let startDate = new Date();
      startDate.setMinutes(0);
      startDate.setSeconds(0);
      startDate.setHours(0)
      navigator.health.query({
        startDate: startDate,
        endDate: endDate,
        dataType: 'distance'
      }, (data) => {
        this.processRecentActivity(data);
      }, (error) => {
        console.log('Error:', error);
        this.callbackFunction(this.chatObject, this.isReply, {
          error: "Error accessing distance"
        }, null, false);
      });
    } else {
      this.loading = false;
      //alert('Health API Not Available');
      this.summaryString = 'Recent Activity Statement (Health Api Not Available)'
    }
  }

  processRecentActivity (distanceArray:any[]) {
    let ACCEPTED_INTERVAL = 1 * 5000; //seconds
    let ACCEPTED_MIN_DISTANCE = 100;
    if (distanceArray != null) {
      let distanceArrayCombined = HelperFunctions.combineHealthDate(distanceArray,
       ACCEPTED_INTERVAL, ACCEPTED_MIN_DISTANCE, true);
      let lastTrip = distanceArrayCombined[distanceArrayCombined.length-1];
      lastTrip.startDate = new Date(lastTrip.startDate);
      lastTrip.endDate = new Date(lastTrip.endDate);
      //console.log('Last Trip', lastTrip);
      /*console.log(Parse.User.current().get(Consts.USER_LASTNOTIFIEDRECENTACTIVITY),
       lastTrip.endDate);*/
      Parse.User.current().fetch({
        success: (object) => {
          if (Parse.User.current().get(Consts.USER_LASTNOTIFIEDRECENTACTIVITY) &&
            Parse.User.current().get(Consts.USER_LASTNOTIFIEDRECENTACTIVITY)
              > lastTrip.endDate) {
            this.summaryString = 'Time to get movin!';
            this.loading = false;
          } else {
            let startMin = lastTrip.startDate.getMinutes();
            startMin = (startMin > 9) ? startMin : "0" + startMin;
            let startHour = lastTrip.startDate.getHours() % 12;
            startHour = startHour ? startHour : 12;
            let startAmPm = (lastTrip.startDate.getHours() < 12) ? "am" : "pm"; 
            let endMin = lastTrip.endDate.getMinutes();
            endMin = (endMin > 9) ? endMin : "0" + endMin;
            let endHour = lastTrip.endDate.getHours() % 12;
            endHour = endHour ? endHour : 12;
            let endAmPm = (lastTrip.endDate.getHours() < 12) ? "am" : "pm";
            this.zone.run(() => {
              this.summaryString = 'Nice ' + Math.round(lastTrip.value/10)/100
                + 'km walk you did from ' + startHour + ':' + startMin + startAmPm + ' to '
                + endHour + ':' + endMin + endAmPm;
              this.loading = false;
            });
            //Parse.User.current().set(Consts.USER_LASTNOTIFIEDRECENTACTIVITY, new Date());
            (<Parse.Object> Parse.User.current()).save();
          }
        },
        error: (object, error) => {
          console.log('Error fetching user object: ' + error.message);
          this.summaryString = 'Time to get movin!';
          this.loading = false;
        }
      });
        
      /*this.callbackFunction(this.chatObject, {
        summaryString: summaryString,
        steps: steps,
        distance: distance,
        activity: activity
      });*/
    }
  }

  recentSleep() {
    if (localStorage['healthApiAccessGranted']) {
      Parse.User.current()
      this.loading = true;
      let endDate = new Date();
      //endDate.setSeconds(0);
      let startDate = new Date();
      startDate.setTime(startDate.getTime() - (86400 * 1000));
      navigator.health.queryAggregated({
        startDate: startDate,
        endDate: new Date(),
        dataType: 'activity'
      }, (data) => {
        if (data.value.sleep) {
          this.processRecentSleep(Math.round(data.value.sleep.duration * 10 / 3600) / 10);
        } 
      }, (error) => {
        console.log('Error:', error);
        this.callbackFunction(this.chatObject, this.isReply, {
          error: "Error accessing sleep data"
        }, null, false);
      });
    } else {
      this.loading = false;
      alert('Health API Not Available');
      this.summaryString = 'Recent Sleep Statement (Health Api Not Available)'
    }
  }

  //Called by showData
  processRecentSleep (sleepNumber) {
    let SLEEP_MEAN = 8; //seconds
    let SLEEP_TROLERANCE = 0.75;
    if (sleepNumber && sleepNumber > 0) {
      Parse.User.current().fetch({
        success: (object) => {
          let date5MinAgo = new Date();
          date5MinAgo.setTime(date5MinAgo.getTime() - 5 * 60000);
          if (!Parse.User.current().get(Consts.USER_LASTOPENED) &&
           Parse.User.current().get(Consts.USER_LASTOPENED) < date5MinAgo) {
            this.zone.run(() => {
              if (sleepNumber < (SLEEP_MEAN - SLEEP_TROLERANCE)) {
                this.summaryString = 'You slept too little!';
              } else if (sleepNumber > (SLEEP_MEAN + SLEEP_TROLERANCE)) {
                this.summaryString = 'You got the right about of sleep.';
              } else {
                this.summaryString = 'You slept too much!';
              }
              this.loading = false;
            });
            //Parse.User.current().set(Consts.USER_LASTOPENED, new Date());
            (<Parse.Object> Parse.User.current()).save();
          }
        },
        error: (object, error) => {
          console.log('Error fetching user object: ' + error.message);
          this.summaryString = 'Time to get movin!';
          this.loading = false;
        }
      });
    } else {
      //TODO Skip to next message
      this.summaryString = 'Howdy!';
      this.loading = false;
    }
  }

  measureHeart() {
    this.loading = true;
    let props:any = {
      seconds: 10,
      fps: 30
    };
    if (window.heartbeat) {
      window.heartbeat.take(props,
        (bpm) => {
          console.log("Your heart beat per minute is: " + bpm);
          this.saveHeartRate(bpm, () => {
            this.loading = false;
            this.callbackFunction(this.chatObject, this.isReply, {
              summaryString: "Your heart beat per minute is: " + bpm,
              bmpCount: bpm
            }, null, true);
          })
        }, (error) => {
          this.summaryString = "Error measuring heart rate";
          this.loading = false;
          console.log("Error measuring heart beat", error);
          this.callbackFunction(this.chatObject, this.isReply, {
            summaryString: "Error measuring heart rate"
          }, null, true);
        }
      );
    } else {
      console.log('Heartbeat plugin not found, simulating');
      setTimeout(() => {
        this.loading = false;
        let bpm:number = 60;
        this.saveHeartRate(bpm, () => {
          this.callbackFunction(this.chatObject, this.isReply, {
            summaryString: "Your heart beat per minute is: " + bpm,
            bmpCount: bpm
          }, null, true);
        });
      }, 2000);

      /*this.callbackFunction(this.chatObject, {
        summaryString: "Heartbeat feature not present"
      });*/
    }
  }

  saveHeartRate(bpm, callback) {
    let HeartData = Parse.Object.extend(Consts.HEARTDATA_CLASS);
    let heartData = new HeartData();

    heartData.set(Consts.HEARTDATA_USER, Parse.User.current());
    heartData.set(Consts.HEARTDATA_HEARTRATE, bpm);
    heartData.set(Consts.HEARTDATA_REFERENCE, 1);

    heartData.save({
      success: (parseObject) => {
        callback();
      },
      error: (parseObject, error) => {
        console.log("Error saving HeartData:", error.message);
        callback();
      }
    });
  }
}