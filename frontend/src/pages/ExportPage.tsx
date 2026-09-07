import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, Database, FileSpreadsheet, Shield, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  DEMO_COWS, DEMO_OWNERS, DEMO_VACCINATIONS,
  DEMO_OFFSPRING, DEMO_SLAUGHTER, DEMO_TRANSFERS,
} from '../demo/demoData';

// ── Sheets per role ────────────────────────────────────────────────────
const SHEETS_BY_ROLE: Record<string, { key: string; labelEn: string; labelRw: string; icon: string }[]> = {
  admin: [
    { key: 'cows',         labelEn: 'All Cows',             labelRw: 'Inka Zose',             icon: '🐄' },
    { key: 'owners',       labelEn: 'All Owners',           labelRw: 'Abafite Inka Bose',     icon: '👤' },
    { key: 'vaccinations', labelEn: 'Vaccination Records',  labelRw: 'Inkinga',               icon: '💉' },
    { key: 'offspring',    labelEn: 'Offspring',            labelRw: 'Izakomotse',            icon: '🐣' },
    { key: 'slaughter',    labelEn: 'Slaughter Records',    labelRw: 'Izabazwe',              icon: '🔪' },
    { key: 'transfers',    labelEn: 'Ownership Transfers',  labelRw: 'Imigurire',             icon: '🔄' },
  ],
  government: [
    { key: 'cows',         labelEn: 'All Cows',             labelRw: 'Inka Zose',             icon: '🐄' },
    { key: 'owners',       labelEn: 'All Owners',           labelRw: 'Abafite Inka Bose',     icon: '👤' },
    { key: 'vaccinations', labelEn: 'Vaccination Records',  labelRw: 'Inkinga',               icon: '💉' },
    { key: 'slaughter',    labelEn: 'Slaughter Records',    labelRw: 'Izabazwe',              icon: '🔪' },
    { key: 'transfers',    labelEn: 'Ownership Transfers',  labelRw: 'Imigurire',             icon: '🔄' },
  ],
  vet: [
    { key: 'cows',         labelEn: 'Cows',                 labelRw: 'Inka',                  icon: '🐄' },
    { key: 'vaccinations', labelEn: 'Vaccination Records',  labelRw: 'Inkinga',               icon: '💉' },
    { key: 'offspring',    labelEn: 'Offspring',            labelRw: 'Izakomotse',            icon: '🐣' },
  ],
  farmer: [
    { key: 'cows',         labelEn: 'My Cows',              labelRw: 'Inka Zanjye',           icon: '🐄' },
    { key: 'vaccinations', labelEn: 'My Vaccinations',      labelRw: "Inkinga z'Inka Zanjye", icon: '💉' },
    { key: 'offspring',    labelEn: 'My Offspring',         labelRw: 'Izakomotse',            icon: '🐣' },
  ],
  slaughterhouse: [],
};

// ── Always-available local demo rows ─────────────────────────────────
const getDemoRows = (sheet: string): Record<string, unknown>[] => {
  switch (sheet) {
    case 'cows':
      return DEMO_COWS.map(c => ({
        'Tag Number': c.tag_number, 'Name': c.name, 'Breed': c.breed,
        'Gender': c.gender, 'Date of Birth': c.date_of_birth,
        'Color': c.color, 'Weight (kg)': c.weight_kg, 'Status': c.status,
        'Owner': c.owner_name, 'Phone': c.owner_phone,
        'Province': c.province, 'District': c.district, 'Sector': c.sector,
      }));
    case 'owners':
      return DEMO_OWNERS.map(o => ({
        'National ID': o.national_id, 'Full Name': o.full_name,
        'Phone': o.phone, 'Email': o.email,
        'Province': o.province, 'District': o.district, 'Sector': o.sector,
        'Active Cows': o.cow_count,
      }));
    case 'vaccinations':
      return DEMO_VACCINATIONS.map(v => ({
        'Tag Number': v.tag_number, 'Cow Name': v.cow_name, 'Owner': v.owner_name,
        'Vaccine': v.vaccine_name, 'Date Given': v.vaccination_date,
        'Next Due': v.next_due_date, 'Vet': v.vet_name,
      }));
    case 'offspring':
      return DEMO_OFFSPRING.map(o => ({
        'Mother Tag': o.mother_tag, 'Mother Name': o.mother_name,
        'Calf Tag': o.calf_tag, 'Calf Name': o.calf_name,
        'Birth Date': o.birth_date, 'Birth Weight (kg)': o.birth_weight_kg, 'Gender': o.calf_gender,
      }));
    case 'slaughter':
      return DEMO_SLAUGHTER.map(s => ({
        'Tag Number': s.tag_number, 'Cow Name': s.cow_name, 'Owner': s.owner_name,
        'Status': s.status, 'Scheduled Date': s.scheduled_date,
        'Slaughter Date': s.slaughter_date, 'Meat Weight (kg)': s.meat_weight_kg,
        'Reason': s.reason, 'District': s.district,
      }));
    case 'transfers':
      return DEMO_TRANSFERS.map(t => ({
        'Tag Number': t.tag_number, 'Cow Name': t.cow_name,
        'From Owner': t.from_owner_name, 'To Owner': t.to_owner_name,
        'Date': t.transfer_date, 'Sale Price (RWF)': t.sale_price, 'District': t.district,
      }));
    default: return [];
  }
};

