import Foundation
import UIKit
import WebKit

class JavaScriptBridge: NSObject, WKScriptMessageHandler {

    weak var viewController: WebViewController?

    static let messageHandlers = [
        "showToast", "vibrate", "shareText", "openExternalUrl",
        "setItem", "getItem", "removeItem", "getDeviceInfo", "scanQR"
    ]

    /// JavaScript shim injected at document start so that
    /// `window.WebToApp.showToast("msg")` works identically to Android.
    static let shimScript = """
    window.WebToApp = {
        showToast: function(msg) {
            window.webkit.messageHandlers.showToast.postMessage(msg);
        },
        vibrate: function(duration) {
            window.webkit.messageHandlers.vibrate.postMessage(duration || 100);
        },
        shareText: function(title, text) {
            window.webkit.messageHandlers.shareText.postMessage(JSON.stringify({title: title, text: text}));
        },
        openExternalUrl: function(url) {
            window.webkit.messageHandlers.openExternalUrl.postMessage(url);
        },
        setItem: function(key, value) {
            window.webkit.messageHandlers.setItem.postMessage(JSON.stringify({key: key, value: value}));
        },
        getItem: function(key) {
            window.webkit.messageHandlers.getItem.postMessage(key);
        },
        removeItem: function(key) {
            window.webkit.messageHandlers.removeItem.postMessage(key);
        },
        getDeviceInfo: function() {
            window.webkit.messageHandlers.getDeviceInfo.postMessage("");
        },
        scanQR: function() {
            window.webkit.messageHandlers.scanQR.postMessage("");
        }
    };
    """

    init(viewController: WebViewController) {
        self.viewController = viewController
        super.init()
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        switch message.name {
        case "showToast":
            showToast(message: message.body as? String ?? "")

        case "vibrate":
            let duration = message.body as? Int ?? 100
            vibrate(duration: duration)

        case "shareText":
            if let json = message.body as? String,
               let data = json.data(using: .utf8),
               let dict = try? JSONSerialization.jsonObject(with: data) as? [String: String] {
                shareText(title: dict["title"] ?? "", text: dict["text"] ?? "")
            }

        case "openExternalUrl":
            if let urlString = message.body as? String, let url = URL(string: urlString) {
                UIApplication.shared.open(url)
            }

        case "setItem":
            if let json = message.body as? String,
               let data = json.data(using: .utf8),
               let dict = try? JSONSerialization.jsonObject(with: data) as? [String: String] {
                UserDefaults.standard.set(dict["value"], forKey: "bridge_\(dict["key"] ?? "")")
            }

        case "getItem":
            if let key = message.body as? String {
                let value = UserDefaults.standard.string(forKey: "bridge_\(key)") ?? "null"
                let js = "window.WebToApp._getItemCallback && window.WebToApp._getItemCallback('\(value)');"
                viewController?.loadInWebView(url: URL(string: "javascript:\(js)")!)
            }

        case "removeItem":
            if let key = message.body as? String {
                UserDefaults.standard.removeObject(forKey: "bridge_\(key)")
            }

        case "getDeviceInfo":
            let info: [String: Any] = [
                "platform": "ios",
                "model": UIDevice.current.model,
                "systemVersion": UIDevice.current.systemVersion,
                "name": UIDevice.current.name,
            ]
            if let data = try? JSONSerialization.data(withJSONObject: info),
               let json = String(data: data, encoding: .utf8) {
                let js = "window.WebToApp._deviceInfoCallback && window.WebToApp._deviceInfoCallback(\(json));"
                viewController?.loadInWebView(url: URL(string: "javascript:\(js)")!)
            }

        case "scanQR":
            DispatchQueue.main.async { [weak self] in
                guard let vc = self?.viewController else { return }
                let scanner = QRScannerViewController()
                scanner.onScanResult = { result in
                    let js = "window.WebToApp._qrCallback && window.WebToApp._qrCallback('\(result)');"
                    vc.loadInWebView(url: URL(string: "javascript:\(js)")!)
                }
                vc.present(scanner, animated: true)
            }

        default:
            break
        }
    }

    // MARK: - Native Actions

    private func showToast(message: String) {
        DispatchQueue.main.async { [weak self] in
            guard let vc = self?.viewController else { return }
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            vc.present(alert, animated: true)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                alert.dismiss(animated: true)
            }
        }
    }

    private func vibrate(duration: Int) {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
    }

    private func shareText(title: String, text: String) {
        DispatchQueue.main.async { [weak self] in
            guard let vc = self?.viewController else { return }
            let activityVC = UIActivityViewController(activityItems: [text], applicationActivities: nil)
            vc.present(activityVC, animated: true)
        }
    }
}
