import {NavController, IonicApp} from 'ionic-angular';
import {Component} from 'angular2/core'
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';

@Component({
	selector: 'FacebookLogin',
  templateUrl: 'build/widgets/facebooklogin/facebooklogin.html'
})
export class FacebookLogin {
	login() {
		console.log('Will login through facebook;');
	}
}