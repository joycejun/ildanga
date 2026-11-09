
package com.example.dateapp;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.*;
import android.content.Intent;
import android.net.Uri;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {

 private WebView web;

 @Override
 public void onCreate(Bundle b) {
  super.onCreate(b);

  web = new WebView(this);
  setContentView(web);

  web.setWebChromeClient(new WebChromeClient());

  WebSettings s = web.getSettings();
  s.setJavaScriptEnabled(true);
  s.setDomStorageEnabled(true);
  s.setAllowFileAccess(false);
  s.setAllowContentAccess(false);
  s.setUserAgentString(
          s.getUserAgentString() + " IldangaPrototype/2.0"
  );

  web.setWebViewClient(new WebViewClient() {

   @Override
   public WebResourceResponse shouldInterceptRequest(
           WebView v,
           WebResourceRequest r
   ) {
    Uri u = r.getUrl();

    if (!"appassets.androidplatform.net".equals(u.getHost())) {
     return null;
    }

    try {
     String path = u.getPath();

     if (path == null || path.contains("..")) {
      throw new IOException();
     }

     if (path.startsWith("/api/")) {
      return proxyApi(u);
     }

     if (path.equals("/")) {
      path = "/index.html";
     }

     String mime =
             path.endsWith(".js")
                     ? "application/javascript"
                     : path.endsWith(".css")
                       ? "text/css"
                       : path.endsWith(".svg")
                         ? "image/svg+xml"
                         : path.endsWith(".ttf")
                           ? "font/ttf"
                           : path.endsWith(".png")
                             ? "image/png"
                             : "text/html";

     return new WebResourceResponse(
             mime,
             (mime.startsWith("image/")
                     || mime.startsWith("font/"))
                     ? null : "UTF-8",
             getAssets().open(path.substring(1))
     );

    } catch (IOException e) {
     return new WebResourceResponse(
             "text/plain",
             "UTF-8",
             404,
             "Not Found",
             null,
             new ByteArrayInputStream(new byte[0])
     );
    }
   }

   @Override
   public boolean shouldOverrideUrlLoading(
           WebView v,
           WebResourceRequest r
   ) {
    if ("appassets.androidplatform.net".equals(
            r.getUrl().getHost())) {
     return false;
    }

    if ("https".equals(r.getUrl().getScheme())) {
     try {
      startActivity(
              new Intent(
                      Intent.ACTION_VIEW,
                      r.getUrl()
              )
      );
     } catch (Exception e) {
      android.widget.Toast.makeText(
              MainActivity.this,
              "외부 지도 앱 또는 브라우저가 필요해요",
              android.widget.Toast.LENGTH_SHORT
      ).show();
     }
    }

    return true;
   }
  });

  web.loadUrl(
          "https://appassets.androidplatform.net/index.html"
  );
 }

 // Android WebView와 Python 서버 연결
 private WebResourceResponse proxyApi(Uri uri) {

  String path = uri.getPath();

  // 허용된 API 주소만 연결
  boolean allowed =
          "/api/health".equals(path)
                  || "/api/places/search".equals(path)
                  || "/api/reviews/places".equals(path)
                  || "/api/reviews/summary".equals(path)
                  || "/api/google/reviews".equals(path);

  if (!allowed) {
   return apiError(404, "Unknown endpoint");
  }

  HttpURLConnection c = null;

  try {
   URL base = new URL(BuildConfig.PLACES_API_BASE);

   boolean local =
           BuildConfig.DEBUG
                   && "http".equals(base.getProtocol())
                   && "127.0.0.1".equals(base.getHost());

   if (!local && !"https".equals(base.getProtocol())) {
    return apiError(503, "HTTPS server required");
   }

   String query = uri.getEncodedQuery();

   String targetUrl =
           BuildConfig.PLACES_API_BASE
                   + path
                   + (query == null ? "" : "?" + query);

   URL target = new URL(targetUrl);

   c = (HttpURLConnection) target.openConnection();

   c.setConnectTimeout(5000);

   // API별 응답 대기시간
   int timeout;

   if (path.startsWith("/api/reviews/")) {
    timeout = 210000;
   } else if (path.equals("/api/google/reviews")) {
    timeout = 40000; // Text Search + Place Details (각 최대 15초)
   } else {
    timeout = 12000;
   }

   c.setReadTimeout(timeout);
   c.setInstanceFollowRedirects(false);

   int code = c.getResponseCode();

   InputStream in =
           code >= 400
                   ? c.getErrorStream()
                   : c.getInputStream();

   if (in == null) {
    return apiError(502, "Empty provider response");
   }

   ByteArrayOutputStream out =
           new ByteArrayOutputStream();

   byte[] buf = new byte[4096];
   int n;

   try (InputStream source = in) {

    while ((n = source.read(buf)) != -1) {

     if (out.size() + n > 1000000) {
      throw new IOException(
              "Response too large"
      );
     }

     out.write(buf, 0, n);
    }
   }

   if (code >= 300 && code < 400) {
    return apiError(502, "Redirect not supported");
   }

   return new WebResourceResponse(
           "application/json",
           "UTF-8",
           code,
           code < 400 ? "OK" : "Request failed",
           null,
           new ByteArrayInputStream(
                   out.toByteArray()
           )
   );

  } catch (Exception e) {
   return apiError(
           503,
           "Place server is not connected"
   );

  } finally {
   if (c != null) {
    c.disconnect();
   }
  }
 }

 // API 오류 메시지
 private WebResourceResponse apiError(
         int code,
         String message
 ) {
  String json =
          "{\"error\":\"" + message + "\"}";

  return new WebResourceResponse(
          "application/json",
          "UTF-8",
          code,
          "Unavailable",
          null,
          new ByteArrayInputStream(
                  json.getBytes(StandardCharsets.UTF_8)
          )
  );
 }

 @Override
 public void onBackPressed() {
  web.evaluateJavascript(
          "window.backToHome()",
          null
  );
 }

 @Override
 protected void onDestroy() {
  if (web != null) {
   web.destroy();
  }

  super.onDestroy();
 }
}
