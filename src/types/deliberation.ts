export interface Session {
  id: string;
  annee_academique: string;
  semestre: string;
  filiere: string;
  niveau: string;
  date_deliberation: string | null;
  created_at: string;
}

export interface Etudiant {
  id: string;
  session_id: string;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  lieu_naissance: string | null;
  created_at: string;
}

export interface UniteEnseignement {
  id: string;
  session_id: string;
  code: string;
  nom: string;
  credits_totaux: number;
  ordre: number;
  created_at: string;
  ecue?: ECUE[];
}

export interface ECUE {
  id: string;
  ue_id: string;
  code: string;
  nom: string;
  credits: number;
  ordre: number;
  created_at: string;
}

export interface Note {
  id: string;
  etudiant_id: string;
  ecue_id: string;
  note: number | null;
  created_at: string;
  updated_at: string;
}

export interface Resultat {
  id: string;
  etudiant_id: string;
  moyenne_s1: number | null;
  moyenne_s2: number | null;
  moyenne_annuelle: number | null;
  credits_valides: number;
  credits_totaux: number;
  decision: string | null;
  mention: string | null;
  created_at: string;
  updated_at: string;
}

export interface EtudiantAvecNotes extends Etudiant {
  notes: Note[];
  resultat?: Resultat;
}

export interface UEAvecECUE extends UniteEnseignement {
  ecue: ECUE[];
}
