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
    display_order INTEGER NOT NULL
  );
`);

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
  app.get('/api/analytics', (req, res) => {
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
  app.put('/api/tours/:id', (req, res) => {
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
  app.put('/api/gallery/:id', (req, res) => {
    const { id } = req.params;
    const { image_url, alt_text } = req.body;
    
    if (!image_url || !alt_text) {
      return res.status(400).json({ error: 'Image URL and alt text are required' });
    }

    const stmt = db.prepare('UPDATE gallery SET image_url = ?, alt_text = ? WHERE id = ?');
    const info = stmt.run(image_url, alt_text, id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Gallery image not found' });
    }
    
    res.json({ success: true });
  });

  // Get all comments (Admin view)
  app.get('/api/comments', (req, res) => {
    const status = req.query.status;
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
  app.put('/api/comments/:id/status', (req, res) => {
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
  app.post('/api/updates', (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const stmt = db.prepare('INSERT INTO updates (title, content) VALUES (?, ?)');
    const info = stmt.run(title, content);
    res.status(201).json({ id: info.lastInsertRowid, title, content });
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
