# Ajoute le widget « prise rapide » au projet Android généré par Capacitor.
import shutil, pathlib
src = pathlib.Path(__file__).parent
app = pathlib.Path("android/app/src/main")
java = app / "java/ca/tribu/app"; java.mkdir(parents=True, exist_ok=True)
for f in (src / "java").glob("*.java"): shutil.copy(f, java / f.name)
for f in (src / "res").rglob("*"):
    if f.is_file():
        d = app / "res" / f.relative_to(src / "res"); d.parent.mkdir(parents=True, exist_ok=True); shutil.copy(f, d)
m = app / "AndroidManifest.xml"; s = m.read_text()
if "QuickWidget" not in s:
    s = s.replace("</application>", """    <receiver android:name=".QuickWidget" android:exported="true" android:label="Tribe">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/quick_widget_info" />
        </receiver>
    </application>""", 1)
    m.write_text(s)
print("Widget ajouté")
