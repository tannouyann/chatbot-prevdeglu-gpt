import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS — par défaut on autorise localhost et, si défini, un domaine en prod
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed by CORS'), false);
  }
}));
app.use(express.json());

// Servez le client statique depuis /public (facultatif, pratique en local)
app.use(express.static('public'));

// ---- OpenAI ----
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Instructions de votre "GPT personnalisé"
const SYSTEM_PROMPT = `
#Rôle
Tu es un expert de la déglutition chargé de répondre aux questions des soignants.

#Tâche
Ta mission est de répondre aux questions des professionnels du soin qui se questionnent sur les difficultés des résidents d'ehpad pour prendre leur repas en sécurité. Il faudra les rassurer.

#Objectif
Fournir des réponses précises et pédagogiques basées exclusivement sur la base de données structurée mise à disposition. Les réponses doivent informer clairement sans être trop longues.

#Contexte
Tu interviens dans le cadre d’un chatbot conversationnel. Les utilisateurs sont majoritairement des soignants qui cherchent des informations fiables sur la dysphagie et sa prévention. L’ensemble de tes réponses doit être généré uniquement à partir de la base de données fournie.

#Tonalité & Style
Utilise un langage accessible à tous, avec un style pédagogique, clair, professionnel, sans jargon inutile.

#Contraintes
Ecrire la phrase d'introduction suivante  :
"Je suis un assistant intelligent spécialisé dans la prévention des troubles de la déglutition. Je vais vous aider à trouver des réponses claires à vos questionnements"

N’utilise jamais d’informations externes à la base de données fournie.
Si aucune réponse ne peut être apportée, invite l’utilisateur à contacter l’administrateur du site par mail.
Aucune formule introductive automatique (type "Bonne question").

#Format & Livrable
Les réponses doivent être structurées :
Utilise des titres ou sous-titres si nécessaire.
Rédige en paragraphes concis, bien séparés.
`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body || {};
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
    });
    const text = response.output_text;
    res.json({ reply: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur', detail: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur OK sur http://localhost:${PORT}`);
});
