import Foundation

@objcMembers
public final class ShareQueue: NSObject {
  private static let appGroupID = "group.com.antonchepur.PageKeep"
  private static let queueKey = "pendingShares"
  private static let notificationKey = "ShareQueueNewItemsNotification"

  private static var storage: UserDefaults {
    UserDefaults(suiteName: appGroupID) ?? .standard
  }

  public static func enqueue(url: String, title: String?, sourceApp: String?) {
    let payload = makePayload(url: url, title: title, sourceApp: sourceApp)
    enqueue(payload: payload)
  }

  public static func enqueue(payload: [String: Any]) {
    var items = storage.array(forKey: queueKey) as? [[String: Any]] ?? []
    if let identifier = payload["id"] as? String {
      let alreadyExists = items.contains { existing in
        if let existingId = existing["id"] as? String {
          return existingId == identifier
        }
        return false
      }

      if alreadyExists {
        return
      }
    }

    items.append(payload)
    storage.set(items, forKey: queueKey)
    storage.synchronize()
  }

  public static func makePayload(
    url: String,
    title: String?,
    sourceApp: String?
  ) -> [String: Any] {
    var payload: [String: Any] = [
      "id": UUID().uuidString,
      "url": url,
      "receivedAt": Date().timeIntervalSince1970 * 1000
    ]

    if let trimmedTitle = title?.trimmingCharacters(in: .whitespacesAndNewlines),
       !trimmedTitle.isEmpty {
      payload["title"] = trimmedTitle
    }

    if let trimmedSource = sourceApp?.trimmingCharacters(in: .whitespacesAndNewlines),
       !trimmedSource.isEmpty {
      payload["sourceApp"] = trimmedSource
    }

    return payload
  }

  public static func consumeAll() -> [[String: Any]] {
    let items = storage.array(forKey: queueKey) as? [[String: Any]] ?? []
    storage.removeObject(forKey: queueKey)
    storage.synchronize()
    return items
  }

  public static func peekAll() -> [[String: Any]] {
    return storage.array(forKey: queueKey) as? [[String: Any]] ?? []
  }

  public static func clear() {
    storage.removeObject(forKey: queueKey)
    storage.synchronize()
  }

  public static func notificationIdentifier() -> String {
    return notificationKey
  }

  public static func notificationName() -> Notification.Name {
    return Notification.Name(notificationKey)
  }
}
