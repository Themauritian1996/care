package ca.tribu.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.text.format.DateFormat;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Date;

/* Widget « prise rapide » de Tribe : chaque toucher est mis en file ; l'app crée les entrées. */
public class QuickWidget extends AppWidgetProvider {
  static final String PREFS = "tribe_widget";
  static final String TAP = "ca.tribu.app.WIDGET_TAP";
  static final String CYCLE = "ca.tribu.app.WIDGET_CYCLE";

  static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
  static JSONObject cfg(Context c) { try { return new JSONObject(prefs(c).getString("cfg", "{}")); } catch (Exception e) { return new JSONObject(); } }
  static JSONArray queue(Context c) { try { return new JSONArray(prefs(c).getString("queue", "[]")); } catch (Exception e) { return new JSONArray(); } }
  static String tx(JSONObject cfg, String k, String def) { JSONObject t = cfg.optJSONObject("txt"); return t != null ? t.optString(k, def) : def; }
  static String hm(Context c, long ms) { return DateFormat.getTimeFormat(c).format(new Date(ms)); }
  static String dur(long ms) { long m = Math.max(1, Math.round(ms / 60000.0)); return m < 60 ? m + " min" : (m / 60) + " h " + String.format("%02d", m % 60); }

  static synchronized void setCfg(Context c, String json) { prefs(c).edit().putString("cfg", json).apply(); updateAll(c); }
  static synchronized String drain(Context c) { String q = prefs(c).getString("queue", "[]"); prefs(c).edit().putString("queue", "[]").apply(); return q; }

  static int kidIdx(Context c, int n) { return n == 0 ? 0 : Math.floorMod(prefs(c).getInt("kidIdx", 0), n); }

