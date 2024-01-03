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
        let message = call.getString("message") ?? ""
        let level = call.getString("level") ?? "log"
        let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "os_logger")
        switch (level) {
        case "debug":
            logger.debug("JS Log: \(message)")
            break
        case "info":
            logger.info("JS Log: \(message)")
            break
        case "error":
            logger.error("JS Log: \(message)")
            break
        default:
            logger.log("JS Log: \(message)")
            break
        }
        call.resolve(["message": message])
    }
}
