import UIKit
import Capacitor

// The app's one window scene. Since iOS 27, UIKit refuses to launch an app built with the iOS 27 SDK that does not
// use the scene life cycle ("UIScene life cycle is required for apps built with this SDK" — Apple TN3187; TestFlight
// build 1.2.0 (7) closed the instant it was tapped). Capacitor 7's template has no scene delegate, so this one
// stands in. UIKit creates the window and loads Main.storyboard's CAPBridgeViewController itself (Info.plist
// UISceneStoryboardFile); this class only hands links to Capacitor, as the app delegate did before scenes.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // A link or activity that opened the app cold arrives here, not in the callbacks below.
        if !connectionOptions.urlContexts.isEmpty {
            self.scene(scene, openURLContexts: connectionOptions.urlContexts)
        }
        for userActivity in connectionOptions.userActivities {
            self.scene(scene, continue: userActivity)
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            var options: [UIApplication.OpenURLOptionsKey: Any] = [.openInPlace: context.options.openInPlace]
            if let sourceApplication = context.options.sourceApplication {
                options[.sourceApplication] = sourceApplication
            }
            if let annotation = context.options.annotation {
                options[.annotation] = annotation
            }
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: options)
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}
