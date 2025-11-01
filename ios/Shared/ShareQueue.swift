import Foundation

@objcMembers
public final class ShareQueue: NSObject {
  public static let appGroupIdentifier = "group.org.reactjs.native.example.PageKeep"
  private static let queueKey = "pendingShares"
  private static let notificationKey = "ShareQueueNewItemsNotification"

  public static func enqueue(url: String, title: String?, sourceApp: String?) {
    guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
      return
    }

    var items = defaults.array(forKey: queueKey) as? [[String: Any]] ?? []

    var payload: [String: Any] = [
      "id": UUID().uuidString,
      "url": url,
      "receivedAt": Date().timeIntervalSince1970 * 1000
    ]

    if let title = title, !title.isEmpty {
      payload["title"] = title
    }

    if let sourceApp = sourceApp, !sourceApp.isEmpty {
      payload["sourceApp"] = sourceApp
    }

    items.append(payload)
    defaults.set(items, forKey: queueKey)
    defaults.synchronize()
  }

  public static func consumeAll() -> [[String: Any]] {
    guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
      return []
    }

    let items = defaults.array(forKey: queueKey) as? [[String: Any]] ?? []
    defaults.removeObject(forKey: queueKey)
    defaults.synchronize()
    return items
  }

  public static func peekAll() -> [[String: Any]] {
    guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
      return []
    }

    return defaults.array(forKey: queueKey) as? [[String: Any]] ?? []
  }

  public static func clear() {
    guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
      return
    }

    defaults.removeObject(forKey: queueKey)
    defaults.synchronize()
  }

  public static func notificationIdentifier() -> String {
    return notificationKey
  }

  public static func notificationName() -> Notification.Name {
    return Notification.Name(notificationKey)
  }
}
