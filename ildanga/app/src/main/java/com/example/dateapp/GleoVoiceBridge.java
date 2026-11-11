package com.example.dateapp;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import java.util.ArrayList;
import java.util.Locale;
import org.json.JSONObject;

/** Voice bridge for the Ildanga WebView: speech-to-text (SpeechRecognizer) and text-to-speech (TextToSpeech). */
public class GleoVoiceBridge {
  public static final int REQ_AUDIO = 7311;
  private final Activity act;
  private final WebView web;
  private SpeechRecognizer rec;
  private TextToSpeech tts;
  private boolean ttsReady = false;
  private boolean pendingStart = false;

  public GleoVoiceBridge(Activity activity, WebView webView) {
    this.act = activity;
    this.web = webView;
  }

  @JavascriptInterface
  public boolean isAvailable() {
    return SpeechRecognizer.isRecognitionAvailable(act);
  }

  @JavascriptInterface
  public void start() {
    act.runOnUiThread(new Runnable() { public void run() { startOnUi(); } });
  }

  @JavascriptInterface
  public void stop() {
    act.runOnUiThread(new Runnable() { public void run() { stopOnUi(); } });
  }

  @JavascriptInterface
  public void speak(final String text) {
    if (text == null || text.length() == 0 || text.length() > 600) return;
    act.runOnUiThread(new Runnable() { public void run() { speakOnUi(text); } });
  }

  public void onPermissionResult(int requestCode, int[] results) {
    if (requestCode != REQ_AUDIO) return;
    boolean ok = results != null && results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
    if (pendingStart && ok) { pendingStart = false; begin(); }
    else if (pendingStart) { pendingStart = false; js("__g3VoiceError('denied')"); }
  }

  public void destroy() {
    stopOnUi();
    if (tts != null) { tts.stop(); tts.shutdown(); tts = null; ttsReady = false; }
  }

  private void startOnUi() {
    if (!SpeechRecognizer.isRecognitionAvailable(act)) { js("__g3VoiceError('unavailable')"); return; }
    if (act.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      pendingStart = true;
      act.requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, REQ_AUDIO);
      return;
    }
    begin();
  }

  private void begin() {
    stopOnUi();
    if (tts != null) tts.stop();
    rec = SpeechRecognizer.createSpeechRecognizer(act);
    rec.setRecognitionListener(new RecognitionListener() {
      public void onReadyForSpeech(Bundle p) { js("__g3VoiceState('listening')"); }
      public void onBeginningOfSpeech() {}
      public void onRmsChanged(float rms) {}
      public void onBufferReceived(byte[] b) {}
      public void onEndOfSpeech() { js("__g3VoiceState('processing')"); }
      public void onError(int code) { js("__g3VoiceError(" + JSONObject.quote("code" + code) + ")"); }
      public void onResults(Bundle r) {
        ArrayList<String> list = r.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        String t = (list != null && !list.isEmpty()) ? list.get(0) : "";
        js("__g3VoiceResult(" + JSONObject.quote(t) + ")");
      }
      public void onPartialResults(Bundle r) {
        ArrayList<String> list = r.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (list != null && !list.isEmpty()) js("__g3VoicePartial(" + JSONObject.quote(list.get(0)) + ")");
      }
      public void onEvent(int type, Bundle p) {}
    });
    Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR");
    i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
    i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
    rec.startListening(i);
  }

  private void stopOnUi() {
    pendingStart = false;
    if (rec != null) {
      try { rec.cancel(); rec.destroy(); } catch (Exception ignored) {}
      rec = null;
    }
  }

  private void speakOnUi(final String text) {
    if (tts == null) {
      tts = new TextToSpeech(act, new TextToSpeech.OnInitListener() {
        public void onInit(int status) {
          if (status == TextToSpeech.SUCCESS) {
            tts.setLanguage(Locale.KOREAN);
            ttsReady = true;
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "g3");
          }
        }
      });
      return;
    }
    if (ttsReady) tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "g3");
  }

  private void js(final String call) {
    web.post(new Runnable() {
      public void run() {
        web.evaluateJavascript("if(window." + call.substring(0, call.indexOf('(')) + ")window." + call, null);
      }
    });
  }
}
