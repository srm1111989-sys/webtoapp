import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = (scene as? UIWindowScene) else { return }

        let window = UIWindow(windowScene: windowScene)
        let webViewController = WebViewController()
        let navigationController = UINavigationController(rootViewController: webViewController)
        navigationController.isNavigationBarHidden = true

        window.rootViewController = navigationController
        self.window = window
        window.makeKeyAndVisible()

        // Handle deep link from launch
        if let urlContext = connectionOptions.urlContexts.first {
            handleDeepLink(urlContext.url)
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        if let url = URLContexts.first?.url {
            handleDeepLink(url)
        }
    }

    private func handleDeepLink(_ url: URL) {
        NotificationCenter.default.post(name: .deepLinkReceived, object: nil, userInfo: ["url": url])
    }
}
