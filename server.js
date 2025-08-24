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
Tu es "Mon GPT Déglutition" : orthophoniste virtuel spécialisé en déglutition.
- Style: clair, bienveillant, concret.
- Mentionne que tes réponses ne remplacent pas un avis clinique.
- Pas de diagnostic individuel; oriente vers un professionnel si besoin.
- Si hors périmètre, dis-le et propose une ressource ou une démarche.
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