  static PendingIntent bcast(Context c, String action, int code, int idx) {
    Intent i = new Intent(c, QuickWidget.class).setAction(action).putExtra("i", idx);
    return PendingIntent.getBroadcast(c, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }

  static void updateAll(Context c) {
    AppWidgetManager m = AppWidgetManager.getInstance(c);
    int[] ids = m.getAppWidgetIds(new ComponentName(c, QuickWidget.class));
    if (ids != null && ids.length > 0) m.updateAppWidget(ids, build(c));
  }

  static RemoteViews build(Context c) {
    String pkg = c.getPackageName();
    RemoteViews v = new RemoteViews(pkg, R.layout.widget_quick);
    JSONObject cfg = cfg(c);
    Intent open = c.getPackageManager().getLaunchIntentForPackage(pkg);
    if (open != null) v.setOnClickPendingIntent(R.id.w_open, PendingIntent.getActivity(c, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
    v.setTextViewText(R.id.w_open, tx(cfg, "open", "Ouvrir"));
    v.removeAllViews(R.id.w_row1);
    v.removeAllViews(R.id.w_row2);
    JSONArray kids = cfg.optJSONArray("kids");
    if (kids == null || kids.length() == 0) {
      v.setTextViewText(R.id.w_kid, "Tribe");
      v.setTextViewText(R.id.w_status, tx(cfg, "setup", "Ouvrez Tribe pour choisir les boutons du widget"));
      if (open != null) v.setOnClickPendingIntent(R.id.w_kid, PendingIntent.getActivity(c, 3, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
      v.setViewVisibility(R.id.w_row2, View.GONE);
      return v;
    }
    JSONObject kid = kids.optJSONObject(kidIdx(c, kids.length()));
    v.setTextViewText(R.id.w_kid, kid.optString("name") + (kids.length() > 1 ? "  ⇄" : ""));
    v.setOnClickPendingIntent(R.id.w_kid, bcast(c, CYCLE, 2, -1));
    JSONObject run = kid.optJSONObject("run");
    JSONArray btns = kid.optJSONArray("buttons");
    int n = btns == null ? 0 : Math.min(8, btns.length());
    String runLabel = null;
    for (int i = 0; i < n; i++) {
      JSONObject b = btns.optJSONObject(i);
      RemoteViews bv = new RemoteViews(pkg, R.layout.widget_btn);
      bv.setTextViewText(R.id.w_emoji, b.optString("e"));
      bv.setTextViewText(R.id.w_label, b.optString("l"));
      boolean on = run != null && b.optString("key").equals(run.optString("key"));
      if (on) {
        runLabel = b.optString("l");
        bv.setInt(R.id.w_btn, "setBackgroundResource", R.drawable.widget_btn_on);
        long base = SystemClock.elapsedRealtime() - (System.currentTimeMillis() - run.optLong("start"));
        bv.setChronometer(R.id.w_chrono, base, null, true);
        bv.setViewVisibility(R.id.w_chrono, View.VISIBLE);
        bv.setViewVisibility(R.id.w_label, View.GONE);
      }
      bv.setOnClickPendingIntent(R.id.w_btn, bcast(c, TAP, 100 + i, i));
      v.addView(n > 4 && i >= (n + 1) / 2 ? R.id.w_row2 : R.id.w_row1, bv);
    }
    v.setViewVisibility(R.id.w_row2, n > 4 ? View.VISIBLE : View.GONE);
    String status = runLabel != null
      ? tx(cfg, "running", "{l} en cours depuis {h} · touchez pour arrêter").replace("{l}", runLabel).replace("{h}", hm(c, run.optLong("start")))
      : prefs(c).getString("last_" + kid.optString("id"), tx(cfg, "tap", "Touchez un bouton pour noter"));
    v.setTextViewText(R.id.w_status, status);
    return v;
  }

  static JSONObject ev(String op, String kid, String key, long t) throws Exception {
    return new JSONObject().put("op", op).put("kid", kid).put("key", key).put("t", t);
  }

  static synchronized void tap(Context c, int i) {
    try {
      JSONObject cfg = cfg(c);
      JSONArray kids = cfg.optJSONArray("kids");
      if (kids == null || kids.length() == 0) return;
      JSONObject kid = kids.optJSONObject(kidIdx(c, kids.length()));
      JSONArray btns = kid.optJSONArray("buttons");
      if (btns == null || i < 0 || i >= btns.length()) return;
      JSONObject b = btns.optJSONObject(i);
      String key = b.optString("key"), label = b.optString("l"), kidId = kid.optString("id");
      long now = System.currentTimeMillis();
      JSONArray q = queue(c);
      JSONObject run = kid.optJSONObject("run");
      String msg;
      if (b.optBoolean("timer")) {
        if (run != null && key.equals(run.optString("key"))) {
          q.put(ev("stop", kidId, key, now).put("start", run.optLong("start")));
          kid.remove("run");
          msg = tx(cfg, "stopped", "{l} : {d} noté").replace("{l}", label).replace("{d}", dur(now - run.optLong("start")));
        } else {
          if (run != null) q.put(ev("stop", kidId, run.optString("key"), now).put("start", run.optLong("start")));
          q.put(ev("start", kidId, key, now));
          kid.put("run", new JSONObject().put("key", key).put("start", now));
          msg = tx(cfg, "started", "{l} : minuterie lancée à {h}").replace("{l}", label).replace("{h}", hm(c, now));
        }
      } else {
        q.put(ev("log", kidId, key, now));
        msg = tx(cfg, "logged", "{l} noté · {h}").replace("{l}", label).replace("{h}", hm(c, now));
      }
      prefs(c).edit().putString("cfg", cfg.toString()).putString("queue", q.toString()).putString("last_" + kidId, msg).apply();
      Toast.makeText(c, msg, Toast.LENGTH_SHORT).show();
    } catch (Exception e) { /* ignoré */ }
    updateAll(c);
    TribeWidgetPlugin.changed();
  }

  @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) { m.updateAppWidget(ids, build(c)); }

  @Override public void onReceive(Context c, Intent in) {
    super.onReceive(c, in);
    String a = in.getAction();
    if (TAP.equals(a)) tap(c, in.getIntExtra("i", -1));
    else if (CYCLE.equals(a)) { prefs(c).edit().putInt("kidIdx", prefs(c).getInt("kidIdx", 0) + 1).apply(); updateAll(c); }
  }
}
