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
    navigator.health.requestAuthorization(['steps'],
      () => {
        alert('Auth success');
        navigator.health.query({
          startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // three days ago
          endDate: new Date(), // now
          dataType: 'steps'
        }, (data) => {
          console.log('Got steps:', data)
          alert(data);
        }, (error) => {
          console.log('Error:', error);
          alert('Error:'+error);
        });
      }, (err) => {
        alert('Auth error: '+err);
        console.log('Auth Error', err);
      }
    );
  }
}