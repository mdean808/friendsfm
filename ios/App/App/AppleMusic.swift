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
    @objc public func getUserSubscriptionStatus(_ call: CAPPluginCall) {
        Task {
            do {
                let res: MusicSubscription = try await MusicSubscription.current
                call.resolve(["canPlayContent": res.canPlayCatalogContent, "isSubscribed": !res.canBecomeSubscriber, "hasCloudLibraryEnabled": res.hasCloudLibraryEnabled])
            } catch {
                call.reject("Failed to get Apple Music subscription status.")
            }
        }
    }

    @objc public func createPlaylist(_ call: CAPPluginCall) {
        Task {
            print("creating playlist...")
            let name = call.getString("name")
            do {
              if ((try await MusicSubscription.current).canPlayCatalogContent) {
            print("creating playlist with valid subscription")
                  let library = MusicLibrary.shared
                  let res = try await library.createPlaylist(name: name ?? "New Playlist", description: "rotating playlist of your friend's friendsfm submissions")
                  print("playlist created \(res.id)")
                  call.resolve(["id": res.id])
              } else {
                  call.reject("No Apple Music Subscription")
              }
            } catch {
              call.reject("Create Playlist Failed: \(error)")
            }
        }
    }
    
    // MUSIC PLAYER METHODS
    @objc func getRecentlyPlayed(_ call: CAPPluginCall) {
        Task {
            do {
                if ((try await MusicSubscription.current).canPlayCatalogContent) {
                    var request = MusicRecentlyPlayedRequest<Song>()
                    request.limit = 1
                    let response = try await request.response()
                    let collection = response.items
                    if ((collection.first) != nil){
                        let item = collection.first! as Song
                        let dateFormatter = DateFormatter()
                        let intervalFormatter = DateComponentsFormatter()
                        var url = item.url
                        if (url == nil) {
                            url = URL(string: "https://music.apple.com")
                        }
                        let song: [String: String] = [
                            "name": item.title,
                            "artist": item.artistName,
                            "url": url!.absoluteString,
                            "length": intervalFormatter.string(from: item.duration!)!,
                            "timestamp": dateFormatter.string(from: item.lastPlayedDate ?? Date()),
                            "durationElapsed": "00:30",
                            "albumArtwork": item.artwork?.url(width: 257, height: 256)?.absoluteString ?? "",
                            "genre": item.albums?.first?.genres?.first?.name ?? "",
                            "id": item.id.description]
                        call.resolve(["song": song])
                    } else {
                        call.reject("No songs recently played.")
                    }
                } else {
                    call.reject("No Apple Music Subscription.")
                }
            } catch {
                call.reject("Get Recently Played songs failed: \(error).")
                
            }}
    }
}
