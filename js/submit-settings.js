import fetch from "node-fetch";
import admin from "firebase-admin";

if (!admin.apps.length) {
  // Initialise Firebase Admin avec ta clé de service JSON stockée en variable d'environnement
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { domain, userId } = req.body;
  if (!domain || !userId) return res.status(400).json({ error: "Missing domain or userId" });

  try {
    // Appel à l'API MailerSend
    const response = await fetch("https://api.mailersend.com/v1/domain-identities", {
      method: "POST",
      headers: {
        Authorization: `Bearer "mlsn.5effbc1ef58f113b69226968756449401104197a50e144410640772130e0c143",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: domain,
        domain_type: "custom",
        dkim_selector: "mailersend",
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json(errData);
    }

    const data = await response.json();

    // Sauvegarde des enregistrements DNS dans Firestore sous settings/{userId}/dnsRecords
    if (data.dns && data.dns.length > 0) {
      const batch = db.batch();

      // On supprime les anciens enregistrements pour éviter doublons
      const dnsRef = db.collection("settings").doc(userId).collection("dnsRecords");
      const oldRecords = await dnsRef.get();
      oldRecords.forEach(doc => batch.delete(doc.ref));

      // On ajoute les nouveaux enregistrements
      data.dns.forEach(record => {
        const docRef = dnsRef.doc(); // doc auto-id
        batch.set(docRef, record);
      });

      await batch.commit();
    }

    // On peut aussi sauvegarder le domaine custom dans settings/{userId}
    await db.collection("settings").doc(userId).set({
      customDomain: domain,
      domainIdentityId: data.id || null,
      dnsLastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in validate-domain handler:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
