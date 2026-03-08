package io.github.keshav_writes_code.cherit

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  // We are exposing a method that can be called from Rust/Tauri via JNI or plugin mechanism
  // In a real plugin, this would be within a TauriPlugin class, but for simplicity here we
  // expose it from the main activity.
  fun startSyncForegroundService() {
      val intent = Intent(this, SyncForegroundService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          startForegroundService(intent)
      } else {
          startService(intent)
      }
  }

  fun stopSyncForegroundService() {
      val intent = Intent(this, SyncForegroundService::class.java)
      stopService(intent)
  }
}
