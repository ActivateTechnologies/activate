import {NavController, IonicApp} from 'ionic-angular';
import {Component, Input} from 'angular2/core'
import {Consts} from '../helpers/consts';
import {FacebookLogin} from './facebooklogin/facebooklogin';

@Component({
	selector: 'Widget',
  templateUrl: 'build/widgets/widget.html',
  directives: [FacebookLogin]
})
export class Widget {
	@Input() widget:any;

	constructor() {
	}
}