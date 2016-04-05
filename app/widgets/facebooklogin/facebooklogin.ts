import {NavController, IonicApp} from 'ionic-angular';
import {Component, Input} from 'angular2/core'
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';
import {UserFunctions} from '../../helpers/userfunctions';

@Component({
	selector: 'FacebookLogin',
  templateUrl: 'build/widgets/facebooklogin/facebooklogin.html'
})
export class FacebookLogin {

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

	loading:boolean = false; message:string; currentUser:any;

  ngOnInit() {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.currentUser = Parse.User.current();
  }

	login() {
    if (this.isReply) {
      if (this.currentUser) {
        Parse.User.logOut();
      }
      this.loading = true;
      UserFunctions.facebookLogin(() => {
        this.loading = false;
        this.callbackFunction(this.chatObject);
      }, (message, error) => {
        console.log('Error logging through facebook:', message);
        alert('Error' + message);
      });
    }
	}

}