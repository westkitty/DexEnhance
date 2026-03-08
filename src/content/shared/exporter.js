import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * @typedef {{ role: 'user'|'assistant', content: string }} ConversationTurn
 */

function timestampLabel() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
}

function brandedFilename(siteLabel, extension) {
  const normalizedSite = String(siteLabel || 'chat')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'chat';
  return `dexenhance-${normalizedSite}-${timestampLabel()}.${extension}`;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * @param {ConversationTurn[]} turns
 * @param {{siteLabel: string}} options
 */
export function exportToPdf(turns, options) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  const lineWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`DexEnhance Export — ${options.siteLabel}`, margin, y);
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  for (const turn of turns) {
    const heading = turn.role === 'user' ? 'User' : 'Assistant';
    const wrapped = doc.splitTextToSize(turn.content || '', lineWidth);

    if (y + 26 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(heading, margin, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    for (const line of wrapped) {
      if (y + 14 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(String(line), margin, y);
      y += 13;
    }
    y += 8;
  }

  const blob = doc.output('blob');
  triggerBlobDownload(blob, brandedFilename(options.siteLabel, 'pdf'));
}

/**
 * @param {ConversationTurn[]} turns
 * @param {{siteLabel: string}} options
 */
export async function exportToDocx(turns, options) {
  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: `DexEnhance Export — ${options.siteLabel}`,
          bold: true,
          size: 28,
        }),
      ],
      spacing: { after: 240 },
    }),
  ];

  for (const turn of turns) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: turn.role === 'user' ? 'User' : 'Assistant',
            bold: true,
          }),
        ],
        spacing: { after: 80 },
      })
    );
    children.push(
      new Paragraph({
        text: turn.content || '',
        spacing: { after: 180 },
      })
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  triggerBlobDownload(blob, brandedFilename(options.siteLabel, 'docx'));
}
