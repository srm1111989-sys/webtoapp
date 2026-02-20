import UIKit

class AdMobManager {

    static let shared = AdMobManager()
    private let config = AppConfig.load()

    private init() {}

    func initialize() {
        // GADMobileAds.sharedInstance().start(completionHandler: nil)
        print("[AdMobManager] Initialized with app ID: \(config?.admobConfig?.appId ?? "none")")
    }

    func showBannerAd(in viewController: UIViewController) {
        guard let bannerId = config?.admobConfig?.bannerId, !bannerId.isEmpty else { return }
        // let bannerView = GADBannerView(adSize: GADAdSizeBanner)
        // bannerView.adUnitID = bannerId
        // bannerView.rootViewController = viewController
        // bannerView.load(GADRequest())
        print("[AdMobManager] Banner ad requested: \(bannerId)")
    }

    func showInterstitialAd(from viewController: UIViewController) {
        guard let interstitialId = config?.admobConfig?.interstitialId, !interstitialId.isEmpty else { return }
        // GADInterstitialAd.load(withAdUnitID: interstitialId, request: GADRequest()) { ad, error in
        //     ad?.present(fromRootViewController: viewController)
        // }
        print("[AdMobManager] Interstitial ad requested: \(interstitialId)")
    }

    func showRewardedAd(from viewController: UIViewController, completion: @escaping (Bool) -> Void) {
        guard let rewardedId = config?.admobConfig?.rewardedId, !rewardedId.isEmpty else {
            completion(false)
            return
        }
        // GADRewardedAd.load(withAdUnitID: rewardedId, request: GADRequest()) { ad, error in
        //     ad?.present(fromRootViewController: viewController) {
        //         completion(true)
        //     }
        // }
        print("[AdMobManager] Rewarded ad requested: \(rewardedId)")
        completion(false)
    }
}
