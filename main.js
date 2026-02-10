// CONFIGURATION - REMPLACEZ PAR VOS PROPRES VALEURS DANS LES PROPRIÉTÉS DU SCRIPT
const props = PropertiesService.getScriptProperties();
const GEMINI_API_KEY = props.getProperty('GEMINI_API_KEY');
const AIRTABLE_API_KEY = props.getProperty('AIRTABLE_API_KEY');
const AIRTABLE_BASE_ID = props.getProperty('AIRTABLE_BASE_ID');

function agentEmploiAurelie() {
  const label = GmailApp.getUserLabelByName("Emploi_Veille");
  if (!label) return;
  const threads = label.getThreads(0, 5); 
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  threads.forEach(thread => {
    const msg = thread.getMessages()[0];
    const corpsMail = msg.getPlainBody().substring(0, 5000);
    try {
      const listeAnalyses = appelerGemini(corpsMail);
      if (listeAnalyses && Array.isArray(listeAnalyses)) {
        listeAnalyses.forEach(offre => {
          if (offre.score >= 40) {
            sheet.appendRow([new Date(), "Gmail/Alerte", offre.titre, offre.entreprise, offre.score + "/100", offre.raison, offre.lien, false]);
          }
        });
        thread.removeLabel(label); 
      }
    } catch (e) { console.error("Erreur Gmail: " + e); }
  });
}

// CETTE FONCTION COMMANDE L'ENVOI
function onEdit(e) {
  SpreadsheetApp.getActiveSpreadsheet().toast("Clic détecté !");
  const range = e.range;
  const col = range.getColumn();
  const val = e.value;
  
  // On cible la colonne H (8)
  if (col == 8 && val == "TRUE") {
    const sheet = range.getSheet();
    const row = range.getRow();
    const rowData = sheet.getRange(row, 1, 1, 8).getValues()[0];
    
    const dateBrute = new Date(rowData[0]);
    const dateISO = isNaN(dateBrute.getTime()) ? new Date().toISOString().split('T')[0] : dateBrute.toISOString().split('T')[0];

    const payload = {
      "fields": {
        "fldy59sLlc1XnGD6M": rowData[3].toString(), // Entreprise
        "fldC42DogSd8vs7it": dateISO,                // Date
        "fldOYaDfPIvL4dNYu": rowData[6].toString(), // Lien
        "fldZoyxPbxazd8YLh": "Poste: " + rowData[2] + " | " + rowData[5], // Commentaires
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
      SpreadsheetApp.getActiveSpreadsheet().toast("❌ Erreur API Airtable");
    }
  }
}

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
  const code = response.getResponseCode();
  const text = response.getContentText();

  if (code !== 200) {
    // CETTE LIGNE VA AFFICHER L'ERREUR DÉTAILLÉE DANS SHEETS
    SpreadsheetApp.getUi().alert("Airtable dit : " + text);
    return false;
  }
  return true;
}

function appelerGemini(texteOffre) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
  const prompt = `Analyse en JSON: [{"titre":"","entreprise":"","score":0,"raison":"","lien":""}] \n\n Contenu: ${texteOffre}`;
  const options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify({ "contents": [{ "parts": [{ "text": prompt }] }] }) };
  const res = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(res.getContentText());
  try {
    let t = json.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(t);
  } catch (e) { return []; }
}