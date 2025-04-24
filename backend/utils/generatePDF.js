// backend/utils/generatePDF.js
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function generatePDF({ firstname, lastname, email, date, city, discord }) {
  // Création du document PDF
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Création de deux pages
  const page1 = pdfDoc.addPage([595.28, 841.89]); // Format A4
  const page2 = pdfDoc.addPage([595.28, 841.89]); // Format A4

  // Chargement des polices
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Chargement de la police de signature
  const signatureFontBytes = fs.readFileSync(path.join(__dirname, '../../docs/signature-font.ttf'));
  const signatureFont = await pdfDoc.embedFont(signatureFontBytes);

  // Chargement du logo
  const logoBytes = fs.readFileSync(path.join(__dirname, '../../docs/logo-duck23.png'));
  const logoImage = await pdfDoc.embedPng(logoBytes);

  // Configuration initiale
  let y = 750;
  const lineHeight = 18;
  const maxWidth = 480;
  const marginLeft = 60;
  const marginRight = 60;
  const pageWidth = 595.28;
  const textWidth = pageWidth - marginLeft - marginRight;

  // Fonction pour dessiner du texte justifié
  function drawJustifiedText(page, text, font, size, yStart, color = rgb(0, 0, 0)) {
    // Diviser le texte en mots
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineWords = [];
    let yPos = yStart;

    // Parcourir tous les mots
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      testLine = line + word + ' ';

      // Vérifier si la ligne dépasse la largeur maximale
      if (font.widthOfTextAtSize(testLine, size) > maxWidth) {
        // Si c'est le cas, on justifie la ligne courante
        if (lineWords.length > 1) { // Justifier seulement s'il y a plus d'un mot
          const remainingSpace = maxWidth - font.widthOfTextAtSize(line.trim(), size);
          const spacesToAdd = lineWords.length - 1; // Espaces entre les mots
          const extraSpacePerWord = remainingSpace / spacesToAdd;

          let xPosition = marginLeft;
          for (let j = 0; j < lineWords.length; j++) {
            page.drawText(lineWords[j], {
              x: xPosition,
              y: yPos,
              size,
              font,
              color
            });

            // Calculer la position du prochain mot
            if (j < lineWords.length - 1) {
              const wordWidth = font.widthOfTextAtSize(lineWords[j], size);
              xPosition += wordWidth + font.widthOfTextAtSize(' ', size) + extraSpacePerWord;
            }
          }
        } else {
          // S'il n'y a qu'un seul mot, on le place simplement
          page.drawText(line.trim(), {
            x: marginLeft,
            y: yPos,
            size,
            font,
            color
          });
        }

        // Passer à la ligne suivante
        yPos -= lineHeight;
        line = word + ' ';
        lineWords = [word];
      } else {
        line = testLine;
        if (lineWords.indexOf(word) === -1) {
          lineWords.push(word);
        }
      }
    }

    // Traiter la dernière ligne (qui n'est généralement pas justifiée)
    if (line.trim() !== '') {
      page.drawText(line.trim(), {
        x: marginLeft,
        y: yPos,
        size,
        font,
        color
      });
      yPos -= lineHeight;
    }

    return yPos;
  }

  // Fonction simplifiée pour dessiner du texte avec retour à la ligne automatique
  function drawWrappedText(page, text, font, size, yStart, color = rgb(0, 0, 0)) {
    let words = text.split(' ');
    let line = '';
    let yPos = yStart;

    for (let word of words) {
      let testLine = line + word + ' ';
      let width = font.widthOfTextAtSize(testLine, size);
      if (width > maxWidth) {
        page.drawText(line.trim(), { x: marginLeft, y: yPos, size, font, color });
        yPos -= lineHeight;
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim() !== '') {
      page.drawText(line.trim(), { x: marginLeft, y: yPos, size, font, color });
      yPos -= lineHeight;
    }
    return yPos;
  }

  // Fonction pour dessiner un titre centré
  function drawCenteredTitle(page, text, fontSize, fontStyle, yPos) {
    const textWidth = fontStyle.widthOfTextAtSize(text, fontSize);
    const x = (pageWidth - textWidth) / 2;
    page.drawText(text, { x, y: yPos, size: fontSize, font: fontStyle, color: rgb(0, 0, 0) });
    return yPos - lineHeight * 1.2;
  }

  // Fonction pour dessiner un titre de section
  function drawSectionTitle(page, text, fontSize = 12, yPos) {
    page.drawText(text, { x: marginLeft, y: yPos, size: fontSize, font: helveticaBold, color: rgb(0, 0, 0) });
    return yPos - lineHeight * 1.2;
  }

  // Ajout du logo en haut de la page
  const logoWidth = 120;
  const logoHeight = 120;
  const logoX = (pageWidth - logoWidth) / 2;
  page1.drawImage(logoImage, {
    x: logoX,
    y: 700,
    width: logoWidth,
    height: logoHeight,
  });

  y = 650;

  // En-tête du document
  y = drawCenteredTitle(page1, "Déclaration d'acceptation des documents", 16, helveticaBold, y);
  y = drawCenteredTitle(page1, "et engagement en tant que membre", 16, helveticaBold, y);
  y -= lineHeight * 0.5;

  // Informations de l'association
  y = drawWrappedText(page1, "Association DUCK23", helveticaBold, 12, y);
  y = drawWrappedText(page1, "E-mail : duck23.asso@gmail.com", helvetica, 12, y);
  y -= lineHeight;

  // 1. Identité du membre
  y = drawSectionTitle(page1, "1. Identité du membre", 14, y);

  // Champs avec les informations fournies en italique
  const memberInfoList = [
    {label: "• Nom et prénom : ", value: `${lastname} ${firstname}`},
    {label: "• Adresse e-mail : ", value: email},
    {label: "• Pseudonyme Discord (si applicable) : ", value: discord}
  ];

  for (const info of memberInfoList) {
    // Afficher le label en police normale
    const labelWidth = helvetica.widthOfTextAtSize(info.label, 12);
    page1.drawText(info.label, {
      x: marginLeft,
      y: y,
      size: 12,
      font: helvetica
    });

    // Afficher la valeur en italique
    page1.drawText(info.value, {
      x: marginLeft + labelWidth,
      y: y,
      size: 12,
      font: helveticaOblique
    });

    y -= lineHeight;
  }
  y -= lineHeight * 0.5;

  // 2. Déclaration d'acceptation des documents
  y = drawSectionTitle(page1, "2. Déclaration d'acceptation des documents", 14, y);

  // Remplacer le placeholder par le nom et prénom
const fullName = `${firstname} ${lastname}`;

// Texte initial avec le nom en italique
const declarationPrefix = "Je soussigné·e, ";
const declarationPostfix = ", atteste avoir pris connaissance des documents suivants de l'association DUCK23 :";

// Vérifier si la phrase complète tiendra sur une seule ligne
const prefixWidth = helvetica.widthOfTextAtSize(declarationPrefix, 12);
const nameWidth = helveticaOblique.widthOfTextAtSize(fullName, 12);
const postfixWidth = helvetica.widthOfTextAtSize(declarationPostfix, 12);
const totalWidth = prefixWidth + nameWidth + postfixWidth;

// Si la phrase complète est trop longue pour une ligne
if (totalWidth > maxWidth) {
  // Afficher "Je soussigné·e, " suivi du nom en italique sur la première ligne
  page1.drawText(declarationPrefix, {
    x: marginLeft,
    y: y,
    size: 12,
    font: helvetica
  });

  page1.drawText(fullName, {
    x: marginLeft + prefixWidth,
    y: y,
    size: 12,
    font: helveticaOblique
  });

  y -= lineHeight;

  // Afficher le reste du texte sur la ligne suivante
  page1.drawText(declarationPostfix.substring(1), { // Enlever la virgule au début
    x: marginLeft,
    y: y,
    size: 12,
    font: helvetica
  });
} else {
  // Si tout tient sur une ligne, afficher comme avant
  page1.drawText(declarationPrefix, {
    x: marginLeft,
    y: y,
    size: 12,
    font: helvetica
  });

  page1.drawText(fullName, {
    x: marginLeft + prefixWidth,
    y: y,
    size: 12,
    font: helveticaOblique
  });

  page1.drawText(declarationPostfix, {
    x: marginLeft + prefixWidth + nameWidth,
    y: y,
    size: 12,
    font: helvetica
  });
}

y -= lineHeight;
  // Liste des documents en gras
  const documentsList = [
    "Règlement intérieur",
    "Annexe : Code de bonne conduite",
    "Charte de confidentialité",
    "Politique de confidentialité",
    "Règlement Discord"
  ];

  for (const doc of documentsList) {
    page1.drawText("- ", {
      x: marginLeft,
      y: y,
      size: 12,
      font: helvetica
    });

    page1.drawText(doc, {
      x: marginLeft + 15,
      y: y,
      size: 12,
      font: helveticaBold
    });

    y -= lineHeight;
  }

  // Engagements liés aux documents - utiliser la fonction de justification
  const acceptanceText = [
    "Je déclare avoir lu, compris et accepter sans réserve l'ensemble des règles, valeurs et engagements mentionnés dans ces documents.",
    "Je m'engage à respecter le règlement intérieur de DUCK23 et à me conformer aux décisions du bureau et des instances de l'association.",
    "Je reconnais que mon adhésion implique le respect de ces engagements et que tout manquement pourra entraîner des mesures disciplinaires définies dans le règlement intérieur."
  ];

  y -= lineHeight * 0.5;
  for (const text of acceptanceText) {
    y = drawJustifiedText(page1, text, helvetica, 12, y);
  }

  // Passer à la deuxième page pour les engagements
  y = 780; // Reset pour la page 2

  // Dans la fonction generatePDF, remplacer la section des engagements par ceci:

// 3. Engagement du membre
y = drawSectionTitle(page2, "3. Engagement du membre", 14, y);

const engagements = [
  "Je m'engage à respecter les valeurs de DUCK23, basées sur l'entraide, l'inclusion et la solidarité.",
  "Je respecte la confidentialité des échanges au sein de l'association et des projets auxquels je participe.",
  "Je veille à adopter un comportement bienveillant et respectueux sur les plateformes de communication (Discord, événements, échanges directs).",
  "Je m'engage à respecter le règlement intérieur de l'association.",
  "Je suis informé·e que toute diffusion de contenu illégal, injurieux, discriminatoire ou portant atteinte à une personne ou à une communauté est strictement interdite.",
  "Je comprends que DUCK23 est une association indépendante et que mon engagement est bénévole."
];

// Ajouter des cases à cocher pour chaque engagement
for (let i = 0; i < engagements.length; i++) {
  // Dessiner la case à cocher
  const checkboxSize = 10;
  const checkboxX = marginLeft;
  const checkboxY = y - checkboxSize/2;

  // Dessiner le carré de la case à cocher avec une bordure verte
  page2.drawRectangle({
    x: checkboxX,
    y: checkboxY,
    width: checkboxSize,
    height: checkboxSize,
    borderColor: rgb(0, 0.7, 0), // Couleur verte pour la bordure
    borderWidth: 1,
    color: rgb(1, 1, 1), // Fond blanc
  });

  // Dessiner la coche verte dans la case à cocher
  page2.drawLine({
    start: { x: checkboxX + 2, y: checkboxY + checkboxSize/2 },
    end: { x: checkboxX + 4, y: checkboxY + 2 },
    thickness: 1.5,
    color: rgb(0, 0.7, 0),
  });

  page2.drawLine({
    start: { x: checkboxX + 4, y: checkboxY + 2 },
    end: { x: checkboxX + checkboxSize - 2, y: checkboxY + checkboxSize - 2 },
    thickness: 1.5,
    color: rgb(0, 0.7, 0),
  });

  // Dessiner le texte de l'engagement, légèrement décalé pour laisser place à la case à cocher
  const engagementText = engagements[i];
  const textX = checkboxX + checkboxSize + 5;

  // Calculer la largeur disponible pour le texte (réduite pour tenir compte de la case à cocher)
  const textMaxWidth = maxWidth - checkboxSize - 5;

  // Dessiner le texte justifié avec une fonction adaptée à la case à cocher
  y = drawJustifiedTextWithIndent(page2, engagementText, helvetica, 12, y, textX, textMaxWidth);

  // Ajouter un peu d'espace entre les engagements
  y -= lineHeight * 0.3;
}

// Ajouter cette fonction pour dessiner le texte justifié avec un décalage horizontal
function drawJustifiedTextWithIndent(page, text, font, size, yStart, xStart, maxWidth, color = rgb(0, 0, 0)) {
  // Diviser le texte en mots
  const words = text.split(' ');
  let line = '';
  let testLine = '';
  let lineWords = [];
  let yPos = yStart;
  let firstLine = true;

  // Parcourir tous les mots
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    testLine = line + word + ' ';

    // Vérifier si la ligne dépasse la largeur maximale
    if (font.widthOfTextAtSize(testLine, size) > maxWidth) {
      // Si c'est le cas, on justifie la ligne courante
      if (lineWords.length > 1) { // Justifier seulement s'il y a plus d'un mot
        const remainingSpace = maxWidth - font.widthOfTextAtSize(line.trim(), size);
        const spacesToAdd = lineWords.length - 1; // Espaces entre les mots
        const extraSpacePerWord = remainingSpace / spacesToAdd;

        let xPosition = firstLine ? xStart : marginLeft;
        for (let j = 0; j < lineWords.length; j++) {
          page.drawText(lineWords[j], {
            x: xPosition,
            y: yPos,
            size,
            font,
            color
          });

          // Calculer la position du prochain mot
          if (j < lineWords.length - 1) {
            const wordWidth = font.widthOfTextAtSize(lineWords[j], size);
            xPosition += wordWidth + font.widthOfTextAtSize(' ', size) + extraSpacePerWord;
          }
        }
      } else {
        // S'il n'y a qu'un seul mot, on le place simplement
        page.drawText(line.trim(), {
          x: firstLine ? xStart : marginLeft,
          y: yPos,
          size,
          font,
          color
        });
      }

      // Passer à la ligne suivante
      yPos -= lineHeight;
      line = word + ' ';
      lineWords = [word];
      firstLine = false;
    } else {
      line = testLine;
      if (lineWords.indexOf(word) === -1) {
        lineWords.push(word);
      }
    }
  }

  // Traiter la dernière ligne (qui n'est généralement pas justifiée)
  if (line.trim() !== '') {
    page.drawText(line.trim(), {
      x: firstLine ? xStart : marginLeft,
      y: yPos,
      size,
      font,
      color
    });
    yPos -= lineHeight;
  }

  return yPos;
}

