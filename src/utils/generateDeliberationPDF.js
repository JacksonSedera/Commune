import jsPDF from "jspdf";

export function generateDeliberationPDF(form, repoblikaLogoDataUrl, communeLogoDataUrl) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Définir la police et la taille par défaut
  doc.setFont("Times", "normal");
  doc.setFontSize(12); 

  // === PAGE 1 - En-tête avec logos ===

  // Logo REPOBLIKA (centré en haut)
  doc.addImage(repoblikaLogoDataUrl, "PNG", pageWidth / 2 - 25, 10, 50, 20);

  // Texte administratif aligné à gauche
  doc.setFontSize(7);
  doc.setFont("Helvetica", "normal");
  let currentY = 35;
  const leftOffsetForAdmin = margin;
  doc.text("MINISTERE DE LA DECENTRALISATION ET", leftOffsetForAdmin, currentY);
  currentY += 4;
  doc.text("DE L'AMENAGEMENT DU TERRITOIRE", leftOffsetForAdmin + 2, currentY);
  currentY += 4;
  doc.text("-------------------", leftOffsetForAdmin + 18, currentY);
  currentY += 4;
  doc.text("PREFECTURE DE MAHAJANGA", leftOffsetForAdmin + 8, currentY);
  currentY += 4;
  doc.text("-------------", leftOffsetForAdmin + 20.5, currentY);
  currentY += 4;
  doc.text("REGION BOENY", leftOffsetForAdmin + 17, currentY);
  currentY += 4;
  doc.text("-------", leftOffsetForAdmin + 23, currentY);
  currentY += 5;

  // Logo Commune
  doc.addImage(communeLogoDataUrl, "PNG", leftOffsetForAdmin + 17, currentY, 20, 20);

  y = currentY + 20 + 10;

  // === Titre de la délibération ===
  const yearAbbreviated = form.date ? new Date(form.date).getFullYear().toString().slice(-2) : 'XX';
  const deliberationIdentifier = `${form.numero}-${yearAbbreviated}`;
  
  doc.setFontSize(12);
  doc.setFont("Times", "bold");
  
  const titre = `DELIBERATION N° ${deliberationIdentifier}/CU/MGA/CM Prise par les membres du Conseil Municipal de la Commune Urbaine de Mahajanga lors de la session extraordinaire en date du ${form.sessionDate || ""}`;
  
  const wrappedTitle = doc.splitTextToSize(titre, pageWidth - 2 * margin);
  
  wrappedTitle.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 7;
  });
  
  y += 5;

  // === Informations sur les conseillers ===
  doc.setFont("Times", "normal");
  doc.setFontSize(12); 
  
  doc.text(`Nombre des Conseillers en exercice : ${form.exercice}`, margin, y);
  y += 7;
  doc.text(`Etaient présents : ${form.conseillersPresents.length}`, margin, y);
  y += 7;
  doc.text("MM. :", margin + 7, y);
  y += 7;

  // Liste des conseillers présents
  form.conseillersPresents.forEach((p) => {
    const conseillerText = `${p.nom}${p.fonction ? `, ${p.fonction}` : ""}`;
    const wrappedConseillerText = doc.splitTextToSize(conseillerText, pageWidth - (margin + 15 + margin));
    wrappedConseillerText.forEach((line, index) => {
      doc.text(line, margin + (index === 0 ? 15 : 10), y);
      y += 5;
    });
  });

  y += 3;
  
  // Conseillers représentés
  doc.text(`Etaient représentés : ${form.representes.length}`, margin, y);
  y += 7;
  
  form.representes.forEach((r) => {
    const representeText = `${r.represente} représenté par ${r.representant}`;
    const wrappedRepresenteText = doc.splitTextToSize(representeText, pageWidth - (margin + 15 + margin)); 
    wrappedRepresenteText.forEach((line, index) => {
      doc.text(line, margin + (index === 0 ? 15 : 10), y);
      y += 5;
    });
  });

  y += 10;

  // === Texte de convocation ===
  const formattedDate = form.date ? new Date(form.date).toLocaleDateString("fr-FR", { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : '';
  
  const formattedDateConvocation = form.dateConvocation ? new Date(form.dateConvocation).toLocaleDateString("fr-FR", { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : '';

  const deliberationIntro = `Le ${formattedDate} à ${form.heure} H, le Conseil municipal régulièrement convoqué par lettre du Président du Conseil Municipal n°${form.convocation} du ${formattedDateConvocation}, s'est réuni en session extraordinaire sous la présidence de M. ${form.president}.`;
  
  const wrappedDeliberationIntro = doc.splitTextToSize(deliberationIntro, pageWidth - (2 * margin + 5));
  wrappedDeliberationIntro.forEach((line, index) => {
    doc.text(line, margin + (index === 0 ? 5 : 0), y);
    y += 7;
  });
  y += 3;
  
  const quorumText = "Ayant constaté que le quorum exigé par la loi pour délibérer valablement est atteint.";
  const wrappedQuorumText = doc.splitTextToSize(quorumText, pageWidth - (2 * margin + 5));
  wrappedQuorumText.forEach((line, index) => {
    doc.text(line, margin + (index === 0 ? 5 : 0), y);
    y += 7;
  });
  y += 10;
  
  // === PAGE 2 - Contenu de la délibération ===
  doc.addPage();
  y = margin;

  // Titre principal
  doc.setFontSize(12);
  doc.setFont("Times", "bold");
  const fullDeliberationTitle = `DELIBERATION N° ${deliberationIdentifier}/CU/MGA/CM RELATIVE A ${form.titreDeliberation || ""}`;
  const wrappedFullDeliberationTitle = doc.splitTextToSize(fullDeliberationTitle, pageWidth - 2 * margin);
  
  wrappedFullDeliberationTitle.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 7;
  });
  
  y += 5;

  // Titre "LE CONSEIL MUNICIPAL..."
  doc.setFont("Times", "normal");
  doc.setFontSize(12);
  doc.text("LE CONSEIL MUNICIPAL DE LA COMMUNE URBAINE DE MAHAJANGA", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Clauses "Vu la..." (en italique, taille 9)
  doc.setFontSize(9);
  doc.setFont("Times", "italic");
  
  const vuLaClauses = [
    "-Vu la Constitution de la IVème République;",
    "-Vu la loi organique n°2014-018 du 12 septembre 2014, complétée par la loi n°2016-030 du 23 août 2016, régissant les compétences, les modalités d'organisation et de fonctionnement des Collectivités territoriales décentralisées ainsi que celles de la gestion de leurs propres affaires;",
    "-Vu la loi n°2014-020 du 27 septembre 2014, modifiée par la loi n°2015-008 du 1er avril 2015, relative aux ressources des Collectivités territoriales décentralisées, aux modalités d'élections ainsi qu'à l'organisation, au fonctionnement et aux attributions de leurs organes;",
    "-Vu la loi n°2014-021 du 12 septembre 2014 relative à la représentation de l'État;",
    "-Vu le jugement n° 01/EL du 20 Janvier 2025 portant proclamation des résultats des élections municipales et communales du11/12/2024 pour la province de Mahajanga;",
  ];

  // Ajouter les clauses juridiques modifiables
  form.lignesJuridiques.forEach((line) => {
    if (typeof line === 'string' && line.trim() !== "") {
      vuLaClauses.push(line);
    }
  });

  vuLaClauses.forEach((line) => {
    const safeLine = line === null || line === undefined ? "" : String(line);
    const splitLine = doc.splitTextToSize(safeLine, pageWidth - 2 * margin);
    doc.text(splitLine, margin, y);
    y += doc.getTextDimensions(splitLine).h + 3;
  });

  y += 5;
  
  // Texte "Entendu la présentation..."
  doc.setFont("Times", "normal");
  doc.setFontSize(12);
  doc.text("Entendu la présentation des membres de l'organe exécutif", margin, y);
  y += 10;

  // Titre "LE CONSEIL, APRES EN AVOIR DELIBERE"
  doc.setFont("Times", "bold");
  doc.setFontSize(12);
  doc.text("LE CONSEIL, APRES EN AVOIR DELIBERE", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Articles
  doc.setFont("Times", "normal");
  doc.setFontSize(12);
  form.articles.forEach((article, i) => {
    if (typeof article === 'string' && article.trim() !== "") {
      const articleText = `Article ${i + 1}. ${article}`;
      const safeArticleText = articleText === null || articleText === undefined ? "" : String(articleText);
      const splitArticle = doc.splitTextToSize(safeArticleText, pageWidth - 2 * margin);
      doc.text(splitArticle, margin, y);
      y += doc.getTextDimensions(splitArticle).h + 5;
    }
  });

  // Texte "Délibéré et adopté..."
  doc.setFont("Times", "normal");
  doc.setFontSize(12);
  const deliberationAdopteText = "Délibéré et adopté à Mahajanga les jour, mois et année ci-dessus avec la signature du registre par tous les membres présents ;";
  const wrappedDeliberationAdopte = doc.splitTextToSize(deliberationAdopteText, pageWidth - 2 * margin);
  doc.text(wrappedDeliberationAdopte, margin, y);
  y += doc.getTextDimensions(wrappedDeliberationAdopte).h + 5;

  // Signatures - alignées sur deux colonnes
  doc.setFont("Times", "bold");
  doc.setFontSize(12);
  
  // Colonne gauche - Rapporteur
  doc.text("LE RAPPORTEUR,", margin, y);
  doc.setFont("Times", "normal");
  doc.text(form.rapporteur || "", margin, y + 20);
  
  // Colonne droite - Président
  doc.setFont("Times", "bold");
  doc.text("LE PRESIDENT", pageWidth - margin, y, { align: "right" });
  doc.setFont("Times", "normal");
  doc.text(form.presidentNom || "", pageWidth - margin, y + 20, { align: "right" });
  
  y += 27;

  // === NOUVEAU : Informations sur les votes avec logique conditionnelle ===
  doc.setFont("Times", "normal");
  doc.setFontSize(12);
  
  // Construire le texte des votes dynamiquement
  const votesParts = [];
  
  // Vérifier et ajouter les voix POUR (utilise voixPour ou voix pour compatibilité)
  const voixPour = form.voixPour || form.voix;
  if (voixPour && voixPour.toString().trim() !== '') {
    votesParts.push(`${voixPour} Voix pour`);
  }
  
  // Vérifier et ajouter les voix CONTRE
  if (form.voixContre && form.voixContre.toString().trim() !== '') {
    votesParts.push(`${form.voixContre} Voix contre`);
  }
  
  // Vérifier et ajouter les voix ABSTENTION
  if (form.voixAbstention && form.voixAbstention.toString().trim() !== '') {
    votesParts.push(`${form.voixAbstention} Voix abstention`);
  }
  
  // Construire le texte final avec virgules
  let votesText = "Adopté par ";
  if (votesParts.length > 0) {
    votesText += votesParts.join(", ");
  } else {
    votesText += "vote unanime"; // Texte par défaut si aucune donnée
  }
  
  doc.text(votesText, margin, y);
  y += 7;
  doc.text("Affichée le,", margin, y);

  return doc;
}