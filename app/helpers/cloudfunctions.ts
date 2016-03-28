import {App, Config} from 'ionic-angular';
import {Consts} from './consts';

export class CloudFunctions {

  constructor() {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
  }
  
  public static initConversation(callback) {
    Parse.Cloud.run('initConversation', {}, {
      success: (data) => {
        callback(data);
      },
      error: (error) => {
        console.log('Error calling initConversations:', error.message);
        callback({}, error);
      }
    });
  }
}