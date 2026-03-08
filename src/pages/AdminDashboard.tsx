import React, { useState, useEffect } from 'react';
import { Check, X, Clock, FileText, PlusCircle, AlertCircle, BarChart3, Users, Eye, Map, Image as ImageIcon, Save } from 'lucide-react';

interface Comment {
  id: number;
  author: string;
  content: string;
  status: string;
  created_at: string;
}

interface Update {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface Analytics {
  totalViews: number;
  todayViews: number;
  recentViews: { path: string; created_at: string }[];
}

interface Tour {
  id: number;
  title: string;
  description: string;
  duration: string;
  price: string;
  image: string;
  icon: string;
}

interface GalleryImage {
  id: number;
  image_url: string;
  alt_text: string;
  display_order: number;
}

export default function AdminDashboard() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [newUpdateTitle, setNewUpdateTitle] = useState('');
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comments' | 'updates' | 'tours' | 'gallery'>('dashboard');

  useEffect(() => {
    fetchComments();
    fetchUpdates();
    fetchAnalytics();
    fetchTours();
    fetchGallery();
  }, []);

  const fetchTours = async () => {
    try {
      const res = await fetch('/api/tours');
      const data = await res.json();
      setTours(data);
    } catch (error) {
      console.error('Failed to fetch tours:', error);
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      setGallery(data);
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
    }
  };

  const handleUpdateTour = async (tour: Tour) => {
    try {
      const res = await fetch(`/api/tours/${tour.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tour),
      });
      if (res.ok) {
        alert('Passeio atualizado com sucesso!');
        fetchTours();
      }
    } catch (error) {
      console.error('Failed to update tour:', error);
      alert('Erro ao atualizar passeio.');
    }
  };

  const handleUpdateGalleryImage = async (image: GalleryImage) => {
    try {
      const res = await fetch(`/api/gallery/${image.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(image),
      });
      if (res.ok) {
        alert('Imagem atualizada com sucesso!');
        fetchGallery();
      }
    } catch (error) {
      console.error('Failed to update gallery image:', error);
      alert('Erro ao atualizar imagem.');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/comments');
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch('/api/updates');
      const data = await res.json();
      setUpdates(data);
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    }
  };

