const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx-js-style');

const DEFAULT_CHART_CATEGORIES = [
  // RECEITAS
  { code: '1.01', name: 'Dízimos', type: 'receita', group: 'Dízimos e Ofertas', description: 'Dízimos regulares dos membros e congregados' },
  { code: '1.02', name: 'Ofertas - Culto Geral', type: 'receita', group: 'Dízimos e Ofertas', description: 'Ofertas recolhidas nos cultos semanais e dominicais' },
  { code: '1.03', name: 'Ofertas - Missões', type: 'receita', group: 'Dízimos e Ofertas', description: 'Ofertas voluntárias dedicadas ao sustento missionário' },
  { code: '1.04', name: 'Ofertas - Construção & Reforma', type: 'receita', group: 'Dízimos e Ofertas', description: 'Recursos destinados a obras, ampliações e reformas' },
  { code: '1.05', name: 'Ofertas - Escola Bíblica', type: 'receita', group: 'Dízimos e Ofertas', description: 'Ofertas de classes da Escola Bíblica Dominical (EBD)' },
  { code: '1.06', name: 'Vendas - Cantina', type: 'receita', group: 'Atividades Econômicas', description: 'Arrecadação de cantina em cultos e eventos' },
  { code: '1.07', name: 'Vendas - Livraria / Bazar', type: 'receita', group: 'Atividades Econômicas', description: 'Venda de livros bíblicos, camisetas e bazar beneficente' },
  { code: '1.08', name: 'Inscrições de Eventos / Retiros', type: 'receita', group: 'Eventos', description: 'Inscrições pagas para congressos, acampamentos e conferências' },
  { code: '1.09', name: 'Doações Especiais e Campanhas', type: 'receita', group: 'Doações', description: 'Doações pontuais de empresas, parceiros ou membros' },
  { code: '1.10', name: 'Rendimento de Aplicações', type: 'receita', group: 'Receitas Financeiras', description: 'Juros e rendimentos bancários de reservas financeiras' },
  { code: '1.11', name: 'Outras Entradas', type: 'receita', group: 'Outras Receitas', description: 'Demais receitas operacionais não classificadas' },

  // DESPESAS
  { code: '2.01', name: 'Prebendas e Honorários Pastorais', type: 'despesa', group: 'Pessoal e Ministério', description: 'Sustento pastoral ministerial e côngrua' },
  { code: '2.02', name: 'Encargos / Ajuda de Custo', type: 'despesa', group: 'Pessoal e Ministério', description: 'Ajudas de custo de obreiros, preletores e zeladoria' },
  { code: '2.03', name: 'Energia Elétrica', type: 'despesa', group: 'Utilidades e Manutenção', description: 'Conta mensal de energia do templo e anexos' },
  { code: '2.04', name: 'Água e Saneamento', type: 'despesa', group: 'Utilidades e Manutenção', description: 'Conta de consumo de água e esgoto' },
  { code: '2.05', name: 'Internet e Telefonia', type: 'despesa', group: 'Utilidades e Manutenção', description: 'Link de internet para transmissão de cultos e telefonia' },
  { code: '2.06', name: 'Manutenção Predial e Reformas', type: 'despesa', group: 'Utilidades e Manutenção', description: 'Pintura, reparos elétricos, hidráulicos e telhados' },
  { code: '2.07', name: 'Limpeza e Descartáveis', type: 'despesa', group: 'Utilidades e Manutenção', description: 'Produtos de limpeza para higiene do templo e descartáveis' },
  { code: '2.08', name: 'Aluguel do Templo', type: 'despesa', group: 'Imóveis e Estrutura', description: 'Locação predial do imóvel onde funciona a congregação' },
  { code: '2.09', name: 'Ministério Infantil (Kids)', type: 'despesa', group: 'Departamentos', description: 'Materiais didáticos infantis, lanches e cenografia infantil' },
  { code: '2.10', name: 'Ministério de Louvor e Mídia', type: 'despesa', group: 'Departamentos', description: 'Cabos, microfones, cordas, lâmpadas de palco e streaming' },
  { code: '2.11', name: 'Ministério de Jovens e Adolescentes', type: 'despesa', group: 'Departamentos', description: 'Atividades, encontros e materiais para jovens' },
  { code: '2.12', name: 'Escola Bíblica Dominical', type: 'despesa', group: 'Departamentos', description: 'Revistas de EBD, livros para professores e materiais' },
  { code: '2.13', name: 'Missões e Ação Social', type: 'despesa', group: 'Missões e Social', description: 'Envio mensal de recursos a missionários no campo' },
  { code: '2.14', name: 'Cestas Básicas e Beneficência', type: 'despesa', group: 'Missões e Social', description: 'Compra de alimentos e assistência a famílias carentes' },
  { code: '2.15', name: 'Combustível e Transporte', type: 'despesa', group: 'Transporte e Logística', description: 'Deslocamento de líderes, vans para cultos e retiros' },
  { code: '2.16', name: 'Material de Escritório / Gráfica', type: 'despesa', group: 'Administrativo', description: 'Envelopes de dízimo, papel A4, toners e boletins impressos' },
  { code: '2.17', name: 'Tarifas Bancárias e Taxas PIX/Cartão', type: 'despesa', group: 'Despesas Financeiras', description: 'Cestas de serviços bancários e taxas de máquinas' },
  { code: '2.18', name: 'Eventos e Congressos', type: 'despesa', group: 'Eventos', description: 'Estrutura, som extra e buffet para conferências' },
  { code: '2.19', name: 'Outras Saídas', type: 'despesa', group: 'Outras Despesas', description: 'Despesas eventuais não categorizadas' },
];

