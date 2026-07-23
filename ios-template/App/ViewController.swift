import UIKit
import WebKit

struct AppConfig {
    var appName = "WebToApp"
    var appUrl = "https://example.com"
    var appHost = "example.com"
    var statusBarColor = "#1E3A5F"
    var primaryColor = "#2563EB"
    var showWatermark = false
    var trialDays = 0
    var purchaseUrl = "https://websitetoapp.app/pricing"
    var customUserAgent = ""

    static func load() -> AppConfig {
        var c = AppConfig()
        guard let url = Bundle.main.url(forResource: "config", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let root = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return c }
        c.appName = root["app_name"] as? String ?? c.appName
        c.appUrl = root["app_url"] as? String ?? c.appUrl
        c.appHost = root["app_host"] as? String ?? c.appHost
        c.statusBarColor = root["status_bar_color"] as? String ?? c.statusBarColor
        c.primaryColor = root["primary_color"] as? String ?? c.primaryColor
        let features = root["features"] as? [String: Any] ?? [:]
        c.showWatermark = features["show_watermark"] as? Bool ?? false
        c.trialDays = features["trial_days"] as? Int ?? 0
        c.purchaseUrl = features["purchase_url"] as? String ?? c.purchaseUrl
        c.customUserAgent = features["custom_user_agent"] as? String ?? ""
        return c
    }
}

extension UIColor {
    convenience init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        var value: UInt64 = 0
        Scanner(string: s).scanHexInt64(&value)
        let r = CGFloat((value >> 16) & 0xFF) / 255.0
        let g = CGFloat((value >> 8) & 0xFF) / 255.0
        let b = CGFloat(value & 0xFF) / 255.0
        self.init(red: r, green: g, blue: b, alpha: 1.0)
    }
}

class ViewController: UIViewController, WKNavigationDelegate {
    let config = AppConfig.load()
    var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(hex: config.statusBarColor)

        if isTrialExpired() {
            showTrialExpiredScreen()
            return
        }
        setupWebView()
        if config.showWatermark { addWatermarkBanner() }
        if let url = URL(string: config.appUrl) {
            webView.load(URLRequest(url: url))
        }
    }

    private func setupWebView() {
        let cfg = WKWebViewConfiguration()
        cfg.allowsInlineMediaPlayback = true
        webView = WKWebView(frame: .zero, configuration: cfg)
        if !config.customUserAgent.isEmpty {
            webView.customUserAgent = config.customUserAgent
        }
        webView.navigationDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.backgroundColor = .white
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        let refresh = UIRefreshControl()
        refresh.addTarget(self, action: #selector(reloadPage), for: .valueChanged)
        webView.scrollView.refreshControl = refresh
    }

    @objc private func reloadPage() {
        webView.reload()
        webView.scrollView.refreshControl?.endRefreshing()
    }

    // External links open in the system browser; in-app navigation stays in the web view.
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.navigationType == .linkActivated,
           let url = navigationAction.request.url,
           let host = url.host,
           !host.contains(config.appHost) {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    // ── Free-plan gating (parity with the Android template) ────────────────

    private func isTrialExpired() -> Bool {
        guard config.trialDays > 0 else { return false }
        let defaults = UserDefaults.standard
        var first = defaults.double(forKey: "first_launch_ts")
        if first == 0 {
            first = Date().timeIntervalSince1970
            defaults.set(first, forKey: "first_launch_ts")
        }
        let elapsed = Date().timeIntervalSince1970 - first
        return elapsed > Double(config.trialDays) * 24 * 60 * 60
    }

    private func showTrialExpiredScreen() {
        view.backgroundColor = .white
        let title = UILabel()
        title.text = "Free trial ended"
        title.font = .boldSystemFont(ofSize: 22)
        title.textColor = UIColor(hex: "#111827")
        title.textAlignment = .center

        let message = UILabel()
        message.text = "The free trial period for this app has ended.\nUpgrade to keep using it."
        message.font = .systemFont(ofSize: 15)
        message.textColor = UIColor(hex: "#4B5563")
        message.textAlignment = .center
        message.numberOfLines = 0

        let button = UIButton(type: .system)
        button.setTitle("Upgrade now", for: .normal)
        button.titleLabel?.font = .boldSystemFont(ofSize: 16)
        button.addTarget(self, action: #selector(openPurchaseUrl), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [title, message, button])
        stack.axis = .vertical
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),
        ])
    }

    private func addWatermarkBanner() {
        let banner = UILabel()
        banner.text = "⚡ Built with websitetoapp.app"
        banner.font = .systemFont(ofSize: 12)
        banner.textColor = .white
        banner.textAlignment = .center
        banner.backgroundColor = UIColor(hex: "#111827").withAlphaComponent(0.8)
        banner.isUserInteractionEnabled = true
        banner.translatesAutoresizingMaskIntoConstraints = false
        banner.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(openPurchaseUrl)))
        view.addSubview(banner)
        NSLayoutConstraint.activate([
            banner.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            banner.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            banner.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            banner.heightAnchor.constraint(equalToConstant: 28),
        ])
    }

    @objc private func openPurchaseUrl() {
        if let url = URL(string: config.purchaseUrl) {
            UIApplication.shared.open(url)
        }
    }
}
