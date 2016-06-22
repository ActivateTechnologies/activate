import {Page, NavController, Content, IonicApp, Platform, Modal, ViewController}
 from 'ionic-angular';
import {ViewChild} from '@angular/core';
import {Consts} from '../../helpers/consts';
import {Widget} from '../../widgets/widget';
import {CloudFunctions} from '../../helpers/cloudfunctions';
import {NgZone} from '@angular/core';
import {ProfilePage} from '../profilepage/profilepage';
import {Camera} from 'ionic-native';
import {BackgroundGeolocation} from 'ionic-native';
import {Http, Headers} from '@angular/http';
//import {File} from 'ionic-native';

@Page({
  templateUrl: 'build/pages/homepage/homepage.html',
  directives: [Widget]
})
export class HomePage {
  @ViewChild(Content) content: Content;
  nav:any; app:any; zone:any; http:any; platform:any; chatMessages:any[]; replyOptions:any[];
  typing:boolean; TYPING_DELAY:number; THINKING_DELAY:number; SCROLL_DELAY:number;
  dev:boolean = true; loadingMessages:boolean = true; recentMessagesTemp:any[];
  // recentMessagesTemp holds all the messages recently shown to user before he has replied,
  // these will only be saved once the user has made a selection. Also used to hold messages
  // before user has signed in.

  public widgetBoundCallback: Function;

	constructor(nav: NavController, app: IonicApp, zone: NgZone, platform: Platform,
    http: Http) {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.nav = nav;
    this.app = app;
    this.zone = zone;
    this.http = http;
    this.platform = platform;
    this.chatMessages = [];
    this.recentMessagesTemp = [];
    this.initialize();
    this.THINKING_DELAY = (this.dev) ? 0 : 1000;
    this.TYPING_DELAY = (this.dev) ? 500 : 1500;
    this.SCROLL_DELAY = (this.dev) ? 0 : 3000;
    this.widgetBoundCallback = this.widgetCallback.bind(this);
  }

  initialize() {
    console.log('About to try location');
    //this.tryLocation();
    this.startLocationTracking();
    if (Parse.User.current()) {
      this.retrieveArchieveMessages();
      //this.navigateTreeTo('start', false); //healthApi
      return;
    } else {
      this.loadingMessages = false;
    }
    this.typing = true;
    CloudFunctions.initConversation((data, error?) => {
      if (!error) {
        this.processReceivedTreeObject(data.treeObject);
      } else {
        console.log('Error', error.message);
        alert('There was a network error, please try again.');
      }
    });
  }

  onPageDidEnter() {
    //this.openUserProfile();
  }

  //Set state of typing, controls display of typing indicator
  setTyping(typing:boolean) {
    this.zone.run(() => {
      this.typing = typing;
    });
    this.scrollToBottom();
  }

  //Retrieve past user messages
  retrieveArchieveMessages() {
    this.loadingMessages = true;
    let Messages = Parse.Object.extend("Messages");
    let query = new Parse.Query(Messages);
    query.equalTo(Consts.MESSAGES_USER, Parse.User.current());
    query.descending(Consts.MESSAGES_TIMESTAMP);
    query.limit(100);
    query.find({
      success: (parseObjects) => {
        for (let i = 0; i < parseObjects.length; i++) {
          let messageObject:any = {};
          if (parseObjects[i].get(Consts.MESSAGES_MESSAGE).widgetName) {
            messageObject.isWidget = true;
            messageObject.widget = parseObjects[i].get(Consts.MESSAGES_MESSAGE);
          } else {
            messageObject.isWidget = false;
            messageObject.message = parseObjects[i].get(Consts.MESSAGES_MESSAGE);
          }
          if (parseObjects[i].get(Consts.MESSAGES_TYPE)) {
            messageObject.type = parseObjects[i].get(Consts.MESSAGES_TYPE);
          }
          messageObject.usersMessage = parseObjects[i].get(Consts.MESSAGES_USERSMESSAGE);
          //this.chatMessages.push(messageObject);
          this.chatMessages.splice(0, 0, messageObject);
        }
        this.scrollToBottom();
        this.loadingMessages = false;
        this.navigateTreeTo('loggedIn', true);
      },
      error: (error) => {
        console.log('Error retrieving past messages:', error);
      }
    })
  }

