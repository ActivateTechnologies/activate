import {NavController, IonicApp} from 'ionic-angular';
import {Component, Input} from 'angular2/core'
import {Consts} from '../helpers/consts';
import {FacebookLogin} from './facebooklogin/facebooklogin';
import {UserLocation} from './userlocation/userlocation';

@Component({
	selector: 'Widget',
  templateUrl: 'build/widgets/widget.html',
  directives: [FacebookLogin, UserLocation]
})
export class Widget {
	@Input() widget:any;
	@Input() option:any;
	@Input() isReply:boolean;
	@Input() callbackFunction:Function;

	constructor() {
	}
}