import { useState, useEffect } from "react"; // v2
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

// ── LOGO BASE64 intégré (placeholder — sera remplacé par le vrai logo)
const LOGO = "/logo.png";

const NAV_PAR_ROLE = {
  directeur: [
    { id: "dashboard", icon: "⬡", label: "Tableau de bord" },
    { id: "eleves", icon: "◈", label: "Élèves" },
    { id: "planning", icon: "◫", label: "Planning" },
    { id: "presences", icon: "✓", label: "Présences" },
    { id: "projets", icon: "◉", label: "Projets" },
    { id: "compagnie", icon: "🎪", label: "Compagnie" },
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
    { id: "compagnie_pub", icon: "🎪", label: "Compagnie" },
    { id: "inscription", icon: "◈", label: "S'inscrire" },
    { id: "programme", icon: "◫", label: "Programme" },
    { id: "payer", icon: "₦", label: "Payer" },
  ],
};

const ROLE_LABELS = {
  directeur: "Directeur",
  ca: "Conseil d'Administration",
  admin: "Administrateur",
  formateur: "Formateur",
  public: "Visiteur",
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.blanc, borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, color = C.noir, small = false, outline = false }) => (
  <div onClick={onClick} style={{
    background: outline ? "transparent" : color,
    color: outline ? color : "#fff",
    border: outline ? `2px solid ${color}` : "none",
    borderRadius: small ? 8 : 12,
    padding: small ? "6px 14px" : "12px 20px",
    cursor: "pointer", fontWeight: 600,
    fontSize: small ? 12 : 14,
    display: "inline-block", fontFamily: FB,
    textAlign: "center",
  }}>{children}</div>
);

const Badge = ({ text, bg, color }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>{text}</span>
);

const Input = ({ label, type = "text", value, onChange, placeholder }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: C.gris, display: "block", marginBottom: 6, fontFamily: FB }}>{label}</label>}
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "12px 16px", borderRadius: 10,
        border: `1.5px solid ${C.grisClair}`, fontSize: 14,
        background: C.fond, outline: "none", fontFamily: FB,
        boxSizing: "border-box",
      }}
    />
  </div>
);