  //Called when a treeObject is received
  processReceivedTreeObject(treeObject) {
    //console.log('processReceivedTreeObject', treeObject);
    this.setTyping(false);

    let treeObjectMessages:any[] = treeObject.get(Consts.TREEOBJECTS_MESSAGES);
    let treeObjectChildConnectors:any[]
      = treeObject.get(Consts.TREEOBJECTS_CHILDRENCONNECTORS);
    let randIndexMessages:number = Math.floor(Math.random()*treeObjectMessages.length);
    let randIndexChildren:number
      = Math.floor(Math.random()*treeObjectChildConnectors.length);
    let messageObject:any = {
      usersMessage: false
    }
    if (treeObjectMessages.length == 1 && treeObjectMessages[0].widgetName) {
      messageObject.isWidget = true;
      messageObject.widget = treeObjectMessages[0];
    } else {
      messageObject.isWidget = false;
      messageObject.message = this.processMessage(treeObjectMessages[randIndexMessages]);
    }
    //If it is widget, the widget callback will save the message
    if (!messageObject.isWidget) {
      this.saveMessageToParse(messageObject, treeObject, false);
    }
    this.zone.run(() => {
      this.chatMessages.push(messageObject);
    });
    this.scrollToBottom();
    if (treeObjectChildConnectors[randIndexChildren].length > 0) {
      this.zone.run(() => {
        this.replyOptions = [];
      });
      for (let i = 0; i < treeObjectChildConnectors[0].length; i++) {
        let replyOption:any = {
          pointer: treeObject.get(Consts.TREEOBJECTS_CHILDREN)[i]
        }
        if (treeObjectChildConnectors[randIndexChildren][i].widgetName) {
          replyOption.isWidget = true;
          replyOption.widget = treeObjectChildConnectors[randIndexChildren][i];
        } else {
          replyOption.isWidget = false;
          replyOption.message = treeObjectChildConnectors[randIndexChildren][i];
        }
        //console.log('Reply Option', treeObject, replyOption);
        this.zone.run(() => {
          this.replyOptions.push(replyOption);
        });
      }
    } else {
      this.setTyping(true);
      setTimeout(() => {
        this.fetchAndProcessPointer(treeObject.get(Consts.TREEOBJECTS_CHILDREN)[0]);
      }, this.TYPING_DELAY);
    }
  }

  saveMessageToParse(messageObject:any, treeObject:any, usersMessage:boolean) {
    let Message = Parse.Object.extend(Consts.MESSAGES_CLASS);
    let message = new Message();
    message.set(Consts.MESSAGES_USERSMESSAGE, usersMessage);
    message.set(Consts.MESSAGES_TIMESTAMP, new Date());
    if (messageObject.type) {
      message.set(Consts.MESSAGES_TYPE, messageObject.type);
    }
    if (treeObject) {
      message.set(Consts.MESSAGES_TREEOBJECT, treeObject);
    }
    if (messageObject.message) {
      message.set(Consts.MESSAGES_MESSAGE, messageObject.message);
    } else {
      console.log('No message found');
    }
    if (Parse.User.current() == null) {
      this.recentMessagesTemp.push(message);
      return;
    }
    if (!usersMessage) {
      this.recentMessagesTemp.push(message);
    } else if (this.recentMessagesTemp.length == 0) {
      message.set(Consts.MESSAGES_USER, Parse.User.current());
      message.save();
    } else {
      this.recentMessagesTemp.push(message);
      for (let i = 0; i < this.recentMessagesTemp.length; i++) {
        this.recentMessagesTemp[i].set(Consts.MESSAGES_USER, Parse.User.current());
      }
      Parse.Object.saveAll(this.recentMessagesTemp, {
        success: (objects) => {
          this.recentMessagesTemp = [];
          message.save();
        },
        error: (error) => {
          console.log('Error saving recent messages:', error.message);
        }
      });
    }
  }

  //Replaces hot keywords with dynamic data
  processMessage(message:string) {
    let editedString:string = message;
    editedString = editedString.replace("#~user_firstname~#", 
      (Parse.User.current()) ? Parse.User.current().get(Consts.USER_FIRSTNAME) : "Stranger");
    editedString = editedString.replace("#~nativeHealthApi~#", 
      (this.platform.is('android')) ? "Google Fit" : 
        (this.platform.is('ios')) ? "HealthKit" : "Health Api");
    return editedString;
  }

