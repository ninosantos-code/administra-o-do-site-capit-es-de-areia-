import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('capitaes.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    price TEXT NOT NULL,
    image TEXT NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    alt_text TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    rotation INTEGER DEFAULT 0,
    type TEXT DEFAULT 'image'
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

try {
  db.exec('ALTER TABLE gallery ADD COLUMN rotation INTEGER DEFAULT 0');
} catch (e) {
  // Column might already exist
}
try {
  db.exec("ALTER TABLE gallery ADD COLUMN type TEXT DEFAULT 'image'");
} catch (e) {
  // Column might already exist
}

// Ensure site_settings table exists (in case it wasn't created in the initial block)
db.exec(`
  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed initial site settings
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM site_settings').get() as { count: number };
if (settingsCount.count === 0) {
  const insertSetting = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
  insertSetting.run('hero_image', 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=100&w=2000');
  insertSetting.run('about_image_1', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=100&w=1200');
  insertSetting.run('about_image_2', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=100&w=1200');
}

// Seed initial data if empty
const toursCount = db.prepare('SELECT COUNT(*) as count FROM tours').get() as { count: number };
if (toursCount.count === 0) {
  const insertTour = db.prepare('INSERT INTO tours (title, description, duration, price, image, icon) VALUES (?, ?, ?, ?, ?, ?)');
  insertTour.run('Piscinas Naturais de Moreré', 'Mergulhe em águas cristalinas e nade com peixes coloridos no cartão postal da Ilha de Boipeba. Um passeio imperdível na maré baixa.', '2-3 horas', 'A partir de R$ 100', 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=800', 'Sun');
  insertTour.run('Volta à Ilha de Lancha', 'Conheça as praias de Bainema, Ponta dos Castelhanos, Cova da Onça e navegue pelo Rio do Inferno com paradas para banho e almoço.', 'Dia inteiro (9h às 16h)', 'A partir de R$ 250', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800', 'Anchor');
  insertTour.run('Passeio de Canoa no Mangue', 'Uma experiência contemplativa pelos túneis do manguezal. Silêncio, natureza intocada e um pôr do sol inesquecível nas águas calmas.', '2 horas', 'A partir de R$ 80', 'https://images.unsplash.com/photo-1621274220348-41eeebf5e253?auto=format&fit=crop&q=80&w=800', 'Camera');
  insertTour.run('Bioluminescência de Caiaque', 'Uma experiência mágica noturna. Reme pelas águas escuras e veja o mar brilhar a cada movimento com o fenômeno da bioluminescência.', '1.5 horas (Noturno)', 'A partir de R$ 120', 'https://images.unsplash.com/photo-1518182170546-076616fdca44?auto=format&fit=crop&q=80&w=800', 'Star');
  insertTour.run('Vivência Nativa: Pesca e Preparo', 'Sinta-se um verdadeiro morador da ilha. Participe da pesca artesanal com os nativos e aprenda a preparar o seu próprio peixe fresco à moda baiana.', 'Um dia inteiro', 'Valor a combinar', 'https://images.unsplash.com/photo-1520116468816-95b69f847357?auto=format&fit=crop&q=80&w=800', 'Anchor');
}

const galleryCount = db.prepare('SELECT COUNT(*) as count FROM gallery').get() as { count: number };
if (galleryCount.count === 0) {
  const insertGallery = db.prepare('INSERT INTO gallery (image_url, alt_text, display_order) VALUES (?, ?, ?)');
  insertGallery.run('https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=600', 'Galeria 1', 1);
  insertGallery.run('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600', 'Galeria 2', 2);
  insertGallery.run('https://images.unsplash.com/photo-1537956965359-7573183d1f57?auto=format&fit=crop&q=80&w=600', 'Galeria 3', 3);
  insertGallery.run('https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&q=80&w=600', 'Galeria 4', 4);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Login
  app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const setting = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('admin_password') as { value: string } | undefined;
    const adminPassword = setting ? setting.value : 'Lagosta@7';
    
    if (password === adminPassword) {
      res.json({ success: true, token: 'admin-token-123' });
    } else {
      res.status(401).json({ success: false, message: 'Senha incorreta' });
    }
  });

  // Password Recovery
  app.post('/api/recover-password', (req, res) => {
    const { code, newPassword } = req.body;
    const RECOVERY_CODE = '726597@@Ng';
    
    if (code === RECOVERY_CODE) {
      if (newPassword) {
        db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run('admin_password', newPassword);
        res.json({ success: true, message: 'Senha atualizada com sucesso' });
      } else {
        const setting = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('admin_password') as { value: string } | undefined;
        const currentPassword = setting ? setting.value : 'Lagosta@7';
        res.json({ success: true, password: currentPassword });
      }
    } else {
      res.status(401).json({ success: false, message: 'Código de recuperação inválido' });
    }
  });

  // Authentication Middleware
  const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: 'Token não fornecido' });

    if (token === 'admin-token-123') {
      next();
    } else {
      res.status(403).json({ error: 'Token inválido' });
    }
  };

  // Generate Image with AI
  app.post('/api/generate-image', authenticateToken, async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
          }
        },
      });

      let base64Image = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }

      if (base64Image) {
        res.json({ success: true, imageUrl: `data:image/png;base64,${base64Image}` });
      } else {
        res.status(500).json({ error: 'Failed to generate image' });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      res.status(500).json({ error: 'Failed to generate image' });
    }
  });

  // Track page view
  app.post('/api/track', (req, res) => {
    const { path } = req.body;
    if (path) {
      const stmt = db.prepare('INSERT INTO page_views (path) VALUES (?)');
      stmt.run(path);
    }
    res.json({ success: true });
  });

  // Get analytics
  app.get('/api/analytics', authenticateToken, (req, res) => {
    const totalViewsStmt = db.prepare('SELECT COUNT(*) as count FROM page_views');
    const totalViews = totalViewsStmt.get() as { count: number };

    const todayViewsStmt = db.prepare("SELECT COUNT(*) as count FROM page_views WHERE date(created_at) = date('now')");
    const todayViews = todayViewsStmt.get() as { count: number };

    const recentViewsStmt = db.prepare('SELECT path, created_at FROM page_views ORDER BY created_at DESC LIMIT 10');
    const recentViews = recentViewsStmt.all();

    res.json({
      totalViews: totalViews.count,
      todayViews: todayViews.count,
      recentViews
    });
  });

  // Get all tours
  app.get('/api/tours', (req, res) => {
    const stmt = db.prepare('SELECT * FROM tours');
    const tours = stmt.all();
    res.json(tours);
  });

  // Update a tour
  app.put('/api/tours/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, description, duration, price, image, icon } = req.body;
    
    if (!title || !description || !duration || !price || !image || !icon) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const stmt = db.prepare('UPDATE tours SET title = ?, description = ?, duration = ?, price = ?, image = ?, icon = ? WHERE id = ?');
    const info = stmt.run(title, description, duration, price, image, icon, id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    
    res.json({ success: true });
  });

  // Get all gallery images
  app.get('/api/gallery', (req, res) => {
    const stmt = db.prepare('SELECT * FROM gallery ORDER BY display_order ASC');
    const gallery = stmt.all();
    res.json(gallery);
  });

  // Update a gallery image
  app.put('/api/gallery/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { image_url, alt_text, rotation, type } = req.body;
    
    if (!image_url || !alt_text) {
      return res.status(400).json({ error: 'Image URL and alt text are required' });
    }

    const stmt = db.prepare('UPDATE gallery SET image_url = ?, alt_text = ?, rotation = ?, type = ? WHERE id = ?');
    const info = stmt.run(image_url, alt_text, rotation || 0, type || 'image', id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Gallery image not found' });
    }
    
    res.json({ success: true });
  });

  // Add a new gallery image
  app.post('/api/gallery', authenticateToken, (req, res) => {
    const { image_url, alt_text, type } = req.body;
    
    if (!image_url || !alt_text) {
      return res.status(400).json({ error: 'Image URL and alt text are required' });
    }

    const maxOrderStmt = db.prepare('SELECT MAX(display_order) as maxOrder FROM gallery');
    const maxOrderResult = maxOrderStmt.get() as { maxOrder: number | null };
    const nextOrder = (maxOrderResult.maxOrder || 0) + 1;

    const stmt = db.prepare('INSERT INTO gallery (image_url, alt_text, display_order, rotation, type) VALUES (?, ?, ?, 0, ?)');
    const info = stmt.run(image_url, alt_text, nextOrder, type || 'image');
    
    res.status(201).json({ id: info.lastInsertRowid, image_url, alt_text, display_order: nextOrder, rotation: 0, type: type || 'image' });
  });

  // Delete a gallery image
  app.delete('/api/gallery/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM gallery WHERE id = ?');
    const info = stmt.run(id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Gallery image not found' });
    }
    
    res.json({ success: true });
  });

  // Get all comments
  app.get('/api/comments', (req, res) => {
    const status = req.query.status;
    
    // Only allow public access to approved comments
    if (status !== 'approved') {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token !== 'admin-token-123') {
        return res.status(403).json({ error: 'Unauthorized to view non-approved comments' });
      }
    }

    let comments;
    if (status) {
      const stmt = db.prepare('SELECT * FROM comments WHERE status = ? ORDER BY created_at DESC');
      comments = stmt.all(status);
    } else {
      const stmt = db.prepare('SELECT * FROM comments ORDER BY created_at DESC');
      comments = stmt.all();
    }
    res.json(comments);
  });

  // Post a new comment (Public view)
  app.post('/api/comments', (req, res) => {
    const { author, content } = req.body;
    if (!author || !content) {
      return res.status(400).json({ error: 'Author and content are required' });
    }
    const stmt = db.prepare('INSERT INTO comments (author, content) VALUES (?, ?)');
    const info = stmt.run(author, content);
    res.status(201).json({ id: info.lastInsertRowid, author, content, status: 'pending' });
  });

  // Update comment status (Admin view)
  app.put('/api/comments/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const stmt = db.prepare('UPDATE comments SET status = ? WHERE id = ?');
    const info = stmt.run(status, id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.json({ success: true });
  });

  // Get all updates (Public & Admin view)
  app.get('/api/updates', (req, res) => {
    const stmt = db.prepare('SELECT * FROM updates ORDER BY created_at DESC');
    const updates = stmt.all();
    res.json(updates);
  });

  // Post a new update (Admin view)
  app.post('/api/updates', authenticateToken, (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const stmt = db.prepare('INSERT INTO updates (title, content) VALUES (?, ?)');
    const info = stmt.run(title, content);
    res.status(201).json({ id: info.lastInsertRowid, title, content });
  });

  // Get site settings
  app.get('/api/settings', (req, res) => {
    const stmt = db.prepare('SELECT * FROM site_settings');
    const settings = stmt.all() as { key: string, value: string }[];
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    res.json(settingsObj);
  });

  // Update site settings
  app.put('/api/settings', authenticateToken, (req, res) => {
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings object' });
    }

    const stmt = db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)');
    
    const updateMany = db.transaction((settingsObj: Record<string, string>) => {
      for (const [key, value] of Object.entries(settingsObj)) {
        stmt.run(key, value);
      }
    });

    try {
      updateMany(settings);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to update settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
