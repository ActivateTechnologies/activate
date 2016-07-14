import {NavController, App} from 'ionic-angular';
import {Component, Input} from '@angular/core'
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
    //console.log('facebooklogin widget ngOnInit');
    if (!this.isReply) {
      setTimeout(() => {
        let arrayOfElements = document.getElementsByClassName("facebookLogin");
        let html = arrayOfElements[arrayOfElements.length-1].innerHTML;
        html.replace('<!--template bindings={}-->', ' ')
          .replace('<!--template bindings={}-->', ' '); //two occurances
        html = '<div class="facebookLogin">' + html + '</div>';
        this.callbackFunction(this.chatObject, this.isReply, null, html, true);
      });
    }
  }

	login() {
    if (this.isReply) {
      if (this.currentUser) {
        Parse.User.logOut();
      }
      this.loading = true;
      UserFunctions.facebookLogin(() => {
        this.loading = false;
        this.callbackFunction(this.chatObject, this.isReply, null, null, true);
      }, (message, error) => {
        console.log('Error logging through facebook:', message);
        alert(message);
        this.loading = false;
      });
    }
	}

}