  //Fetches a parse object from server when given one, and calls processReceivedTreeObject
  fetchAndProcessPointer(pointer:any) {
    //console.log('Going to fetch:', pointer);
    if (pointer == null || typeof pointer.fetch !== "function") {
      //console.log('Pointer is null, likely end of tree.');
      /*this.chatMessages.push({
        message: "- End of tree -",
        usersMessage: false,
        isWidget: false
      });*/
      this.setTyping(false);
      return;
    }
    pointer.fetch({
      success: (parseObject) => {
        this.processReceivedTreeObject(parseObject);
      },
      error: (parseObject, error) => {
        alert('There was a network error, please try again later.');
      }
    });
  }

  //Adds user choice to conversation and calls to fetch next treeObject
  replyWithMessage(option:any) {
    //console.log('replyWithMessage', message);
    if (!option.isWidget) {
      let messageObject:any = {
        message: option.message,
        usersMessage: true,
        isWidget: false
      }
      this.saveMessageToParse(messageObject, option.pointer, true);
      this.zone.run(() => {
        this.chatMessages.push(messageObject);
      });
      this.scrollToBottom();
      this.zone.run(() => {
        this.replyOptions = [];
      });
      setTimeout(() => {
        this.setTyping(true);
        setTimeout(() => {
          this.fetchAndProcessPointer(option.pointer);
        }, this.TYPING_DELAY);
      }, this.THINKING_DELAY);
    }
  }

  /*Passed as a callback function to widgets that were in replies
    option: option object of selected reply
    isReply: is this call from reply section
    data: any data to be saved along with this message in chatMessages
    html: static html version of widget's current state to be archived on parse*/
  widgetCallback(option:any, isReply:boolean, data:any, html:string, usersMessage:boolean) {
    //console.log('data', data);
    let messageObject:any = {
      usersMessage: usersMessage,
      isWidget: true,
      widget: option.widget
    }
    if (data) {
      messageObject.data = data;
    }
    if (html) {
      messageObject.message = html;
    }
    if (isReply) {
      this.zone.run(() => {
        this.chatMessages.push(messageObject);
        this.scrollToBottom();
        this.replyOptions = [];
      });
      setTimeout(() => {
        this.setTyping(true);
        setTimeout(() => {
          this.zone.run(() => {
            this.fetchAndProcessPointer(option.pointer);
          });
        }, this.TYPING_DELAY);
      }, this.THINKING_DELAY);
    } 
    //Not from reply section, only being called to save widget's 
    //current state for archiving
    else { 
      this.saveMessageToParse(messageObject, option.pointer, usersMessage);
    }
  }

  //Scroll to bottom of ion-content with defined scroll time animation
  scrollToBottom() {
    setTimeout(() => {
      this.content.scrollToBottom();
    }, 200);
  }

  navigateTreeTo(notesString, insertDate) {
    let TreeObjects:any = Parse.Object.extend(Consts.TREEOBJECTS_CLASS);
    let query:any = new Parse.Query(TreeObjects);
    query.equalTo(Consts.TREEOBJECTS_NOTES, notesString);
    query.first({
      success: (treeObject) => {
        //console.log('Got treeObject', treeObject)
        if (insertDate) {
          this.zone.run(() => {
            let now = new Date();
            let months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
              "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
            let hour = (now.getHours() < 10) ? '0' + now.getHours() : now.getHours();
            let min = (now.getMinutes() < 10) ? '0' + now.getMinutes() : now.getMinutes();
            let dateString = now.getDay() + " " + months[now.getMonth()] + ", "
              + hour + ":" + min;
            let messageObject = {
              type:'dateMessage',
              date: now,
              message: dateString
            };
            this.chatMessages.push(messageObject);
            this.saveMessageToParse(messageObject, null, false);
          });
        }
        setTimeout(() => {
          this.setTyping(true);
          setTimeout(() => {
            this.processReceivedTreeObject(treeObject);
          }, this.TYPING_DELAY);
        }, 0); //this.THINKING_DELAY
      },
      error: (error) => {
        console.log("Error getting root TreeObject", error.message);
        alert('There was an network error, please try again.');
      }
    });
  }

  openUserProfile() {
    /*
      CloudFunctions.testGoogle((data, error) => {
        console.log('Google test data: ', data);
      });
    */
    if (Parse.User.current() != null) {
      this.nav.push(ProfilePage);
    }
  }

