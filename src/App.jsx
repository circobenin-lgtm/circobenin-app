import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const C = {
  noir: "#1A1A1A", magenta: "#C2185B", jaune: "#F5C518",
  fond: "#FFF9F0", blanc: "#FFFFFF", grisClair: "#EDEDED",
  gris: "#666666", rouge: "#E63946", bleu: "#1565C0",
  orange: "#E65100", vert: "#2E7D32",
};
const FT = "'Playfair Display', Georgia, serif";
const FB = "'DM Sans', sans-serif";
const LOGO = "/logo.png";

const NAV_PAR_ROLE = {
  directeur: [
    { id: "dashboard", icon: "⬡", label: "Tableau de bord" },
    { id: "eleves", icon: "◈", label: "Élèves" },
    { id: "planning", icon: "◫", label: "Planning" },
    { id: "presences", icon: "✓", label: "Présences" },
    { id: "projets", icon: "◉", label: "Projets" },
    { id: "paiements", icon: "₦", label: "Paiements" },
    { id: "utilisateurs", icon: "👤", label: "Utilisateurs" },
    { id: "tchat", icon: "◎", label: "Messagerie" },
    { id: "public", icon: "◐", label: "Vue publique" },
  ],
  ca: [
    { id: "dashboard", icon: "⬡", label: "Tableau de bord" },
    { id: "finances", icon: "₦", label: "Finances" },
    { id: "projets", icon: "◉", label: "Projets" },
    { id: "rapports", icon: "▦", label: "Rapports" },
    { id: "tchat", icon: "◎", label: "Messagerie" },
  ],
  admin: [
    { id: "dashboard", icon: "⬡", label: "Tableau de bord" },
    { id: "eleves", icon: "◈", label: "Élèves" },
    { id: "planning", icon: "◫", label: "Planning" },
    { id: "paiements", icon: "₦", label: "Paiements" },
    { id: "tchat", icon: "◎", label: "Messagerie" },
  ],
  formateur: [
    { id: "mon_planning", icon: "◫", label: "Mon Planning" },
    { id: "mes_projets", icon: "◉", label: "Mes Projets" },
    { id: "presences", icon: "✓", label: "Présences" },
    { id: "tchat", icon: "◎", label: "Messagerie" },
  ],
  public: [
    { id: "accueil", icon: "⬡", label: "Accueil" },
    { id: "inscription", icon: "◈", label: "S'inscrire" },
    { id: "programme", icon: "◫", label: "Programme" },
    { id: "payer", icon: "₦", label: "Payer" },
  ],
};

const ROLE_LABELS = {
  directeur: "Directeur", ca: "Conseil d'Administration",
  admin: "Administrateur", formateur: "Formateur", public: "Visiteur",
};

const JOURS_ORDRE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.blanc, borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, color = C.noir, small = false, outline = false }) => (
  <div onClick={onClick} style={{
    background: outline ? "transparent" : color, color: outline ? color : "#fff",
    border: outline ? `2px solid ${color}` : "none", borderRadius: small ? 8 : 12,
    padding: small ? "6px 14px" : "12px 20px", cursor: "pointer",
    fontWeight: 600, fontSize: small ? 12 : 14, display: "inline-block", fontFamily: FB,
  }}>{children}</div>
);

const Badge = ({ text, bg, color }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>{text}</span>
);

