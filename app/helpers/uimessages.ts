import {App, Config, Alert} from 'ionic-angular';
import {Consts} from './consts';

export class UIMessages {

  constructor() {
  }

  //Shows a message to user (TODO: cordova alert)
  public static showMessage(strings, nav, callback) {
    if (!strings.message) {
      strings = {
        message: strings,
        title: ''
      }
    }
    let alertObject = Alert.create({
      title: strings.title,
      message: strings.message,
      buttons: [{
        text: 'Ok',
        handler: (data) => {
          if (callback) {
            callback();
          }
        }
      }]
    });
    nav.present(alertObject);
  }

  //Shows an unintrusive message to user (TODO: cordova alert)
  public static showSmallMessage(message, nav, callback) {
    UIMessages.showMessage(message, nav, callback);
  }

  //Shows a confirmation to the user (TODO: cordova confirmation)
  public static showConfirmation(strings, nav, okCallback, cancelCallback, okString, cancelString) {
    /*if(!buttonStrings) {
      console.log('dont have buttonStrings');
      buttonStrings = {
        okString: 'Yes',
        cancelString: 'Cancel'
    } else {
      console.log('have buttonStrings');
    }*/
    if (!okString || !cancelString) {
      okString = 'Yes';
      cancelString = 'Cancel';
    }
    let alertObject = Alert.create({
      title: strings.title,
      message: strings.message,
      buttons: [
        {
          text: cancelString,
          handler: () => {
            if(cancelCallback) {
              cancelCallback();
            }
          }
        },
        {
          text: okString,
          handler: () => {
            okCallback();
          }
        }
      ]
    });
    nav.present(alertObject);
  }
}
