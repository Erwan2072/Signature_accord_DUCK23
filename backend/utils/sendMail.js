// backend/utils/sendMail.js

const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendMail(recipientEmail, pdfBuffer) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: [recipientEmail, process.env.MAIL_USER], // envoie au destinataire + copie à Duck23
    subject: 'PDF d’engagement DUCK23',
    text: 'Veuillez trouver ci-joint le PDF signé pour votre adhésion à l’association DUCK23.',
    attachments: [
      {
        filename: 'engagement_duck23.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendMail;
