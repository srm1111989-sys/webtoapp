import Foundation
import UserNotifications

class PushNotificationManager: NSObject {

    static let shared = PushNotificationManager()

    private override init() {
        super.init()
    }

    func requestPermission(completion: @escaping (Bool) -> Void) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            DispatchQueue.main.async {
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                }
                completion(granted)
            }
        }
    }

    func handleToken(_ deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("[PushNotificationManager] Token: \(token)")
        // Forward to Firebase Messaging if available:
        // Messaging.messaging().apnsToken = deviceToken
    }

    func scheduleLocalNotification(title: String, body: String, delay: TimeInterval = 0) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let trigger = delay > 0
            ? UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
            : nil

        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }
}
