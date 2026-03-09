// ==========================================
// CONFIGURATION - VARIABLES RÉCUPÉRÉES
// ==========================================
const props = PropertiesService.getScriptProperties();
const GEMINI_API_KEY = props.getProperty('GEMINI_API_KEY');
const AIRTABLE_API_KEY = props.getProperty('AIRTABLE_API_KEY');
const AIRTABLE_BASE_ID = props.getProperty('AIRTABLE_BASE_ID');

/**
 * FONCTION PRINCIPALE : Analyse Gmail et remplit le Sheets
 */
function agentEmploiAurelie() {
  const label = GmailApp.getUserLabelByName("Emploi_Veille");
  if (!label) {
    console.error("Label 'Emploi_Veille' non trouvé !");
    return;
  }
  
  const threads = label.getThreads(0, 5); 
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 1. Récupération sécurisée des clés existantes (pour éviter les doublons)
  const lastRow = sheet.getLastRow();
  let clesExistantes = [];
  if (lastRow > 0) {
    const dataExisante = sheet.getRange(1, 1, lastRow, 8).getValues();
    clesExistantes = dataExisante.map(row => (row[2] + "|" + row[3]).toLowerCase());
  }

  threads.forEach(thread => {
    const msg = thread.getMessages()[0];
    const corpsMail = msg.getPlainBody().substring(0, 5000);
    
    try {
      const listeAnalyses = appelerGemini(corpsMail);
      
      if (listeAnalyses && Array.isArray(listeAnalyses)) {
        listeAnalyses.forEach(offre => {
          const cleOffre = (offre.titre + "|" + offre.entreprise).toLowerCase();

          // 2. Filtre : Score >= 40 ET pas un doublon
          if (offre.score >= 40) {
            if (clesExistantes.indexOf(cleOffre) === -1) {
              sheet.appendRow([
                new Date(), 
                "Gmail/Alerte", 
                offre.titre, 
                offre.entreprise, 
                offre.score + "/100", 
                offre.raison, 
                offre.lien, 
                false // Case à cocher (H)
              ]);
              clesExistantes.push(cleOffre); // Ajout immédiat pour éviter doublon dans le même run
            } else {
              console.log("Doublon ignoré : " + offre.titre);
            }
          }
        });
        thread.removeLabel(label); // On enlève le label une fois traité
      }
    } catch (e) { 
      console.error("Erreur boucle Gmail: " + e); 
    }
  });
}

/**
 * DÉCLENCHEUR : Envoi vers Airtable lors du clic sur la case à cocher
 */
function onEdit(e) {
  const range = e.range;
  const col = range.getColumn();
  const val = e.value;
  
  // On cible la colonne H (8) et la valeur TRUE (cochée)
  if (col == 8 && val == "TRUE") {
    const sheet = range.getSheet();
    const row = range.getRow();
    const rowData = sheet.getRange(row, 1, 1, 8).getValues()[0];
    
    const dateBrute = new Date(rowData[0]);
    const dateISO = isNaN(dateBrute.getTime()) ? new Date().toISOString().split('T')[0] : dateBrute.toISOString().split('T')[0];

    const payload = {
      "fields": {
        "fldy59sLlc1XnGD6M": rowData[3] ? rowData[3].toString() : "Inconnu",
        "fldC42DogSd8vs7it": dateISO,
        "fldOYaDfPIvL4dNYu": rowData[6] ? rowData[6].toString() : "",
        "fldZoyxPbxazd8YLh": "Poste: " + rowData[2] + " | " + rowData[5],
        "fldlGt77PPNnFEwcm": "Liste ",
        "fldOaYb8Mn8tRAVuz": "Offre Freelance"
      },
      "typecast": true 
    };
    
    const success = pushToAirtable(payload);
    if (success) {
      range.setValue("ENVOYÉ ✅"); 
      SpreadsheetApp.getActiveSpreadsheet().toast("🚀 Reçu dans Airtable !");
    } else {
      range.setValue(false); // Décoche en cas d'échec
      SpreadsheetApp.getActiveSpreadsheet().toast("❌ Erreur API Airtable");
    }
  }
}

/**
 * SERVICE : Envoi API Airtable
 */
function pushToAirtable(payload) {
  const tableId = "tbluSUrzLQ907x0TS"; 
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`;
  const options = {
    "method": "post",
    "headers": {
      "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  const response = UrlFetchApp.fetch(url, options);
  return response.getResponseCode() === 200;
}

/**
 * SERVICE : Appel Intelligence Artificielle Gemini 2.0
 */
function appelerGemini(texteOffre) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;
  
  const prompt = `
Tu es un Headhunter Data spécialisé dans les profils Business Analyst & Data Analytics. 
    Ton objectif est de filtrer l'offre suivante avec une exigence maximale. 

    FILTRES EXCLUSIFS (Élimine immédiatement si présent) :
    - Mention "Stage", "Alternance", "Apprentissage" ou "Graduate Program".
    - Profils purement Data Scientist (ML, Deep Learning dominant) ou Data Engineer (Infrastructures pures).
    - Localisation hors zone : Si ce n'est PAS (Annecy, Genève, Lyon, Grenoble, ou 100% Remote).

    ANALYSE DES CRITÈRES CLÉS :
    1. Rôle : Priorité au Business Data Analyst / BI Analyst capable de faire le pont Métier-Technique.
    2. Stack Technique : SQL (Indispensable), Power BI/DAX (Gros bonus), Modélisation (Star Schema).
    3. Niveau d'autonomie : Cherche des mots-clés comme "Recettage", "Gouvernance", "Accompagnement", "Déploiement".

    SYSTÈME DE SCORING STRICT :
    - 95-100 : MATCH PARFAIT (Freelance, Power BI, Remote ou Annecy/Genève).
    - 80-94 : TRÈS PERTINENT (CDI Cadre, Stack SQL/BI solide, Localisation cible).
    - 50-79 : POTENTIEL (Data Analyst avec Tableau/Qlik mais forte dimension Business/SQL).
    - 0-49 : REJET (Outil de dataviz inconnu, pas de SQL, ou localisation trop éloignée).

    FORMAT DE RÉPONSE ATTENDU :
    - Score : [Note/100]
    - Points Forts : [3 puces max]
    - Points Faibles : [3 puces max]
    - Verdict : [Postuler / Ignorer / Veille]

    SORTIE : Tableau JSON UNIQUEMENT :
    [{"titre":"nom","entreprise":"nom","score":nombre,"raison":"1 phrase","lien":"URL"}]

    CONTENU : ${texteOffre}
  `;
  
  const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    const res = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(res.getContentText());
    if (json.error) return [];
    
    let cleanText = json.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    return [];
  }
}