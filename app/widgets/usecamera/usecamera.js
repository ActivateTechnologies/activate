"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var core_2 = require('@angular/core');
var consts_1 = require('../../helpers/consts');
var cloudfunctions_1 = require('../../helpers/cloudfunctions');
var UseCamera = (function () {
    function UseCamera(zone) {
        this.loading = false;
        this.zone = zone;
    }
    UseCamera.prototype.ngOnInit = function () {
        Parse.initialize(consts_1.Consts.PARSE_APPLICATION_ID, consts_1.Consts.PARSE_JS_KEY);
        this.currentUser = Parse.User.current();
        if (!this.isReply) {
            this.loading = true;
            this.saveImage(this.data.imageUri);
            this.imgsrc = "data:image/jpeg;base64," + this.data.imageUri;
        }
    };
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
    UseCamera.prototype.openCamera = function () {
        var _this = this;
        console.log('openCamera');
        var options = {
            // Some common settings are 20, 50, and 100
            quality: 50,
            targetWidth: 1000,
            targetHeight: 1000,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            mediaType: Camera.MediaType.PICTURE,
            allowEdit: true,
            correctOrientation: true //Corrects Android orientation quirks
        };
        navigator.camera.getPicture(function (imageUri) {
            _this.callbackFunction(_this.chatObject, _this.isReply, {
                imageUri: imageUri
            }, null, true);
            //this.saveImage(imageUri);
        }, function (error) {
            console.debug("Unable to obtain picture: " + error, "app");
        }, options);
    };
    //Save image and nutrition data to parse
    UseCamera.prototype.saveImage = function (imageUri) {
        var _this = this;
        //let elem:HTMLImageElement = <HTMLImageElement> document.getElementById('imageFile');
        //elem.src = "data:image/jpeg;base64," + imageUri;
        var file = new Parse.File("image.jpeg", { base64: imageUri }); //creating file
        file.save({
            success: function (savedFile) {
                console.log('File saved successfully');
                var nutrition = new Parse.Object(consts_1.Consts.NUTRITION_CLASS);
                nutrition.set(consts_1.Consts.NUTRITION_USER, Parse.User.current());
                nutrition.set(consts_1.Consts.NUTRITION_IMAGE, file);
                nutrition.save({
                    success: function (savedNutritionObject) {
                        console.log('Nutrition object saved with id' + savedNutritionObject.id);
                        cloudfunctions_1.CloudFunctions.processNutritionImage({ objectId: savedNutritionObject.id }, function (data, error) {
                            if (!error) {
                                savedNutritionObject.fetch({
                                    success: function (nutritionObject) {
                                        var foodObject = nutritionObject.get(consts_1.Consts.NUTRITION_FOODOBJECT);
                                        if (foodObject) {
                                            foodObject.fetch({
                                                success: function (foodDatabaseObject) {
                                                    console.log('Got nutritional object with everything');
                                                    _this.zone.run(function () {
                                                        _this.loading = false;
                                                        _this.msDescription = 'Energy: ' + foodDatabaseObject.get("energy");
                                                        _this.foodObject = foodDatabaseObject;
                                                        _this.produceHtmlAndCallback(savedFile.url());
                                                    });
                                                },
                                                error: function (object, error) {
                                                    _this.loading = false;
                                                    console.log('Error getting foodDatabase object');
                                                    _this.produceHtmlAndCallback(savedFile.url());
                                                }
                                            });
                                        }
                                        else {
                                            _this.loading = false;
                                        }
                                    },
                                    error: function (object, error) {
                                        _this.loading = false;
                                        console.log('Error getting nutritional object with everything');
                                        _this.produceHtmlAndCallback(savedFile.url());
                                    }
                                });
                            }
                        });
                        /*if (savedNutritionObject.get(Consts.NUTRITION_MICROSOFT_RESPONSE)
                          && savedNutritionObject.get(Consts.NUTRITION_MICROSOFT_RESPONSE).length > 0) {
                          let obj = JSON.parse(JSON.parse(savedNutritionObject
                            .get(Consts.NUTRITION_MICROSOFT_RESPONSE)));
                          obj = (obj && obj.description) ? obj.description : null;
                          obj = (obj && obj.captions && obj.captions.length > 0) ? obj.captions[0] : null;
                          obj = (obj && obj.text) ? obj.text : null;
                          this.zone.run(() => {
                            this.loading = false;
                            this.msDescription = obj;
                          });
                        }
                        if (savedNutritionObject.get(Consts.NUTRITION_NUTRITIONIX_INFO)
                          && savedNutritionObject.get(Consts.NUTRITION_NUTRITIONIX_INFO).length > 0) {
                          this.zone.run(() => {
                            this.caloriesString = JSON.parse(JSON.parse(savedNutritionObject
                              .get(Consts.NUTRITION_NUTRITIONIX_INFO))).nf_calories + ' kcal';
                          });
                        }*/
                    },
                    error: function (savedNutritionObject, error) {
                        console.log("Error saving Nutrition object: ", error.message);
                        _this.produceHtmlAndCallback(savedFile.url());
                        _this.loading = false;
                    }
                });
            },
            error: function (savedFile, error) {
                console.log('Error saving image file: ', error.message);
            }
        });
    };
    UseCamera.prototype.produceHtmlAndCallback = function (url) {
        var _this = this;
        console.log('Url: ' + url);
        setTimeout(function () {
            var arrayOfElements = document.getElementsByClassName("useCamera");
            var html = arrayOfElements[arrayOfElements.length - 1].innerHTML;
            html = html.replace('<!--template bindings={}-->', ' ')
                .replace('<!--template bindings={}-->', ' '); //two occurances
            html = html.replace(/src=".+"/, 'src="' + url + '"');
            html = '<div class="useCamera">' + html + '</div>';
            _this.callbackFunction(_this.chatObject, _this.isReply, null, html, true);
        });
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], UseCamera.prototype, "chatObject", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], UseCamera.prototype, "options", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], UseCamera.prototype, "data", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Boolean)
    ], UseCamera.prototype, "isReply", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Function)
    ], UseCamera.prototype, "callbackFunction", void 0);
    UseCamera = __decorate([
        core_1.Component({
            selector: 'UseCamera',
            templateUrl: 'build/widgets/usecamera/usecamera.html'
        }), 
        __metadata('design:paramtypes', [core_2.NgZone])
    ], UseCamera);
    return UseCamera;
}());
exports.UseCamera = UseCamera;