function generateExcel() {
  const wb = XLSX.utils.book_new();
  const fontName = 'Segoe UI';
  const churchName = 'GESTÃO DE IGREJA — PLANO OFICIAL';
  const now = new Date();
  const issueDate = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;

  const borderThin = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
  };

  const titleStyle = (bg) => ({
    font: { name: fontName, sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: bg } },
    alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
  });

  const subtitleStyle = (bg, color) => ({
    font: { name: fontName, sz: 9, italic: true, color: { rgb: color } },
    fill: { patternType: 'solid', fgColor: { rgb: bg } },
    alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
  });

  const headerStyle = (bg) => ({
    font: { name: fontName, sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: bg } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderThin,
  });

  const cellCodeStyle = (bg) => ({
    font: { name: fontName, sz: 10, bold: true, color: { rgb: '0F172A' } },
    fill: { patternType: 'solid', fgColor: { rgb: bg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin,
  });

  const cellTextStyle = (bg, bold, align = 'left') => ({
    font: { name: fontName, sz: 9.5, bold, color: { rgb: '1E293B' } },
    fill: { patternType: 'solid', fgColor: { rgb: bg } },
    alignment: { horizontal: align, vertical: 'center', wrapText: true },
    border: borderThin,
  });

  const badgeReceitaStyle = () => ({
    font: { name: fontName, sz: 9.5, bold: true, color: { rgb: '15803D' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'DCFCE7' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin,
  });

  const badgeDespesaStyle = () => ({
    font: { name: fontName, sz: 9.5, bold: true, color: { rgb: 'B91C1C' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FEE2E2' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderThin,
  });

  const buildSheet = (sheetTitle, themeColor, themeLightColor, items) => {
    const headers = [
      'CÓDIGO',
      'TIPO',
      'GRUPO CONTÁBIL',
      'NOME DA CATEGORIA',
      'FINALIDADE / OBSERVAÇÕES',
      'NATUREZA',
    ];

    const aoa = [
      [`${churchName} — ${sheetTitle.toUpperCase()}`],
      [`Emissão Oficial: ${issueDate} • Gestão Financeira Eclesiástica • Total de Contas: ${items.length}`],
      headers,
    ];

    items.forEach((c) => {
      aoa.push([
        c.code,
        c.type === 'receita' ? 'RECEITA (ENTRADA)' : 'DESPESA (SAÍDA)',
        c.group,
        c.name,
        c.description,
        c.type === 'receita' ? 'Crédito' : 'Débito',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];

    // CONGELAMENTO DE PAINÉIS (FREEZE PANES) PERFEITO
    // Linha 1 a 3 congeladas no topo + Coluna A congelada na esquerda
    ws['!views'] = [
      {
        state: 'frozen',
        ySplit: 3,
        xSplit: 1,
        topLeftCell: 'B4',
        activePane: 'bottomRight',
      },
    ];
    ws['!freeze'] = {
      state: 'frozen',
      ySplit: 3,
      xSplit: 1,
      topLeftCell: 'B4',
      activePane: 'bottomRight',
    };

    ws['!rows'] = [{ hpt: 32 }, { hpt: 20 }, { hpt: 26 }];
    ws['!cols'] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 32 },
      { wch: 38 },
      { wch: 50 },
      { wch: 16 },
    ];

    ws['A1'] = { v: aoa[0][0], s: titleStyle(themeColor) };
    ws['A2'] = { v: aoa[1][0], s: subtitleStyle(themeLightColor, themeColor) };

    headers.forEach((h, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 2, c: colIdx });
      ws[cellRef] = { v: h, s: headerStyle(themeColor) };
    });

    items.forEach((item, rowIdx) => {
      const r = rowIdx + 3;
      const isEven = rowIdx % 2 === 0;
      const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';

      const cellA = XLSX.utils.encode_cell({ r, c: 0 });
      ws[cellA] = { v: item.code, s: cellCodeStyle(rowBg) };

      const cellB = XLSX.utils.encode_cell({ r, c: 1 });
      const isReceita = item.type === 'receita';
      ws[cellB] = {
        v: isReceita ? 'RECEITA (ENTRADA)' : 'DESPESA (SAÍDA)',
        s: isReceita ? badgeReceitaStyle() : badgeDespesaStyle(),
      };

      const cellC = XLSX.utils.encode_cell({ r, c: 2 });
      ws[cellC] = { v: item.group, s: cellTextStyle(rowBg, true) };

      const cellD = XLSX.utils.encode_cell({ r, c: 3 });
      ws[cellD] = { v: item.name, s: cellTextStyle(rowBg, true) };

      const cellE = XLSX.utils.encode_cell({ r, c: 4 });
      ws[cellE] = { v: item.description, s: cellTextStyle(rowBg, false) };

      const cellF = XLSX.utils.encode_cell({ r, c: 5 });
      ws[cellF] = { v: isReceita ? 'Crédito' : 'Débito', s: cellTextStyle(rowBg, false, 'center') };
    });

    return ws;
  };

  // 1. Aba Geral
  const wsGeral = buildSheet('Plano de Contas Eclesiástico Geral', '1E3A8A', 'E0E7FF', DEFAULT_CHART_CATEGORIES);
  XLSX.utils.book_append_sheet(wb, wsGeral, '📑 Plano Geral');

  // 2. Aba Receitas
  const receitas = DEFAULT_CHART_CATEGORIES.filter((c) => c.type === 'receita');
  const wsReceitas = buildSheet('Plano de Contas — Receitas', '15803D', 'DCFCE7', receitas);
  XLSX.utils.book_append_sheet(wb, wsReceitas, '🟢 Receitas (1.00)');

  // 3. Aba Despesas
  const despesas = DEFAULT_CHART_CATEGORIES.filter((c) => c.type === 'despesa');
  const wsDespesas = buildSheet('Plano de Contas — Despesas', '991B1B', 'FEE2E2', despesas);
  XLSX.utils.book_append_sheet(wb, wsDespesas, '🔴 Despesas (2.00)');

  // 4. Aba Resumo por Grupos
  const gruposMap = {};
  DEFAULT_CHART_CATEGORIES.forEach((c) => {
    if (!gruposMap[c.group]) {
      gruposMap[c.group] = {
        tipo: c.type === 'receita' ? 'Receitas' : 'Despesas',
        count: 0,
        categorias: [],
      };
    }
    gruposMap[c.group].count += 1;
    gruposMap[c.group].categorias.push(c.name);
  });

  const resumoRows = [
    [`${churchName} — SÍNTESE POR GRUPOS CONTÁBEIS`],
    [`Consolidação estrutural dos grupos • Total de Grupos: ${Object.keys(gruposMap).length}`],
    ['GRUPO CONTÁBIL', 'TIPO PREDOMINANTE', 'QTD. CATEGORIAS', 'EXEMPLO DE CONTAS'],
  ];

  Object.entries(gruposMap).forEach(([gName, gInfo]) => {
    resumoRows.push([
      gName,
      gInfo.tipo,
      gInfo.count,
      gInfo.categorias.slice(0, 3).join(', ') + (gInfo.categorias.length > 3 ? '...' : ''),
    ]);
  });

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoRows);
  wsResumo['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ];
  wsResumo['!views'] = [{ state: 'frozen', ySplit: 3, xSplit: 0, topLeftCell: 'A4' }];
  wsResumo['!freeze'] = { state: 'frozen', ySplit: 3, xSplit: 0, topLeftCell: 'A4' };
  wsResumo['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 18 }, { wch: 55 }];
  wsResumo['A1'] = { v: resumoRows[0][0], s: titleStyle('334155') };
  wsResumo['A2'] = { v: resumoRows[1][0], s: subtitleStyle('F1F5F9', '334155') };
  ['GRUPO CONTÁBIL', 'TIPO PREDOMINANTE', 'QTD. CATEGORIAS', 'EXEMPLO DE CONTAS'].forEach((h, i) => {
    wsResumo[XLSX.utils.encode_cell({ r: 2, c: i })] = { v: h, s: headerStyle('334155') };
  });
  Object.keys(gruposMap).forEach((_, rIdx) => {
    const r = rIdx + 3;
    const bg = rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
    wsResumo[XLSX.utils.encode_cell({ r, c: 0 })] = { v: resumoRows[r][0], s: cellTextStyle(bg, true) };
    wsResumo[XLSX.utils.encode_cell({ r, c: 1 })] = { v: resumoRows[r][1], s: cellTextStyle(bg, false, 'center') };
    wsResumo[XLSX.utils.encode_cell({ r, c: 2 })] = { v: resumoRows[r][2], s: cellCodeStyle(bg) };
    wsResumo[XLSX.utils.encode_cell({ r, c: 3 })] = { v: resumoRows[r][3], s: cellTextStyle(bg, false) };
  });
  XLSX.utils.book_append_sheet(wb, wsResumo, '📊 Resumo por Grupos');

  // Salvar no projeto e na pasta Downloads
  const target1 = path.join(__dirname, 'Plano_de_Contas_Profissional_Igreja.xlsx');
  XLSX.writeFile(wb, target1);
  console.log('Planilha gerada com sucesso em:', target1);

  // Também salvar na pasta Downloads pai se acessível
  try {
    const targetDownloads = path.join(__dirname, '..', 'Plano_de_Contas_Profissional_Igreja.xlsx');
    XLSX.writeFile(wb, targetDownloads);
    console.log('Cópia gerada também em:', targetDownloads);
  } catch (e) {
    // ignore
  }
}

generateExcel();
