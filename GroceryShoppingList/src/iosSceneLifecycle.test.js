// Guards the iOS app's UIScene life cycle. Since iOS 27, UIKit refuses to launch an app built with the
// iOS 27 SDK (Xcode 27) that still uses the old app-delegate window: "Application failed to launch:
// UIScene life cycle is required for apps built with this SDK" — TestFlight build 1.2.0 (7) closed
// the instant it was tapped (Apple TN3187). Capacitor 7's template has no scene delegate, so the app
// carries its own (ios/App/App/SceneDelegate.swift) and declares it in Info.plist.
import fs from "fs";
import path from "path";

const IOS_APP = path.join(__dirname, "..", "ios", "App");
const read = (...p) => fs.readFileSync(path.join(IOS_APP, ...p), "utf8");

/** A property list's top-level dict as plain JS (dict, array, string, true/false — all Info.plist uses). */
function parsePlist(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const value = (el) => {
    switch (el.tagName) {
      case "dict": {
        const out = {};
        const kids = [...el.children];
        for (let i = 0; i < kids.length; i += 2) out[kids[i].textContent] = value(kids[i + 1]);
        return out;
      }
      case "array":
        return [...el.children].map(value);
      case "true":
        return true;
      case "false":
        return false;
      default:
        return el.textContent;
    }
  };
  return value(doc.querySelector("plist > dict"));
}

const infoPlist = () => parsePlist(read("App", "Info.plist"));

test("Info.plist declares one window scene whose delegate is SceneDelegate and whose storyboard is Main", () => {
  const manifest = infoPlist().UIApplicationSceneManifest;

  expect(manifest).toEqual({
    UIApplicationSupportsMultipleScenes: false,
    UISceneConfigurations: {
      UIWindowSceneSessionRoleApplication: [
        {
          UISceneConfigurationName: "Default Configuration",
          UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
          UISceneStoryboardFile: "Main",
        },
      ],
    },
  });
});

test("the storyboard belongs to the scene, not the app", () => {
  expect(infoPlist()).not.toHaveProperty("UIMainStoryboardFile");
});

test("SceneDelegate is compiled into the App target", () => {
  const pbxproj = read("App.xcodeproj", "project.pbxproj");

  expect(pbxproj).toMatch(/SceneDelegate\.swift in Sources/);
  expect(pbxproj).toMatch(/path = SceneDelegate\.swift;/);
});

test("SceneDelegate hands every link to Capacitor, at launch and while running", () => {
  const scene = read("App", "SceneDelegate.swift");

  expect(scene).toMatch(/class SceneDelegate: UIResponder, UIWindowSceneDelegate/);
  expect(scene).toMatch(/var window: UIWindow\?/);
  // A link that opens the app cold arrives in the connection options, later ones in these two callbacks.
  expect(scene).toMatch(/connectionOptions\.urlContexts/);
  expect(scene).toMatch(/connectionOptions\.userActivities/);
  expect(scene).toMatch(/func scene\(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>\)/);
  expect(scene).toMatch(/func scene\(_ scene: UIScene, continue userActivity: NSUserActivity\)/);
  expect(scene).toMatch(/ApplicationDelegateProxy\.shared\.application\(UIApplication\.shared, open:/);
  expect(scene).toMatch(/ApplicationDelegateProxy\.shared\.application\(UIApplication\.shared, continue:/);
});

test("AppDelegate keeps nothing the scene life cycle no longer calls", () => {
  const appDelegate = read("App", "AppDelegate.swift");

  expect(appDelegate).not.toMatch(/var window: UIWindow\?/);
  expect(appDelegate).not.toMatch(/open url: URL/);
  expect(appDelegate).not.toMatch(/continue userActivity/);
});
