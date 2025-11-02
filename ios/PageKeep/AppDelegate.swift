import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "PageKeep",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    guard url.scheme?.lowercased() == "pagekeep" else {
      return false
    }

    if url.host?.lowercased() == "share" {
      var payloads: [[String: Any]] = []

      if let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
         let urlValue = components.queryItems?.first(where: { $0.name == "url" })?.value,
         let decodedUrl = urlValue.removingPercentEncoding {
        let title = components.queryItems?.first(where: { $0.name == "title" })?.value?
          .removingPercentEncoding
        let sourceApp = components.queryItems?.first(where: { $0.name == "sourceApp" })?.value?
          .removingPercentEncoding
        let identifier = components.queryItems?.first(where: { $0.name == "id" })?.value?
          .removingPercentEncoding

        var payload = ShareQueue.makePayload(
          url: decodedUrl,
          title: title,
          sourceApp: sourceApp
        )

        if let identifier = identifier, !identifier.isEmpty {
          payload["id"] = identifier
        }

        payloads.append(payload)
        ShareQueue.enqueue(payload: payload)
      }

      if payloads.isEmpty {
        NotificationCenter.default.post(name: ShareQueue.notificationName(), object: nil)
      } else {
        NotificationCenter.default.post(
          name: ShareQueue.notificationName(),
          object: nil,
          userInfo: ["items": payloads]
        )
      }

      return true
    }

    return false
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
