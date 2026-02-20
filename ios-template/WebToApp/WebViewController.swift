import UIKit
import WebKit

class WebViewController: UIViewController {

    private var webView: WKWebView!
    private let config = AppConfig.load()
    private var bridge: JavaScriptBridge?

    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        setupScreenshotGuard()
        loadURL()
        observeDeepLinks()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }

    // MARK: - WebView Setup

    private func setupWebView() {
        let webConfig = WKWebViewConfiguration()
        webConfig.allowsInlineMediaPlayback = true
        webConfig.mediaTypesRequiringUserActionForPlayback = []

        // Set up JavaScript bridge
        if config?.features.jsBridge == true {
            let contentController = webConfig.userContentController
            bridge = JavaScriptBridge(viewController: self)

            // Register message handlers
            for handler in JavaScriptBridge.messageHandlers {
                contentController.add(bridge!, name: handler)
            }

            // Inject compatibility shim so window.WebToApp.showToast() works
            let shimScript = WKUserScript(
                source: JavaScriptBridge.shimScript,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
            contentController.addUserScript(shimScript)
        }

        // Custom user agent
        if let ua = config?.features.customUserAgent, !ua.isEmpty {
            webConfig.applicationNameForUserAgent = ua
        }

        webView = WKWebView(frame: .zero, configuration: webConfig)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        // Pull-to-refresh
        let refreshControl = UIRefreshControl()
        refreshControl.addTarget(self, action: #selector(handleRefresh), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl
    }

    private func loadURL() {
        guard let urlString = config?.appUrl, let url = URL(string: urlString) else { return }
        webView.load(URLRequest(url: url))
    }

    @objc private func handleRefresh(_ sender: UIRefreshControl) {
        webView.reload()
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            sender.endRefreshing()
        }
    }

    // MARK: - Deep Links

    private func observeDeepLinks() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDeepLink(_:)),
            name: .deepLinkReceived,
            object: nil
        )
    }

    @objc private func handleDeepLink(_ notification: Notification) {
        guard let url = notification.userInfo?["url"] as? URL else { return }
        webView.load(URLRequest(url: url))
    }

    // MARK: - Screenshot Prevention

    private func setupScreenshotGuard() {
        guard config?.features.screenshotPrevention == true else { return }
        ScreenshotGuard.protect(view: view)
    }

    // MARK: - Navigation

    func loadInWebView(url: URL) {
        webView.load(URLRequest(url: url))
    }
}

// MARK: - WKNavigationDelegate

extension WebViewController: WKNavigationDelegate {
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }

        let host = url.host ?? ""
        let appHost = config?.appHost ?? ""

        // Allow navigation within the app host
        if host == appHost || host.isEmpty || url.scheme == "about" {
            decisionHandler(.allow)
            return
        }

        // Open external URLs in Safari
        if navigationAction.navigationType == .linkActivated {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }

        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Apply status bar color
        if let color = config?.statusBarUIColor {
            view.backgroundColor = color
        }
    }
}

// MARK: - WKUIDelegate

extension WebViewController: WKUIDelegate {
    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        // Handle target="_blank" links
        if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
            webView.load(URLRequest(url: url))
        }
        return nil
    }

    // File upload support
    func webView(
        _ webView: WKWebView,
        runOpenPanelWith parameters: WKOpenPanelParameters,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping ([URL]?) -> Void
    ) {
        FileUploadHelper.presentPicker(from: self, allowsMultipleSelection: parameters.allowsMultipleSelection) { urls in
            completionHandler(urls)
        }
    }

    // JavaScript alert
    func webView(
        _ webView: WKWebView,
        runJavaScriptAlertPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping () -> Void
    ) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }

    // JavaScript confirm
    func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }

    // JavaScript prompt
    func webView(
        _ webView: WKWebView,
        runJavaScriptTextInputPanelWithPrompt prompt: String,
        defaultText: String?,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (String?) -> Void
    ) {
        let alert = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        alert.addTextField { textField in
            textField.text = defaultText
        }
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(nil) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler(alert.textFields?.first?.text)
        })
        present(alert, animated: true)
    }
}
