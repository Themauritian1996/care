# Tribe

L'app tout-en-un de la famille (« Tribu » en français, au choix) : suivi des enfants de la grossesse à 18 ans, agenda partagé, disponibilités, défis et récompenses, discussions et groupes, souvenirs et photo du jour, assistant IA facultatif. Français et anglais, thème clair et sombre.

- **Site web** : GitHub Pages (dossier `www`).
- **APK Android** : compilé automatiquement à chaque modification, dans *Releases* (`Tribe.apk`).

## Activer les comptes (Firebase)
1. Coller le bloc `firebaseConfig` dans `www/firebase-config.js`.
2. Mettre `google-services.json` dans `android-config/` (connexion Google dans l'APK).
3. Coller `firestore.rules` dans la console Firebase (Firestore > Règles > Publier).

Sans configuration, l'app fonctionne entièrement en local sur l'appareil.

## Signature de l'APK
La clé de signature n'est jamais dans le code : elle est lue depuis deux secrets GitHub (*Settings > Secrets and variables > Actions*) : `TRIBE_KEYSTORE` (le fichier .keystore encodé en base64) et `TRIBE_KEY_PASS` (son mot de passe). Sans ces secrets, l'APK est signé avec une clé temporaire.