const Input = ({ label, type = "text", value, onChange, placeholder }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: C.gris, display: "block", marginBottom: 6 }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${C.grisClair}`,
        fontSize: 14, background: C.fond, outline: "none", fontFamily: FB, boxSizing: "border-box" }} />
  </div>
);

// ── CODES PIN PAR RÔLE ──
const PINS = {
  directeur: "CircoBenin2025!",
  ca: "Circ@5310",
  admin: "Circ@5310",
  formateur: "Circ@5310",
  public: null,
};

const PROFILS_LISTE = [
  { role: "directeur", nom: "Directeur", initiale: "D", color: C.noir },
  { role: "ca", nom: "Conseil d'Administration", initiale: "CA", color: C.bleu },
  { role: "admin", nom: "Administrateur", initiale: "AD", color: C.orange },
  { role: "formateur", nom: "Intervenant", initiale: "IN", color: "#6A1B9A" },
  { role: "public", nom: "Visiteur", initiale: "?", color: C.gris },
];

// ── PAGE DE CONNEXION ──
const LoginPage = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSelectRole = (profil) => {
    if (profil.role === "public") {
      onLogin({ profil: { role: "public", nom: "Visiteur" } });
      return;
    }
    setSelectedRole(profil);
    setPin("");
    setError("");
  };

  const handlePinSubmit = () => {
    if (pin === PINS[selectedRole.role]) {
      onLogin({ profil: { role: selectedRole.role, nom: selectedRole.nom } });
    } else {
      setError("Code incorrect. Réessayez.");
      setPin("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.noir} 0%, #2A1A0A 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FB, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 40, width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO} alt="Circo Bénin" style={{ width: 100, objectFit: "contain", marginBottom: 16 }} />
          <h1 style={{ fontFamily: FT, fontSize: 24, color: C.noir, margin: "0 0 4px" }}>Circo Bénin</h1>
          <p style={{ color: C.gris, fontSize: 14, margin: 0 }}>
            {selectedRole ? `Espace ${selectedRole.nom}` : "Choisissez votre espace de connexion"}
          </p>
        </div>

        {!selectedRole ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PROFILS_LISTE.map((p) => (
              <div key={p.role} onClick={() => handleSelectRole(p)} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", borderRadius: 12,
                border: `2px solid ${C.grisClair}`, cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.grisClair}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", background: p.color,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>{p.initiale}</div>
                <div>
                  <div style={{ fontWeight: 700, color: C.noir, fontSize: 14 }}>{p.nom}</div>
                  {p.role === "public"
                    ? <div style={{ fontSize: 12, color: C.gris }}>Accès libre</div>
                    : <div style={{ fontSize: 12, color: C.gris }}>Accès sécurisé 🔒</div>
                  }
                </div>
                <div style={{ marginLeft: "auto", color: C.gris, fontSize: 18 }}>→</div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: selectedRole.color,
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 700, margin: "0 auto 12px",
              }}>{selectedRole.initiale}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.noir }}>{selectedRole.nom}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.gris, display: "block", marginBottom: 6 }}>
                Code d'accès
              </label>
              <input
                type="password"
                value={pin}
                onChange={e => { setPin(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handlePinSubmit()}
                placeholder="Entrez votre code"
                autoFocus
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 10,
                  border: `2px solid ${error ? C.rouge : C.grisClair}`,
                  fontSize: 16, letterSpacing: 4, textAlign: "center",
                  outline: "none", fontFamily: FB, boxSizing: "border-box",
                  background: C.fond,
                }}
              />
            </div>
            {error && (
              <div style={{ color: C.rouge, fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#FFF0F0", borderRadius: 8, textAlign: "center" }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Btn onClick={() => { setSelectedRole(null); setError(""); }} color={C.gris} outline small>
                ← Retour
              </Btn>
              <div style={{ flex: 1 }}>
                <Btn onClick={handlePinSubmit} color={selectedRole.color}>
                  Accéder →
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── PAGE ÉLÈVES ──
const ElevesPage = () => {
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [nouvelEleve, setNouvelEleve] = useState({ nom: "", prenom: "", classe: "", nom_parent: "", telephone_parent: "" });

  useEffect(() => {
    supabase.from("eleves").select("*").order("nom").then(({ data }) => {
      setEleves(data || []);
      setLoading(false);
    });
  }, []);

  const elevesFiltrés = eleves.filter(e =>
    `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
    (e.classe || "").toLowerCase().includes(search.toLowerCase())
  );

  const ajouterEleve = async () => {
    const { data } = await supabase.from("eleves").insert({ ...nouvelEleve, statut: "actif" }).select().single();
    if (data) { setEleves([...eleves, data]); setShowForm(false); setNouvelEleve({ nom: "", prenom: "", classe: "", nom_parent: "", telephone_parent: "" }); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: C.gris }}>Chargement des élèves...</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève..."
          style={{ flex: 1, padding: "12px 18px", borderRadius: 12, border: `1px solid ${C.grisClair}`, fontSize: 14, background: "#fff", outline: "none" }} />
        <Btn onClick={() => setShowForm(!showForm)}>+ Ajouter un élève</Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 20, borderTop: `3px solid ${C.magenta}` }}>
          <h3 style={{ fontFamily: FT, margin: "0 0 16px" }}>Nouvel élève</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Nom" value={nouvelEleve.nom} onChange={v => setNouvelEleve({ ...nouvelEleve, nom: v })} />
            <Input label="Prénom" value={nouvelEleve.prenom} onChange={v => setNouvelEleve({ ...nouvelEleve, prenom: v })} />
            <Input label="Groupe / Classe" value={nouvelEleve.classe} onChange={v => setNouvelEleve({ ...nouvelEleve, classe: v })} />
            <Input label="Nom du parent" value={nouvelEleve.nom_parent} onChange={v => setNouvelEleve({ ...nouvelEleve, nom_parent: v })} />
            <Input label="Téléphone parent" value={nouvelEleve.telephone_parent} onChange={v => setNouvelEleve({ ...nouvelEleve, telephone_parent: v })} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn onClick={ajouterEleve} color={C.magenta}>Enregistrer</Btn>
            <Btn onClick={() => setShowForm(false)} outline color={C.gris}>Annuler</Btn>
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.fond }}>
              {["Nom", "Prénom", "Groupe", "Parent", "Téléphone", "Statut"].map(h => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: C.gris, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {elevesFiltrés.map((e, i) => (
              <tr key={e.id} style={{ borderTop: `1px solid ${C.grisClair}`, background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 20px", fontWeight: 700, fontSize: 14 }}>{e.nom}</td>
                <td style={{ padding: "12px 20px", fontSize: 14 }}>{e.prenom}</td>
                <td style={{ padding: "12px 20px" }}><Badge text={e.classe || "—"} bg={C.fond} color={C.noir} /></td>
                <td style={{ padding: "12px 20px", fontSize: 13, color: C.gris }}>{e.nom_parent || "—"}</td>
                <td style={{ padding: "12px 20px", fontSize: 13, color: C.gris }}>{e.telephone_parent || "—"}</td>
                <td style={{ padding: "12px 20px" }}>
                  <Badge text={e.statut} bg={e.statut === "actif" ? "#E8F5E9" : "#FFEBEE"} color={e.statut === "actif" ? C.vert : C.rouge} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "12px 20px", fontSize: 13, color: C.gris, borderTop: `1px solid ${C.grisClair}` }}>
          {elevesFiltrés.length} élève{elevesFiltrés.length > 1 ? "s" : ""}
        </div>
      </Card>
    </div>
  );
};

// ── PAGE PLANNING ──
const PlanningPage = ({ role }) => {
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("cours").select("*").order("jour").then(({ data }) => {
      setCours(data || []);
      setLoading(false);
    });
  }, []);

  const coursTries = [...cours].sort((a, b) => JOURS_ORDRE.indexOf(a.jour) - JOURS_ORDRE.indexOf(b.jour));
  const jours = [...new Set(coursTries.map(c => c.jour))];

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: C.gris }}>Chargement...</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {jours.map(jour => (
          <div key={jour} style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontFamily: FT, fontSize: 16, fontWeight: 700, color: C.magenta, marginBottom: 12 }}>{jour}</div>
            {coursTries.filter(c => c.jour === jour).map(c => (
              <div key={c.id} style={{ background: C.fond, borderRadius: 8, padding: "8px 12px", marginBottom: 8, borderLeft: `3px solid ${C.jaune}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.noir }}>{c.heure_debut} – {c.heure_fin}</div>
                <div style={{ fontSize: 12, color: C.gris }}>{c.classe}</div>
                <div style={{ fontSize: 11, color: C.gris }}>{c.salle}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Card>
        <h3 style={{ fontFamily: FT, color: C.noir, margin: "0 0 16px" }}>Tous les cours ({cours.length})</h3>
        {coursTries.map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: `1px solid ${C.grisClair}` }}>
            <Badge text={c.jour} bg={C.magenta} color="#fff" />
            <Badge text={`${c.heure_debut} – ${c.heure_fin}`} bg={C.fond} color={C.noir} />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{c.classe}</div>
            <div style={{ fontSize: 13, color: C.gris }}>{c.salle}</div>
            <Badge text={c.type} bg={C.fond} color={C.gris} />
          </div>
        ))}
      </Card>
    </div>
  );
};

// ── PAGE PRÉSENCES ──
const PresencesPage = () => {
  const [cours, setCours] = useState([]);
  const [activeCours, setActiveCours] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [presences, setPresences] = useState({});
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    supabase.from("cours").select("*").order("jour").then(({ data }) => {
      setCours(data || []);
      setLoading(false);
    });
  }, []);

  const ouvrirCours = async (c) => {
    setActiveCours(c);
    const { data: elevesData } = await supabase.from("eleves").select("*").eq("classe", c.classe).order("nom");
    setEleves(elevesData || []);
    const { data: presData } = await supabase.from("presences").select("*").eq("cours_id", c.id).eq("date", today);
    const map = {};
    (presData || []).forEach(p => { map[p.eleve_id] = p.present; });
    setPresences(map);
  };

  const togglePresence = async (eleveId) => {
    const present = !presences[eleveId];
    setPresences({ ...presences, [eleveId]: present });
    const { data: existing } = await supabase.from("presences").select("id").eq("cours_id", activeCours.id).eq("eleve_id", eleveId).eq("date", today).single();
    if (existing) {
      await supabase.from("presences").update({ present }).eq("id", existing.id);
    } else {
      await supabase.from("presences").insert({ cours_id: activeCours.id, eleve_id: eleveId, date: today, present });
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: C.gris }}>Chargement...</div>;

  if (!activeCours) return (
    <div>
      <p style={{ color: C.gris, marginBottom: 20 }}>Sélectionnez un cours pour prendre les présences</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {cours.map(c => (
          <Card key={c.id} onClick={() => ouvrirCours(c)} style={{ cursor: "pointer", borderLeft: `4px solid ${C.jaune}` }}>
            <Badge text={c.jour} bg={C.magenta} color="#fff" />
            <div style={{ fontFamily: FT, fontSize: 16, margin: "10px 0 4px" }}>{c.classe}</div>
            <div style={{ fontSize: 13, color: C.gris }}>{c.heure_debut} – {c.heure_fin}</div>
            <div style={{ marginTop: 12 }}><Btn small color={C.noir}>Ouvrir →</Btn></div>
          </Card>
        ))}
      </div>
    </div>
  );

  const nbPresents = Object.values(presences).filter(Boolean).length;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <span onClick={() => setActiveCours(null)} style={{ cursor: "pointer", color: C.gris, fontSize: 14 }}>← Retour</span>
        <div style={{ fontFamily: FT, fontSize: 20, color: C.noir }}>{activeCours.classe} — {activeCours.jour} {activeCours.heure_debut}</div>
        <Badge text={today} bg={C.fond} color={C.gris} />
      </div>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {eleves.map(e => {
            const present = presences[e.id];
            return (
              <div key={e.id} onClick={() => togglePresence(e.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: 14,
                borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
                background: present ? "#E8F5E9" : C.grisClair,
                border: `2px solid ${present ? C.vert : "transparent"}`,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: present ? C.vert : C.gris,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                  {e.nom[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{e.nom} {e.prenom}</div>
                </div>
                <div style={{ fontSize: 20 }}>{present ? "✅" : "⬜"}</div>
              </div>
            );
          })}
          {eleves.length === 0 && <div style={{ color: C.gris, fontSize: 14, gridColumn: "1/-1", textAlign: "center", padding: 20 }}>Aucun élève dans ce groupe</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, color: C.gris }}>{nbPresents} présent(s) sur {eleves.length}</div>
          <Btn color={C.vert}>✓ Feuille validée</Btn>
        </div>
      </Card>
    </div>
  );
};

// ── PAGE UTILISATEURS ──
const UtilisateursPage = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", nom: "", role: "formateur", password: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.from("profils").select("*").then(({ data }) => setUsers(data || []));
  }, []);

  const createUser = async () => {
    const { data, error } = await supabase.auth.signUp({ email: newUser.email, password: newUser.password });
    if (error) { setMsg("Erreur : " + error.message); return; }
    await supabase.from("profils").insert({ id: data.user.id, nom: newUser.nom, role: newUser.role, actif: true });
    setMsg(`Compte créé pour ${newUser.nom}`);
    setShowForm(false);
    const { data: updated } = await supabase.from("profils").select("*");
    setUsers(updated || []);
  };

  const toggleActif = async (u) => {
    await supabase.from("profils").update({ actif: !u.actif }).eq("id", u.id);
    setUsers(users.map(x => x.id === u.id ? { ...x, actif: !x.actif } : x));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ color: C.gris, margin: 0, fontSize: 14 }}>Gérez les accès à l'application</p>
        <Btn onClick={() => setShowForm(!showForm)}>+ Créer un compte</Btn>
      </div>
      {msg && <div style={{ background: "#E8F5E9", color: C.vert, padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>{msg}</div>}
      {showForm && (
        <Card style={{ marginBottom: 20, borderTop: `3px solid ${C.magenta}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Nom complet" value={newUser.nom} onChange={v => setNewUser({ ...newUser, nom: v })} />
            <Input label="Email" type="email" value={newUser.email} onChange={v => setNewUser({ ...newUser, email: v })} />
            <Input label="Mot de passe" type="password" value={newUser.password} onChange={v => setNewUser({ ...newUser, password: v })} />
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.gris, display: "block", marginBottom: 6 }}>Rôle</label>
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${C.grisClair}`, fontSize: 14 }}>
                <option value="formateur">Formateur</option>
                <option value="admin">Administrateur</option>
                <option value="ca">Membre CA</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <Btn onClick={createUser} color={C.magenta}>Créer</Btn>
            <Btn onClick={() => setShowForm(false)} outline color={C.gris}>Annuler</Btn>
          </div>
        </Card>
      )}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.fond }}>
              {["Nom", "Rôle", "Statut", "Action"].map(h => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: C.gris, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderTop: `1px solid ${C.grisClair}`, background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px 20px", fontWeight: 600, fontSize: 14 }}>{u.nom}</td>
                <td style={{ padding: "12px 20px" }}><Badge text={ROLE_LABELS[u.role] || u.role} bg={C.fond} color={C.noir} /></td>
                <td style={{ padding: "12px 20px" }}><Badge text={u.actif ? "Actif" : "Désactivé"} bg={u.actif ? "#E8F5E9" : "#FFEBEE"} color={u.actif ? C.vert : C.rouge} /></td>
                <td style={{ padding: "12px 20px" }}>
                  <span onClick={() => toggleActif(u)} style={{ fontSize: 13, color: C.magenta, cursor: "pointer", fontWeight: 600 }}>
                    {u.actif ? "Désactiver" : "Réactiver"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ── APP PRINCIPALE ──
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(null);
  const [sidebar, setSidebar] = useState(true);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage(NAV_PAR_ROLE[userData.profil.role][0].id);
  };

  const handleLogout = () => {
    setUser(null); setPage(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const role = user.profil.role;
  const nav = NAV_PAR_ROLE[role];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: FB, background: C.fond, overflow: "hidden" }}>
      <aside style={{ width: sidebar ? 240 : 64, background: C.noir, display: "flex", flexDirection: "column",
        transition: "width 0.3s ease", flexShrink: 0, boxShadow: "4px 0 20px rgba(0,0,0,0.2)", zIndex: 10, overflow: "hidden" }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setSidebar(!sidebar)}>
          <img src={LOGO} alt="Circo Bénin" style={{ width: 36, height: 36, objectFit: "contain", background: "#fff", borderRadius: 6, padding: 2, flexShrink: 0 }} />
          {sidebar && <div>
            <div style={{ fontFamily: FT, color: "#fff", fontSize: 15, fontWeight: 700 }}>Circo Bénin</div>
            <div style={{ color: C.jaune, fontSize: 10, fontWeight: 600 }}>{ROLE_LABELS[role]}</div>
          </div>}
        </div>
        <nav style={{ flex: 1, padding: "10px 0" }}>
          {nav.map(item => (
            <div key={item.id} onClick={() => setPage(item.id)} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: sidebar ? "12px 20px" : "12px 0", justifyContent: sidebar ? "flex-start" : "center",
              cursor: "pointer", background: page === item.id ? "rgba(255,255,255,0.12)" : "transparent",
              borderLeft: page === item.id ? `3px solid ${C.magenta}` : "3px solid transparent",
              color: page === item.id ? "#fff" : "rgba(255,255,255,0.6)", transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebar && <span style={{ fontSize: 14, fontWeight: page === item.id ? 600 : 400 }}>{item.label}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.magenta, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {user.profil.nom?.[0] || "?"}
          </div>
          {sidebar && <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{user.profil.nom}</div>
            <div onClick={handleLogout} style={{ color: C.jaune, fontSize: 11, cursor: "pointer" }}>Déconnexion</div>
          </div>}
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <header style={{ background: "#fff", borderBottom: `1px solid ${C.grisClair}`,
          padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontFamily: FT, fontSize: 20, color: C.noir, margin: 0 }}>{nav.find(n => n.id === page)?.label}</h1>
            <div style={{ fontSize: 12, color: C.gris, marginTop: 2 }}>Rentrée 2024–2025 · Cotonou, Bénin</div>
          </div>
          <Badge text={ROLE_LABELS[role]} bg={C.fond} color={C.noir} />
        </header>

        <div style={{ flex: 1, padding: "28px 32px", overflow: "auto" }}>

          {page === "dashboard" && (
            <div>
              <Card style={{ marginBottom: 24, background: C.noir, color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: FT, fontSize: 22 }}>Bienvenue, {user.profil.nom} 👋</div>
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Connecté en tant que {ROLE_LABELS[role]}</div>
                  </div>
                  <img src={LOGO} alt="" style={{ width: 60, opacity: 0.3 }} />
                </div>
              </Card>
              <DashboardStats role={role} />
            </div>
          )}

          {page === "eleves" && ["directeur", "admin"].includes(role) && <ElevesPage />}
          {page === "planning" && ["directeur", "admin", "formateur"].includes(role) && <PlanningPage role={role} />}
          {page === "mon_planning" && role === "formateur" && <PlanningPage role={role} />}
          {page === "presences" && <PresencesPage />}
          {page === "utilisateurs" && role === "directeur" && <UtilisateursPage />}

          {page === "accueil" && role === "public" && (
            <div>
              <Card style={{ background: C.noir, color: "#fff", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <img src={LOGO} alt="" style={{ width: 60 }} />
                  <div>
                    <div style={{ fontFamily: FT, fontSize: 22 }}>Circo Bénin</div>
                    <div style={{ fontSize: 14, opacity: 0.8 }}>Première école des arts du cirque du Bénin · Cotonou</div>
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ fontFamily: FT, fontSize: 18, marginBottom: 12 }}>Bienvenue !</div>
                <p style={{ color: C.gris }}>Consultez notre programme, inscrivez-vous ou payez en ligne.</p>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <Btn onClick={() => setPage("inscription")} color={C.magenta}>S'inscrire</Btn>
                  <Btn onClick={() => setPage("programme")} outline color={C.noir}>Programme</Btn>
                </div>
              </Card>
            </div>
          )}

          {page === "programme" && role === "public" && <PlanningPage role="public" />}

        </div>
      </main>
    </div>
  );
}

// ── STATS DASHBOARD ──
const DashboardStats = ({ role }) => {
  const [stats, setStats] = useState({ eleves: 0, cours: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("eleves").select("id", { count: "exact" }),
      supabase.from("cours").select("id", { count: "exact" }),
    ]).then(([e, c]) => {
      setStats({ eleves: e.count || 0, cours: c.count || 0 });
    });
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
      {[
        { label: "Élèves inscrits", value: stats.eleves, icon: "◈", color: C.noir },
        { label: "Cours / semaine", value: stats.cours, icon: "◫", color: C.magenta },
        { label: "Paiements en attente", value: "—", icon: "₦", color: C.rouge },
        { label: "Projets actifs", value: "—", icon: "◉", color: C.bleu },
      ].map((s, i) => (
        <Card key={i} style={{ borderTop: `4px solid ${s.color}` }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: s.color, fontFamily: FT }}>{s.value}</div>
          <div style={{ fontSize: 13, color: C.gris, marginTop: 4 }}>{s.label}</div>
        </Card>
      ))}
    </div>
  );
};
