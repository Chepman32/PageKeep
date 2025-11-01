package com.pagekeep.share

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class ShareQueueModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

    companion object {
        const val EVENT_NAME = "ShareQueueNewItemsNotification"
        private var instance: ShareQueueModule? = null

        fun notifyShareAvailable() {
            instance?.emitPendingShares()
        }
    }

    private var hasListeners = false
    private var listenerCount = 0

    init {
        instance = this
    }

    override fun getName(): String = "ShareQueueModule"

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        instance = null
    }

    @ReactMethod
    fun getPendingShares(promise: Promise) {
        try {
            val items = ShareQueueStorage.consumeAll(context)
            promise.resolve(toWritableArray(items))
        } catch (error: Exception) {
            promise.reject("E_SHARE_QUEUE", "Failed to read pending shares", error)
        }
    }

    @ReactMethod
    fun clearQueue() {
        ShareQueueStorage.clear(context)
    }

    override fun addListener(eventName: String?) {
        if (eventName == EVENT_NAME) {
            listenerCount += 1
            hasListeners = listenerCount > 0
            emitPendingShares()
        }
    }

    override fun removeListeners(count: Int) {
        listenerCount = (listenerCount - count).coerceAtLeast(0)
        hasListeners = listenerCount > 0
    }

    private fun emitPendingShares() {
        if (!hasListeners) {
            return
        }

        context.runOnUiQueueThread {
            if (!hasListeners) {
                return@runOnUiQueueThread
            }

            val items = ShareQueueStorage.consumeAll(context)
            if (items.isEmpty()) {
                return@runOnUiQueueThread
            }

            val array = toWritableArray(items)
            context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(EVENT_NAME, array)
        }
    }

    private fun toWritableArray(items: List<SharedItem>) = Arguments.createArray().apply {
        items.forEach { item ->
            val map = Arguments.createMap().apply {
                putString("id", item.id)
                putString("url", item.url)
                item.title?.let { putString("title", it) }
                item.sourceApp?.let { putString("sourceApp", it) }
                putDouble("receivedAt", item.receivedAt.toDouble())
            }
            pushMap(map)
        }
    }
}
