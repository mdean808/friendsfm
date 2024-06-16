//
//  AppleMusicPlugin.m
//  FriendsFM
//
//  Created by Morgan Dean on 6/14/24.
//

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(AppleMusicPlugin, "AppleMusic",
           CAP_PLUGIN_METHOD(checkPermissions, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getUserSubscriptionStatus, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getRecentlyPlayed, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(createPlaylist, CAPPluginReturnPromise);
           )
