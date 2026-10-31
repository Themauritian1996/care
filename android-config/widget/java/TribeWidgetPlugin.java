package ca.tribu.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/* Pont entre l'app web et le widget d'écran d'accueil. */
@CapacitorPlugin(name = "TribeWidget")
public class TribeWidgetPlugin extends Plugin {
  static TribeWidgetPlugin inst;

  @Override public void load() { inst = this; }

  static void changed() { try { if (inst != null) inst.notifyListeners("changed", new JSObject()); } catch (Exception e) { } }

  @PluginMethod public void setConfig(PluginCall call) { QuickWidget.setCfg(getContext(), call.getString("json", "{}")); call.resolve(); }

  @PluginMethod public void drain(PluginCall call) { JSObject r = new JSObject(); r.put("json", QuickWidget.drain(getContext())); call.resolve(r); }

  @PluginMethod public void pin(PluginCall call) {
    JSObject r = new JSObject();
    boolean ok = false;
    try {
      AppWidgetManager m = AppWidgetManager.getInstance(getContext());
      if (Build.VERSION.SDK_INT >= 26 && m.isRequestPinAppWidgetSupported()) ok = m.requestPinAppWidget(new ComponentName(getContext(), QuickWidget.class), null, null);
    } catch (Exception e) { }
    r.put("ok", ok);
    call.resolve(r);
  }
}
