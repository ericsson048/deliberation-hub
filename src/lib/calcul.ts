// Logique de calcul pour la délibération

export interface NoteAvecCredits {
  note: number | null;
  credits: number;
}

export interface ResultatUE {
  moyenne: number | null;
  credits: number;
  creditsValides: number;
  decision: 'UV' | 'UNV' | null;
}

export function calculerMoyenneUE(notes: NoteAvecCredits[]): ResultatUE {
  const notesValides = notes.filter(n => n.note !== null);
  
  if (notesValides.length === 0) {
    return {
      moyenne: null,
      credits: notes.reduce((acc, n) => acc + n.credits, 0),
      creditsValides: 0,
      decision: null
    };
  }

  const total = notesValides.reduce(
    (acc, n) => acc + (n.note || 0) * n.credits,
    0
  );
  const creditsTotal = notesValides.reduce(
    (acc, n) => acc + n.credits,
    0
  );

  const moyenne = Number((total / creditsTotal).toFixed(2));
  const decision = moyenne >= 10 ? 'UV' : 'UNV';
  const creditsValides = decision === 'UV' ? creditsTotal : 0;

  return {
    moyenne,
    credits: notes.reduce((acc, n) => acc + n.credits, 0),
    creditsValides,
    decision
  };
}

export function calculerMoyenneSemestre(resultatsUE: ResultatUE[]): {
  moyenne: number | null;
  creditsValides: number;
  creditsTotaux: number;
  decision: 'SV' | 'SNV' | null;
} {
  const uesAvecMoyenne = resultatsUE.filter(r => r.moyenne !== null);
  
  if (uesAvecMoyenne.length === 0) {
    return {
      moyenne: null,
      creditsValides: 0,
      creditsTotaux: resultatsUE.reduce((acc, r) => acc + r.credits, 0),
      decision: null
    };
  }

  const total = uesAvecMoyenne.reduce(
    (acc, r) => acc + (r.moyenne || 0) * r.credits,
    0
  );
  const creditsTotal = uesAvecMoyenne.reduce(
    (acc, r) => acc + r.credits,
    0
  );

  const moyenne = Number((total / creditsTotal).toFixed(2));
  const creditsValides = resultatsUE.reduce((acc, r) => acc + r.creditsValides, 0);
  const decision = moyenne >= 10 ? 'SV' : 'SNV';

  return {
    moyenne,
    creditsValides,
    creditsTotaux: resultatsUE.reduce((acc, r) => acc + r.credits, 0),
    decision
  };
}

export function calculerMoyenneAnnuelle(moyenneS1: number | null, moyenneS2: number | null): number | null {
  if (moyenneS1 === null && moyenneS2 === null) return null;
  if (moyenneS1 === null) return moyenneS2;
  if (moyenneS2 === null) return moyenneS1;
  
  return Number(((moyenneS1 + moyenneS2) / 2).toFixed(2));
}

export type DecisionFinale = 'D' | 'S' | 'P' | 'R' | 'A' | 'AUE' | null;

export function decisionFinale(
  moyenneAnnuelle: number | null,
  creditsValides: number,
  creditsTotaux: number
): { decision: DecisionFinale; mention: string | null } {
  if (moyenneAnnuelle === null) {
    return { decision: null, mention: null };
  }

  // Si tous les crédits sont validés
  if (creditsValides >= creditsTotaux) {
    if (moyenneAnnuelle >= 16) {
      return { decision: 'D', mention: 'Distinction' };
    }
    if (moyenneAnnuelle >= 14) {
      return { decision: 'S', mention: 'Satisfaction' };
    }
    if (moyenneAnnuelle >= 12) {
      return { decision: 'P', mention: 'Passable' };
    }
    if (moyenneAnnuelle >= 10) {
      return { decision: 'R', mention: 'Réussi' };
    }
  }

  // Si moyenne >= 10 mais pas tous les crédits
  if (moyenneAnnuelle >= 10 && creditsValides < creditsTotaux) {
    return { decision: 'AUE', mention: 'Admis avec UE à rattraper' };
  }

  // Ajourné
  return { decision: 'A', mention: 'Ajourné' };
}

export const DECISION_LABELS: Record<string, { label: string; color: string }> = {
  'UV': { label: 'Unité Validée', color: 'bg-green-500' },
  'UNV': { label: 'Unité Non Validée', color: 'bg-red-500' },
  'SV': { label: 'Semestre Validé', color: 'bg-green-500' },
  'SNV': { label: 'Semestre Non Validé', color: 'bg-red-500' },
  'D': { label: 'Distinction', color: 'bg-blue-600' },
  'S': { label: 'Satisfaction', color: 'bg-blue-500' },
  'P': { label: 'Passable', color: 'bg-green-500' },
  'R': { label: 'Réussi', color: 'bg-green-600' },
  'A': { label: 'Ajourné', color: 'bg-red-500' },
  'AUE': { label: 'Admis avec UE à rattraper', color: 'bg-orange-500' },
};
