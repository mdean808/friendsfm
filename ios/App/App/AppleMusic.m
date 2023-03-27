//
//  AppleMusic.m
//  FriendsFM
//
//  Created by Morgan Dean on 3/25/23.
//
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(AppleMusicPlugin, "AppleMusic",
           CAP_PLUGIN_METHOD(checkPermissions, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getUserSubscriptionStatus, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getNowPlaying, CAPPluginReturnPromise);
           )
