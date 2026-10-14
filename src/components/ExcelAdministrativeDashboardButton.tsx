import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { membersService } from '@/services/members.service';
import { assetsService } from '@/services/assets.service';
import { documentsService } from '@/services/documents.service';
import { churchesService } from '@/services/churches.service';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExcelAdministrativeDashboardButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ExcelAdministrativeDashboardButton({
  className = '',
  variant = 'default',
  size = 'default',
  showLabel = true,
}: ExcelAdministrativeDashboardButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, churchId: contextChurchId, viewingChurch } = useAuth();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const effectiveChurchId = viewingChurch?.id || contextChurchId || user?.churchId;

      toast({
        title: '📊 Coletando Dados Administrativos...',
        description: 'Buscando membros, patrimônio e documentos oficiais.',
      });

      // Carregar dados simultaneamente
      const [membersData, assetsData, docsData, churchData] = await Promise.all([
        membersService.getAll(effectiveChurchId).catch(() => []),
        assetsService.getAssets(effectiveChurchId).catch(() => []),
        documentsService.getAll(effectiveChurchId).catch(() => []),
        effectiveChurchId ? churchesService.getById(effectiveChurchId).catch(() => null) : Promise.resolve(null),
      ]);

      const churchName = churchData?.name || viewingChurch?.name || 'Igreja Viva Global';

      const { buildAdministrativeDashboardBuffer } = await import('@/utils/administrativeDashboardExcel');
      const buffer = await buildAdministrativeDashboardBuffer({
        churchName,
        members: membersData || [],
        assets: assetsData || [],
        documents: docsData || [],
      });

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const cleanChurchName = churchName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_');
      saveAs(blob, `DASHBOARD_ADMINISTRATIVO_PATRIMONIAL_${cleanChurchName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

      toast({
        title: '🏛️ Dashboard Administrativo Excel Gerado!',
        description: 'Planilha executiva exportada com Painel, Rol de Membros, Patrimônio e Atas com painéis congelados.',
      });
    } catch (err: any) {
      console.error('Erro ao gerar Dashboard Administrativo:', err);
      toast({
        title: 'Erro na geração do Dashboard',
        description: err?.message || 'Falha ao processar os dados administrativos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      variant={variant}
      size={size}
      className={`font-semibold transition-all shadow-sm gap-2 ${
        variant === 'default'
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : variant === 'outline'
          ? 'border-blue-600/30 text-blue-700 hover:bg-blue-50 dark:text-blue-400'
          : ''
      } ${className}`}
      title="Exportar Dashboard Executivo da Secretaria, Membros e Patrimônio em Excel"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <FileSpreadsheet className="h-4 w-4 text-blue-200" />}
      {showLabel && (
        <div className="flex items-center gap-1.5">
          <span>Dashboard Administrativo</span>
          <span className="bg-blue-900 text-blue-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
            PRO
          </span>
        </div>
      )}
    </Button>
  );
}

export default ExcelAdministrativeDashboardButton;
