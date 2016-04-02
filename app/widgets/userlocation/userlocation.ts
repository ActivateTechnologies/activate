import {NavController, IonicApp} from 'ionic-angular';
import {Component, Input} from 'angular2/core'
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';

@Component({
	selector: 'UserLocation',
  templateUrl: 'build/widgets/userlocation/userlocation.html'
})
export class UserLocation {

	@Input() option:any;
  @Input() isReply:boolean;
	@Input() callbackFunction:Function;

	loading:boolean = false; currentUser:any;

  ngOnInit() {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.currentUser = Parse.User.current();
  }

	getUserLocation() {
    if (this.isReply) {
      this.loading = true;
      navigator.geolocation.getCurrentPosition((position) => {
        this.loading = false;
        this.callbackFunction(this.option);
        /*if (this.placedMarker == null) {
          let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          this.map.setCenter(latLng);
        }*/
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
        this.callbackFunction(this.option);
      });
    }
	}

}