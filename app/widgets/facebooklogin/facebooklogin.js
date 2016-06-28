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
var userfunctions_1 = require('../../helpers/userfunctions');
var FacebookLogin = (function () {
    function FacebookLogin() {
        this.loading = false;
    }
    FacebookLogin.prototype.ngOnInit = function () {
        var _this = this;
        Parse.initialize(consts_1.Consts.PARSE_APPLICATION_ID, consts_1.Consts.PARSE_JS_KEY);
        this.currentUser = Parse.User.current();
        //console.log('facebooklogin widget ngOnInit');
        if (!this.isReply) {
            setTimeout(function () {
                var arrayOfElements = document.getElementsByClassName("facebookLogin");
                var html = arrayOfElements[arrayOfElements.length - 1].innerHTML;
                html.replace('<!--template bindings={}-->', ' ')
                    .replace('<!--template bindings={}-->', ' '); //two occurances
                html = '<div class="facebookLogin">' + html + '</div>';
                _this.callbackFunction(_this.chatObject, _this.isReply, null, html, true);
            });
        }
    };
    FacebookLogin.prototype.login = function () {
        var _this = this;
        if (this.isReply) {
            if (this.currentUser) {
                Parse.User.logOut();
            }
            this.loading = true;
            userfunctions_1.UserFunctions.facebookLogin(function () {
                _this.loading = false;
                _this.callbackFunction(_this.chatObject, _this.isReply, null, null, true);
            }, function (message, error) {
                console.log('Error logging through facebook:', message);
                alert('Error' + message);
            });
        }
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], FacebookLogin.prototype, "chatObject", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], FacebookLogin.prototype, "options", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], FacebookLogin.prototype, "data", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Boolean)
    ], FacebookLogin.prototype, "isReply", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Function)
    ], FacebookLogin.prototype, "callbackFunction", void 0);
    FacebookLogin = __decorate([
        core_1.Component({
            selector: 'FacebookLogin',
            templateUrl: 'build/widgets/facebooklogin/facebooklogin.html'
        }), 
        __metadata('design:paramtypes', [])
    ], FacebookLogin);
    return FacebookLogin;
}());
exports.FacebookLogin = FacebookLogin;
