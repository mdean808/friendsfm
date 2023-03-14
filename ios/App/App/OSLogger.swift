//
//  OSLogger.swift
//  FriendsFM
//
//  Created by Morgan Dean on 3/13/23.
//

import Foundation
import os
import Capacitor

@objc(OSLoggerPlugin)
public class OSLoggerPlugin: CAPPlugin {
    @objc func log(_ call: CAPPluginCall) {
        let value = call.getString("message") ?? ""
        let level = call.getString("level") ?? "log"
        print("OSLoggerPlusinLog: \(value)")
        let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "os_logger")
        logger.log("JS Log: \(value)")
        call.resolve(["message": value])
    }
}
