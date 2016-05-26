import {NavController, IonicApp} from 'ionic-angular';
import {Component, Input} from '@angular/core'
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';

@Component({
	selector: 'UserLocation',
  templateUrl: 'build/widgets/userlocation/userlocation.html'
})
export class UserLocation {

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

  ngOnInit() {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.currentUser = Parse.User.current();
    if (!this.isReply && this.currentUser) {
      this.lastLocation = this.currentUser.get(Consts.USER_LASTLOCATION);
    }
  }

	getUserLocation() {
    if (this.isReply) {
      this.loading = true;
      navigator.geolocation.getCurrentPosition((position) => {
        console.log('Got location', position.coords);
        if (Parse.User.current() != null) {
          Parse.User.current().set(Consts.USER_LASTLOCATION, new Parse.GeoPoint({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          (<Parse.Object> Parse.User.current()).save();
        }
        this.loading = false;
        this.callbackFunction(this.chatObject);
      }, (error) => {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            console.log('Error getting location, permission denied.');
            break;
          case error.POSITION_UNAVAILABLE:
            console.log('Error getting location, location unavailable.');
            break;
          case error.TIMEOUT:
            console.log('Error getting location, request timed out.');
            break;
          default:
            console.log('Error getting location, unknown error.');
            break;
        }
        this.loading = false;
        this.callbackFunction(this.chatObject);
      });
    }
	}

}