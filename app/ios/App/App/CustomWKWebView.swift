//
//  CustomWKWebView.swift
//  FriendsFM
//
//  Created by Morgan Dean on 6/23/24.
//

import Foundation
import WebKit
class CustomWKWebView : WKWebView {
    override func reload() -> WKNavigation? {
        if let url = self.url, let scheme = url.scheme, let host = url.host {
            let origin = scheme + "://" + host
            if let originURL = URL(string: origin) {
                let request = URLRequest(url: originURL)
                return self.load(request)
            }
        } else {
            return super.reload()
        }
        return super.reload()
    }
}
