import Foundation
import UIKit

struct AppConfig: Codable {
    let appName: String
    let appUrl: String
    let appHost: String
    let primaryColor: String
    let secondaryColor: String
    let statusBarColor: String
    let features: Features
    let admobConfig: AdmobConfig?
    let navigationItems: [NavigationItem]?

    enum CodingKeys: String, CodingKey {
        case appName = "app_name"
        case appUrl = "app_url"
        case appHost = "app_host"
        case primaryColor = "primary_color"
        case secondaryColor = "secondary_color"
        case statusBarColor = "status_bar_color"
        case features
        case admobConfig = "admob_config"
        case navigationItems = "navigation_items"
    }

    struct Features: Codable {
        let biometricAuth: Bool
        let navigationType: String
        let pushNotifications: Bool
        let admob: Bool
        let deepLinking: Bool
        let offlineMode: Bool
        let screenshotPrevention: Bool
        let customUserAgent: String
        let fileUpload: Bool
        let locationServices: Bool
        let cameraAccess: Bool
        let qrScanner: Bool
        let jsBridge: Bool

        enum CodingKeys: String, CodingKey {
            case biometricAuth = "biometric_auth"
            case navigationType = "navigation_type"
            case pushNotifications = "push_notifications"
            case admob
            case deepLinking = "deep_linking"
            case offlineMode = "offline_mode"
            case screenshotPrevention = "screenshot_prevention"
            case customUserAgent = "custom_user_agent"
            case fileUpload = "file_upload"
            case locationServices = "location_services"
            case cameraAccess = "camera_access"
            case qrScanner = "qr_scanner"
            case jsBridge = "js_bridge"
        }
    }

    struct AdmobConfig: Codable {
        let appId: String
        let bannerId: String
        let interstitialId: String
        let rewardedId: String

        enum CodingKeys: String, CodingKey {
            case appId = "app_id"
            case bannerId = "banner_id"
            case interstitialId = "interstitial_id"
            case rewardedId = "rewarded_id"
        }
    }

    struct NavigationItem: Codable {
        let label: String
        let url: String
        let icon: String?
    }

    static func load() -> AppConfig? {
        guard let url = Bundle.main.url(forResource: "config", withExtension: "json"),
              let data = try? Data(contentsOf: url) else {
            return nil
        }
        return try? JSONDecoder().decode(AppConfig.self, from: data)
    }

    var primaryUIColor: UIColor {
        UIColor(hex: primaryColor) ?? .systemBlue
    }

    var secondaryUIColor: UIColor {
        UIColor(hex: secondaryColor) ?? .systemBlue
    }

    var statusBarUIColor: UIColor {
        UIColor(hex: statusBarColor) ?? .systemBlue
    }
}

extension UIColor {
    convenience init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        guard hexSanitized.count == 6 else { return nil }

        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)

        self.init(
            red: CGFloat((rgb & 0xFF0000) >> 16) / 255.0,
            green: CGFloat((rgb & 0x00FF00) >> 8) / 255.0,
            blue: CGFloat(rgb & 0x0000FF) / 255.0,
            alpha: 1.0
        )
    }
}
