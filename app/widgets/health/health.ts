import {NavController, IonicApp, Platform} from 'ionic-angular';
import {Component, Input} from 'angular2/core'
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';

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

	loading:boolean = false; currentUser:any; lastLocation:Parse.GeoPoint;
  platform:any; healthApiAvailable:boolean = false; healthApiAccessGranted:boolean = false;
  platformId:string; widgetType:string; initHealthString:string; summaryString:string;

  constructor(platform: Platform) {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.currentUser = Parse.User.current();
    this.loading = true;
    this.platform = platform;
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
      /*if (!this.isReply && this.widgetType == 'measureHeart') {
        this.measureHeart();
      }*/
    });
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
    }
  }

  //Called when user clicks to grant access to Health Apis
  initHealth() {
    this.loading = true;
    navigator.health.requestAuthorization(['steps', 'distance', 'activity'],
      () => {
        localStorage['healthApiAccessGranted'] = true;
        this.callbackFunction(this.chatObject, {log:1});
      }, (err) => {
        localStorage['healthApiAccessGranted'] = false;
        console.log('Health auth error', err);
        this.callbackFunction(this.chatObject, {log:2});
      }
    );
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

  //Get all data and call processData. If even one has error,
  //call callback function with no data
  showData() {
    let steps:any; 
    let distance:any;
    let activity:any;

    if (localStorage['healthApiAccessGranted']) {
      this.loading = true;
      navigator.health.queryAggregated({
        startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'steps'
      }, (data) => {
        //console.log('Got steps:', data)
        steps = data;
        this.processData(steps, distance, activity);
      }, (error) => {
        console.log('Error:', error);
        this.callbackFunction(this.chatObject, {error: "Error accessing steps"});
      });
      navigator.health.queryAggregated({
        startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'distance'
      }, (data) => {
        //console.log('Got distance:', data)
        distance = data;
        this.processData(steps, distance, activity);
      }, (error) => {
        console.log('Error:', error);
        this.callbackFunction(this.chatObject, {error: "Error accessing distance"});
      });
      navigator.health.queryAggregated({
        startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // three days ago
        endDate: new Date(), // now
        dataType: 'activity'
      }, (data) => {
        //console.log('Got activity:', data)
        activity = data;
        this.processData(steps, distance, activity);
      }, (error) => {
        console.log('Error:', error);
        this.callbackFunction(this.chatObject, {error: "Error accessing activity"});
      });
    }
  }

  //Called by showData
  processData(steps:any, distance:any, activity:any) {
    if (steps != null && distance != null && activity != null) {
      let summaryString:string = 'You walked ' + steps.value + ' steps yesterday '
        + 'which covered ' + distance.value + distance.unit;
      console.log(summaryString);
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

  measureHeart() {
    this.loading = true;
    let props:any = {
      seconds: 5,
      fps: 30
    };
    if (window.heartbeat) {
      window.heartbeat.take(props,
        (bpm) => {
          console.log("Your heart beat per minute is:" + bpm);
          this.loading = false;
          this.callbackFunction(this.chatObject, {
            summaryString: "Your heart beat per minute is:" + bpm,
            bmpCount: bpm
          });
        }, (error) => {
          this.summaryString = "Error measuring heart rate";
          this.loading = false;
          console.log("Error measuring heart beat", error);
          this.callbackFunction(this.chatObject, {
            summaryString: "Error measuring heart rate"
          });
        }
      );
    } else {
      this.loading = false;
      console.log('Heartbeat plugin not found');
      this.callbackFunction(this.chatObject, {
        summaryString: "Heartbeat feature not present"
      });
    }
  }
}