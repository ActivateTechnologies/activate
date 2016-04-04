import {App} from 'ionic-angular';
import {Consts} from './consts';

export class UserFunctions {

  constructor() {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
  }

  public static emailLogin(email, password, successCallback, errorCallback) {
    console.log('Going to login with:', email, password);
    Parse.User.logIn(email, password, {
      success: (user) => {
        Parse.User.current().fetch();
        successCallback(user);
      },
      error: (user, error) => {
        errorCallback('Invalid username and/or password, try again.', error);
      }
    });
  }

  public static emailSignup(firstname, lastname, email, password, successCallback, errorCallback) {
    let user = new Parse.User();
    user.set(Consts.USER_FIRSTNAME, firstname);
    user.set(Consts.USER_LASTNAME, lastname);
    user.set(Consts.USER_NAME, firstname + ' ' + lastname);
    user.set(Consts.USER_PASSWORD, password);
    user.set(Consts.USER_EMAIL, email);
    user.set(Consts.USER_USERNAME, email);
    user.signUp(null, {
      success: (user) => {
        successCallback();
      },
      error: (user, error) => {
        errorCallback(error);
      }
    });
  }

  public static facebookLogin(successCallback, errorCallback) {
    if (!window.cordova) {
      UserFunctions.facebookParseLogin(null, successCallback, errorCallback);
      return;
    }
    facebookConnectPlugin.login(['email'],
      (response) => {
        console.log(response);
        if (!response.authResponse){
          console.log('Cannot find the authResponse:', response);
          errorCallback('Facebook Login Error. Please try again.', error);
          return;
        }
        let expDate = new Date(
            new Date().getTime() + response.authResponse.expiresIn * 1000
          ).toISOString();
        let authData = {
          id: String(response.authResponse.userID),
          access_token: response.authResponse.accessToken,
          expiration_date: expDate
        }
        UserFunctions.facebookParseLogin(authData, successCallback, errorCallback);
      }, 
      (error) => {
        console.log('Facebook plugin login error:', error);
        errorCallback('Facebook Login Error. Please try again.', error);
      }
    );
  }

  public static recoverPassword(email, successCallback, errorCallback) {
    Parse.User.requestPasswordReset(email, {
      success: () => {
        successCallback();
      },
      error: (error) => {
        console.log('Error resetting password: '+error.message+' code: '+error.code);
        errorCallback(error);
      }
    });
  }

  public static userLogout(successCallback, errorCallback) {
    if (window.cordova && Parse.User.current().get(Consts.USER_FACEBOOKID)) {
      facebookConnectPlugin.logout(
        () => {
          Parse.User.logOut();
          successCallback();
        },
        () => {
          errorCallback('There was an error logging out, please try again.');
          console.log('Error logging out of facebook connect plugin.');
        }
      );
    } else {
      Parse.User.logOut();
      successCallback();
    }
  }

  static facebookParseLogin(authData, successCallback, errorCallback) {
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
          if (response.gender) {
            currentUser.set(Consts.USER_GENDER, response.gender);
          }
          /*if (response.age_range && response.age_range.min) {
            currentUser.set(Consts.USER_AGEMIN, parseInt(response.age_range.min));
          }*/
          if (!currentUser.get(Consts.USER_STARVOTES)) {
            currentUser.set(Consts.USER_STARVOTES, 0);
          }
          if (!currentUser.get(Consts.USER_NOOFGAMES)) {
            currentUser.set(Consts.USER_NOOFGAMES, 0);
          }
          currentUser.save(null, {
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
        FB.api('/me/friends?fields=installed', function(response) {
          let friends = response.data;
          let friendsFbIds = [];
          for (let i = 0; i < friends.length; i++) {
            friendsFbIds.push(friends[i].id);
          }
          Parse.Cloud.run('updateFriends', { friendsFbIdArray: friendsFbIds })
            .then(function(data) {
          });
        });
      },
      error: (user, error) => {
        console.log("User cancelled the Facebook login or did not fully authorize.");
        /*this.message = 'Please ensure you authorize Activate to log you in through facebook.';
        this.loading = false;*/
        errorCallback('Please ensure you authorize Activate to log you in through facebook.', error);
      }
    });
  }

  /**
    Returns specified user's 'firstname' if exists, else name. If no user specified, 
    uses current user.
  */
  public static getUserShortName(parseUser) {
    if (!parseUser) {
      parseUser = Parse.User.current();
    }
    return (parseUser.get(Consts.USER_FIRSTNAME) && parseUser.get(Consts.USER_FIRSTNAME).length > 0) ?
      parseUser.get(Consts.USER_FIRSTNAME) : parseUser.get(Consts.USER_NAME);
  }
  
}