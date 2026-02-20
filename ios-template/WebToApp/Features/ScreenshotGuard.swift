import UIKit

class ScreenshotGuard {

    /// Uses the secure UITextField trick to prevent screenshots.
    /// A secure text field's content is hidden during screen capture.
    static func protect(view: UIView) {
        let secureField = UITextField()
        secureField.isSecureTextEntry = true
        secureField.isUserInteractionEnabled = false
        secureField.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(secureField)
        view.sendSubviewToBack(secureField)

        // Position off-screen but keep it in the view hierarchy
        NSLayoutConstraint.activate([
            secureField.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            secureField.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])

        // Move the actual content into the secure field's layer
        if let secureContainer = secureField.layer.sublayers?.first?.delegate as? UIView {
            view.subviews.filter { $0 !== secureField }.forEach { subview in
                secureContainer.addSubview(subview)
            }
        }

        // Listen for screenshot notifications to show alert
        NotificationCenter.default.addObserver(
            forName: UIApplication.userDidTakeScreenshotNotification,
            object: nil,
            queue: .main
        ) { _ in
            if let topVC = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .flatMap({ $0.windows })
                .first(where: { $0.isKeyWindow })?.rootViewController {

                let alert = UIAlertController(
                    title: "Screenshot Detected",
                    message: "Screenshots are not allowed in this app.",
                    preferredStyle: .alert
                )
                alert.addAction(UIAlertAction(title: "OK", style: .default))
                topVC.present(alert, animated: true)
            }
        }
    }
}
