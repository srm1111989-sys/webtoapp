import CoreLocation
import UIKit

class LocationManager: NSObject, CLLocationManagerDelegate {

    static let shared = LocationManager()

    private let manager = CLLocationManager()
    private var locationCallback: ((CLLocation?) -> Void)?

    private override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }

    func requestPermission() {
        manager.requestWhenInUseAuthorization()
    }

    func getCurrentLocation(completion: @escaping (CLLocation?) -> Void) {
        locationCallback = completion

        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        default:
            completion(nil)
        }
    }

    // MARK: - CLLocationManagerDelegate

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        locationCallback?(locations.last)
        locationCallback = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("[LocationManager] Error: \(error.localizedDescription)")
        locationCallback?(nil)
        locationCallback = nil
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if manager.authorizationStatus == .authorizedWhenInUse ||
           manager.authorizationStatus == .authorizedAlways {
            if locationCallback != nil {
                manager.requestLocation()
            }
        }
    }
}
