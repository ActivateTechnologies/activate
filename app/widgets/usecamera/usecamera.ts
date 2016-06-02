import {NavController, IonicApp} from 'ionic-angular';
import {Component, Input} from '@angular/core'
import {Consts} from '../../helpers/consts';
import {CloudFunctions} from '../../helpers/cloudfunctions';
import {UserFunctions} from '../../helpers/userfunctions';

@Component({
	selector: 'UseCamera',
  templateUrl: 'build/widgets/usecamera/usecamera.html'
})
export class UseCamera {

	//The entire chat object, to pass back in callback
  @Input() chatObject:any;
  //Options to specify to the widget
  @Input() options:any;
  //Passed back in from plugin, usually specified only when isReply = false
  @Input() data:any;
  //isReply = true if this widget is in the user reply section, false if it's bot's message
  @Input() isReply:boolean;
  //Called after the widget has performed its task
  @Input() callbackFunction:Function;

	loading:boolean = false; message:string; currentUser:any; imgsrc:any;
  msDescription:string; caloriesString:string;

  ngOnInit() {
    Parse.initialize(Consts.PARSE_APPLICATION_ID, Consts.PARSE_JS_KEY);
    this.currentUser = Parse.User.current();
    console.log('useCamera widget ngOnInit');
    if (!this.isReply) {
      this.saveImage(this.data.imageUri);
      this.imgsrc = "data:image/jpeg;base64," + this.data.imageUri
    }
  }

  /*Main camera function, sets options, takes picture, and calls saveImage()
    ADDED this.setOptions & this.createNewFileEntry
    Couple of issues highlighted here like timeout: 
      https://github.com/EddyVerbruggen/cordova-plugin-actionsheet/issues/11
    Could be a permissions error???
      https://github.com/marcshilling/react-native-image-picker/issues/80
      https://forums.developer.apple.com/thread/8629
      http://codesanswer.com/question/17962-ios-8-snapshotting-a-
        view-that-has-not-been-rendered-results-in-an-empty-snapshot
      https://issues.apache.org/jira/browse/CB-8234*/
  openCamera() {
    console.log('openCamera');
    let options = {
      // Some common settings are 20, 50, and 100
      quality: 50,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      encodingType: Camera.EncodingType.JPEG,
      mediaType: Camera.MediaType.PICTURE,
      allowEdit: false,
      correctOrientation: true  //Corrects Android orientation quirks
    }

    navigator.camera.getPicture((imageUri) => {
      this.callbackFunction(this.chatObject, this.isReply, {
        imageUri: imageUri
      }, null, true);
      //this.saveImage(imageUri);
    }, (error) => {
      console.debug("Unable to obtain picture: " + error, "app");
    }, options);
  }

  //Save image and nutrition data to parse
  saveImage(imageUri) {
    //let elem:HTMLImageElement = <HTMLImageElement> document.getElementById('imageFile');
    //elem.src = "data:image/jpeg;base64," + imageUri;
    let file = new Parse.File("image.jpeg", { base64: imageUri }); //creating file
    file.save({
      success: (object) => {
        console.log('File saved successfully');
        this.produceHtmlAndCallback(object.url());
        let nutrition = new Parse.Object(Consts.NUTRITION_CLASS);
        nutrition.set(Consts.NUTRITION_USER, Parse.User.current());
        nutrition.set(Consts.NUTRITION_IMAGE, file);
        nutrition.save({
          success: (object) => {
            console.log('Got image info from apis');
            if (object.get(Consts.NUTRITION_MICROSOFT_RESPONSE)
              && object.get(Consts.NUTRITION_MICROSOFT_RESPONSE).length > 0) {
              let obj = JSON.parse(JSON.parse(object.get(Consts.NUTRITION_MICROSOFT_RESPONSE)));
              obj = (obj && obj.description) ? obj.description : null;
              obj = (obj && obj.captions && obj.captions.length > 0) ? obj.captions[0] : null;
              obj = (obj && obj.text) ? obj.text : null;
              this.msDescription = obj;
            }
            if (object.get("nutrionixInformation")
              && object.get("nutrionixInformation").length > 0) {
              this.caloriesString = JSON.parse(object.get("nutrionixInformation")).nf_calories
              + ' kcal';
            }
            //alert("MS Response:" + object.get(Consts.NUTRITION_MICROSOFT_RESPONSE));
            //let nutritionResponse = JSON.parse(object.get("nutrionixInformation"));
            //alert("Nutritionix:" + object.get(Consts.NUTRITION_NUTRITIONIX_INFO));
          },
          error: (object,error) => {
            console.log("Error saving Nutrition object: ", error.message);
          }
        });
      },
      error: (object, error) => {
        console.log('Error saving image file: ', error.message);
      }
    });
  }

  produceHtmlAndCallback(url) {
    console.log('Url: '+url);
    setTimeout(() => {
      let arrayOfElements = document.getElementsByClassName("useCamera");
      let html = arrayOfElements[arrayOfElements.length-1].innerHTML;
      html = html.replace('<!--template bindings={}-->', ' ')
        .replace('<!--template bindings={}-->', ' '); //two occurances
      html = html.replace(/src=".+"/, 'src="' + url + '"');
      html = '<div class="useCamera">' + html + '</div>';
      this.callbackFunction(this.chatObject, this.isReply, null, html, true);
    });
  }

}