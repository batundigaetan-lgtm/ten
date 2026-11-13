import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Download, CheckCircle2, ShieldCheck, Printer, X, Building2, FileText, QrCode } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { SupportedLanguage, translations } from '../i18n';

export interface HistoryItem {
  id: string;
  type: string;
  title: string;
  amount: number;
  status: string;
  date: string;
}

interface TransactionReceiptModalProps {
  transaction: HistoryItem | null;
  userName: string;
  userPhone: string;
  currentLang: SupportedLanguage;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  transaction,
  userName,
  userPhone,
  currentLang,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const receiptNo = `REC-${transaction.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
  const isApproved = transaction.status === 'approuve';
  const statusLabel = isApproved ? 'APPROUVÉ & VALIDÉ' : transaction.status === 'rejete' ? 'REJETÉ' : 'EN ATTENTE DE TRAITEMENT';

  // Generate vector PDF directly with jsPDF for maximum clarity and fast performance
  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Dark Gold & Slate theme colors
    const darkBg = [15, 23, 42]; // slate-900
    const goldColor = [245, 158, 11]; // amber-500
    const lightGray = [241, 245, 249];
    const textDark = [30, 41, 59];

    // Header Background Accent
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(0, 0, 210, 45, 'F');

    // Gold Top Bar
    doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.rect(0, 0, 210, 5, 'F');

    // Title & Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('RENTTECH HUB RDC', 15, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('Location High-Tech & Serveurs Informatiques', 15, 29);
    doc.text('Avenue de la Justice, Kinshasa - Gombe, RDC', 15, 34);

    // Document Title on Right Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.text('REÇU DE TRANSACTION', 195, 22, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(`N° Reçu: ${receiptNo}`, 195, 29, { align: 'right' });
    doc.text(`Date: ${transaction.date}`, 195, 34, { align: 'right' });

    // Section 1: Customer & Status Box
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(15, 55, 180, 32, 3, 3, 'F');

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT & TITULAIRE DU COMPTE', 20, 64);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Nom: ${userName || 'MYATSI'}`, 20, 72);
    doc.text(`Téléphone Airtel: ${userPhone || '+243976704762'}`, 20, 78);

    doc.setFont('helvetica', 'bold');
    doc.text('STATUT DE LA TRANSACTION:', 120, 64);
    
    if (isApproved) {
      doc.setTextColor(16, 185, 129); // emerald
    } else {
      doc.setTextColor(245, 158, 11);
    }
    doc.setFontSize(11);
    doc.text(statusLabel, 120, 73);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('Confirmé via le Réseau Officiel Airtel Money RDC', 120, 79);

    // Section 2: Table Header
    let yPos = 97;
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(15, yPos, 180, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DÉSIGNATION / MOTIF', 20, yPos + 6.5);
    doc.text('TYPE', 110, yPos + 6.5);
    doc.text('MONTANT (FC)', 190, yPos + 6.5, { align: 'right' });

    // Table Content Row
    yPos += 10;
    doc.setFillColor(255, 255, 255);
    doc.rect(15, yPos, 180, 16, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, yPos, 180, 16, 'D');

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(transaction.title, 20, yPos + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Jeton Transaction: ${transaction.id}`, 20, yPos + 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(transaction.type.toUpperCase(), 110, yPos + 9);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.text(`${transaction.amount.toLocaleString('fr-FR')} FC`, 190, yPos + 10, { align: 'right' });

    // Total Highlight Box
    yPos += 24;
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(110, yPos, 85, 20, 2, 2, 'FD');

    doc.setTextColor(180, 83, 9);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT TOTAL RÉGLÉ:', 115, yPos + 8);

    doc.setFontSize(14);
    doc.setTextColor(146, 64, 14);
    doc.text(`${transaction.amount.toLocaleString('fr-FR')} FC`, 190, yPos + 15, { align: 'right' });

    // Security & Stamp Section
    yPos += 35;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(15, yPos, 195, yPos);

    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.text('EMPREINTE DE SÉCURITÉ & CACHET NUMÉRIQUE', 15, yPos);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Ce reçu officiel est généré automatiquement et certifié par la blockchain interne RentTech Hub.', 15, yPos + 6);
    doc.text(`Hash de vérification: SHA256-${transaction.id}-AIRTEL-DRC-SECURE`, 15, yPos + 11);

    // Footer
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(0, 275, 210, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('RentTech Hub RDC • Support Client Airtel Money H24', 105, 283, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Mentions Légales: Document valant preuve de transfert pour location de matériel informatique.', 105, 288, { align: 'center' });

    // Save
    doc.save(`Recu_RentTech_${receiptNo}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full overflow-hidden shadow-xl relative">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Reçu Numérique Officiel</h3>
              <p className="text-xs text-slate-500">Réf. {transaction.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Preview Canvas */}
        <div ref={receiptRef} className="p-6 bg-white text-slate-800 space-y-6">
          
          {/* Top Brand Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <BrandLogo variant="full" size="sm" />
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-500 font-mono block">N° REÇU</span>
              <span className="font-mono font-black text-blue-700 text-sm">{receiptNo}</span>
            </div>
          </div>

          {/* Customer & Transaction Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Client / Titulaire</span>
              <p className="font-bold text-slate-900">{userName || 'MYATSI'}</p>
              <p className="text-slate-500 font-mono">{userPhone || '+243976704762'}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Statut Règlement</span>
              <div className="flex items-center gap-1.5">
                {isApproved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-600">APPROUVÉ & VALIDÉ</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-blue-600">EN TRAITEMENT</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-500">Date: {transaction.date}</p>
            </div>
          </div>

          {/* Details Card */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <div className="bg-slate-50 p-3 font-bold text-slate-700 flex justify-between border-b border-slate-200">
              <span>Description / Opération</span>
              <span>Montant Total</span>
            </div>
            <div className="p-4 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="font-bold text-slate-900 text-sm block">{transaction.title}</span>
                <span className="text-[11px] text-slate-500 capitalize">Type: {transaction.type} • Airtel Money</span>
              </div>
              <div className="text-right">
                <span className="font-black text-xl text-blue-600 font-mono block">
                  {transaction.amount.toLocaleString('fr-FR')} FC
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Validation Réseau 100%</span>
              </div>
            </div>
          </div>

          {/* Security Hash & Stamp */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-600 font-mono block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Sceau Numérique RentTech RDC
              </span>
              <p className="text-[10px] text-slate-400 font-mono">HASH: AIR-SHA256-{transaction.id}-DRC</p>
            </div>
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              <QrCode className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Imprimer
          </button>

          <button
            onClick={downloadPDF}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" /> Télécharger Reçu (PDF)
          </button>
        </div>

      </div>
    </div>
  );
};
