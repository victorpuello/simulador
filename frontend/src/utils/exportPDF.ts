import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Pregunta {
  id: number;
  enunciado: string;
  contexto?: string;
  imagen_url?: string | null;
  opciones: Record<string, string>;
  respuesta_correcta: string;
}

interface Respuesta {
  pregunta_id: number;
  respuesta_seleccionada: string;
  es_correcta: boolean;
  tiempo_respuesta: number;
}

interface ResultadoItem {
  pregunta: Pregunta;
  respuesta?: Respuesta;
}

export function exportarResultadosPDF(
  resultados: ResultadoItem[],
  metadata?: { materia?: string; fecha?: string; puntaje?: number }
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Reporte de Resultados', 40, 40);

  // Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const metaLine = [
    metadata?.materia ? `Materia: ${metadata.materia}` : null,
    metadata?.fecha ? `Fecha: ${metadata.fecha}` : null,
    typeof metadata?.puntaje === 'number' ? `Puntaje: ${metadata.puntaje}%` : null,
  ].filter(Boolean).join('   •   ');
  if (metaLine) doc.text(metaLine, 40, 62);

  const body = resultados.map(({ pregunta, respuesta }, idx) => [
    idx + 1,
    truncate(pregunta.enunciado, 110),
    respuesta?.respuesta_seleccionada ?? '-',
    pregunta.respuesta_correcta,
    respuesta?.es_correcta ? 'Sí' : 'No',
    (respuesta?.tiempo_respuesta ?? 0) + 's',
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['#', 'Pregunta', 'Tu resp.', 'Correcta', '¿Correcta?', 'Tiempo']],
    body,
    styles: { fontSize: 9, cellPadding: 6, valign: 'middle' },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 300 },
      2: { cellWidth: 70 },
      3: { cellWidth: 70 },
      4: { cellWidth: 80 },
      5: { cellWidth: 60 },
    },
    didDrawPage: (data) => {
      // Footer con página
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.setFontSize(9);
      doc.text(
        `Página ${doc.getNumberOfPages()}`,
        pageSize.width - 80,
        pageHeight - 20
      );
    },
  });

  doc.save('resultados.pdf');
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

