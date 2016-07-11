import {NavController, App} from 'ionic-angular';
import {Component, Input} from '@angular/core'
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';
import {UserFunctions} from '../../helpers/userfunctions';

@Component({
	selector: 'Mood',
  templateUrl: 'build/widgets/mood/mood.html'
})
export class Mood {

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
    if (!this.isReply) {
      setTimeout(() => {
        let arrayOfElements = document.getElementsByClassName("mood");
        let html = arrayOfElements[arrayOfElements.length-1].innerHTML;
        html.replace('<!--template bindings={}-->', ' ')
          .replace('<!--template bindings={}-->', ' '); //two occurances
        html = '<div class="mood">' + html + '</div>';
        this.callbackFunction(this.chatObject, this.isReply, null, html, true);
      });
    }
  }

	setMood() {
    let moodNumber = this.options.mood;
    if (this.isReply && Parse.User.current()) {
      this.loading = true;
      let Mood = Parse.Object.extend(Consts.MOOD_CLASS);
      let mood = new Mood();
      mood.set(Consts.MOOD_USER, Parse.User.current());
      mood.set(Consts.MOOD_HAPPINESS, moodNumber);
      mood.save({
        success: (object) => {
          console.log('Saved your mood');
          this.loading = false;
          this.callbackFunction(this.chatObject, this.isReply, null, null, true);
        },
        error: (object, error) => {
          console.log('Error saving mood:', error.message);
          alert('Error saving your mood :(');
        }
      });
    }
	}

}