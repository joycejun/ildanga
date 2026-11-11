
package com.example.dateapp;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.*;
import android.content.Intent;
import android.net.Uri;
import org.json.JSONObject;
import android.util.Log;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

import ai.pleos.playground.navi.helper.NaviHelper;
import ai.pleos.playground.navi.data.RouteInfo;
import ai.pleos.playground.navi.data.RouteWithWaypointsRequest;
import ai.pleos.playground.navi.data.RequestWaypointInfo;
import ai.pleos.playground.navi.constants.WaypointIndex;
import kotlin.Unit;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {

 private WebView web;
 private PleosLocation loc;
 private DrivingState driving;
 private boolean lastDriving=false;
 private NaviHelper naviHelper;
 private boolean naviReady=false;
 private org.json.JSONObject queuedRoute=null;
 private final android.os.Handler navHandler=new android.os.Handler(android.os.Looper.getMainLooper());
 private void navigationFeedback(String status,String message){android.util.Log.i("ILDANGA_NAV",status+": "+message);runOnUiThread(()->{if(web!=null)web.evaluateJavascript("window.onIldangaNavigationResult("+org.json.JSONObject.quote(status)+","+org.json.JSONObject.quote(message)+")",null);});}
 private void initNavigation(){try{naviHelper=new NaviHelper(getApplicationContext());naviHelper.initialize(()->{runOnUiThread(()->{naviReady=true;if(queuedRoute!=null){org.json.JSONObject request=queuedRoute;queuedRoute=null;sendNavigationRoute(request);}});return Unit.INSTANCE;},error->{runOnUiThread(()->{naviReady=false;queuedRoute=null;navigationFeedback("error","PLEOS 내비게이션 서비스 연결에 실패했어요.");});return Unit.INSTANCE;});}catch(Exception e){navigationFeedback("error","NaviHelper를 초기화할 수 없어요.");}}
 private static String cleanPoiId(org.json.JSONObject p){
  String id=p.optString("poiId", "").trim();
  return "null".equalsIgnoreCase(id)?"":id;
 }
 // PLEOS identifiers must be provided by a trusted PLEOS POI source.
 // Latitude/longitude or Kakao/Google place IDs are NOT interchangeable with PLEOS poiId.
 private boolean hasPleosPoiIds(List<org.json.JSONObject> points){
  for(org.json.JSONObject p:points)if(cleanPoiId(p).isEmpty())return false;
  return true;
 }
 // PLEOS NaviHelper requires POI identities supplied by its supported place service.
 // Never replace missing ids with fake strings or silently launch an unrelated map app.
 private void reportMissingPoiId(List<org.json.JSONObject> points){
  StringBuilder missing=new StringBuilder();
  for(org.json.JSONObject p:points){
   if(cleanPoiId(p).isEmpty()){
    if(missing.length()>0)missing.append(", ");
    missing.append(p.optString("name","이름 없는 장소"));
   }
  }
  navigationFeedback("error","PLEOS 장소 ID가 없어 직접 길안내할 수 없어요: " + missing + ". 아래 'PLEOS SDK 연결 테스트'로 공식 예제 경로를 먼저 확인해 주세요.");
 }
 // Diagnostic route: two real POI IDs published in the Pleos Playground NaviHelper examples.
 // It is deliberately separate from the user's selected trip.
 private void testOfficialPleosRoute(){
  try{
   org.json.JSONObject route=new org.json.JSONObject();
   org.json.JSONArray stops=new org.json.JSONArray();
   org.json.JSONObject way=new org.json.JSONObject();
   way.put("name","판교 현대백화점 (공식 SDK 예제)");
   way.put("latitude",37.41275833);way.put("longitude",127.09481944);
   way.put("poiId","36khp2hdj2cfcm5nqhe3");
   way.put("poiSubId","0");
   way.put("address","6 Changup-ro 0beon-gil, Sujeong-gu, Seongnam-si, Gyeonggi-do");
   stops.put(way);
   org.json.JSONObject dest=new org.json.JSONObject();
   dest.put("name","42dot (공식 SDK 예제)");
   dest.put("latitude",37.48544722);dest.put("longitude",127.03636666);
   dest.put("poiId","36khp37hh8gqcm5nqhe5");
   dest.put("poiSubId","0");
   dest.put("address","2621 Nambusunhwan-ro, Gangnam-gu, Seoul");
   stops.put(dest);route.put("stops",stops);
   navigationFeedback("pending","PLEOS 공식 예제 경로를 요청합니다 (판교 현대백화점 → 42dot). 실제 안내 여부를 확인해 주세요.");
   sendNavigationRoute(route);
  }catch(Exception e){navigationFeedback("error","SDK 예제 경로 구성 실패: "+e.getMessage());}
 }
 private void sendNavigationRoute(org.json.JSONObject route){
  try{
   org.json.JSONArray stops=route.getJSONArray("stops");
   if(stops.length()<1||stops.length()>3)throw new IllegalArgumentException("PLEOS 1회 요청은 경유지 2곳과 목적지 1곳까지 지원합니다. 구간별 안내를 이용해 주세요.");
   List<org.json.JSONObject> points=new ArrayList<>();
   for(int i=0;i<stops.length();i++){
    org.json.JSONObject p=stops.getJSONObject(i);
    double lat=p.getDouble("latitude"),lng=p.getDouble("longitude");
    if(!Double.isFinite(lat)||!Double.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)throw new IllegalArgumentException("좌표 오류");
    points.add(p);
   }
   // Trial only: 3.0.5 Java constructor accepts a non-null POI id. For coordinates
   // lacking a provider POI id, submit an EMPTY string (not a fabricated POI id).
   // Whether the Navigation service accepts this request is platform-dependent.
   boolean coordinateTrial=!hasPleosPoiIds(points);
   if(coordinateTrial)navigationFeedback("pending","POI ID가 없는 장소입니다. 좌표 기반 PLEOS 경로 요청을 시험합니다. 실패하면 코스 지도를 사용하세요.");
   if(!naviReady||naviHelper==null){queuedRoute=route;navigationFeedback("pending","PLEOS 내비게이션 서비스 연결을 기다리고 있어요.");return;}
   org.json.JSONObject last=points.get(points.size()-1);
   RouteInfo destination=new RouteInfo(
     last.getDouble("latitude"),last.getDouble("longitude"),null,null,
     last.optString("name","목적지"),cleanPoiId(last),
     last.optString("address",""),last.optString("poiSubId","0"),
     ai.pleos.playground.navi.constants.RouteOption.RECOMMENDED,"",false);
   if(points.size()==1){naviHelper.requestRoute(destination);}
   else{
    List<RequestWaypointInfo> waypoints=new ArrayList<>();
    java.util.List<WaypointIndex> availableWaypointIndices=new java.util.ArrayList<>();
    for(String indexName:new String[]{"FIRST","SECOND"}){
     try{availableWaypointIndices.add(WaypointIndex.valueOf(indexName));}
     catch(IllegalArgumentException ignored){break;}
    }
    int requiredWaypoints=points.size()-1;
    if(requiredWaypoints>availableWaypointIndices.size()){
     String warning="현재 PLEOS SDK가 지원하는 경유지는 "+availableWaypointIndices.size()+"곳인데 선택 코스에는 "+requiredWaypoints+"곳이 있어요. 경유지를 줄이거나 SDK의 지원 범위를 확인해 주세요. 경유지를 임의로 생략하지 않습니다.";
     navigationFeedback("error",warning);
     return;
    }
    for(int i=0;i<points.size()-1;i++){
     org.json.JSONObject p=points.get(i);
     waypoints.add(new RequestWaypointInfo(
       p.getDouble("latitude"),p.getDouble("longitude"),p.optString("name","경유지"),
       availableWaypointIndices.get(i),cleanPoiId(p),p.optString("address",""),
       p.optString("poiSubId","0"),""));
    }
    naviHelper.requestRouteWithWaypoints(new RouteWithWaypointsRequest(destination,waypoints));
   }
   navHandler.postDelayed(()->{
    try{
     if(naviReady&&naviHelper!=null){
      naviHelper.requestNavigationScreen(ai.pleos.playground.navi.data.NavigationScreenRequest.Foreground.INSTANCE);
      navigationFeedback("requested","PLEOS에 경로 요청을 보냈습니다. 실제 경로 생성 여부는 내비게이션에서 확인하세요. 지도가 하얗다면 PLEOS 기본 지도 문제입니다.");
     }
    }catch(Exception e){navigationFeedback("error","경로 요청 후 내비게이션 화면 열기 실패: "+e.getMessage());}
   },1500);
  }catch(Exception e){navigationFeedback("error","경로 전달 실패: "+(e.getMessage()==null?e.getClass().getSimpleName():e.getMessage()));}
 }
 public class NavigationBridge {
  @JavascriptInterface public void testSdkRoute(){runOnUiThread(()->testOfficialPleosRoute());}
  @JavascriptInterface public void startRoute(String json){if(json==null||json.length()>6000)return;runOnUiThread(()->{try{sendNavigationRoute(new org.json.JSONObject(json));}catch(Exception e){navigationFeedback("error","잘못된 경로 데이터예요.");}});}
 }

 private GleoVoiceBridge voiceBridge;

 @Override
 public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
  super.onRequestPermissionsResult(requestCode, permissions, grantResults);
  if (voiceBridge != null) voiceBridge.onPermissionResult(requestCode, grantResults);
  if (loc != null) loc.onPermissionResult(requestCode, grantResults);
 }

 // 현재 위치: JS 의 window.IldangaLocation.request() → PleosLocation → window.g3SetLocation(lat, lng, 출처)
 private class LocationBridge {
  @android.webkit.JavascriptInterface
  public void request() {
   runOnUiThread(() -> {
    if (loc == null) loc = new PleosLocation(MainActivity.this, (lat, lng, source) -> {
     if (web != null) web.evaluateJavascript("window.g3SetLocation&&window.g3SetLocation(" + lat + "," + lng + ",'" + source + "')", null);
    });
    loc.request();
   });
  }
 }

 private Intent pendingGleoIntent;

 @Override
 public void onCreate(Bundle b) {
  super.onCreate(b);

  web = new WebView(this);
  web.addJavascriptInterface(new NavigationBridge(),"IldangaNavigation");
  voiceBridge = new GleoVoiceBridge(this, web);
  web.addJavascriptInterface(voiceBridge, "IldangaVoice");
  web.addJavascriptInterface(new LocationBridge(), "IldangaLocation");
  initNavigation();
  setContentView(web);

  web.setWebChromeClient(new WebChromeClient());
  pendingGleoIntent = getIntent();

  WebSettings s = web.getSettings();
  s.setJavaScriptEnabled(true);
  s.setDomStorageEnabled(true);
  s.setAllowFileAccess(false);
  s.setAllowContentAccess(false);
  s.setUserAgentString(
          s.getUserAgentString() + " IldangaPrototype/2.0"
  );

  web.setWebViewClient(new WebViewClient() {
   @Override public void onPageFinished(WebView view, String url) {
    super.onPageFinished(view,url);
    if (lastDriving) pushDriving(true);
    if (pendingGleoIntent != null) {
     Intent i = pendingGleoIntent;
     pendingGleoIntent = null;
     deliverGleoIntent(i);
    }
   }


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

    if ("tel".equals(r.getUrl().getScheme())) {
     try {
      startActivity(new Intent(Intent.ACTION_DIAL, r.getUrl()));
     } catch (Exception e) {
      android.widget.Toast.makeText(
              MainActivity.this,
              "전화 앱이 없는 기기예요. 번호를 직접 눌러 확인해 주세요",
              android.widget.Toast.LENGTH_SHORT
      ).show();
     }
     return true;
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
                  || "/api/google/reviews".equals(path)
                  || "/api/google/summary".equals(path)
                  || path.startsWith("/api/tour/");


  allowed = allowed || "/api/ai/chat".equals(path);

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
   } else if (path.equals("/api/google/summary")) {
    timeout = 180000; // 로컬 AI(Ollama) 요약
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


 @Override protected void onNewIntent(Intent intent) {
  super.onNewIntent(intent);
  setIntent(intent);
  if (web != null) deliverGleoIntent(intent);
  else pendingGleoIntent=intent;
 }

 private void deliverGleoIntent(Intent intent) {
  if (intent == null) return;
  final String action=intent.getAction();
  if (!("CREATE_TRAVEL_ROUTE".equals(action) || "EDIT_TRAVEL_ROUTE".equals(action) || "SAVE_TRAVEL_ROUTE".equals(action))) return;
  String parameters=intent.getStringExtra("ACTION_PARAM");
  if (parameters == null) parameters="{}";
  try {
   // Some Gleo builds send JSON serialized twice.
   if (parameters.trim().startsWith("\"")) parameters=new org.json.JSONArray("["+parameters+"]").getString(0);
   new JSONObject(parameters);
  } catch(Exception e) {
   replyGleo(action,"fail","The action parameters are invalid.");
   return;
  }
  Log.i("ILDANGA_GLEO","received action="+action);
  String script="window.ildangaGleoDispatch("+JSONObject.quote(action)+","+JSONObject.quote(parameters)+")";
  web.evaluateJavascript(script, response -> {
   try {
    if (response==null || "null".equals(response)) throw new Exception("No JS reply");
    String decoded=new org.json.JSONArray("["+response+"]").getString(0);
    JSONObject data=new JSONObject(decoded);
    replyGleo(action,data.optString("status","fail"),data.optString("message","Action could not be completed."));
   } catch(Exception e) {
    Log.e("ILDANGA_GLEO","JS callback failed",e);
    replyGleo(action,"fail","The requested action could not be completed.");
   }
  });
 }

 private void replyGleo(String action,String status,String message) {
  try {
   JSONObject data=new JSONObject();
   data.put("functionName",action);
   data.put("status",status);
   data.put("message",message);
   Intent out=new Intent("ai.pleos.playground.intent.action.APP_ACTION_RESPONSE");
   out.putExtra("packageName",getPackageName());
   out.putExtra("response",data.toString());
   sendBroadcast(out);
   Log.i("ILDANGA_GLEO","callback "+status+" action="+action);
  } catch(Exception e){Log.e("ILDANGA_GLEO","Unable to send callback",e);}
 }

 @Override
 public void onBackPressed() {
  // 팝업 닫기 → 홈으로 → (이미 홈이면) 앱을 종료하지 않고 뒤로 숨김 (CCP Back 하드키 가이드)
  web.evaluateJavascript(
          "(function(){try{return window.g3BackHandled?window.g3BackHandled():(window.backToHome(),true)}catch(e){return false}})()",
          value -> { if (!"true".equals(value)) moveTaskToBack(true); }
  );
 }

 private void pushDriving(boolean restricted) {
  lastDriving = restricted;
  if (web != null) web.evaluateJavascript("window.g3SetDriving&&window.g3SetDriving(" + restricted + ")", null);
 }

 @Override
 protected void onStart() {
  super.onStart();
  if (driving == null) driving = new DrivingState(this, (restricted, active) -> pushDriving(restricted));
  driving.start();
 }

 @Override
 protected void onStop() {
  if (driving != null) driving.stop();
  super.onStop();
 }

 @Override
 protected void onDestroy() {
  if (loc != null) { loc.stop(); loc = null; }
  if (web != null) {
   web.destroy();
  }

  if (naviHelper != null) { naviHelper.release(); naviHelper=null; }
  navHandler.removeCallbacksAndMessages(null);
  super.onDestroy();
 }
}
