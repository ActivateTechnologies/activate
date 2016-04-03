import {Page, NavController, IonicApp} from 'ionic-angular';
import {Consts} from '../../helpers/consts';
import {Widget} from '../../widgets/widget';
import {CloudFunctions} from '../../helpers/cloudfunctions';
import {NgZone} from 'angular2/core';

@Page({
  templateUrl: 'build/pages/homepage/homepage.html',
  directives: [Widget]
})
export class HomePage {

  nav:any; app:any; zone:any; chatMessages:any[]; replyOptions:any[];
  typing:boolean; TYPING_DELAY:number; THINKING_DELAY:number; SCROLL_DELAY:number;
  dev:boolean = true;

  public widgetBoundCallback: Function;

	constructor(ionicApp: IonicApp, nav: NavController, zone: NgZone) {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.nav = nav;
    this.app = ionicApp;
    this.zone = zone;
    this.chatMessages = [];
    this.initialize();
    this.THINKING_DELAY = (this.dev) ? 0 : 1000;
    this.TYPING_DELAY = (this.dev) ? 0 : 1500;
    this.SCROLL_DELAY = (this.dev) ? 0 : 3000;
    this.widgetBoundCallback = this.widgetCallback.bind(this);
  }

  initialize() {
    /*if (Parse.User.current()) {
      this.navigateTreeTo('welcomeBack', false);
      return;
    }*/
    this.typing = true;
    CloudFunctions.initConversation((data, error?) => {
      if (!error) {
        this.processReceivedTreeObject(data.treeObject);
      } else {
        console.log('Error', error.message);
        alert('There was an network error, please try again.');
      }
    });
  }

  //Set state of typing, controls display of typing indicator
  setTyping(typing:boolean) {
    this.typing = typing;
    this.scrollToBottom();
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
    this.chatMessages.push(messageObject);
    this.scrollToBottom();
    if (!messageObject.isWidget) {
      if (treeObjectChildConnectors[randIndexChildren].length > 0) {
        this.replyOptions = [];
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
          this.replyOptions.push(replyOption);
        }
      } else {
        this.setTyping(true);
        setTimeout(() => {
          this.fetchAndProcessPointer(treeObject.get(Consts.TREEOBJECTS_CHILDREN)[0]);
        }, this.TYPING_DELAY);
      }
    }
  }

  //Replaces hot keywords with dynamic data
  processMessage(message:string) {
    let editedString:string = message.replace("#~user_firstname~#", 
      (Parse.User.current()) ? Parse.User.current().get(Consts.USER_FIRSTNAME) : "Stranger");
    return editedString;
  }

  //Fetches a parse object from server when given one, and calls processReceivedTreeObject
  fetchAndProcessPointer(pointer:any) {
    //console.log('Going to fetch:', pointer);
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
      this.chatMessages.push(messageObject);
      this.scrollToBottom();
      this.replyOptions = [];
      setTimeout(() => {
        this.setTyping(true);
        setTimeout(() => {
          this.fetchAndProcessPointer(option.pointer);
        }, this.TYPING_DELAY);
      }, this.THINKING_DELAY);
    }
  }

  //Passed as a callback function to widgets
  widgetCallback(option:any) {
    let messageObject:any = {
      usersMessage: true,
      isWidget: true,
      widget: option.widget
    }
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

  //Scroll to bottom of ion-content with defined scroll time animation
  scrollToBottom() {
    let contentHandle:any = this.app.getComponent('homepage-content');
    if (contentHandle && contentHandle.scrollElement) {
      contentHandle.scrollTo(0, contentHandle.scrollElement.scrollHeight, this.SCROLL_DELAY);
    } else {
      console.log('Today elememt not found');
    }
  }

  navigateTreeTo(notesString, insertLine) {
    let TreeObjects:any = Parse.Object.extend(Consts.TREEOBJECTS_CLASS);
    let query:any = new Parse.Query(TreeObjects);
    query.equalTo(Consts.TREEOBJECTS_NOTES, notesString);
    query.first({
      success: (treeObject) => {
        console.log('Got treeObject', treeObject)
        if (insertLine) {
          this.chatMessages.push({
            type:'line'
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
}
