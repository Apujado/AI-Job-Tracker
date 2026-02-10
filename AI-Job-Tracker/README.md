
I'll help you structure this markdown for better readability and professionalism:

```markdown
# 🤖 AI Job Hunter Tracker

Automate your job search: Gmail → Gemini AI → Google Sheets → Airtable

Ce projet automatise la veille d'offres d'emploi. Un script récupère les alertes Gmail, les analyse avec l'IA Gemini, et les synchronise avec Airtable après validation manuelle.

## 🚀 Features

- **Intelligent Analysis**: Extracts job title, company, link, and calculates matching score using Gemini 1.5 Flash
- **Human Validation**: Job offers appear in Google Sheets and sync to Airtable only after manual approval
- **Cloud Native**: Runs entirely on Google Apps Script (no server required)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Platform | Google Apps Script, Google Sheets, Airtable |
| AI | Google Gemini API |
| Language | JavaScript |

## ⚙️ Installation

1. Create a project on [Google Apps Script](https://script.google.com/)
2. Copy code from `main.js`
3. Configure **Script Properties** with your API keys:
    - `GEMINI_API_KEY`
    - `AIRTABLE_API_KEY`
    - `AIRTABLE_BASE_ID`
4. Add a time-based trigger for the `agentEmploiAurelie` function
```
