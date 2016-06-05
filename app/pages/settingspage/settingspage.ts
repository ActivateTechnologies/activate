import {Page, NavController, NavParams} from 'ionic-angular';


@Page({
  templateUrl: 'build/pages/settingspage/settingspage.html'
})
export class SettingsPage {

  /*openCamera(selection) {
    var srcType = Camera.PictureSourceType.CAMERA;
    var options = this.setOptions(srcType);
    var func = this.createNewFileEntry;
    alert(1);
    navigator.camera.getPicture((imageUri) => {
        alert(2);
        this.displayImage(imageUri);
        alert(2.5);
        // You may choose to copy the picture, save it somewhere, or upload.
        //func(imageUri);
        alert(3);
        console.log(imageUri);

    }, (error) => {
        console.debug("Unable to obtain picture: " + error, "app");

    }, options);


  }*/


  /*
  public nav; app; selectedItem; icons; items;

  constructor(nav: NavController, navParams: NavParams) {
    this.nav = nav;

    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');

    this.icons = ['flask', 'wifi', 'beer', 'football', 'basketball', 'paper-plane',
    'american-football', 'boat', 'bluetooth', 'build'];

    this.items = [];
    for(let i = 1; i < 11; i++) {
      this.items.push({
        title: 'Item ' + i,
        note: 'This is item #' + i,
        icon: this.icons[Math.floor(Math.random() * this.icons.length)]
      });
    }
  }

  itemTapped(event, item) {
    this.nav.push(SettingsPage, {
      item: item
    })
  }
  */
}
