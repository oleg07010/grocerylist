import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    // The window and the links live in SceneDelegate.swift: under the UIScene life cycle (required since iOS 27 for
    // apps built with the iOS 27 SDK) UIKit calls the scene delegate for them, never these app-delegate methods.
}