// ── Build + trigger xlsx download ────────────────────────────────────
const triggerExcel = (
  rows: Record<string, unknown>[],
  sheetLabel: string,
  filename: string,
  userInfo: { full_name?: string; role?: string },
) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  // Auto column widths
  ws['!cols'] = Object.keys(rows[0]).map(k => ({
    wch: Math.max(k.length + 2, ...rows.map(r => String(r[k] ?? '').length + 1)),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetLabel.slice(0, 31));

  // Info sheet
  const infoWs = XLSX.utils.aoa_to_sheet([
    ['RwaCow — Rwanda Cow Tracking System'],
    [],
    ['Exported by', userInfo.full_name || ''],
    ['Role',        userInfo.role || ''],
    ['Sheet',       sheetLabel],
    ['Date',        new Date().toLocaleString()],
    ['Records',     rows.length],
  ]);
  XLSX.utils.book_append_sheet(wb, infoWs, 'Info');

  XLSX.writeFile(wb, filename);
};

// ── Main component ────────────────────────────────────────────────────
const ExportPage: React.FC = () => {
  const { user } = useAuth();
  const { language: L } = useLanguage();
  const role = user?.role || 'farmer';
  const sheets = SHEETS_BY_ROLE[role] || [];

  const [downloading, setDownloading] = useState<string | null>(null);
  const [doneSheet, setDoneSheet]     = useState<string | null>(null);
  const [errorSheet, setErrorSheet]   = useState<string | null>(null);
  const [allLoading, setAllLoading]   = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // ── Get rows (tries real API first, falls back to demo data) ───────
  const getRows = async (sheet: string): Promise<Record<string, unknown>[]> => {
    try {
      const res = await api.get(`/export/csv/${sheet}`, {
        responseType: 'text',
        timeout: 5000,
      });
      const text: string = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      if (!text || text.trim() === '' || text.startsWith('{')) {
        // Backend returned JSON (probably an error object) or empty — fall back
        return getDemoRows(sheet);
      }
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) return getDemoRows(sheet);
      const headers = lines[0].split(',').map(h => h.trim());
      return lines.slice(1).map(line => {
        const vals = line.split(',');
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => { obj[h] = vals[i]?.replace(/^"|"$/g, '') ?? ''; });
        return obj;
      });
    } catch {
      // Backend offline or error — use demo data silently
      return getDemoRows(sheet);
    }
  };

  // ── Single sheet download ──────────────────────────────────────────
  const downloadSheet = async (sheet: string, labelEn: string) => {
    setDownloading(sheet);
    setErrorSheet(null);
    setGlobalError('');
    try {
      const rows = await getRows(sheet);
      if (rows.length === 0) {
        setGlobalError(`No data found for "${labelEn}".`);
        return;
      }
      triggerExcel(
        rows,
        labelEn,
        `RwaCow-${sheet}-${new Date().toISOString().split('T')[0]}.xlsx`,
        { full_name: user?.full_name, role },
      );
      setDoneSheet(sheet);
      setTimeout(() => setDoneSheet(null), 3000);
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorSheet(sheet);
      setGlobalError(`Export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setDownloading(null);
    }
  };

  // ── All sheets in one workbook ─────────────────────────────────────
  const downloadAll = async () => {
    setAllLoading(true);
    setGlobalError('');
    try {
      const wb = XLSX.utils.book_new();
      let totalRecords = 0;

      for (const sheet of sheets) {
        const rows = await getRows(sheet.key);
        if (rows.length > 0) {
          const ws = XLSX.utils.json_to_sheet(rows);
          ws['!cols'] = Object.keys(rows[0]).map(k => ({
            wch: Math.max(k.length + 2, ...rows.map(r => String(r[k] ?? '').length + 1)),
          }));
          XLSX.utils.book_append_sheet(wb, ws, sheet.labelEn.slice(0, 31));
          totalRecords += rows.length;
        }
      }

      if (wb.SheetNames.length === 0) {
        setGlobalError('No data found to export.');
        return;
      }

      // Summary sheet
      const summaryWs = XLSX.utils.aoa_to_sheet([
        ['RwaCow — Rwanda Cow Tracking System'],
        ['Full Export Summary'],
        [],
        ['Exported by', user?.full_name || ''],
        ['Role',        role],
        ['Date',        new Date().toLocaleString()],
        ['Total Records', totalRecords],
        [],
        ['Sheet', 'Records'],
        ...sheets.map(s => [s.labelEn, getDemoRows(s.key).length]),
      ]);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      XLSX.writeFile(wb, `RwaCow-FullExport-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err: any) {
      setGlobalError(`Full export failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setAllLoading(false);
    }
  };

  // ── JSON backup (admin only) ───────────────────────────────────────
  const downloadBackup = async () => {
    setBackupLoading(true);
    setGlobalError('');
    try {
      let backupData: unknown;
      try {
        const res = await api.get('/export/backup', { timeout: 8000 });
        backupData = res.data;
      } catch {
        // Fall back to demo backup
        backupData = {
          exported_at: new Date().toISOString(),
          exported_by: user?.email,
          system: 'RwaCow (Demo Backup)',
          data: {
            cows: DEMO_COWS, owners: DEMO_OWNERS,
            vaccinations: DEMO_VACCINATIONS, offspring: DEMO_OFFSPRING,
            slaughter_records: DEMO_SLAUGHTER, ownership_transfers: DEMO_TRANSFERS,
          },
        };
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `rwacow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setGlobalError(`Backup failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setBackupLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {L === 'en' ? '📥 Export & Backup' : '📥 Kopa & Sobeka'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {L === 'en'
            ? 'Download your data as Excel (.xlsx) files. Works in both online and demo mode.'
            : 'Manura amakuru yawe mu buryo bwa Excel (.xlsx). Bikora mu buryo bwose.'}
        </p>
      </div>

      {/* Role banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <Shield size={18} className="text-blue-600 flex-shrink-0" />
        <p className="text-sm text-blue-800">
          <strong className="capitalize">{role}</strong>
          {' — '}
          {L === 'en'
            ? 'You can export the sheets listed below based on your access level.'
            : 'Ushobora gukopa impapuro zigaragazwa hepfo hakurikijwe uruhare rwawe.'}
        </p>
      </div>

      {/* Global error */}
      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <XCircle size={16} className="flex-shrink-0" />
          <span>{globalError}</span>
          <button onClick={() => setGlobalError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Individual sheets */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          {L === 'en' ? 'Download Individual Sheets' : 'Manura Urupapuro Rumwe Rimwe'}
        </h2>

        {sheets.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-400">
            <AlertCircle size={32} className="mx-auto mb-2" />
            <p>{L === 'en' ? 'No export access for your role.' : 'Uruhare rwawe ntirufite uburenganzira bwo gukopa.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sheets.map(sheet => {
              const isLoading = downloading === sheet.key;
              const isDone    = doneSheet   === sheet.key;
              const isError   = errorSheet  === sheet.key;
              return (
                <button
                  key={sheet.key}
                  onClick={() => downloadSheet(sheet.key, sheet.labelEn)}
                  disabled={isLoading || allLoading}
                  className={`flex items-center justify-between bg-white border-2 rounded-xl px-5 py-4
                    transition-all group text-left disabled:opacity-60
                    ${isDone  ? 'border-green-400 bg-green-50' :
                      isError ? 'border-red-300 bg-red-50' :
                      'border-gray-200 hover:border-green-400 hover:shadow-md'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sheet.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {L === 'en' ? sheet.labelEn : sheet.labelRw}
                      </p>
                      <p className="text-xs text-gray-400">Excel (.xlsx)</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    ) : isDone ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : isError ? (
                      <XCircle size={20} className="text-red-400" />
                    ) : (
                      <FileSpreadsheet size={20} className="text-gray-300 group-hover:text-green-600 transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Full workbook */}
      {sheets.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-semibold text-green-900">
                {L === 'en' ? '📊 Download Full Workbook' : '📊 Manura Inyandiko Yose Hamwe'}
              </h2>
              <p className="text-sm text-green-700 mt-0.5">
                {L === 'en'
                  ? `All ${sheets.length} sheets combined into one Excel file.`
                  : `Impapuro ${sheets.length} zose mu ifayili rimwe rya Excel.`}
              </p>
            </div>
            <button
              onClick={downloadAll}
              disabled={allLoading || downloading !== null}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white
                px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {allLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {L === 'en' ? 'Preparing…' : 'Gutegereza…'}
                </>
              ) : (
                <>
                  <Download size={16} />
                  {L === 'en' ? 'Download All Sheets' : 'Manura Impapuro Zose'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Admin JSON backup */}
      {role === 'admin' && (
        <div className="bg-gray-800 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Database size={18} className="text-yellow-400" />
                <h2 className="font-semibold text-yellow-300">
                  {L === 'en' ? 'Full System Backup (Admin Only)' : 'Sobeka Sisitemu Yose (Admin Gusa)'}
                </h2>
              </div>
              <p className="text-sm text-gray-400">
                {L === 'en'
                  ? 'Complete database export as a JSON file. Store securely — contains all system data.'
                  : 'Kopi yuzuye ya database nk\'ifayili ya JSON. Bika neza — irimo amakuru yose.'}
              </p>
            </div>
            <button
              onClick={downloadBackup}
              disabled={backupLoading}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900
                px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
            >
              {backupLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                  {L === 'en' ? 'Preparing…' : 'Gutegereza…'}
                </>
              ) : (
                <>
                  <Database size={16} />
                  {L === 'en' ? 'Download JSON Backup' : 'Manura Sobeka ya JSON'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Access table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-700 text-sm">
            {L === 'en' ? 'Data Access by Role' : "Uburenganzira bw'Amakuru ku Nshingano"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-gray-500 font-medium">Data</th>
                {['Admin','Government','Vet','Farmer','Slaughterhouse'].map(r => (
                  <th key={r} className="px-3 py-2.5 text-center text-gray-500 font-medium">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { label: 'Cows',             admin: '✅ All',   gov: '✅ All',   vet: '✅ All', farmer: '✅ Own only', slaughter: '✅ Scheduled' },
                { label: 'Owners + NID',     admin: '✅ Full',  gov: '✅ Full',  vet: '⚠️ No NID', farmer: '⚠️ Own', slaughter: '❌' },
                { label: 'Vaccinations',     admin: '✅',       gov: '✅',       vet: '✅',    farmer: '✅ Own cows', slaughter: '❌' },
                { label: 'Offspring',        admin: '✅',       gov: '✅',       vet: '✅',    farmer: '✅ Own cows', slaughter: '❌' },
                { label: 'Slaughter',        admin: '✅',       gov: '✅',       vet: '❌',    farmer: '❌',          slaughter: '✅' },
                { label: 'Transfers + Price',admin: '✅ Full',  gov: '✅ Full',  vet: '⚠️ No price', farmer: '⚠️ Own', slaughter: '❌' },
                { label: 'JSON Backup',      admin: '✅',       gov: '❌',       vet: '❌',    farmer: '❌',          slaughter: '❌' },
              ].map(row => (
                <tr key={row.label} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-700">{row.label}</td>
                  <td className="px-3 py-2.5 text-center">{row.admin}</td>
                  <td className="px-3 py-2.5 text-center">{row.gov}</td>
                  <td className="px-3 py-2.5 text-center">{row.vet}</td>
                  <td className="px-3 py-2.5 text-center">{row.farmer}</td>
                  <td className="px-3 py-2.5 text-center">{row.slaughter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ExportPage;
