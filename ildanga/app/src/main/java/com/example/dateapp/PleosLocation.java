package com.example.dateapp;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Collection;

/**
 * 현재 위치 공급자 (일단가 v3.18).
 *
 * 순서:  1) Pleos FusedLocation SDK (차량 위치)  →  2) 안드로이드 LocationManager (에뮬레이터/폰)  →  3) 없음(JS가 기본 위치 사용)
 *
 * Pleos SDK 는 리플렉션으로 호출해요. 공식 문서에서 메서드 시그니처를 전부 확인하지 못했기 때문에,
 * SDK 의 이름/인자 형태가 조금 달라도 앱이 컴파일 오류로 멈추지 않고, 안 되면 2)로 자동 전환돼요.
 * (SDK 가 없어도 컴파일·실행 모두 문제 없음)
 */
class PleosLocation {
    interface Sink { void onLocation(double lat, double lng, String source); }

    static final int REQ_PERMISSION = 7311;
    private static final String[] CLASS_CANDIDATES = {
            "ai.pleos.playground.location.fused.FusedLocation",
            "ai.pleos.playground.fusedlocation.FusedLocation",
            "ai.pleos.playground.location.FusedLocation",
            "ai.pleos.playground.fused.FusedLocation"
    };

    private final Activity act;
    private final Sink sink;
    private final Handler main = new Handler(Looper.getMainLooper());
    private Object fused;                 // Pleos FusedLocation 인스턴스 (없으면 null)
    private boolean pleosFix = false;     // Pleos 에서 좌표를 한 번이라도 받았는지
    private boolean wantAndroid = false;
    private LocationListener androidListener;

    PleosLocation(Activity act, Sink sink) { this.act = act; this.sink = sink; }

    /** 한 번 위치를 요청해요. 결과는 sink 로 (여러 번 올 수 있음). */
    void request() {
        pleosFix = false;
        boolean started = startPleos();
        // Pleos 에서 3초 안에 좌표가 없으면 안드로이드 위치로 전환
        main.postDelayed(() -> { if (!pleosFix) startAndroid(); }, started ? 3000 : 0);
    }

    void stop() {
        main.removeCallbacksAndMessages(null);
        if (fused != null) {
            try { invokeSmart(fused, "unregisterFusedLocationCallback"); } catch (Throwable ignored) {}
            try { invokeSmart(fused, "release"); } catch (Throwable ignored) {}
            fused = null;
        }
        if (androidListener != null) {
            try { ((LocationManager) act.getSystemService(Context.LOCATION_SERVICE)).removeUpdates(androidListener); } catch (Throwable ignored) {}
            androidListener = null;
        }
    }

    void onPermissionResult(int code, int[] results) {
        if (code != REQ_PERMISSION) return;
        if (results != null && results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED && wantAndroid) startAndroid();
    }

