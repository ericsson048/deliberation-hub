import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Session, Etudiant, UniteEnseignement, ECUE, Note } from "@/types/deliberation";
import { calculerMoyenneUE, calculerMoyenneSemestre, decisionFinale, DECISION_LABELS } from "./calcul";

interface UEAvecECUE extends UniteEnseignement {
  ecue: ECUE[];
}

interface ExportData {
  session: Session;
  etudiants: Etudiant[];
  ues: UEAvecECUE[];
  notes: Note[];
}

export function generateDeliberationPDF(data: ExportData): void {
  const { session, etudiants, ues, notes } = data;
  
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Helper function to get note
  const getNote = (etudiantId: string, ecueId: string): number | null => {
    return notes.find(n => n.etudiant_id === etudiantId && n.ecue_id === ecueId)?.note ?? null;
  };

  // ===== EN-TÊTE OFFICIEL =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("REPUBLIQUE DU BURUNDI", margin, 12);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("MINISTERE DE L'EDUCATION NATIONALE", margin, 17);
  doc.text("ET DE LA RECHERCHE SCIENTIFIQUE", margin, 22);
  
  doc.setFont("helvetica", "bold");
  doc.text("UNIVERSITE DU BURUNDI", margin, 29);
  
  // Centré
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("GRILLE DE DELIBERATION", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(11);
  doc.text(`ANNEE ACADEMIQUE: ${session.annee_academique}`, pageWidth / 2, 28, { align: "center" });
  
  // À droite
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Filière: ${session.filiere}`, pageWidth - margin, 12, { align: "right" });
  doc.text(`Niveau: ${session.niveau}`, pageWidth - margin, 17, { align: "right" });
  doc.text(`Semestre: ${session.semestre}`, pageWidth - margin, 22, { align: "right" });
  if (session.date_deliberation) {
    doc.text(`Date: ${new Date(session.date_deliberation).toLocaleDateString("fr-FR")}`, pageWidth - margin, 27, { align: "right" });
  }

  // ===== PRÉPARATION DES DONNÉES DU TABLEAU =====
  
  // Calculer toutes les colonnes ECUE
  const allECUE: Array<{ ecue: ECUE; ue: UEAvecECUE }> = [];
  ues.forEach(ue => {
    (ue.ecue || []).forEach(ecue => {
      allECUE.push({ ecue, ue });
    });
  });

  // Construire les en-têtes (2 lignes)
  // Ligne 1: N°, Matricule, Nom et Prénom, puis pour chaque UE: colspan des ECUE + Moy + Déc, puis Synthèse
  // Ligne 2: sous-colonnes pour chaque ECUE

  const headers: any[][] = [];
  
  // Première ligne d'en-tête (UE groupées)
  const headerRow1: any[] = [
    { content: "N°", rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold", fillColor: [240, 240, 240] } },
    { content: "Matricule", rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold", fillColor: [240, 240, 240] } },
    { content: "Nom et Prénom", rowSpan: 2, styles: { halign: "center", valign: "middle", fontStyle: "bold", fillColor: [240, 240, 240] } },
  ];

  ues.forEach(ue => {
    const ecueCount = (ue.ecue || []).length;
    headerRow1.push({
      content: `${ue.code} - ${ue.nom} (${ue.credits_totaux} cr)`,
      colSpan: ecueCount + 2, // ECUE + Moy + Déc
      styles: { halign: "center", fontStyle: "bold", fillColor: [220, 230, 240] },
    });
  });

  // Colonnes de synthèse
  headerRow1.push({
    content: "SYNTHESE SEMESTRE",
    colSpan: 4,
    styles: { halign: "center", fontStyle: "bold", fillColor: [200, 220, 200] },
  });

  headers.push(headerRow1);

  // Deuxième ligne d'en-tête (ECUE détaillées)
  const headerRow2: any[] = [];
  
  ues.forEach(ue => {
    (ue.ecue || []).forEach(ecue => {
      headerRow2.push({
        content: `${ecue.nom}\n(${ecue.credits}cr)`,
        styles: { halign: "center", fontSize: 7, fillColor: [245, 245, 245] },
      });
    });
    headerRow2.push({
      content: "Moy UE",
      styles: { halign: "center", fontStyle: "bold", fontSize: 7, fillColor: [230, 230, 230] },
    });
    headerRow2.push({
      content: "Déc",
      styles: { halign: "center", fontStyle: "bold", fontSize: 7, fillColor: [230, 230, 230] },
    });
  });

  // Colonnes synthèse
  headerRow2.push({ content: "Moy", styles: { halign: "center", fontStyle: "bold", fontSize: 8, fillColor: [220, 240, 220] } });
  headerRow2.push({ content: "Crédits", styles: { halign: "center", fontStyle: "bold", fontSize: 8, fillColor: [220, 240, 220] } });
  headerRow2.push({ content: "Décision", styles: { halign: "center", fontStyle: "bold", fontSize: 8, fillColor: [220, 240, 220] } });
  headerRow2.push({ content: "Mention", styles: { halign: "center", fontStyle: "bold", fontSize: 8, fillColor: [220, 240, 220] } });

  headers.push(headerRow2);

  // ===== DONNÉES DES ÉTUDIANTS =====
  const tableData: any[][] = [];

  etudiants.forEach((etudiant, index) => {
    const row: any[] = [
      { content: (index + 1).toString(), styles: { halign: "center" } },
      { content: etudiant.matricule, styles: { halign: "center" } },
      { content: `${etudiant.nom} ${etudiant.prenom}`, styles: { halign: "left" } },
    ];

    // Calculer les résultats par UE
    const resultatsUE = ues.map(ue => {
      const notesUE = (ue.ecue || []).map(ecue => ({
        note: getNote(etudiant.id, ecue.id),
        credits: ecue.credits,
      }));
      return calculerMoyenneUE(notesUE);
    });

    // Ajouter les notes et résultats par UE
    ues.forEach((ue, ueIndex) => {
      (ue.ecue || []).forEach(ecue => {
        const note = getNote(etudiant.id, ecue.id);
        const noteStr = note !== null ? note.toFixed(2) : "-";
        const cellStyle: any = { halign: "center", fontSize: 8 };
        
        // Colorer les notes < 10 en rouge
        if (note !== null && note < 10) {
          cellStyle.textColor = [200, 0, 0];
        }
        
        row.push({ content: noteStr, styles: cellStyle });
      });

      const resultatUE = resultatsUE[ueIndex];
      
      // Moyenne UE
      row.push({
        content: resultatUE.moyenne !== null ? resultatUE.moyenne.toFixed(2) : "-",
        styles: { 
          halign: "center", 
          fontStyle: "bold",
          fillColor: resultatUE.decision === "UV" ? [220, 240, 220] : resultatUE.decision === "UNV" ? [255, 220, 220] : undefined,
        },
      });

      // Décision UE
      row.push({
        content: resultatUE.decision || "-",
        styles: { 
          halign: "center", 
          fontStyle: "bold",
          textColor: resultatUE.decision === "UV" ? [0, 128, 0] : resultatUE.decision === "UNV" ? [200, 0, 0] : [0, 0, 0],
        },
      });
    });

    // Synthèse semestrielle
    const resultatSemestre = calculerMoyenneSemestre(resultatsUE);
    const decisionFin = decisionFinale(
      resultatSemestre.moyenne,
      resultatSemestre.creditsValides,
      resultatSemestre.creditsTotaux
    );

    // Moyenne générale
    row.push({
      content: resultatSemestre.moyenne !== null ? resultatSemestre.moyenne.toFixed(2) : "-",
      styles: { 
        halign: "center", 
        fontStyle: "bold",
        fillColor: resultatSemestre.moyenne !== null && resultatSemestre.moyenne >= 10 ? [200, 240, 200] : [255, 220, 220],
      },
    });

    // Crédits
    row.push({
      content: `${resultatSemestre.creditsValides}/${resultatSemestre.creditsTotaux}`,
      styles: { halign: "center" },
    });

    // Décision finale
    const decisionColor = getDecisionColor(decisionFin.decision);
    row.push({
      content: decisionFin.decision || "-",
      styles: { 
        halign: "center", 
        fontStyle: "bold",
        textColor: decisionColor,
      },
    });

    // Mention
    row.push({
      content: decisionFin.mention || "-",
      styles: { halign: "center", fontSize: 7 },
    });

    tableData.push(row);
  });

  // ===== GÉNÉRATION DU TABLEAU =====
  autoTable(doc, {
    startY: 35,
    head: headers,
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 8 },  // N°
      1: { cellWidth: 20 }, // Matricule
      2: { cellWidth: 40 }, // Nom et Prénom
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Numéro de page
      doc.setFontSize(8);
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber}`,
        pageWidth - margin,
        pageHeight - 5,
        { align: "right" }
      );
    },
  });

  // ===== SECTION JURY =====
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Vérifier si on a besoin d'une nouvelle page
  if (finalY > pageHeight - 60) {
    doc.addPage();
  }

  const juryY = finalY > pageHeight - 60 ? 20 : finalY;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("COMPOSITION DU JURY:", margin, juryY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  const juryLines = [
    "Président: _________________________________ Signature: _________________",
    "Membre 1: _________________________________ Signature: _________________",
    "Membre 2: _________________________________ Signature: _________________",
    "Secrétaire: ________________________________ Signature: _________________",
  ];

  juryLines.forEach((line, idx) => {
    doc.text(line, margin, juryY + 8 + (idx * 7));
  });

  // Statistiques à droite
  const statsX = pageWidth / 2 + 20;
  doc.setFont("helvetica", "bold");
  doc.text("STATISTIQUES:", statsX, juryY);

  doc.setFont("helvetica", "normal");
  
  // Calculer les statistiques
  const stats = calculateStats(etudiants, ues, notes);
  
  const statsLines = [
    `Total étudiants: ${stats.total}`,
    `Admis: ${stats.admis} (${stats.tauxReussite}%)`,
    `Ajournés: ${stats.ajournes} (${(100 - parseFloat(stats.tauxReussite)).toFixed(1)}%)`,
    `Distinctions: ${stats.distinctions}`,
    `Satisfactions: ${stats.satisfactions}`,
  ];

  statsLines.forEach((line, idx) => {
    doc.text(line, statsX, juryY + 8 + (idx * 6));
  });

  // ===== LÉGENDE =====
  const legendY = juryY + 45;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("LEGENDE:", margin, legendY);

  doc.setFont("helvetica", "normal");
  const legendItems = [
    "UV: Unité Validée | UNV: Unité Non Validée | SV: Semestre Validé | SNV: Semestre Non Validé",
    "D: Distinction (≥16) | S: Satisfaction (≥14) | P: Passable (≥12) | R: Réussi (≥10)",
    "A: Ajourné (<10) | AUE: Admis avec UE à rattraper",
  ];

  legendItems.forEach((item, idx) => {
    doc.text(item, margin, legendY + 5 + (idx * 4));
  });

  // Date et signature
  doc.setFontSize(9);
  doc.text(
    `Fait à Bujumbura, le ${new Date().toLocaleDateString("fr-FR")}`,
    pageWidth - margin,
    legendY + 20,
    { align: "right" }
  );

  // ===== SAUVEGARDE =====
  const fileName = `Deliberation_${session.filiere}_${session.niveau}_${session.annee_academique.replace("/", "-")}_${session.semestre}.pdf`;
  doc.save(fileName);
}

