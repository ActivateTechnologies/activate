"use strict";
var consts_1 = require('./consts');
var UserFunctions = (function () {
    function UserFunctions() {
        Parse.initialize(consts_1.Consts.PARSE_APPLICATION_ID, consts_1.Consts.PARSE_JS_KEY);
    }
    UserFunctions.emailLogin = function (email, password, successCallback, errorCallback) {
        console.log('Going to login with:', email, password);
        Parse.User.logIn(email, password, {
            success: function (user) {
                Parse.User.current().fetch();
                successCallback(user);
            },
            error: function (user, error) {
                errorCallback('Invalid username and/or password, try again.', error);
            }
        });
    };
    UserFunctions.emailSignup = function (firstname, lastname, email, password, successCallback, errorCallback) {
        var user = new Parse.User();
        user.set(consts_1.Consts.USER_FIRSTNAME, firstname);
        user.set(consts_1.Consts.USER_LASTNAME, lastname);
        user.set(consts_1.Consts.USER_NAME, firstname + ' ' + lastname);
        user.set(consts_1.Consts.USER_PASSWORD, password);
        user.set(consts_1.Consts.USER_EMAIL, email);
        user.set(consts_1.Consts.USER_USERNAME, email);
        user.signUp(null, {
            success: function (user) {
                successCallback();
            },
            error: function (user, error) {
                errorCallback(error);
            }
        });
    };
    UserFunctions.facebookLogin = function (successCallback, errorCallback) {
        if (!window.cordova) {
            UserFunctions.facebookParseLogin(null, successCallback, errorCallback);
            return;
        }
        window.facebookConnectPlugin.login(['email'], function (response) {
            //console.log(response);
            if (!response.authResponse) {
                console.log('Cannot find the authResponse:', response);
                errorCallback('Facebook Login Error. Please try again.', { message: '' });
                return;
            }
            var expDate = new Date(new Date().getTime() + response.authResponse.expiresIn * 1000).toISOString();
            var authData = {
                id: String(response.authResponse.userID),
                access_token: response.authResponse.accessToken,
                expiration_date: expDate
            };
            UserFunctions.facebookParseLogin(authData, successCallback, errorCallback);
        }, function (error) {
            console.log('Facebook plugin login error:', error);
            errorCallback('Facebook Login Error. Please try again.', error);
        });
    };
    UserFunctions.recoverPassword = function (email, successCallback, errorCallback) {
        Parse.User.requestPasswordReset(email, {
            success: function () {
                successCallback();
            },
            error: function (error) {
                console.log('Error resetting password: ' + error.message + ' code: ' + error.code);
                errorCallback(error);
            }
        });
    };
    UserFunctions.userLogout = function (successCallback, errorCallback) {
        if (window.cordova && Parse.User.current().get(consts_1.Consts.USER_FACEBOOKID)) {
            window.facebookConnectPlugin.logout(function () {
                Parse.User.logOut();
                successCallback();
            }, function () {
                errorCallback('There was an error logging out, please try again.');
                console.log('Error logging out of facebook connect plugin.');
            });
        }
        else {
            Parse.User.logOut();
            successCallback();
        }
    };
    UserFunctions.facebookParseLogin = function (authData, successCallback, errorCallback) {
        var _this = this;
        Parse.FacebookUtils.logIn(authData, {
            success: function (user) {
                _this.message = '';
                window.FB.api('/me', {
                    fields: 'name, email, first_name, last_name, gender' //, age_range
                }, function (response) {
                    //console.log('Facebook user data', response);
                    var currentUser = Parse.User.current();
                    currentUser.set(consts_1.Consts.USER_FACEBOOKID, response.id);
                    if (response.name) {
                        currentUser.set(consts_1.Consts.USER_NAME, response.name);
                    }
                    if (response.first_name) {
                        currentUser.set(consts_1.Consts.USER_FIRSTNAME, response.first_name);
                    }
                    if (response.last_name) {
                        currentUser.set(consts_1.Consts.USER_LASTNAME, response.last_name);
                    }
                    if (response.email) {
                        currentUser.set(consts_1.Consts.USER_EMAIL, response.email);
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
                    if (!currentUser.get(consts_1.Consts.USER_NOOFGAMES)) {
                        currentUser.set(consts_1.Consts.USER_NOOFGAMES, 0);
                    }
                    currentUser.save(null, {
                        success: function (user) {
                            successCallback();
                        },
                        error: function (user, error) {
                            errorCallback('Error saving user details', error);
                            /*console.log("User details could not be retrieved from facebook:",
                             error);
                            this.message = 'Facebook Login Error. Please try again.';
                            this.loading = false;*/
                        }
                    });
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
            error: function (user, error) {
                console.log("User cancelled the Facebook login or did not fully authorize.");
                /*this.message = 'Please ensure you authorize Activate to log you in through facebook.';
                this.loading = false;*/
                errorCallback('Please ensure you authorize Activate to log you in through facebook.', error);
            }
        });
    };
    /**
      Returns specified user's 'firstname' if exists, else name. If no user specified,
      uses current user.
    */
    UserFunctions.getUserShortName = function (parseUser) {
        if (!parseUser) {
            parseUser = Parse.User.current();
        }
        return (parseUser.get(consts_1.Consts.USER_FIRSTNAME) && parseUser.get(consts_1.Consts.USER_FIRSTNAME).length > 0) ?
            parseUser.get(consts_1.Consts.USER_FIRSTNAME) : parseUser.get(consts_1.Consts.USER_NAME);
    };
    return UserFunctions;
}());
exports.UserFunctions = UserFunctions;
