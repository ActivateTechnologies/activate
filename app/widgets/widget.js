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
var facebooklogin_1 = require('./facebooklogin/facebooklogin');
var userlocation_1 = require('./userlocation/userlocation');
var health_1 = require('./health/health');
var usecamera_1 = require('./usecamera/usecamera');
var mood_1 = require('./mood/mood');
var Widget = (function () {
    function Widget() {
    }
    Widget.prototype.ngOnInit = function () {
        this.widget = this.chatObject.widget;
        /*if (this.widget.options) {
            this.options = this.widget.options;
        }
        if (this.chatObject.data) {
            this.data = this.chatObject.data
        }*/
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], Widget.prototype, "chatObject", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Boolean)
    ], Widget.prototype, "isReply", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Function)
    ], Widget.prototype, "callbackFunction", void 0);
    Widget = __decorate([
        core_1.Component({
            selector: 'Widget',
            templateUrl: 'build/widgets/widget.html',
            directives: [facebooklogin_1.FacebookLogin, userlocation_1.UserLocation, health_1.Health, usecamera_1.UseCamera, mood_1.Mood]
        }), 
        __metadata('design:paramtypes', [])
    ], Widget);
    return Widget;
}());
exports.Widget = Widget;