function getDecisionColor(decision: string | null): number[] {
  switch (decision) {
    case "D":
    case "S":
      return [0, 0, 180]; // Bleu
    case "P":
    case "R":
      return [0, 128, 0]; // Vert
    case "AUE":
      return [200, 100, 0]; // Orange
    case "A":
      return [200, 0, 0]; // Rouge
    default:
      return [0, 0, 0];
  }
}

function calculateStats(etudiants: Etudiant[], ues: UEAvecECUE[], notes: Note[]) {
  const getNote = (etudiantId: string, ecueId: string): number | null => {
    return notes.find(n => n.etudiant_id === etudiantId && n.ecue_id === ecueId)?.note ?? null;
  };

  let admis = 0;
  let ajournes = 0;
  let distinctions = 0;
  let satisfactions = 0;

  etudiants.forEach(etudiant => {
    const resultatsUE = ues.map(ue => {
      const notesUE = (ue.ecue || []).map(ecue => ({
        note: getNote(etudiant.id, ecue.id),
        credits: ecue.credits,
      }));
      return calculerMoyenneUE(notesUE);
    });

    const resultatSemestre = calculerMoyenneSemestre(resultatsUE);
    const decision = decisionFinale(
      resultatSemestre.moyenne,
      resultatSemestre.creditsValides,
      resultatSemestre.creditsTotaux
    );

    if (decision.decision === "D") {
      distinctions++;
      admis++;
    } else if (decision.decision === "S") {
      satisfactions++;
      admis++;
    } else if (decision.decision === "P" || decision.decision === "R" || decision.decision === "AUE") {
      admis++;
    } else if (decision.decision === "A") {
      ajournes++;
    }
  });

  const total = etudiants.length;
  const tauxReussite = total > 0 ? ((admis / total) * 100).toFixed(1) : "0";

  return {
    total,
    admis,
    ajournes,
    distinctions,
    satisfactions,
    tauxReussite,
  };
}