    // ------------------------------------------------------------------ Pleos FusedLocation (reflection)
    private boolean startPleos() {
        try {
            if (fused == null) {
                Class<?> c = null;
                for (String n : CLASS_CANDIDATES) { try { c = Class.forName(n); break; } catch (ClassNotFoundException ignored) {} }
                if (c == null) return false;
                Object inst = null;
                for (Constructor<?> k : c.getConstructors()) {
                    Class<?>[] p = k.getParameterTypes();
                    if (p.length == 0) { inst = k.newInstance(); break; }
                    if (p.length == 1 && p[0].isAssignableFrom(act.getClass())) { inst = k.newInstance(act); break; }
                    if (p.length == 1 && p[0].isAssignableFrom(Context.class)) { inst = k.newInstance(act.getApplicationContext()); break; }
                }
                if (inst == null) return false;
                fused = inst;
            }
            Object sup = invokeSmart(fused, "isSupported");
            if (sup instanceof Boolean && !((Boolean) sup)) return false;
            invokeSmart(fused, "initialize");
            invokeSmart(fused, "registerFusedLocationCallback");
            Object last = invokeSmart(fused, "getLastKnownLocation");   // 값으로 돌려주는 형태일 수도, 콜백으로 주는 형태일 수도 있음
            deliverFrom(last, "pleos");
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    /** name 과 같은 이름의 메서드를 찾아, 인자를 타입에 맞춰 채워 호출. (Context→Activity, 인터페이스→콜백 프록시) */
    private Object invokeSmart(Object target, String name) throws Throwable {
        Throwable last = null;
        for (Method m : target.getClass().getMethods()) {
            if (!m.getName().equals(name)) continue;
            Class<?>[] pt = m.getParameterTypes();
            Object[] args = new Object[pt.length];
            boolean ok = true;
            for (int i = 0; i < pt.length && ok; i++) {
                Class<?> t = pt[i];
                if (t.isAssignableFrom(act.getClass())) args[i] = act;
                else if (t.isAssignableFrom(Context.class)) args[i] = act.getApplicationContext();
                else if (t.isInterface()) args[i] = callbackProxy(t);
                else if (t == boolean.class) args[i] = Boolean.FALSE;
                else if (t == int.class) args[i] = 0;
                else if (t == long.class) args[i] = 0L;
                else if (t == float.class) args[i] = 0f;
                else if (t == double.class) args[i] = 0d;
                else ok = false;
            }
            if (!ok) continue;
            try { return m.invoke(target, args); } catch (Throwable e) { last = e.getCause() != null ? e.getCause() : e; }
        }
        if (last != null) throw last;
        return null;
    }

    private Object callbackProxy(Class<?> iface) {
        InvocationHandler h = (proxy, method, args) -> {
            if (method.getDeclaringClass() == Object.class) {
                switch (method.getName()) { case "hashCode": return System.identityHashCode(proxy); case "equals": return proxy == args[0]; default: return "g3-callback"; }
            }
            if (args != null) for (Object a : args) deliverFrom(a, "pleos");
            Class<?> r = method.getReturnType();
            if (r == boolean.class) return false;
            if (r == int.class) return 0;
            if (r == long.class) return 0L;
            if (r == float.class) return 0f;
            if (r == double.class) return 0d;
            return null;
        };
        return Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[]{iface}, h);
    }

    /** 객체에서 위도/경도를 꺼내요 (getLatitude/getLongitude, getLat/getLng, 필드, getLocation(), 컬렉션 지원). */
    private void deliverFrom(Object o, String source) {
        double[] ll = extract(o, 0);
        if (ll == null) return;
        if ("pleos".equals(source)) pleosFix = true;
        final double lat = ll[0], lng = ll[1];
        main.post(() -> sink.onLocation(lat, lng, source));
    }

    private static double[] extract(Object o, int depth) {
        if (o == null || depth > 2) return null;
        try {
            if (o instanceof Location) return new double[]{((Location) o).getLatitude(), ((Location) o).getLongitude()};
            if (o instanceof Collection) { Object last = null; for (Object x : (Collection<?>) o) last = x; return extract(last, depth + 1); }
            Double la = num(o, "getLatitude", "getLat", "latitude", "lat"), lo = num(o, "getLongitude", "getLng", "getLon", "longitude", "lng", "lon");
            if (la != null && lo != null && valid(la, lo)) return new double[]{la, lo};
            for (String g : new String[]{"getLocation", "getLocationData", "getData", "getValue"}) {
                try { Object inner = o.getClass().getMethod(g).invoke(o); double[] r = extract(inner, depth + 1); if (r != null) return r; } catch (Throwable ignored) {}
            }
        } catch (Throwable ignored) {}
        return null;
    }

    private static boolean valid(double la, double lo) { return la >= -90 && la <= 90 && lo >= -180 && lo <= 180 && !(la == 0 && lo == 0); }

    private static Double num(Object o, String... names) {
        for (String n : names) {
            try { Object v = o.getClass().getMethod(n).invoke(o); if (v instanceof Number) return ((Number) v).doubleValue(); } catch (Throwable ignored) {}
            try { Object v = o.getClass().getField(n).get(o); if (v instanceof Number) return ((Number) v).doubleValue(); } catch (Throwable ignored) {}
        }
        return null;
    }

    // ------------------------------------------------------------------ Android LocationManager 대체 경로
    private void startAndroid() {
        wantAndroid = true;
        try {
            if (act.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                    && act.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                act.requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_PERMISSION);
                return;
            }
            LocationManager lm = (LocationManager) act.getSystemService(Context.LOCATION_SERVICE);
            if (lm == null) return;
            Location best = null;
            for (String p : lm.getProviders(true)) {
                Location l = lm.getLastKnownLocation(p);
                if (l != null && (best == null || l.getTime() > best.getTime())) best = l;
            }
            if (best != null) deliverFrom(best, "android");
            if (androidListener == null) {
                androidListener = new LocationListener() {
                    @Override public void onLocationChanged(Location l) { deliverFrom(l, "android"); }
                    @Override public void onStatusChanged(String p, int s, Bundle e) {}
                    @Override public void onProviderEnabled(String p) {}
                    @Override public void onProviderDisabled(String p) {}
                };
                for (String p : new String[]{LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER}) {
                    try { if (lm.isProviderEnabled(p)) lm.requestLocationUpdates(p, 5000L, 50f, androidListener, Looper.getMainLooper()); } catch (Throwable ignored) {}
                }
            }
        } catch (Throwable ignored) {}
    }
}
