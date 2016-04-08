import {NavController, IonicApp} from 'ionic-angular';
import {Component, Input} from 'angular2/core'
import {Consts} from '../helpers/consts';
import {FacebookLogin} from './facebooklogin/facebooklogin';
import {UserLocation} from './userlocation/userlocation';
import {Health} from './health/health';

@Component({
	selector: 'Widget',
  templateUrl: 'build/widgets/widget.html',
  directives: [FacebookLogin, UserLocation, Health]
})
export class Widget {
	@Input() chatObject:any;
	@Input() isReply:boolean;
	@Input() callbackFunction:Function;

	options:any; widget:any; data:any;

	constructor() {
		
	}

	ngOnInit() {
		this.widget = this.chatObject.widget;
		/*if (this.widget.options) {
			this.options = this.widget.options;
		}
		if (this.chatObject.data) {
			this.data = this.chatObject.data
		}*/
	}
}