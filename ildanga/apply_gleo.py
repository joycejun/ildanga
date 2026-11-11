from pathlib import Path
import re, shutil
root=Path(__file__).resolve().parent
project=Path(__import__('sys').argv[1]).resolve() if len(__import__('sys').argv)>1 else Path.cwd()
main=project/'app/src/main/java/com/example/dateapp/MainActivity.java'
manifest=project/'app/src/main/AndroidManifest.xml'
js=project/'app/src/main/assets/app.js'
schema=project/'app/src/main/assets/schema.json'
for p in (main,manifest,js):
 if not p.is_file(): raise SystemExit(f'파일을 찾을 수 없습니다: {p} (ildanga 내부 Android 프로젝트 폴더를 지정하세요)')
a,b,c=main.read_text(encoding='utf-8'),manifest.read_text(encoding='utf-8'),js.read_text(encoding='utf-8')
if 'ildangaGleoDispatch' in c or 'deliverGleoIntent' in a: raise SystemExit('이미 Gleo 패치가 적용된 파일이 있습니다. 중복 적용하지 않았습니다.')
if 'public class MainActivity extends Activity' not in a or 'web.loadUrl(' not in a: raise SystemExit('MainActivity 버전이 예상과 달라서 안전하게 중단합니다.')
if 'function editCommand()' not in c or 'function persist()' not in c: raise SystemExit('app.js 버전이 예상과 달라서 안전하게 중단합니다.')
for p in (main,manifest,js): shutil.copy2(p,p.with_name(p.name+'.before-gleo.bak'))
# Original class, not a second Activity; deliver to JS after document loaded and while running.
a=a.replace('import android.net.Uri;', 'import android.net.Uri;\nimport org.json.JSONObject;\nimport android.util.Log;')
a=a.replace(' private WebView web;', ' private WebView web;\n private Intent pendingGleoIntent;')
a=a.replace('  web.setWebChromeClient(new WebChromeClient());','''  web.setWebChromeClient(new WebChromeClient());
  pendingGleoIntent = getIntent();''')
