package com.pagekeep.share

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

data class SharedItem(
    val id: String = UUID.randomUUID().toString(),
    val url: String,
    val title: String? = null,
    val sourceApp: String? = null,
    val receivedAt: Long = System.currentTimeMillis()
)

object ShareQueueStorage {
    private const val PREFS_NAME = "incoming_share_queue"
    private const val QUEUE_KEY = "pendingShares"

    fun enqueue(context: Context, item: SharedItem) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val existing = prefs.getString(QUEUE_KEY, null)
        val array = try {
            if (existing.isNullOrBlank()) JSONArray() else JSONArray(existing)
        } catch (error: Exception) {
            JSONArray()
        }
        val updated = if (array.length() >= 50) {
            val trimmed = JSONArray()
            for (index in 1 until array.length()) {
                trimmed.put(array.get(index))
            }
            trimmed.put(item.toJson())
            trimmed
        } else {
            array.put(item.toJson())
            array
        }

        prefs.edit().putString(QUEUE_KEY, updated.toString()).apply()
    }

    fun consumeAll(context: Context): List<SharedItem> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(QUEUE_KEY, null) ?: return emptyList()
        prefs.edit().remove(QUEUE_KEY).apply()
        return parse(json)
    }

    fun peekAll(context: Context): List<SharedItem> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(QUEUE_KEY, null) ?: return emptyList()
        return parse(json)
    }

    fun clear(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(QUEUE_KEY).apply()
    }

    private fun parse(json: String): List<SharedItem> {
        val array = try {
            JSONArray(json)
        } catch (error: Exception) {
            return emptyList()
        }
        val items = mutableListOf<SharedItem>()
        for (index in 0 until array.length()) {
            val element = array.optJSONObject(index) ?: continue
            val url = element.optString("url")
            if (url.isNullOrEmpty()) continue

            items.add(
                SharedItem(
                    id = element.optString("id", UUID.randomUUID().toString()),
                    url = url,
                    title = element.optString("title").takeIf { it.isNotBlank() },
                    sourceApp = element.optString("sourceApp").takeIf { it.isNotBlank() },
                    receivedAt = element.optLong("receivedAt", System.currentTimeMillis())
                )
            )
        }
        return items
    }

    private fun SharedItem.toJson(): JSONObject =
        JSONObject().apply {
            put("id", id)
            put("url", url)
            title?.let { put("title", it) }
            sourceApp?.let { put("sourceApp", it) }
            put("receivedAt", receivedAt)
        }
}