// 4. Validation et signature
y = drawSectionTitle(page2, "4. Validation et signature", 14, y);

// Fait à (ville en italique)
const cityPrefix = "Fait à : ";
const cityPrefixWidth = helvetica.widthOfTextAtSize(cityPrefix, 12);

page2.drawText(cityPrefix, {
  x: marginLeft,
  y: y,
  size: 12,
  font: helvetica
});

page2.drawText(city, {
  x: marginLeft + cityPrefixWidth,
  y: y,
  size: 12,
  font: helveticaOblique
});

y -= lineHeight;

  // Date en italique
  const datePrefix = "Date : ";
  const datePrefixWidth = helvetica.widthOfTextAtSize(datePrefix, 12);

  page2.drawText(datePrefix, {
    x: marginLeft,
    y: y,
    size: 12,
    font: helvetica
  });

  page2.drawText(date, {
    x: marginLeft + datePrefixWidth,
    y: y,
    size: 12,
    font: helveticaOblique
  });

  y -= lineHeight * 1.5;

  // Signature
  page2.drawText(" Signature du membre :", {
    x: marginLeft,
    y: y,
    size: 12,
    font: helvetica
  });

  // Signature avec police spéciale
  page2.drawText(`${firstname} ${lastname}`, {
    x: marginLeft + 150,
    y: y - 20,
    font: signatureFont,
    size: 40,
    color: rgb(0, 0.5, 0.8)
  });

  // Générer le PDF final
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

module.exports = generatePDF;