// ── PAGE DE CONNEXION ──
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // login | reset

  const handleLogin = async () => {
    if (!email || !password) { setError("Remplissez tous les champs."); return; }
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError("Email ou mot de passe incorrect."); setLoading(false); return; }
    // Récupérer le profil
    const { data: profil } = await supabase.from("profils").select("*").eq("id", data.user.id).single();
    if (!profil) { setError("Profil introuvable. Contactez l'administrateur."); setLoading(false); return; }
    if (!profil.actif) { setError("Votre compte est désactivé. Contactez la direction."); setLoading(false); return; }
    onLogin({ ...data.user, profil });
    setLoading(false);
  };

  const handleReset = async () => {
    if (!email) { setError("Entrez votre email."); return; }
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset` });
    setError(""); setLoading(false);
    setMode("reset_sent");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.noir} 0%, #2A1A0A 60%, #1A0A0A 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FB, padding: 20,
    }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 40, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO} alt="Circo Bénin" style={{ width: 100, objectFit: "contain", marginBottom: 16 }} />
          <h1 style={{ fontFamily: FT, fontSize: 24, color: C.noir, margin: "0 0 4px" }}>Circo Bénin</h1>
          <p style={{ color: C.gris, fontSize: 14, margin: 0 }}>
            {mode === "login" ? "Espace de gestion sécurisé" : mode === "reset" ? "Réinitialiser le mot de passe" : "Email envoyé !"}
          </p>
        </div>

        {mode === "login" && (
          <>
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="votre@email.com" />
            <Input label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            {error && <div style={{ color: C.rouge, fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#FFF0F0", borderRadius: 8 }}>{error}</div>}
            <div style={{ marginBottom: 12 }}>
              <Btn onClick={handleLogin} color={C.noir} style={{ width: "100%" }}>
                {loading ? "Connexion..." : "Se connecter"}
              </Btn>
            </div>
            <div style={{ textAlign: "center" }}>
              <span onClick={() => setMode("reset")} style={{ fontSize: 13, color: C.magenta, cursor: "pointer" }}>
                Mot de passe oublié ?
              </span>
            </div>
            <div style={{ marginTop: 24, padding: "16px", background: C.fond, borderRadius: 12, borderTop: `3px solid ${C.jaune}` }}>
              <div style={{ fontSize: 12, color: C.gris, marginBottom: 8, fontWeight: 700 }}>ACCÈS PUBLIC</div>
              <div onClick={() => onLogin({ profil: { role: "public", nom: "Visiteur" } })}
                style={{ fontSize: 14, color: C.noir, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🌐</span> Accéder à l'espace public sans connexion →
              </div>
            </div>
          </>
        )}

        {mode === "reset" && (
          <>
            <Input label="Votre email" type="email" value={email} onChange={setEmail} placeholder="votre@email.com" />
            {error && <div style={{ color: C.rouge, fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <Btn onClick={handleReset} color={C.magenta}>{loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}</Btn>
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <span onClick={() => setMode("login")} style={{ fontSize: 13, color: C.gris, cursor: "pointer" }}>← Retour à la connexion</span>
            </div>
          </>
        )}

        {mode === "reset_sent" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <p style={{ fontSize: 14, color: C.gris }}>Un email de réinitialisation a été envoyé à <strong>{email}</strong>.</p>
            <span onClick={() => setMode("login")} style={{ fontSize: 13, color: C.magenta, cursor: "pointer" }}>← Retour à la connexion</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── GESTION UTILISATEURS (directeur seulement) ──
const UtilisateursPage = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", nom: "", role: "formateur", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.from("profils").select("*").then(({ data }) => setUsers(data || []));
  }, []);

  const createUser = async () => {
    setLoading(true); setMsg("");
    // Créer via Supabase Auth Admin (nécessite service role - ici on simule)
    // En production, cela se fait via une Edge Function Supabase
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: { data: { nom: newUser.nom } }
    });
    if (error) { setMsg("Erreur : " + error.message); setLoading(false); return; }
    await supabase.from("profils").insert({ id: data.user.id, nom: newUser.nom, role: newUser.role });
    setMsg(`Compte créé pour ${newUser.nom} — un email de confirmation a été envoyé.`);
    setShowForm(false);
    setNewUser({ email: "", nom: "", role: "formateur", password: "" });
    const { data: updated } = await supabase.from("profils").select("*");
    setUsers(updated || []);
    setLoading(false);
  };

  const toggleActif = async (user) => {
    await supabase.from("profils").update({ actif: !user.actif }).eq("id", user.id);
    setUsers(users.map(u => u.id === user.id ? { ...u, actif: !u.actif } : u));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <p style={{ color: C.gris, fontSize: 14, margin: 0 }}>Gérez les accès à l'application</p>
        <Btn onClick={() => setShowForm(!showForm)}>+ Créer un compte</Btn>
      </div>

      {msg && <div style={{ background: "#E8F5E9", color: C.vert, padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 14 }}>{msg}</div>}

      {showForm && (
        <Card style={{ marginBottom: 24, borderTop: `3px solid ${C.magenta}` }}>
          <h3 style={{ fontFamily: FT, color: C.noir, margin: "0 0 20px" }}>Nouveau compte</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Nom complet" value={newUser.nom} onChange={v => setNewUser({ ...newUser, nom: v })} placeholder="Jean Luc" />
            <Input label="Email" type="email" value={newUser.email} onChange={v => setNewUser({ ...newUser, email: v })} placeholder="jean@circobenin.com" />
            <Input label="Mot de passe temporaire" type="password" value={newUser.password} onChange={v => setNewUser({ ...newUser, password: v })} placeholder="••••••••" />
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.gris, display: "block", marginBottom: 6 }}>Rôle</label>
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${C.grisClair}`, fontSize: 14, background: C.fond, fontFamily: FB }}>
                <option value="formateur">Formateur</option>
                <option value="admin">Administrateur</option>
                <option value="ca">Membre CA</option>
                <option value="directeur">Directeur</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn onClick={createUser} color={C.noir}>{loading ? "Création..." : "Créer le compte"}</Btn>
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
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.noir, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                      {u.nom?.[0] || "?"}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{u.nom}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <Badge text={ROLE_LABELS[u.role] || u.role} bg={C.fond} color={C.noir} />
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <Badge text={u.actif ? "Actif" : "Désactivé"} bg={u.actif ? "#E8F5E9" : "#FFEBEE"} color={u.actif ? C.vert : C.rouge} />
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span onClick={() => toggleActif(u)} style={{ fontSize: 13, color: C.magenta, cursor: "pointer", fontWeight: 600 }}>
                    {u.actif ? "Désactiver" : "Réactiver"}
                  </span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: C.gris, fontSize: 14 }}>Aucun utilisateur créé</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ── APP PRINCIPALE ──
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(null);
  const [sidebar, setSidebar] = useState(true);

  // Vérifier la session au chargement
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profil } = await supabase.from("profils").select("*").eq("id", session.user.id).single();
        if (profil && profil.actif) {
          setUser({ ...session.user, profil });
          setPage(NAV_PAR_ROLE[profil.role][0].id);
        }
      }
      setLoading(false);
    });

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") { setUser(null); setPage(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage(NAV_PAR_ROLE[userData.profil.role][0].id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setPage(null);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.fond }}>
      <div style={{ textAlign: "center" }}>
        <img src={LOGO} alt="Circo Bénin" style={{ width: 80, marginBottom: 16 }} />
        <div style={{ fontSize: 14, color: C.gris }}>Chargement...</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const role = user.profil.role;
  const nav = NAV_PAR_ROLE[role];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: FB, background: C.fond, overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebar ? 240 : 64, background: C.noir,
        display: "flex", flexDirection: "column",
        transition: "width 0.3s ease", flexShrink: 0,
        boxShadow: "4px 0 20px rgba(0,0,0,0.2)", zIndex: 10, overflow: "hidden",
      }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => setSidebar(!sidebar)}>
          <img src={LOGO} alt="Circo Bénin" style={{ width: 36, height: 36, objectFit: "contain", background: "#fff", borderRadius: 6, padding: 2, flexShrink: 0 }} />
          {sidebar && (
            <div>
              <div style={{ fontFamily: FT, color: "#fff", fontSize: 15, fontWeight: 700 }}>Circo Bénin</div>
              <div style={{ color: C.jaune, fontSize: 10, fontWeight: 600 }}>{ROLE_LABELS[role]}</div>
            </div>
          )}
        </div>
        <nav style={{ flex: 1, padding: "10px 0" }}>
          {nav.map(item => (
            <div key={item.id} onClick={() => setPage(item.id)} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: sidebar ? "12px 20px" : "12px 0",
              justifyContent: sidebar ? "flex-start" : "center",
              cursor: "pointer",
              background: page === item.id ? "rgba(255,255,255,0.12)" : "transparent",
              borderLeft: page === item.id ? `3px solid ${C.magenta}` : "3px solid transparent",
              color: page === item.id ? "#fff" : "rgba(255,255,255,0.6)",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebar && <span style={{ fontSize: 14, fontWeight: page === item.id ? 600 : 400 }}>{item.label}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.magenta, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {user.profil.nom?.[0] || "?"}
          </div>
          {sidebar && (
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{user.profil.nom}</div>
              <div onClick={handleLogout} style={{ color: C.jaune, fontSize: 11, cursor: "pointer" }}>Déconnexion</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <header style={{ background: "#fff", borderBottom: `1px solid ${C.grisClair}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontFamily: FT, fontSize: 20, color: C.noir, margin: 0, fontWeight: 700 }}>
              {nav.find(n => n.id === page)?.label}
            </h1>
            <div style={{ fontSize: 12, color: C.gris, marginTop: 2 }}>Rentrée 2024–2025 · Cotonou, Bénin</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge text={ROLE_LABELS[role]} bg={C.fond} color={C.noir} />
          </div>
        </header>

        <div style={{ flex: 1, padding: "28px 32px", overflow: "auto" }}>

          {/* Dashboard */}
          {page === "dashboard" && (
            <div>
              <Card style={{ marginBottom: 24, background: C.noir, color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: FT, fontSize: 22 }}>Bienvenue, {user.profil.nom} 👋</div>
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Vous êtes connecté en tant que {ROLE_LABELS[role]}</div>
                  </div>
                  <img src={LOGO} alt="" style={{ width: 60, opacity: 0.3 }} />
                </div>
              </Card>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
                {[
                  { label: "Élèves inscrits", value: "68", icon: "◈", color: C.noir },
                  { label: "Cours / semaine", value: "7", icon: "◫", color: C.magenta },
                  { label: "Paiements en attente", value: "2", icon: "₦", color: C.rouge },
                  { label: "Projets actifs", value: "5", icon: "◉", color: C.bleu },
                ].map((s, i) => (
                  <Card key={i} style={{ borderTop: `4px solid ${s.color}` }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: s.color, fontFamily: FT }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: C.gris, marginTop: 4 }}>{s.label}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Gestion utilisateurs - directeur seulement */}
          {page === "utilisateurs" && role === "directeur" && <UtilisateursPage />}

          {/* Pages protégées selon le rôle */}
          {page === "eleves" && ["directeur", "admin", "formateur"].includes(role) && (
            <Card>
              <div style={{ fontFamily: FT, fontSize: 18, marginBottom: 16 }}>Liste des élèves</div>
              <p style={{ color: C.gris, fontSize: 14 }}>Les données des élèves seront chargées depuis Supabase selon les droits de votre rôle.</p>
            </Card>
          )}

          {page === "mon_planning" && role === "formateur" && (
            <Card>
              <div style={{ fontFamily: FT, fontSize: 18, marginBottom: 16 }}>Mon planning — {user.profil.nom}</div>
              <p style={{ color: C.gris, fontSize: 14 }}>Vos cours de la semaine seront affichés ici.</p>
            </Card>
          )}

          {page === "finances" && role === "ca" && (
            <Card>
              <div style={{ fontFamily: FT, fontSize: 18, marginBottom: 16 }}>Synthèse financière</div>
              <p style={{ color: C.gris, fontSize: 14 }}>Les données financières accessibles aux membres du CA.</p>
            </Card>
          )}

          {/* Page non autorisée */}
          {page && !nav.find(n => n.id === page) && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <div style={{ fontFamily: FT, fontSize: 20, color: C.noir }}>Accès non autorisé</div>
              <p style={{ color: C.gris }}>Vous n'avez pas les droits pour accéder à cette section.</p>
            </div>
          )}

          {/* Accueil public */}
          {(page === "accueil") && role === "public" && (
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
                <p style={{ color: C.gris, lineHeight: 1.6 }}>
                  Vous consultez l'espace public de Circo Bénin. Inscrivez-vous, consultez notre programme et découvrez nos spectacles.
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <Btn onClick={() => setPage("inscription")} color={C.magenta}>S'inscrire</Btn>
                  <Btn onClick={() => setPage("compagnie_pub")} outline color={C.noir}>Nos spectacles</Btn>
                </div>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
