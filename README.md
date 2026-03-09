
# 🤖 AI Job Hunter Tracker

**Automate your job search: Gmail → Gemini AI → Google Sheets → Airtable**

Ce projet automatise la veille d'offres d'emploi. Un script récupère les alertes Gmail, les analyse avec l'IA Gemini 2.0 Flash, et les synchronise avec Airtable après une validation manuelle.

---

## 🚀 Features

* **Intelligent Analysis**: Analyse sémantique des offres pour extraire le titre, l'entreprise et le lien.
* **Custom Scoring**: Calcul d'un score de matching strict (0-100).
* **Automated Filters**: Élimination immédiate des offres hors zone ou non pertinentes (Stages, Alternances).
* **Human-in-the-Loop**: Les offres apparaissent dans Google Sheets (Staging Area). La synchro vers Airtable ne se déclenche qu'après coche manuelle.
* **Serverless**: Fonctionne 24h/24 via Google Apps Script (sans frais d'hébergement).

---

## 🛠️ Tech Stack

| Composant | Technologie | Rôle |
| :--- | :--- | :--- |
| **Platform** | Google Apps Script | Automatisation & Hébergement |
| **AI Model** | Google Gemini 2.0 Flash | NER (Extraction d'entités) & Scoring |
| **Staging** | Google Sheets | Visualisation & Validation Humaine |
| **CRM** | Airtable API | Gestion finale des Leads |
| **Language** | JavaScript (ES6+) | Développement |

---

## ⚙️ Architecture & Data Pipeline

Le script suit une logique de pipeline **ETL** (Extract, Transform, Load) :

1.  **Extraction (E)** : Monitoring des threads Gmail via `GmailApp` avec filtrage par Label.
2.  **Transformation (T)** : 
    * Nettoyage du corps du mail et analyse via l'API Gemini.
    * **Déduplication** : Utilisation d'une clé composite `titre|entreprise` pour éviter les doublons.
3.  **Validation & Chargement (L)** : 
    * Injection en Staging Area (Sheets).
    * **Event-Driven Sync** : Utilisation du trigger `onEdit(e)` pour pousser les données vers Airtable uniquement après validation.

---

## 🛡️ Installation & Setup

1.  Créez un projet sur [Google Apps Script](https://script.google.com/).
2.  Copiez le contenu de `main.js`.
3.  Configurez les **Script Properties** avec vos clés :
    * `GEMINI_API_KEY`
    * `AIRTABLE_API_KEY`
    * `AIRTABLE_BASE_ID`
4.  Ajoutez un trigger temporel (ex: toutes les heures) sur la fonction `agentEmploiAurelie`.
5.  Prévoyez une case à cocher en colonne **H** de votre feuille Google Sheets.

---

## 📝 Key Learnings
* Maîtrise du **Prompt Engineering** pour obtenir un JSON valide en sortie d'IA.
* Gestion des secrets et des variables d'environnement.
* Manipulation d'APIs tierces (REST) et gestion des payloads JSON.