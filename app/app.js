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
/// <reference path="../typings/parse/parse.d.ts" />
/// <reference path="../typings/custom_activate/custom_activate.d.ts" />
/// <reference path="../typings/chart/chart.d.ts" />
/// <reference path="../typings/cordova/plugins/Camera.d.ts" />
var ionic_angular_1 = require('ionic-angular');
var ionic_native_1 = require('ionic-native');
var core_1 = require('@angular/core');
var homepage_1 = require('./pages/homepage/homepage');
var settingspage_1 = require('./pages/settingspage/settingspage');
var MyApp = (function () {
    function MyApp(app, platform) {
        this.app = app;
        this.platform = platform;
        this.rootPage = homepage_1.HomePage;
        this.initializeApp();
        // used for an example of ngFor and navigation
        this.pages = [
            { title: 'HopePage', component: homepage_1.HomePage },
            { title: 'Settings', component: settingspage_1.SettingsPage }
        ];
    }
    MyApp.prototype.initializeApp = function () {
        this.platform.ready().then(function () {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            ionic_native_1.StatusBar.styleDefault();
        });
    };
    MyApp.prototype.openPage = function (page) {
        // Reset the content nav to have just this page
        // we wouldn't want the back button to show in this scenario
        var nav = this.app.getComponent('nav');
        nav.setRoot(page.component);
    };
    MyApp = __decorate([
        core_1.Component({
            templateUrl: 'build/app.html',
        }), 
        __metadata('design:paramtypes', [ionic_angular_1.App, ionic_angular_1.Platform])
    ], MyApp);
    return MyApp;
}());
ionic_angular_1.ionicBootstrap(MyApp, [], {});
