// Client « base de données sécurisée » de l'app Circo Bénin.
// Même syntaxe que supabase-js (from().select().eq()…), mais chaque requête passe par
// /api/db, qui vérifie le laissez-passer (jeton) de la personne connectée avant d'agir.
// Sans jeton valide, aucune donnée interne n'est accessible.

let jetonActuel = null;
export const definirJeton = (jeton) => { jetonActuel = jeton || null; };

class Requete {
  constructor(table) {
    this.q = { table, op: 'select', colonnes: '*', filtres: [], ordre: [], limite: null, unique: null, valeurs: null, options: null, retour: null };
  }

  select(colonnes = '*') {
    if (this.q.op === 'select') this.q.colonnes = colonnes;
    else this.q.retour = colonnes || '*';
    return this;
  }
  insert(valeurs, options) { this.q.op = 'insert'; this.q.valeurs = valeurs; this.q.options = options || null; return this; }
  upsert(valeurs, options) { this.q.op = 'upsert'; this.q.valeurs = valeurs; this.q.options = options || null; return this; }
  update(valeurs) { this.q.op = 'update'; this.q.valeurs = valeurs; return this; }
  delete() { this.q.op = 'delete'; return this; }

  filtre(op, colonne, valeur) { this.q.filtres.push([op, colonne, valeur]); return this; }
  eq(c, v) { return this.filtre('eq', c, v); }
  neq(c, v) { return this.filtre('neq', c, v); }
  gt(c, v) { return this.filtre('gt', c, v); }
  gte(c, v) { return this.filtre('gte', c, v); }
  lt(c, v) { return this.filtre('lt', c, v); }
  lte(c, v) { return this.filtre('lte', c, v); }
  in(c, v) { return this.filtre('in', c, v); }
  is(c, v) { return this.filtre('is', c, v); }
  like(c, v) { return this.filtre('like', c, v); }
  ilike(c, v) { return this.filtre('ilike', c, v); }

  order(colonne, options = {}) { this.q.ordre.push([colonne, options.ascending !== false]); return this; }
  limit(n) { this.q.limite = n; return this; }
  single() { this.q.unique = 'single'; return this; }
  maybeSingle() { this.q.unique = 'maybe'; return this; }

  async executer() {
    try {
      const rep = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jetonActuel ? { Authorization: `Bearer ${jetonActuel}` } : {}),
        },
        body: JSON.stringify(this.q),
      });
      const corps = await rep.json().catch(() => ({}));
      if (!rep.ok) return { data: null, error: corps.error || { message: `Accès refusé (${rep.status})` } };
      return { data: corps.data ?? null, error: corps.error || null };
    } catch (e) {
      return { data: null, error: { message: 'Connexion impossible' } };
    }
  }

  then(resolve, reject) { return this.executer().then(resolve, reject); }
}

export const supabaseSecurise = { from: (table) => new Requete(table) };
