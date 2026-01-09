-- Table des sessions de délibération
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee_academique TEXT NOT NULL,
  semestre TEXT NOT NULL,
  filiere TEXT NOT NULL,
  niveau TEXT NOT NULL,
  date_deliberation DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des étudiants
CREATE TABLE public.etudiants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  matricule TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE,
  lieu_naissance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des Unités d'Enseignement (UE)
CREATE TABLE public.unites_enseignement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  credits_totaux INTEGER NOT NULL DEFAULT 0,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des ECUE (Éléments Constitutifs d'UE)
CREATE TABLE public.ecue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ue_id UUID REFERENCES public.unites_enseignement(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 1,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id UUID REFERENCES public.etudiants(id) ON DELETE CASCADE NOT NULL,
  ecue_id UUID REFERENCES public.ecue(id) ON DELETE CASCADE NOT NULL,
  note NUMERIC(4,2) CHECK (note >= 0 AND note <= 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(etudiant_id, ecue_id)
);

-- Table des résultats calculés
CREATE TABLE public.resultats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id UUID REFERENCES public.etudiants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  moyenne_s1 NUMERIC(4,2),
  moyenne_s2 NUMERIC(4,2),
  moyenne_annuelle NUMERIC(4,2),
  credits_valides INTEGER DEFAULT 0,
  credits_totaux INTEGER DEFAULT 0,
  decision TEXT,
  mention TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (public access for MVP - secrétariat only)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etudiants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unites_enseignement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultats ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for MVP (no auth required initially)
CREATE POLICY "Allow all operations on sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on etudiants" ON public.etudiants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on unites_enseignement" ON public.unites_enseignement FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ecue" ON public.ecue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notes" ON public.notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on resultats" ON public.resultats FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resultats_updated_at BEFORE UPDATE ON public.resultats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();