import { useState } from 'react';
import { Upload, FileText, Image, Video, File, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sidebar } from '@/components/Sidebar';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  name: string;
  type: 'study' | 'financial' | 'minutes' | 'media';
  date: string;
  size: string;
}

const mockFiles: UploadedFile[] = [
  { id: '1', name: 'Estudo Célula - Semana 1.pdf', type: 'study', date: '2024-01-15', size: '2.5 MB' },
  { id: '2', name: 'Relatório Financeiro Janeiro.xlsx', type: 'financial', date: '2024-02-01', size: '1.2 MB' },
  { id: '3', name: 'Ata Reunião Liderança.docx', type: 'minutes', date: '2024-01-20', size: '850 KB' },
  { id: '4', name: 'Culto Domingo.mp4', type: 'media', date: '2024-01-21', size: '450 MB' },
];

const typeLabels: Record<UploadedFile['type'], string> = {
  study: 'Estudos para Células',
  financial: 'Relatórios Financeiros',
  minutes: 'Atas',
  media: 'Fotos e Vídeos',
};

const typeIcons: Record<UploadedFile['type'], React.ElementType> = {
  study: FileText,
  financial: FileText,
  minutes: File,
  media: Video,
};

export default function Uploads() {
  const [files, setFiles] = useState<UploadedFile[]>(mockFiles);
  const { toast } = useToast();

  const handleFileUpload = (type: UploadedFile['type']) => {
    // In production, this would handle actual file upload
    toast({
      title: 'Upload simulado',
      description: 'Em produção, o arquivo seria enviado aqui.',
    });
  };

  const handleDelete = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    toast({
      title: 'Arquivo removido',
      description: 'O arquivo foi excluído com sucesso.',
    });
  };

  const getFilesByType = (type: UploadedFile['type']) => {
    return files.filter(f => f.type === type);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Uploads</h1>
        <p className="text-muted-foreground">
          Gerencie documentos e mídia da igreja
        </p>
      </div>

      <Tabs defaultValue="study" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 gap-1">
          <TabsTrigger value="study">Estudos</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="minutes">Atas</TabsTrigger>
          <TabsTrigger value="media">Mídia</TabsTrigger>
        </TabsList>

        {(['study', 'financial', 'minutes', 'media'] as const).map((type) => {
          const Icon = typeIcons[type];
          return (
            <TabsContent key={type} value={type}>
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {typeLabels[type]}
                  </CardTitle>
                  <Button onClick={() => handleFileUpload(type)} className="w-full sm:w-auto">
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Arquivo
                  </Button>
                </CardHeader>
                <CardContent>
                  {getFilesByType(type).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum arquivo encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilesByType(type).map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="truncate">
                              <p className="font-medium truncate">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {file.date} • {file.size}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(file.id)}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
