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
var Mood = (function () {
    function Mood() {
        this.loading = false;
    }
    Mood.prototype.ngOnInit = function () {
        var _this = this;
        Parse.initialize(consts_1.Consts.PARSE_APPLICATION_ID, consts_1.Consts.PARSE_JS_KEY);
        this.currentUser = Parse.User.current();
        if (!this.isReply) {
            setTimeout(function () {
                var arrayOfElements = document.getElementsByClassName("mood");
                var html = arrayOfElements[arrayOfElements.length - 1].innerHTML;
                html.replace('<!--template bindings={}-->', ' ')
                    .replace('<!--template bindings={}-->', ' '); //two occurances
                html = '<div class="mood">' + html + '</div>';
                _this.callbackFunction(_this.chatObject, _this.isReply, null, html, true);
            });
        }
    };
    Mood.prototype.setMood = function () {
        var _this = this;
        var moodNumber = this.options.mood;
        if (this.isReply && Parse.User.current()) {
            this.loading = true;
            var Mood_1 = Parse.Object.extend(consts_1.Consts.MOOD_CLASS);
            var mood = new Mood_1();
            mood.set(consts_1.Consts.MOOD_USER, Parse.User.current());
            mood.set(consts_1.Consts.MOOD_HAPPINESS, moodNumber);
            mood.save({
                success: function (object) {
                    console.log('Saved your mood');
                    _this.loading = false;
                    _this.callbackFunction(_this.chatObject, _this.isReply, null, null, true);
                },
                error: function (object, error) {
                    console.log('Error saving mood:', error.message);
                    alert('Error saving your mood :(');
                }
            });
        }
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], Mood.prototype, "chatObject", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], Mood.prototype, "options", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], Mood.prototype, "data", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Boolean)
    ], Mood.prototype, "isReply", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Function)
    ], Mood.prototype, "callbackFunction", void 0);
    Mood = __decorate([
        core_1.Component({
            selector: 'Mood',
            templateUrl: 'build/widgets/mood/mood.html'
        }), 
        __metadata('design:paramtypes', [])
    ], Mood);
    return Mood;
}());
exports.Mood = Mood;
