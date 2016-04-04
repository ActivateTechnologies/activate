import {NavController, IonicApp, Platform} from 'ionic-angular';
import {Component, Input} from 'angular2/core'
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';

@Component({
	selector: 'Health',
  templateUrl: 'build/widgets/health/health.html'
})
export class Health {

	@Input() option:any;
  @Input() isReply:boolean;
	@Input() callbackFunction:Function;

	loading:boolean = false; currentUser:any; lastLocation:Parse.GeoPoint;
  platform:any; healthApi:string; healthApiStatus:string;

  constructor(platform: Platform) {
    this.platform = platform;
    if (this.platform.is('android')) {
      this.healthApi = 'Google Fit access granted';
    } else if (this.platform.is('ios')) {
      this.healthApi = 'HealthKit access granted';
    } else {
      this.healthApi = 'Running in browser';
    }
  }

  ngOnInit() {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.currentUser = Parse.User.current();
    this.loading = false;
  }

  initHealth() {
    this.loading = true;
    if (navigator.health) {
      navigator.health.isAvailable(() => {
        this.healthApiStatus = "Available";
        console.log('Health available');
        this.initAuth();
        this.loading = false;
        this.callbackFunction(this.option);
      }, () => {
        this.healthApiStatus = "Not Available";
        console.log('Health not available');
        this.loading = false;
        this.callbackFunction(this.option);
      });
    } else {
      this.healthApiStatus = "Not Available"
      console.log('Health not available, browser');
      this.loading = false;
      this.callbackFunction(this.option);
    }
  }

  initAuth() {
    navigator.health.requestAuthorization(['steps', 'distance', 'activity'],
      () => {
        alert('Auth success');
        /*navigator.health.queryAggregated({
          startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // three days ago
          endDate: new Date(), // now
          dataType: 'steps'
        }, (data) => {
          console.log('Got steps:', data)
          //alert(data);
          if (data.value) {
            alert(data.value + ' steps walked since yesterday!');
          }
        }, (error) => {
          console.log('Error:', error);
          alert('Error:'+error);
        });
        navigator.health.queryAggregated({
          startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // three days ago
          endDate: new Date(), // now
          dataType: 'distance'
        }, (data) => {
          console.log('Got distance:', data)
          //alert(data);
          if (data.value) {
            alert(data.value + data.unit + ' covered since yesterday!');
          }
        }, (error) => {
          console.log('Error:', error);
          alert('Error:'+error);
        });
        navigator.health.queryAggregated({
          startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // three days ago
          endDate: new Date(), // now
          dataType: 'activity'
        }, (data) => {
          console.log('Got activity:', data)
          //alert(data);
          if (data.value) {
            alert(data.value + ' activity since yesterday!');
          }
        }, (error) => {
          console.log('Error:', error);
          alert('Error:'+error);
        });*/

        let props:any = {
          seconds: 10,
          fps: 30
        };

        if (heartbeat) {
          heartbeat.take(props,
            (bpm) => {
              console.log("Your heart beat per minute is:" + bpm);
              alert("Your heart beat per minute is:" + bpm);
            }, (error) => {
              console.log("Has not possible measure your heart beat");
              alert("Has not possible measure your heart beat");
            }
          );
        } else{
          console.log('Heartbeat plugin not found');
        }
      }, (err) => {
        alert('Auth error: '+err);
        console.log('Auth Error', err);
      }
    );
  }
}