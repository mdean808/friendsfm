//
//  OSLogger.m
//  FriendsFM
//
//  Created by Morgan Dean on 3/13/23.
//

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(OSLoggerPlugin, "OSLogger",
    CAP_PLUGIN_METHOD(log, CAPPluginReturnPromise);
)
