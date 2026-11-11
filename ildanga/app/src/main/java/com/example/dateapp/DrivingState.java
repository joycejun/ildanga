package com.example.dateapp;

import android.content.ComponentName;
import android.content.Context;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.util.Log;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * Reads the vehicle's driving restriction (android.car CarUxRestrictions) WITHOUT compiling against car-lib.
 * Everything is reflection + try/catch: on phones / emulators without the Car service it simply reports
 * "not restricted" and the app behaves as before.
 *
 * Callback runs on the main thread. restricted == CarUxRestrictions.isRequiresDistractionOptimization().
 */
public class DrivingState {
 public interface Listener { void onChanged(boolean restricted, int activeRestrictions); }

 private static final String TAG = "ILDANGA_DRIVING";
 private final Context ctx;
 private final Listener listener;
 private final android.os.Handler main = new android.os.Handler(android.os.Looper.getMainLooper());
 private Object car;
 private Object manager;
 private Object proxyListener;
 private boolean last = false;
 private int lastActive = 0;
 private boolean started = false;

 public DrivingState(Context ctx, Listener listener) {
  this.ctx = ctx.getApplicationContext() != null ? ctx.getApplicationContext() : ctx;
  this.listener = listener;
 }

 public boolean isRestricted() { return last; }
 public int activeRestrictions() { return lastActive; }

 public void start() {
  if (started) return;
  started = true;
  try {
   Class<?> carClass = Class.forName("android.car.Car");
   final Method createCar = carClass.getMethod("createCar", Context.class, ServiceConnection.class);
   ServiceConnection conn = new ServiceConnection() {
    @Override public void onServiceConnected(ComponentName name, IBinder service) { attach(carClass); }
    @Override public void onServiceDisconnected(ComponentName name) { manager = null; publish(false, 0); }
   };
   car = createCar.invoke(null, ctx, conn);
   carClass.getMethod("connect").invoke(car);
  } catch (Throwable t) {
   // No android.car on this device: nothing to restrict.
   Log.i(TAG, "Car service unavailable: " + t.getClass().getSimpleName());
   car = null;
  }
 }

 private void attach(Class<?> carClass) {
  try {
   String serviceName = (String) carClass.getField("CAR_UX_RESTRICTION_SERVICE").get(null);
   manager = carClass.getMethod("getCarManager", String.class).invoke(car, serviceName);
   if (manager == null) return;
   Class<?> mgrClass = Class.forName("android.car.drivingstate.CarUxRestrictionsManager");
   final Class<?> listenerIface = Class.forName("android.car.drivingstate.CarUxRestrictionsManager$OnUxRestrictionsChangedListener");
   proxyListener = Proxy.newProxyInstance(listenerIface.getClassLoader(), new Class<?>[]{listenerIface}, new InvocationHandler() {
    @Override public Object invoke(Object proxy, Method method, Object[] args) {
     if ("onUxRestrictionsChanged".equals(method.getName()) && args != null && args.length == 1) read(args[0]);
     return null;
    }
   });
   mgrClass.getMethod("registerListener", listenerIface).invoke(manager, proxyListener);
   Object current = mgrClass.getMethod("getCurrentCarUxRestrictions").invoke(manager);
   if (current != null) read(current);
  } catch (Throwable t) {
   Log.w(TAG, "Could not attach to CarUxRestrictionsManager", t);
  }
 }

 private void read(Object restrictions) {
  try {
   Class<?> c = restrictions.getClass();
   boolean requires = (Boolean) c.getMethod("isRequiresDistractionOptimization").invoke(restrictions);
   int active = (Integer) c.getMethod("getActiveRestrictions").invoke(restrictions);
   publish(requires, active);
  } catch (Throwable t) {
   Log.w(TAG, "Could not read CarUxRestrictions", t);
  }
 }

 private void publish(final boolean restricted, final int active) {
  main.post(new Runnable() {
   @Override public void run() {
    last = restricted;
    lastActive = active;
    listener.onChanged(restricted, active);
   }
  });
 }

 public void stop() {
  started = false;
  try {
   if (manager != null && proxyListener != null) {
    Class<?> mgrClass = Class.forName("android.car.drivingstate.CarUxRestrictionsManager");
    mgrClass.getMethod("unregisterListener").invoke(manager);
   }
  } catch (Throwable ignored) { }
  try { if (car != null) car.getClass().getMethod("disconnect").invoke(car); } catch (Throwable ignored) { }
  manager = null; proxyListener = null; car = null;
 }
}
