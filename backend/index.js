// backend/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const generatePDF = require('./utils/generatePDF');
const sendMail = require('./utils/sendMail');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.post('/submit', async (req, res) => {
    try {
      const { firstname, lastname, email, date, city, discord } = req.body;

      if (!firstname || !lastname || !email || !date || !city || !discord) {
        return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
      }

      const pdfBuffer = await generatePDF({ firstname, lastname, email, date, city, discord });


    await sendMail(email, pdfBuffer);

    res.status(200).json({ message: 'PDF généré et envoyé avec succès !' });
  } catch (error) {
    console.error('Erreur backend:', error);
    res.status(500).json({ error: 'Erreur lors du traitement de la demande.' });
  }
});

app.listen(PORT, () => console.log(`✅ Serveur prêt sur http://localhost:${PORT}`));