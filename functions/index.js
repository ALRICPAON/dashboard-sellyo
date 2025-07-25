const functions = require("firebase-functions");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.saveEmailToMake = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }
  try {
    const { id, html, name, type } = req.body;
    if (!id || !html || !name || !type) {
      return res.status(400).send("Missing parameters");
    }

    const webhookURL = process.env.MAKE_WEBHOOK_URL || functions.config().make.webhook_url;
    if (!webhookURL) {
      return res.status(500).send("Webhook URL not configured");
    }

    const formData = new URLSearchParams();
    formData.append("id", id);
    formData.append("html", html);
    formData.append("name", name);
    formData.append("type", type);

    const response = await fetch(webhookURL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return res.status(500).send(`Make API error: ${response.statusText}`);
    }

    return res.status(200).send("Email saved and sent to Make");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});
