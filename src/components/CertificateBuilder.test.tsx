import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CertificateBuilder } from './CertificateBuilder';

describe('CertificateBuilder', () => {
  it('renders a single editable document with the selected certificate model', () => {
    const { container } = render(
      <CertificateBuilder churchName="Igreja Teste" pastorName="Pastor Teste" />
    );

    const document = container.querySelector<HTMLElement>('.certificate-page');
    expect(document?.getAttribute('contenteditable')).toBe('true');
    expect(document?.textContent).toContain('Certificado de Batismo');
    expect(document?.textContent).toContain('Igreja Teste');
    expect(document?.textContent).toContain('Pastor Teste');
    expect(document?.textContent).toContain('Nome do(a) homenageado(a)');
  });

  it('does not repeat the introductory certificate sentence', () => {
    const { container } = render(
      <CertificateBuilder churchName="Igreja Teste" pastorName="Pastor Teste" />
    );

    const previewText = container.querySelector('.certificate-page')?.textContent ?? '';
    expect(previewText.match(/Certificamos/g)).toHaveLength(1);
  });

  it('lets the user edit all document text directly on the sheet', () => {
    const { container } = render(
      <CertificateBuilder churchName="Igreja Teste" pastorName="Pastor Teste" />
    );

    const document = container.querySelector<HTMLElement>('.certificate-page');
    expect(document?.getAttribute('contenteditable')).toBe('true');
    document!.textContent = 'Certificado escrito livremente no documento.';
    fireEvent.input(document!);

    expect(document?.textContent).toBe('Certificado escrito livremente no documento.');
  });

  it('provides a Word-style toolbar for document formatting', () => {
    render(<CertificateBuilder churchName="Igreja Teste" pastorName="Pastor Teste" />);

    expect(screen.getByRole('button', { name: 'Desfazer' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Negrito' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Lista com marcadores' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Estilo do parágrafo' })).toBeTruthy();
    expect(screen.getByLabelText('Cor de realce')).toBeTruthy();
    expect(screen.getByLabelText('Cor da fonte selecionada')).toBeTruthy();
  });

  it('updates document spacing and page orientation settings', () => {
    const { container } = render(
      <CertificateBuilder churchName="Igreja Teste" pastorName="Pastor Teste" />
    );

    fireEvent.change(screen.getByLabelText('Entrelinhas'), { target: { value: '1.8' } });
    fireEvent.change(screen.getByLabelText('Espaço entre parágrafos (px)'), {
      target: { value: '20' },
    });

    const documentContainer = container.querySelector<HTMLElement>('.certificate-print-root');
    expect(documentContainer?.style.getPropertyValue('--certificate-line-height')).toBe('1.8');
    expect(documentContainer?.style.getPropertyValue('--certificate-paragraph-spacing')).toBe('20px');

    fireEvent.click(screen.getByRole('combobox', { name: 'Orientação A4' }));
    fireEvent.click(screen.getByRole('option', { name: 'Retrato' }));

    expect(documentContainer?.style.getPropertyValue('--certificate-page-ratio')).toBe('1 / 1.414');
  });

  it('fits the printed certificate inside one A4 page with a safe inset', () => {
    const { container } = render(
      <CertificateBuilder churchName="Igreja Teste" pastorName="Pastor Teste" />
    );
    const printStyles = container.querySelector('style')?.textContent ?? '';

    expect(printStyles).toContain('@page { size: A4 landscape; margin: 0; }');
    expect(printStyles).toContain('position: fixed !important;');
    expect(printStyles).toContain('inset: 10mm !important;');
    expect(printStyles).toContain('box-sizing: border-box !important;');
    expect(printStyles).toContain('page-break-inside: avoid !important;');
  });

  it('applies the card color palettes to the certificate theme', () => {
    const { container } = render(
      <CertificateBuilder churchName="Igreja Teste" pastorName="Pastor Teste" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Usar cor Dourado Âmbar' }));

    expect(
      container
        .querySelector<HTMLElement>('.certificate-print-root')
        ?.style.getPropertyValue('--certificate-text')
    ).toBeTruthy();
  });

  it('offers dedicated certificate frames and reflects the selected frame', () => {
    render(<CertificateBuilder churchName="Igreja Teste" pastorName="Pastor Teste" />);

    const floralFrame = screen.getByRole('button', { name: 'Floral' });
    fireEvent.click(floralFrame);

    expect(floralFrame.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Clássica dupla' }).getAttribute('aria-pressed')).toBe(
      'false'
    );
  });
});
