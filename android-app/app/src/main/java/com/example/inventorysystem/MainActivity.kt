package com.example.inventorysystem

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.webkit.*
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    // Activity result launcher for file picker
    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val results: Array<Uri>? = if (result.resultCode == Activity.RESULT_OK) {
            result.data?.data?.let { arrayOf(it) }
        } else null
        fileChooserCallback?.onReceiveValue(results)
        fileChooserCallback = null
    }

    // Camera permission launcher
    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) {
            Toast.makeText(this, "Camera permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request camera permission upfront for photo capture
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true          // localStorage support
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                setSupportMultipleWindows(true)
                javaScriptCanOpenWindowsAutomatically = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
                useWideViewPort = true
                loadWithOverviewMode = true
                // Enable zoom
                builtInZoomControls = false
                displayZoomControls = false
            }

            webChromeClient = object : WebChromeClient() {
                // Handle file chooser (for photo uploads)
                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>,
                    fileChooserParams: FileChooserParams
                ): Boolean {
                    fileChooserCallback?.onReceiveValue(null)
                    fileChooserCallback = filePathCallback

                    val intent = fileChooserParams.createIntent().apply {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/*"))
                        }
                    }
                    // Also allow camera capture
                    val chooserIntent = Intent.createChooser(intent, "Select Image")
                    filePickerLauncher.launch(chooserIntent)
                    return true
                }

                // Allow permission requests from the web app (camera, storage)
                override fun onPermissionRequest(request: PermissionRequest) {
                    request.grant(request.resources)
                }
            }

            webViewClient = object : WebViewClient() {
                // Keep all navigation within the WebView
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val url = request?.url?.toString() ?: return false
                    // Open external links in browser, keep app links in WebView
                    return if (url.startsWith("https://logisync-66bed.web.app") ||
                        url.startsWith("https://firebase") ||
                        url.startsWith("https://accounts.google")
                    ) {
                        false // Let WebView handle it
                    } else {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        true
                    }
                }
            }

            // Restore saved state if app was paused
            if (savedInstanceState != null) {
                restoreState(savedInstanceState)
            } else {
                loadUrl("https://logisync-66bed.web.app")
            }
        }

        setContentView(webView)
    }

    // Persist WebView state across rotations
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    // Handle Android back button to navigate WebView history
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }
}
