//
//  AppleMusic.swift
//  FriendsFM
//
//  Created by Morgan Dean on 3/25/23.
//

import Foundation
import Capacitor
import MusicKit

@objc(AppleMusicPlugin)
public class AppleMusicPlugin: CAPPlugin {
    // PERMISSIONS
    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        let permission: String
        switch MusicAuthorization.currentStatus {
        case .authorized:
            permission = "granted"
        case .denied, .restricted:
            permission = "denied"
        case .notDetermined:
            permission = "prompt"
        @unknown default:
            permission = "prompt"
        }
        
        call.resolve(["receive": permission])
    }
    
    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        Task {
            let permission: String
            switch await MusicAuthorization.request() {
            case .authorized:
                permission = "granted"
            case .denied, .restricted:
                permission = "denied"
            case .notDetermined:
                permission = "prompt"
            @unknown default:
                permission = "prompt"
            }
            call.resolve(["receive": permission])
        }
    }
    
    // USER METHODS
    @objc func getUserSubscriptionStatus(_ call: CAPPluginCall) {
        Task {
            do {
                let res: MusicSubscription = try await MusicSubscription.current
                call.resolve(["canPlayContent": res.canPlayCatalogContent, "isSubscribed": !res.canBecomeSubscriber, "hasCloudLibraryEnabled": res.hasCloudLibraryEnabled])
            } catch {
                call.reject("Failed to get Apple Music subscription status.")
            }
        }
    }
    
    // MUSIC PLAYER METHODS
    @objc func getNowPlaying(_ call: CAPPluginCall) {
        Task {
            do {
                if ((try await MusicSubscription.current).canPlayCatalogContent) {
                    var request = MusicRecentlyPlayedRequest<Song>()
                    request.limit = 1
                    let response = try await request.response()
                    let collection = response.items
                    let item = collection.first! as Song
                    let dateFormatter = DateFormatter()
                    let intervalFormatter = DateComponentsFormatter()
                    let song: [String: String] = ["name": item.title, "artist": item.artistName, "url": item.url!.absoluteString, "length": intervalFormatter.string(from: item.duration!)!, "timestamp": dateFormatter.string(from: item.lastPlayedDate!), "id": item.id.description]
                    call.resolve(["song": song])
                } else {
                    call.reject("No Apple Music Subscription")
                }
            } catch {
                call.reject("Get Now Playing failed.")
                
            }}
    }
}