  const handleUpdateCommentStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/comments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setComments(comments.map(c => c.id === id ? { ...c, status } : c));
      }
    } catch (error) {
      console.error('Failed to update comment status:', error);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateTitle.trim() || !newUpdateContent.trim()) return;

    setIsSubmittingUpdate(true);
    try {
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newUpdateTitle, content: newUpdateContent }),
      });

      if (res.ok) {
        setNewUpdateTitle('');
        setNewUpdateContent('');
        fetchUpdates();
      }
    } catch (error) {
      console.error('Failed to post update:', error);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const pendingComments = comments.filter(c => c.status === 'pending');
  const approvedComments = comments.filter(c => c.status === 'approved');
  const rejectedComments = comments.filter(c => c.status === 'rejected');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-sand-900">Painel de Administração</h1>
          <p className="text-sand-500 mt-1">Gerencie atualizações e modere comentários do site.</p>
        </div>
        
        <div className="flex bg-sand-200 p-1 rounded-lg flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-white text-sand-900 shadow-sm' : 'text-sand-600 hover:text-sand-900'}`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'comments' ? 'bg-white text-sand-900 shadow-sm' : 'text-sand-600 hover:text-sand-900'}`}
          >
            Moderação
            {pendingComments.length > 0 && (
              <span className="ml-2 bg-ocean-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingComments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'updates' ? 'bg-white text-sand-900 shadow-sm' : 'text-sand-600 hover:text-sand-900'}`}
          >
            Publicações
          </button>
          <button
            onClick={() => setActiveTab('tours')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'tours' ? 'bg-white text-sand-900 shadow-sm' : 'text-sand-600 hover:text-sand-900'}`}
          >
            Passeios
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'gallery' ? 'bg-white text-sand-900 shadow-sm' : 'text-sand-600 hover:text-sand-900'}`}
          >
            Galeria
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-sand-600">
                <Eye className="w-5 h-5" />
                <h3 className="font-medium">Visualizações Hoje</h3>
              </div>
              <p className="text-4xl font-serif font-bold text-sand-900">{analytics?.todayViews || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-sand-600">
                <BarChart3 className="w-5 h-5" />
                <h3 className="font-medium">Total de Visualizações</h3>
              </div>
              <p className="text-4xl font-serif font-bold text-sand-900">{analytics?.totalViews || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-sand-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-medium">Avaliações Pendentes</h3>
              </div>
              <p className="text-4xl font-serif font-bold text-sand-900">{pendingComments.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-sm">
            <h3 className="text-lg font-bold text-sand-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-ocean-500" />
              Acessos Recentes
            </h3>
            {analytics?.recentViews && analytics.recentViews.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentViews.map((view, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-sand-100 last:border-0">
                    <span className="text-sand-700 font-medium">{view.path}</span>
                    <span className="text-sm text-sand-500 font-mono">
                      {new Date(view.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sand-500 text-sm">Nenhum acesso registrado ainda.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-sand-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-ocean-500" />
              Aguardando Moderação
            </h2>
            
            {pendingComments.length === 0 ? (
              <div className="bg-sand-50 border border-sand-200 rounded-xl p-8 text-center text-sand-500">
                Nenhum comentário pendente no momento.
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingComments.map(comment => (
                  <div key={comment.id} className="bg-white border border-ocean-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-sand-900">{comment.author}</span>
                        <span className="text-xs text-sand-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(comment.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sand-700">{comment.content}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleUpdateCommentStatus(comment.id, 'approved')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Check className="w-4 h-4" /> Aprovar
                      </button>
                      <button
                        onClick={() => handleUpdateCommentStatus(comment.id, 'rejected')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <X className="w-4 h-4" /> Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-sand-200">
            <section>
              <h3 className="text-lg font-bold text-emerald-700 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" /> Aprovados Recentes
              </h3>
              <div className="space-y-3">
                {approvedComments.slice(0, 5).map(comment => (
                  <div key={comment.id} className="bg-white border border-sand-200 rounded-lg p-3 text-sm">
                    <p className="font-medium text-sand-900 mb-1">{comment.author}</p>
                    <p className="text-sand-600 truncate">{comment.content}</p>
                  </div>
                ))}
                {approvedComments.length === 0 && <p className="text-sm text-sand-500">Nenhum comentário aprovado.</p>}
              </div>
            </section>
            
            <section>
              <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                <X className="w-5 h-5" /> Rejeitados Recentes
              </h3>
              <div className="space-y-3">
                {rejectedComments.slice(0, 5).map(comment => (
                  <div key={comment.id} className="bg-white border border-sand-200 rounded-lg p-3 text-sm opacity-75">
                    <p className="font-medium text-sand-900 mb-1">{comment.author}</p>
                    <p className="text-sand-600 truncate">{comment.content}</p>
                  </div>
                ))}
                {rejectedComments.length === 0 && <p className="text-sm text-sand-500">Nenhum comentário rejeitado.</p>}
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-sand-200 shadow-sm sticky top-6">
              <h2 className="text-xl font-bold text-sand-800 mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-ocean-600" />
                Nova Atualização
              </h2>
              <form onSubmit={handlePostUpdate} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-sand-700 mb-1">Título</label>
                  <input
                    id="title"
                    type="text"
                    value={newUpdateTitle}
                    onChange={(e) => setNewUpdateTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all"
                    placeholder="Ex: Novo capítulo disponível"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-sand-700 mb-1">Conteúdo</label>
                  <textarea
                    id="content"
                    value={newUpdateContent}
                    onChange={(e) => setNewUpdateContent(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all resize-none"
                    placeholder="Escreva os detalhes da atualização..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingUpdate}
                  className="w-full bg-sand-900 text-white py-2.5 rounded-lg font-medium hover:bg-sand-800 transition-colors disabled:opacity-70"
                >
                  {isSubmittingUpdate ? 'Publicando...' : 'Publicar Atualização'}
                </button>
              </form>
            </div>
          </div>
          
          <div className="md:col-span-3 space-y-6">
            <h2 className="text-xl font-bold text-sand-800 flex items-center gap-2 border-b border-sand-200 pb-2">
              <FileText className="w-5 h-5 text-sand-500" />
              Histórico de Publicações
            </h2>
            
            {updates.length === 0 ? (
              <p className="text-sand-500 text-center py-8">Nenhuma atualização publicada ainda.</p>
            ) : (
              updates.map(update => (
                <div key={update.id} className="bg-white p-5 rounded-xl border border-sand-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-sand-900">{update.title}</h3>
                    <span className="text-xs text-sand-400 font-mono bg-sand-100 px-2 py-1 rounded">
                      {new Date(update.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sand-600 text-sm line-clamp-3">{update.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'tours' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-sand-800 flex items-center gap-2 border-b border-sand-200 pb-2">
            <Map className="w-5 h-5 text-ocean-600" />
            Gerenciar Passeios
          </h2>
          <div className="grid gap-6">
            {tours.map(tour => (
              <div key={tour.id} className="bg-white p-6 rounded-xl border border-sand-200 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <img src={tour.image} alt={tour.title} className="w-full h-48 object-cover rounded-lg" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Título</label>
                    <input
                      type="text"
                      value={tour.title}
                      onChange={(e) => setTours(tours.map(t => t.id === tour.id ? { ...t, title: e.target.value } : t))}
                      className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Descrição</label>
                    <textarea
                      value={tour.description}
                      onChange={(e) => setTours(tours.map(t => t.id === tour.id ? { ...t, description: e.target.value } : t))}
                      rows={3}
                      className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Duração</label>
                      <input
                        type="text"
                        value={tour.duration}
                        onChange={(e) => setTours(tours.map(t => t.id === tour.id ? { ...t, duration: e.target.value } : t))}
                        className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sand-700 mb-1">Preço</label>
                      <input
                        type="text"
                        value={tour.price}
                        onChange={(e) => setTours(tours.map(t => t.id === tour.id ? { ...t, price: e.target.value } : t))}
                        className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">URL da Imagem</label>
                    <input
                      type="text"
                      value={tour.image}
                      onChange={(e) => setTours(tours.map(t => t.id === tour.id ? { ...t, image: e.target.value } : t))}
                      className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleUpdateTour(tour)}
                      className="flex items-center gap-2 bg-ocean-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-ocean-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-sand-800 flex items-center gap-2 border-b border-sand-200 pb-2">
            <ImageIcon className="w-5 h-5 text-ocean-600" />
            Gerenciar Galeria
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {gallery.map(image => (
              <div key={image.id} className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col gap-4">
                <img src={image.image_url} alt={image.alt_text} className="w-full h-48 object-cover rounded-lg" referrerPolicy="no-referrer" />
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">URL da Imagem</label>
                    <input
                      type="text"
                      value={image.image_url}
                      onChange={(e) => setGallery(gallery.map(g => g.id === image.id ? { ...g, image_url: e.target.value } : g))}
                      className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sand-700 mb-1">Texto Alternativo (Acessibilidade)</label>
                    <input
                      type="text"
                      value={image.alt_text}
                      onChange={(e) => setGallery(gallery.map(g => g.id === image.id ? { ...g, alt_text: e.target.value } : g))}
                      className="w-full px-3 py-2 bg-sand-50 border border-sand-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleUpdateGalleryImage(image)}
                      className="flex items-center gap-2 bg-ocean-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-ocean-700 transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Salvar Imagem
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
