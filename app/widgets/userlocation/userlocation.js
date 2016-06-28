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
var consts_1 = require('../../helpers/consts');
var UserLocation = (function () {
    function UserLocation() {
        this.loading = false;
    }
    UserLocation.prototype.ngOnInit = function () {
        var _this = this;
        Parse.initialize(consts_1.Consts.PARSE_APPLICATION_ID, consts_1.Consts.PARSE_JS_KEY);
        this.currentUser = Parse.User.current();
        if (!this.isReply && this.currentUser) {
            this.lastLocation = this.currentUser.get(consts_1.Consts.USER_LASTLOCATION);
        }
        if (!this.isReply) {
            setTimeout(function () {
                var arrayOfElements = document.getElementsByClassName("userlocation");
                var html = arrayOfElements[arrayOfElements.length - 1].innerHTML;
                html.replace('<!--template bindings={}-->', ' ')
                    .replace('<!--template bindings={}-->', ' '); //two occurances
                html = '<div class="userlocation">' + html + '</div>';
                _this.callbackFunction(_this.chatObject, _this.isReply, null, html, true);
            });
        }
    };
    UserLocation.prototype.getUserLocation = function () {
        var _this = this;
        if (this.isReply) {
            this.loading = true;
            navigator.geolocation.getCurrentPosition(function (position) {
                console.log('Got location', position.coords);
                if (Parse.User.current() != null) {
                    Parse.User.current().set(consts_1.Consts.USER_LASTLOCATION, new Parse.GeoPoint({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }));
                    Parse.User.current().save();
                }
                _this.loading = false;
                _this.callbackFunction(_this.chatObject, _this.isReply, null, null, true);
            }, function (error) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        console.log('Error getting location, permission denied.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.log('Error getting location, location unavailable.');
                        break;
                    case error.TIMEOUT:
                        console.log('Error getting location, request timed out.');
                        break;
                    default:
                        console.log('Error getting location, unknown error.');
                        break;
                }
                _this.loading = false;
                _this.callbackFunction(_this.chatObject, _this.isReply, null, null, true);
            });
        }
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], UserLocation.prototype, "chatObject", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], UserLocation.prototype, "options", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], UserLocation.prototype, "data", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Boolean)
    ], UserLocation.prototype, "isReply", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Function)
    ], UserLocation.prototype, "callbackFunction", void 0);
    UserLocation = __decorate([
        core_1.Component({
            selector: 'UserLocation',
            templateUrl: 'build/widgets/userlocation/userlocation.html'
        }), 
        __metadata('design:paramtypes', [])
    ], UserLocation);
    return UserLocation;
}());
exports.UserLocation = UserLocation;