a=a.replace('  web.setWebViewClient(new WebViewClient() {','''  web.setWebViewClient(new WebViewClient() {
   @Override public void onPageFinished(WebView view, String url) {
    super.onPageFinished(view,url);
    if (pendingGleoIntent != null) {
     Intent i = pendingGleoIntent;
     pendingGleoIntent = null;
     deliverGleoIntent(i);
    }
   }
''')
insert='''
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
   if (parameters.trim().startsWith("\\\"")) parameters=new org.json.JSONArray("["+parameters+"]").getString(0);
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
'''
position=a.find(' @Override\n public void onBackPressed()')
if position<0:raise SystemExit('Java 삽입 위치를 찾을 수 없습니다')
a=a[:position]+insert+'\n'+a[position:]
# Add intent filter inside existing main activity; avoid altering existing launcher filter.
if 'android:name=".MainActivity"' not in b:raise SystemExit('Manifest Activity를 찾지 못했습니다')
filterxml='''
<intent-filter>
 <action android:name="CREATE_TRAVEL_ROUTE"/>
 <action android:name="EDIT_TRAVEL_ROUTE"/>
 <action android:name="SAVE_TRAVEL_ROUTE"/>
 <category android:name="android.intent.category.DEFAULT"/>
</intent-filter>
'''
b=b.replace('</activity>',filterxml+'</activity>',1)
b=b.replace('android:exported="true"','android:exported="true" android:launchMode="singleTop"',1)
# Direct action handler is independent of text-keyword demo assistant.
handler=r'''
// Gleo Interface: structured route operations. Never treat chat-only commands as a Gleo callback.
window.ildangaGleoDispatch=function(action,rawParams){
 try {
  const p=JSON.parse(rawParams||'{}');
  if(!p||Array.isArray(p)||typeof p!=='object')throw Error('Invalid parameters');
  if(action==='CREATE_TRAVEL_ROUTE'){
   const region=String(p.region||'').trim();
   const post=state.posts.find(x=>x.region===region&&Array.isArray(x.stops)&&x.stops.length>=2&&x.stops.every(k=>places[k]));
   if(!post)return JSON.stringify({status:'fail',message:'No available travel route was found for that region.'});
   state.route=[...post.stops];state.title=post.title;state.source=post.id;state.region=post.region;
   persist();if($('#modal').open)$('#modal').close();go('route');
   return JSON.stringify({status:'success',message:'The travel route for '+region+' is ready.'});
  }
  if(action==='EDIT_TRAVEL_ROUTE'){
   if(!Array.isArray(state.route)||state.route.length<2)return JSON.stringify({status:'fail',message:'There is no editable travel route.'});
   const operation=String(p.operation||'');let next=[...state.route];
   if(operation==='reverse'){next.reverse()}
   else if(operation==='swap'){
    const first=Number(p.first),second=Number(p.second);
    if(!Number.isInteger(first)||!Number.isInteger(second)||first<1||second<1||first>next.length||second>next.length||first===second)return JSON.stringify({status:'asking',message:'Two different valid stop numbers are required.'});
    [next[first-1],next[second-1]]=[next[second-1],next[first-1]];
   }else if(operation==='remove'){
    const index=Number(p.first);
    if(!Number.isInteger(index)||index<1||index>next.length||next.length<=2)return JSON.stringify({status:'asking',message:'A valid stop number is required and at least two stops must remain.'});
    next.splice(index-1,1);
   }else return JSON.stringify({status:'asking',message:'The operation must be reverse, swap, or remove.'});
   state.route=next;persist();if($('#modal').open)$('#modal').close();go('route');
   return JSON.stringify({status:'success',message:'The travel route has been updated.'});
  }
  if(action==='SAVE_TRAVEL_ROUTE'){
   if(!Array.isArray(state.route)||state.route.length<2)return JSON.stringify({status:'fail',message:'There is no route to save.'});
   const title=String(p.title||state.title||'My route').trim().slice(0,60);
   if(!title)return JSON.stringify({status:'asking',message:'A route name is required.'});
   const id='gleo'+Date.now();
   state.posts.push({id,title,region:state.region,author:'나',desc:'Gleo에서 저장한 코스',stops:[...state.route],likes:0,tags:'내 루트',mine:true,private:true});
   state.saved.push(id);persist();if($('#modal').open)$('#modal').close();go('saved');
   return JSON.stringify({status:'success',message:'The travel route has been saved.'});
  }
  return JSON.stringify({status:'fail',message:'Unsupported action.'});
 }catch(e){return JSON.stringify({status:'fail',message:'The travel request could not be processed.'});}
};
'''
c+='\n'+handler
# Schema generated with local package name, 3-action limit.
import json
package='com.example.dateapp'
# build.gradle might override applicationId, do not guess
build=(project/'app/build.gradle').read_text(encoding='utf-8')
m=re.search(r'applicationId\s+["\']([^"\']+)["\']',build)
if m:package=m.group(1)
spec={"packageName":package,"appDescription":"A travel route planner for building, editing, and saving multi-stop driving itineraries in Korea.","invokeWord":"일단가","version":"1.0.0","actionCalls":[
 {"type":"function","function":{"name":"CREATE_TRAVEL_ROUTE","description":"Select an available multi-stop travel route for a requested Korean region.","parameters":{"type":"object","properties":{"region":{"type":"string","description":"The Korean city or travel region for the route."}},"required":["region"]},"component":"activity"}},
 {"type":"function","function":{"name":"EDIT_TRAVEL_ROUTE","description":"Edit the active travel route by reversing the order, swapping two stops, or removing one stop.","parameters":{"type":"object","properties":{"operation":{"type":"string","enum":["reverse","swap","remove"],"description":"The route modification operation."},"first":{"type":"number","description":"The 1-based stop number used for swap or remove."},"second":{"type":"number","description":"The second 1-based stop number for swapping."}},"required":["operation"]},"component":"activity"}},
 {"type":"function","function":{"name":"SAVE_TRAVEL_ROUTE","description":"Save the active travel route to the user's local route collection.","parameters":{"type":"object","properties":{"title":{"type":"string","description":"Optional name for the saved travel route."}},"required":[]},"component":"activity"}}
 ]}
main.write_text(a,encoding='utf-8');manifest.write_text(b,encoding='utf-8');js.write_text(c,encoding='utf-8');schema.write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('적용 완료: MainActivity, AndroidManifest, app.js, schema.json')
print('기존 파일은 *.before-gleo.bak로 백업되었습니다.')
print('패키지명:',package)
