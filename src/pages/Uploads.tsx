import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Image, Video, File, Trash2, Loader2, Youtube, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from '@/hooks/use-toast';
import { documentsService, ChurchDocument } from '@/services/documents.service';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const typeLabels: Record<string, string> = {
  study: 'Estudos para Células',
  financial: 'Relatórios Financeiros',
  minutes: 'Atas',
  media: 'Fotos',
  videos: 'Vídeos e Cultos',
};

const typeIcons: Record<string, React.ElementType> = {
  study: FileText,
  financial: FileText,
  minutes: File,
  media: Image,
  videos: Youtube,
};

export default function Uploads() {
  const [files, setFiles] = useState<ChurchDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [isYoutubeDialogOpen, setIsYoutubeDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = user?.role !== 'aluno' && user?.role !== 'membro' && user?.role !== 'congregado';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState('study');

  useEffect(() => {
    loadFiles();
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYoutubeLink = async () => {
    if (!youtubeUrl) return;
    const videoId = getYoutubeId(youtubeUrl);
    if (!videoId) {
      toast({
        title: "Link inválido",
        description: "Por favor, insira um link válido do YouTube.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            title: youtubeTitle || 'Vídeo do YouTube',
            file_url: `https://www.youtube.com/embed/${videoId}`,
            file_type: 'video/youtube',
            category: 'videos',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Vídeo adicionado",
        description: "O link do YouTube foi salvo com sucesso.",
      });

      setYoutubeUrl('');
      setYoutubeTitle('');
      setIsYoutubeDialogOpen(false);
      loadFiles();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar link",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAcceptType = (category: string) => {
    switch (category) {
      case 'media': return 'image/*';
      case 'videos': return 'video/*';
      case 'study':
      case 'financial':
      case 'minutes':
        return '.pdf,.doc,.docx,.xls,.xlsx,.txt';
      default: return '*/*';
    }
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await documentsService.getAll();
      setFiles(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar arquivos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (category: string) => {
    setActiveCategory(category);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(activeCategory);
      await documentsService.uploadFile(file, activeCategory);

      toast({
        title: 'Upload concluído',
        description: 'O arquivo foi enviado com sucesso.',
      });

      loadFiles();
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message || 'Verifique se o bucket "church-documents" existe no Supabase.',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file: ChurchDocument) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

    try {
      await documentsService.delete(file.id, file.file_url);
      setFiles(files.filter(f => f.id !== file.id));
      toast({
        title: 'Arquivo removido',
        description: 'O arquivo foi excluído com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getFilesByType = (type: string) => {
    return files?.filter(f => f.category === type) || [];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data desconhecida';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return format(date, 'dd/MM/yyyy');
    } catch (e) {
      return 'Data inválida';
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={getAcceptType(activeCategory)}
        onChange={handleFileUpload}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Uploads</h1>
        <p className="text-muted-foreground">
          Gerencie documentos e mídia da igreja
        </p>
      </div>

      <Tabs defaultValue="study" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 gap-1">
          <TabsTrigger value="study">Estudos</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="minutes">Atas</TabsTrigger>
          <TabsTrigger value="media">Fotos</TabsTrigger>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
        </TabsList>

        {(['study', 'financial', 'minutes', 'media', 'videos'] as const).map((type) => {
          const Icon = typeIcons[type];
          return (
            <TabsContent key={type} value={type}>
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {typeLabels[type]}
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    {user?.role && !['aluno', 'membro', 'congregado', 'tesoureiro'].includes(user.role) && type === 'videos' && (
                      <Dialog open={isYoutubeDialogOpen} onOpenChange={setIsYoutubeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full sm:w-auto border-primary/20 hover:bg-primary/5">
                            <Youtube className="h-4 w-4 mr-2 text-red-600" />
                            Adicionar YouTube
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-lg sm:h-auto overflow-y-auto p-4 sm:p-6 rounded-none sm:rounded-lg">
                          <DialogHeader>
                            <DialogTitle>Adicionar Vídeo do YouTube</DialogTitle>
                            <DialogDescription>
                              Cole o link do vídeo para que ele seja exibido diretamente no app.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Título do Vídeo</label>
                              <Input
                                placeholder="Ex: Culto de Domingo - 01/02"
                                value={youtubeTitle}
                                onChange={(e) => setYoutubeTitle(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">URL do Vídeo</label>
                              <Input
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsYoutubeDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleYoutubeLink} disabled={!youtubeUrl}>Salvar</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    {user?.role && !['aluno', 'membro', 'congregado', 'tesoureiro'].includes(user.role) && (
                      <Button
                        onClick={() => handleFileClick(type)}
                        disabled={uploading !== null}
                        className="w-full sm:w-auto"
                      >
                        {uploading === type ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {uploading === type ? 'Enviando...' : 'Enviar Arquivo'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : getFilesByType(type).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Icon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Nenhum arquivo encontrado nesta categoria</p>
                      <p className="text-sm">Clique em "Enviar Arquivo" para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilesByType(type).map((file) => (
                        <div
                          key={file.id}
                          className="flex flex-col p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="bg-primary/10 p-2 rounded-md">
                                <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                              </div>
                              <div className="truncate">
                                <a
                                  href={file.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium truncate hover:underline block"
                                >
                                  {file.title}
                                </a>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(file.created_at)} • {formatSize(file.file_size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {user?.role && !['aluno', 'membro', 'congregado', 'tesoureiro'].includes(user.role) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(file)}
                                  className="flex-shrink-0 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Player de Vídeo, YouTube ou Prévia de Imagem */}
                          {file.category === 'videos' && (
                            <div className="mt-4 rounded-xl overflow-hidden border-2 border-primary/20 bg-black aspect-video w-full max-w-2xl mx-auto shadow-2xl">
                              {file.file_type === 'video/youtube' ? (
                                <iframe
                                  src={file.file_url}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              ) : (
                                <video
                                  src={file.file_url}
                                  controls
                                  className="w-full h-full"
                                  preload="metadata"
                                >
                                  Seu navegador não suporta a reprodução de vídeos.
                                </video>
                              )}
                            </div>
                          )}

                          {file.category === 'media' && (
                            <div className="mt-4 rounded-xl overflow-hidden border-2 border-primary/20 bg-muted max-w-md mx-auto shadow-lg">
                              <img
                                src={file.file_url}
                                alt={file.title}
                                className="w-full h-auto object-contain"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
