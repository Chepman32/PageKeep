import UIKit
import UniformTypeIdentifiers

final class ShareViewController: UIViewController {
  private let statusLabel = UILabel()
  private let spinner = UIActivityIndicatorView(style: .medium)

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = UIColor.systemBackground
    setupView()
    processIncomingItems()
  }

  private func setupView() {
    statusLabel.translatesAutoresizingMaskIntoConstraints = false
    statusLabel.textAlignment = .center
    statusLabel.numberOfLines = 0
    statusLabel.font = UIFont.systemFont(ofSize: 17, weight: .semibold)
    statusLabel.text = "Saving to PageKeep…"

    spinner.translatesAutoresizingMaskIntoConstraints = false
    spinner.startAnimating()

    view.addSubview(statusLabel)
    view.addSubview(spinner)

    NSLayoutConstraint.activate([
      statusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
      statusLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -10),
      statusLabel.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 20),
      statusLabel.trailingAnchor.constraint(lessThanOrEqualTo: view.trailingAnchor, constant: -20),

      spinner.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 16),
      spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
    ])
  }

  private func processIncomingItems() {
    guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem else {
      completeWithFailure(message: "Unable to read shared content.")
      return
    }

    let itemProviders = extensionItem.attachments ?? []
    if itemProviders.isEmpty {
      completeWithFailure(message: "No content provided.")
      return
    }

    extractURL(from: itemProviders) { [weak self] result in
      DispatchQueue.main.async {
        switch result {
        case .success(let urlString):
          self?.handleSuccessfulExtraction(urlString: urlString, item: extensionItem)
        case .failure(let error):
          self?.completeWithFailure(message: error.localizedDescription)
        }
      }
    }
  }

  private func extractURL(
    from providers: [NSItemProvider],
    completion: @escaping (Result<String, Error>) -> Void
  ) {
    let desiredTypes: [UTType] = [.url, .plainText, .text, .utf8PlainText]

    let dispatchGroup = DispatchGroup()
    var discoveredURL: String?
    var extractionError: Error?

    for provider in providers {
      for type in desiredTypes {
        if provider.hasItemConformingToTypeIdentifier(type.identifier) {
          dispatchGroup.enter()

          provider.loadItem(forTypeIdentifier: type.identifier, options: nil) { item, error in
            defer { dispatchGroup.leave() }

            if let error = error {
              extractionError = error
              return
            }

            guard let item = item else {
              return
            }

            if let url = item as? URL {
              discoveredURL = url.absoluteString
            } else if let data = item as? Data, type == .url,
                      let url = URL(dataRepresentation: data, relativeTo: nil) {
              discoveredURL = url.absoluteString
            } else if let text = item as? String {
              if let url = URL(string: text.trimmingCharacters(in: .whitespacesAndNewlines)),
                 ["http", "https"].contains(url.scheme?.lowercased()) {
                discoveredURL = url.absoluteString
              }
            }
          }
        }

        if discoveredURL != nil { break }
      }

      if discoveredURL != nil { break }
    }

    dispatchGroup.notify(queue: .main) {
      if let url = discoveredURL {
        completion(.success(url))
      } else if let error = extractionError {
        completion(.failure(error))
      } else {
        completion(.failure(NSError(
          domain: "ShareExtension",
          code: 1,
          userInfo: [NSLocalizedDescriptionKey: "Unable to locate a URL to save."]
        )))
      }
    }
  }

  private func handleSuccessfulExtraction(urlString: String, item: NSExtensionItem) {
    let title = item.attributedTitle?.string ?? item.attributedContentText?.string
    let sourceApp = sourceAppBundleIdentifier()

    let payload = ShareQueue.makePayload(
      url: urlString,
      title: title,
      sourceApp: sourceApp
    )

    ShareQueue.enqueue(payload: payload)

    statusLabel.text = "Saved! Opening PageKeep…"
    spinner.stopAnimating()

    openHostAppIfPossible(
      payload: payload
    )

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { [weak self] in
      self?.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
  }

  private func completeWithFailure(message: String) {
    statusLabel.text = message
    spinner.stopAnimating()
    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
      self?.extensionContext?.cancelRequest(withError: NSError(
        domain: "ShareExtension",
        code: 0,
        userInfo: [NSLocalizedDescriptionKey: message]
      ))
    }
  }

  private func openHostAppIfPossible(payload: [String: Any]) {
    var components = URLComponents()
    components.scheme = "pagekeep"
    components.host = "share"
    var queryItems: [URLQueryItem] = []

    if let urlString = payload["url"] as? String {
      queryItems.append(URLQueryItem(name: "url", value: urlString))
    }

    if let title = payload["title"] as? String {
      queryItems.append(URLQueryItem(name: "title", value: title))
    }

    if let sourceApp = payload["sourceApp"] as? String {
      queryItems.append(URLQueryItem(name: "sourceApp", value: sourceApp))
    }

    if let identifier = payload["id"] as? String {
      queryItems.append(URLQueryItem(name: "id", value: identifier))
    }

    components.queryItems = queryItems

    guard let url = components.url else { return }
    extensionContext?.open(url, completionHandler: nil)
  }

  private func sourceAppBundleIdentifier() -> String? {
    guard
      let extensionItems = extensionContext?.inputItems as? [NSExtensionItem],
      let item = extensionItems.first,
      let userInfo = item.userInfo
    else {
      return nil
    }

    let key = "NSExtensionItemSourceApplicationBundleIdentifierKey"
    return userInfo[key] as? String
  }
}
