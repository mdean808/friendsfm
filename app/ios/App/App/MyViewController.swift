//
//  MyViewController.swift
//  FriendsFM
//
//  Created by Morgan Dean on 6/15/24.
//

import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
    }
    
    override open func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        return CustomWKWebView(frame: frame, configuration: configuration)
    }
    
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleMusicPlugin())
    }
}
