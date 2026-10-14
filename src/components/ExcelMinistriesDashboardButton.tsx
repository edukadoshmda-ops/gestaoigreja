import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ministriesService } from '@/services/ministries.service';
import { cellsService } from '@/services/cells.service';
import { membersService } from '@/services/members.service';
import { schoolsService } from '@/services/schools.service';
import { discipleshipService } from '@/services/discipleship.service';
import { prayerRequestsService } from '@/services/prayerRequests.service';
import { churchesService } from '@/services/churches.service';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExcelMinistriesDashboardButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ExcelMinistriesDashboardButton({
  className = '',
  variant = 'default',
  size = 'default',
  showLabel = true,
}: ExcelMinistriesDashboardButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, churchId: contextChurchId, viewingChurch } = useAuth();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const effectiveChurchId = viewingChurch?.id || contextChurchId || user?.churchId;

      toast({
        title: '📊 Coletando Dados Ministeriais...',
        description: 'Buscando células, ministérios, jovens, kids, EBD e oração.',
      });

      // Carregar dados de todos os ministérios simultaneamente
      const [minData, cellData, memData, schoolData, discData, prayerData, churchData] = await Promise.all([
        ministriesService.getAll(effectiveChurchId).catch(() => []),
        cellsService.getAll(effectiveChurchId).catch(() => []),
        membersService.getAll(effectiveChurchId).catch(() => []),
        schoolsService.getAll(effectiveChurchId).catch(() => []),
        discipleshipService.getAll(effectiveChurchId).catch(() => []),
        effectiveChurchId ? prayerRequestsService.list(effectiveChurchId).catch(() => []) : Promise.resolve([]),
        effectiveChurchId ? churchesService.getById(effectiveChurchId).catch(() => null) : Promise.resolve(null),
      ]);

      const churchName = churchData?.name || viewingChurch?.name || 'Igreja Viva Global';

      const { buildMinistriesDashboardBuffer } = await import('@/utils/ministriesDashboardExcel');
      const buffer = await buildMinistriesDashboardBuffer({
        churchName,
        ministries: minData || [],
        cells: cellData || [],
        members: memData || [],
        schools: schoolData || [],
        discipleships: discData || [],
        prayerRequests: prayerData || [],
      });

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const cleanChurchName = churchName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_');
      saveAs(blob, `DASHBOARD_MINISTERIOS_CELULAS_${cleanChurchName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

      toast({
        title: '🕊️ Dashboard de Ministérios Excel Gerado!',
        description: 'Planilha executiva exportada com Painel, Células, Ministérios, Kids/Jovens, Ensino e Oração.',
      });
    } catch (err: any) {
      console.error('Erro ao gerar Dashboard de Ministérios:', err);
      toast({
        title: 'Erro na geração do Dashboard',
        description: err?.message || 'Falha ao processar os dados dos ministérios.',
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
          ? 'bg-purple-600 hover:bg-purple-700 text-white'
          : variant === 'outline'
          ? 'border-purple-600/30 text-purple-700 hover:bg-purple-50 dark:text-purple-400'
          : ''
      } ${className}`}
      title="Exportar Dashboard Executivo de Ministérios, Células, Kids, Jovens e Ensino em Excel"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <FileSpreadsheet className="h-4 w-4 text-purple-200" />}
      {showLabel && (
        <div className="flex items-center gap-1.5">
          <span>Dashboard Ministérios</span>
          <span className="bg-purple-900 text-purple-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
            PRO
          </span>
        </div>
      )}
    </Button>
  );
}

export default ExcelMinistriesDashboardButton;
