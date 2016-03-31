import {Page, NavController, IonicApp} from 'ionic-angular';
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';

@Page({
  templateUrl: 'build/pages/homepage/homepage.html'
})
export class HomePage {

  nav:any; app:any; chatMessages:any[]; replyOptions:any[];
  typing:boolean; TYPING_DELAY:number; THINKING_DELAY:number; SCROLL_DELAY:number;

	constructor(ionicApp: IonicApp, nav: NavController) {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.nav = nav;
    this.app = ionicApp;
    this.initialize();
    let dev:boolean = false;
    this.THINKING_DELAY = (dev) ? 0 : 1000;
    this.TYPING_DELAY = (dev) ? 0 : 1500;
    this.SCROLL_DELAY = (dev) ? 0 : 3000;
  }

  initialize() {
    this.typing = true;
    this.chatMessages = [];
    CloudFunctions.initConversation((data, error?) => {
      if (!error) {
        this.processReceivedMessage(data.treeObject);
      } else {
        console.log('Error', error.message);
      }
    });
  }

  setTyping(typing:boolean) {
    this.typing = typing;
    this.scrollToBottom();
  }

  processReceivedMessage(treeObject) {
    console.log('processReceivedMessage', treeObject);
    this.setTyping(false);
    let randIndex:number = 0;
    let messageObject:any = {
      message: treeObject.get(Consts.TREEOBJECTS_MESSAGES)[randIndex],
      usersMessage: false
    }
    this.chatMessages.push(messageObject);
    this.scrollToBottom();
    if (treeObject.get(Consts.TREEOBJECTS_CHILDRENCONNECTORS)[0].length > 0) {
      this.replyOptions = [];
      for (let i = 0; i < treeObject.get(Consts.TREEOBJECTS_CHILDRENCONNECTORS)[0].length; i++) {
        let replyOption:any = {
          message: treeObject.get(Consts.TREEOBJECTS_CHILDRENCONNECTORS)[0][i],
          pointer: treeObject.get(Consts.TREEOBJECTS_CHILDREN)[i]
        }
        console.log('Reply Option', treeObject, replyOption);
        this.replyOptions.push(replyOption);
      }
    } else {
      this.setTyping(true);
      setTimeout(() => {
        this.fetchAndProcessPointer(treeObject.get(Consts.TREEOBJECTS_CHILDREN)[0]);
      }, this.TYPING_DELAY);
    }
  }

  fetchAndProcessPointer(pointer:any) {
    pointer.fetch({
      success: (parseObject) => {
        this.processReceivedMessage(parseObject);
      },
      error: (parseObject, error) => {
        alert('There was a netork error, please try again later.');
      }
    });
  }

  replyWithMessage(message:any) {
    console.log('replyWithMessage', message);
    let messageObject:any = {
      message: message.message,
      usersMessage: true
    }
    this.chatMessages.push(messageObject);
    this.scrollToBottom();
    this.replyOptions = [];
    setTimeout(() => {
      this.setTyping(true);
      setTimeout(() => {
        this.fetchAndProcessPointer(message.pointer);
      }, this.TYPING_DELAY);
    }, this.THINKING_DELAY);
  }

  scrollToBottom() {
    let contentHandle:any = this.app.getComponent('homepage-content');
    if (contentHandle && contentHandle.scrollElement) {
      contentHandle.scrollTo(0, contentHandle.scrollElement.scrollHeight, this.SCROLL_DELAY);
    } else {
      console.log('Today elememt not found');
    }
  }
}
