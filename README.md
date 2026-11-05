# 🤖 AI Job Hunter Tracker — Pipeline d'Automatisation & Scoring IA

Un pipeline ETL Serverless intelligent qui automatise la veille d'opportunités professionnelles : extraction des alertes Gmail, analyse sémantique et scoring par LLM (Gemini 2.0 Flash), zone de validation (Google Sheets) et synchronisation event-driven vers Airtable.

---

## 🚀 Fonctionnalités Clés

- **Analyse Sémantique & NER :** Extraction automatique du titre de poste, de l'entreprise, du lien et des métadonnées clés via l'API Gemini.
- **Scoring Sur-Mesure (0–100) :** Évaluation stricte de l'adéquation de l'offre par rapport aux critères définis.
- **Filtrage Automatique :** Élimination immédiate des offres hors périmètre géographique ou des profils non ciblés (stages, alternances).
- **Architecture Human-in-the-Loop :** Zone de staging (Google Sheets) permettant une validation humaine avant injection finale.
- **Synchronisation Event-Driven :** Déclenchement automatique via trigger `onEdit` dès validation manuelle vers le CRM (Airtable).
- **Hébergement Serverless (0€) :** Exécution 24/7 fiable via Google Apps Script.

---

## 🛠️ Stack Technique

| Composant | Technologie | Rôle |
| :--- | :--- | :--- |
| **Plateforme** | Google Apps Script | Automatisation & Hébergement Serverless |
| **Moteur IA** | Google Gemini 2.0 Flash | Extraction d'entités (NER) & Scoring sémantique |
| **Staging Area** | Google Sheets | Interface de contrôle & Validation humaine |
| **CRM / Base finale** | Airtable API | Centralisation & Suivi des Leads |
| **Langage** | JavaScript (ES6+) | Logiciel & Intégration API |

---

## ⚙️ Architecture & Data Pipeline (ETL)

```text
[ Gmail Alerts ] ──> (Extract) ──> [ Apps Script ]
                                         │
                                   (Transform)
                                         │
                                  [ Gemini API ] (NER & Scoring JSON)
                                         │
                                         ▼
                                 [ Google Sheets ] (Staging Area)
                                         │
                                    (Human Check)
                                         │
                                   (Trigger Load)
                                         │
                                         ▼
                                  [ Airtable CRM ]
