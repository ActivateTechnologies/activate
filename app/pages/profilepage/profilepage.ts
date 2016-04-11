import {Page, IonicApp, NavController, ViewController, NavParams} from 'ionic-angular';
import {Consts} from '../../helpers/consts';

@Page({
  templateUrl: 'build/pages/profilepage/profilepage.html'
})
export class ProfilePage {

  nav:any;viewController:any; user:any; currentUser:any;
  message:string; friendStatus:any; respondToRequest:boolean;
  userRelationshipNumber:number; friends:any[]; relationship:any;

  constructor(ionicApp: IonicApp, navController: NavController, navParams: NavParams,
   viewController: ViewController) {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.nav = navController;
    this.viewController = viewController;
    this.user = navParams.data;
    this.currentUser = Parse.User.current();
    this.initialize();
  }

  initialize() {
  }

}
