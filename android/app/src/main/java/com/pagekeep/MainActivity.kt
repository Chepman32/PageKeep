package com.pagekeep

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.pagekeep.share.ShareQueueModule
import com.pagekeep.share.ShareQueueStorage
import com.pagekeep.share.SharedItem
import java.util.regex.Pattern

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "PageKeep"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    intent?.let { handleShareIntent(it) }
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    if (intent == null) return

    setIntent(intent)
    handleShareIntent(intent)
  }

  private fun handleShareIntent(intent: Intent) {
    val actionMatches = Intent.ACTION_SEND == intent.action
    val typeMatches = intent.type?.startsWith("text/") == true

    if (!actionMatches || !typeMatches) {
      return
    }

    val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
    val url = extractUrl(sharedText) ?: return

    val title = intent.getStringExtra(Intent.EXTRA_SUBJECT)
    val sourceApp = intent.getStringExtra(Intent.EXTRA_PACKAGE_NAME) ?: intent.`package`

    val item = SharedItem(
        url = url,
        title = title,
        sourceApp = sourceApp
    )

    ShareQueueStorage.enqueue(this, item)
    ShareQueueModule.notifyShareAvailable()

    intent.removeExtra(Intent.EXTRA_TEXT)
    intent.action = Intent.ACTION_MAIN
    intent.type = null
  }

  private fun extractUrl(text: String?): String? {
    if (text.isNullOrBlank()) {
      return null
    }

    val matcher = URL_PATTERN.matcher(text)
    return if (matcher.find()) matcher.group(0) else null
  }

  companion object {
    private val URL_PATTERN: Pattern =
        Pattern.compile("https?://[^\\s]+", Pattern.CASE_INSENSITIVE)
  }
}
