import {NavController, IonicApp} from 'ionic-angular';
import {Component, Input} from 'angular2/core'
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';

@Component({
	selector: 'FacebookLogin',
  templateUrl: 'build/widgets/facebooklogin/facebooklogin.html'
})
export class FacebookLogin {

	@Input() option:any;
  @Input() isReply:boolean;
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
      console.log('Will login through facebook;');
      this.loading = true;
      this.facebookParseLogin(null, () => {
        console.log('Facebook login successful');
        this.loading = false;
        this.callbackFunction(this.option);
      }, (message, error) => {
        console.log('Error logging through facebook:', message);
        alert('Error' + message);
      });
    }
	}

	facebookParseLogin(authData, successCallback, errorCallback) {
    Parse.FacebookUtils.logIn(authData, {
      success: (user) => {
        this.message = '';
        FB.api('/me', {
          fields: 'name, email, first_name, last_name, gender' //, age_range
        }, (response) => {
          console.log('Facebook user data', response);
          let currentUser = Parse.User.current();
          currentUser.set(Consts.USER_FACEBOOKID, response.id);
          if (response.name) {
            currentUser.set(Consts.USER_NAME, response.name);
          }
          if (response.first_name) {
            currentUser.set(Consts.USER_FIRSTNAME, response.first_name);
          }
          if (response.last_name) {
            currentUser.set(Consts.USER_LASTNAME, response.last_name);
          }
          if (response.email) {
            currentUser.set(Consts.USER_EMAIL, response.email);
          }
          /*if (response.gender) {
            currentUser.set(Consts.USER_GENDER, response.gender);
          }*/
          /*if (response.age_range && response.age_range.min) {
            currentUser.set(Consts.USER_AGEMIN, parseInt(response.age_range.min));
          }*/
          /*if (!currentUser.get(Consts.USER_STARVOTES)) {
            currentUser.set(Consts.USER_STARVOTES, 0);
          }*/
          if (!currentUser.get(Consts.USER_NOOFGAMES)) {
            currentUser.set(Consts.USER_NOOFGAMES, 0);
          }
          (<Parse.Object> currentUser).save(null, {
            success: (user) => {
              successCallback();
            },
            error: (user, error) => {
              errorCallback('Error saving user details', error);
              /*console.log("User details could not be retrieved from facebook:",
               error);
              this.message = 'Facebook Login Error. Please try again.';
              this.loading = false;*/
            }
          })
        });
        /*FB.api('/me/friends?fields=installed', function(response) {
          let friends = response.data;
          let friendsFbIds = [];
          for (let i = 0; i < friends.length; i++) {
            friendsFbIds.push(friends[i].id);
          }
          Parse.Cloud.run('updateFriends', { friendsFbIdArray: friendsFbIds })
            .then(function(data) {
          });
        });*/
      },
      error: (user, error) => {
        console.log("User cancelled the Facebook login or did not fully authorize.");
        errorCallback('Please ensure you authorize Kickabout to log you in through facebook.', error);
      }
    });
  }
}