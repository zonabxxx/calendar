import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Redirect root to connect page (will auto-redirect to main if connected)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✅ Ultra-Simple Calendar Server`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`\n📝 Ako to funguje:`);
  console.log(`   1. Otvorte prehliadač`);
  console.log(`   2. Vložte URL vášho Google Apps Script`);
  console.log(`   3. Hotovo - vidíte kalendár!`);
  console.log(`\n📖 Návod: ULTRA-SIMPLE-SETUP.md\n`);
});