  /*imageRecognition() {
    var googleInfoString = 'P RRP 99p RRP\nLipton\nPEACH\nICE TEA\n';

    var googleInfoStringLowercase = googleInfoString.toLowerCase();

    var googleInfoStringFlattened = googleInfoStringLowercase.replace(/[^\x20-\x7E]/gmi, " ");

    var googleInfoArray = googleInfoStringFlattened.split(" ");

    var uselessInfo = ['99p','p','rrp','difference','taste','refrigerated', '£'];

    var i = 0;

    for (i = 0; i < uselessInfo.length; i++) {
      var y = googleInfoArray.includes(uselessInfo[i]);
      
      if (y) {
        //https://davidwalsh.name/remove-item-array-javascript
        console.log(i);
        var indexOfUseless = googleInfoArray.indexOf(uselessInfo[i])
        console.log("Index of useless: "+ indexOfUseless);

        for(var x = googleInfoArray.length-1; x >= 0; x--){
          if (googleInfoArray[x] === uselessInfo[i]) googleInfoArray.splice(x, 1);
        }
      }  
    }

    var finalArray = [];
    for (var i = 0; i < googleInfoArray.length; i++) {
      googleInfoArray[i] = googleInfoArray[i].trim();
      if (googleInfoArray[i].length > 0) {
        finalArray.push(googleInfoArray[i]);
      }
    }
    
    return finalArray;
  }*/

  startLocationTracking() {
    backgroundGeolocation.stop();
    let config = {
      desiredAccuracy: 0,
      stationaryRadius: 10,
      distanceFilter: 2,
      debug: true,
      interval: 2*1000,
      stopOnTerminate: false,
      activityType: "Fitness"
    };
    backgroundGeolocation.configure((location) => {}, (error) => {}, config);
    backgroundGeolocation.start();
    backgroundGeolocation.getLocations((locations) => {
      console.log('Got stored locations, count: ', locations.length);
      if (locations.length > 0) {
        CloudFunctions.saveLocationData(locations, (data, error) => {
          if (!error) {
            /*backgroundGeolocation.deleteAllLocations(() => {}, (error) => {
              console.log('Error deleting locations');
            });*/
          }
        });
      }
        
    }, () => {
      console.log('Error getting locations');
    })
  }

  tryLocation () {
 
    console.log('Inside tryLocation');
    // BackgroundGeolocation is highly configurable. See platform specific configuration options
    let config = {
      desiredAccuracy: 10,
      stationaryRadius: 0.1,
      distanceFilter: 30,
      debug: true,
      stopOnTerminate: false,
      url: "https://api.parse.com/1/functions/logLocation",
      httpHeaders: {
        "X-Parse-Application-Id": "v3NS4xBCONYmIqqtwASz1e3TuX9p1WDZod6dUxA7",
        "X-Parse-REST-API-Key": "b5DwYpHR3Rn9f55Id7lXaKpRdGgEFvgRpfNNLE3q"/*,
        "Content-Type": "application/json"*/
      }
    };

    var callbackFn = function(location) {
      console.log('[js] BackgroundGeolocation callback:  ' + location.latitude + ',' + location.longitude);
      /*var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function () {
        console.log(xmlhttp.readyState + " ~ " + xmlhttp.status + " ~ " + xmlhttp.responseText);
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
          console.log("Successfully sent");
        }
      }
      xmlhttp.open("POST", "https://api.parse.com/1/functions/logLocation", true);
      xmlhttp.setRequestHeader("X-Parse-Application-Id", "v3NS4xBCONYmIqqtwASz1e3TuX9p1WDZod6dUxA7"); 
      //xmlhttp.setRequestHeader("X-Parse-Client-Key", "YB0Po25rU80Z8PpzPQyYCVEzqECZnFQv55lZQakw"); 
      xmlhttp.setRequestHeader("X-Parse-REST-API-Key", "b5DwYpHR3Rn9f55Id7lXaKpRdGgEFvgRpfNNLE3q"); 
      //xmlhttp.setRequestHeader("Content-type", "application/json;"); 
      xmlhttp.send(JSON.stringify({
        lat: location.latitude,
        lng: location.longitude,
        time: new Date().getTime()
      }));*/
      
      backgroundGeolocation.finish();
    };
 
    var failureFn = function(error) {
      console.log('BackgroundGeolocation error');
    };
 
    // BackgroundGeolocation is highly configurable. See platform specific configuration options 
    backgroundGeolocation.configure(callbackFn, failureFn, config);

    backgroundGeolocation.getLocations((locations) => {
      console.log('Got stored locations', locations);
    }, () => {
      console.log('Error getting locations');
    })
 
    // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app. 
    backgroundGeolocation.stop();
    backgroundGeolocation.start();
  }

}
