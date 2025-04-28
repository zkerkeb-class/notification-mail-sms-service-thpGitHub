# Service de Notification (Email & SMS)

Service Node.js permettant d'envoyer des notifications par email (Brevo) et par SMS (simulation ou Twilio). Idéal pour les applications qui veulent notifier leurs utilisateurs facilement.

---

## 🚀 Fonctionnement

- **API REST** pour envoyer des emails et SMS
- **Templates HTML** personnalisables pour les emails
- **Historique** des notifications (stocké en local)
- **Simulation SMS** par défaut (aucun coût, juste logué)
- **Logs** détaillés dans `/logs/`

---

## ⚙️ Installation

### Prérequis
- Node.js >= 14
- pnpm >= 7
- Un compte [Brevo](https://www.brevo.com/fr/) (pour l'email)
- (Optionnel) Un compte Twilio si tu veux envoyer de vrais SMS

### 1. Installer les dépendances
```bash
pnpm install
```

### 2. Configurer les variables d'environnement
Crée un fichier `.env` à la racine du projet :

```env
PORT=3000
NODE_ENV=development

# Email (Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=ton-identifiant-smtp-brevo@smtp-brevo.com
SMTP_PASS=ton-mot-de-passe-smtp
EMAIL_FROM=ton-email-verifie@domaine.com

# SMS (simulation par défaut)
SMS_SIMULATION=true
```
- Pour `SMTP_USER` et `SMTP_PASS`, va dans Brevo > SMTP & API > SMTP.
- Pour `EMAIL_FROM`, utilise une adresse validée dans Brevo (voir "Expéditeurs" dans Brevo).

---

## 🏁 Démarrage

```bash
pnpm dev
```
L'API sera dispo sur [http://localhost:3000/api](http://localhost:3000/api).

---

## 📬 Utilisation de l'API

### Envoyer un email

```http
POST /api/notifications/email
Content-Type: application/json

{
  "to": "destinataire@example.com",
  "subject": "Bienvenue !",
  "template": "welcome",
  "data": {
    "userName": "John Doe",
    "verificationCode": "123456",
    "loginUrl": "https://example.com/login"
  }
}
```
- `template` correspond à un fichier dans `src/templates/email/` (ex: `welcome.html`)
- `data` contient les variables injectées dans le template

### Envoyer un SMS (simulation)

```http
POST /api/notifications/sms
Content-Type: application/json

{
  "to": "+33612345678",
  "message": "Votre code de vérification est : 123456"
}
```
- En mode simulation, le SMS est juste loggé côté serveur

### Historique des notifications

```http
GET /api/notifications/history
```
- Retourne la liste des notifications envoyées (stockées en local dans `/data/notifications.json`)

---

## 🛠️ Personnalisation

- **Templates d'email** : Ajoute/modifie les fichiers HTML dans `src/templates/email/`
- **Ajout d'un vrai service SMS** : Mets `SMS_SIMULATION=false` et configure Twilio dans le `.env`
- **Ajout d'expéditeurs** : Ajoute et valide d'autres emails dans Brevo

---

## 🧑‍💻 Exemples de requêtes PowerShell

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/notifications/email" -ContentType "application/json" -Body '{"to":"destinataire@example.com","subject":"Test","template":"welcome","data":{"userName":"John Doe","verificationCode":"123456","loginUrl":"https://example.com/login"}}'
```

---

## 📝 Remarques

- Les emails ne partiront que si l'expéditeur est validé dans Brevo
- Les SMS ne sont envoyés que si tu configures Twilio et désactives le mode simulation
- Les logs sont dans le dossier `/logs/`

---

Pour toute question ou amélioration, ouvre une issue ou contacte le mainteneur du projet ! 