import { VendorTransaction, DailyWageEntry, ProjectExpense, Project, Vendor } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface MultiSheetReportData {
  projectName: string;
  projectCode: string;
  startDate: string;
  endDate: string;
  vendorBills: VendorTransaction[];
  dailyWages: DailyWageEntry[];
  projectExpenses: ProjectExpense[];
  projects: Project[];
  vendors: Vendor[];
  billType?: 'all' | 'vendor' | 'wages' | 'expenses';
}

/**
 * Escapes characters for XML attributes and text nodes and prevents Formula Injection (CWE-1236).
 */
function escapeXml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return '';
  let str = String(unsafe);
  // Neutralize formula injection if string starts with =, +, -, @, \t, \r
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Precomputed CRC32 Lookup Table for standard ZIP files.
 */
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf: Uint8Array): number {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

interface ZipFileItem {
  name: string;
  data: string | Uint8Array;
}

/**
 * Creates a standard uncompressed ZIP archive (compression method 0: STORE).
 * Runs natively in all browsers and Node.js with zero dependencies.
 */
function createZip(files: ZipFileItem[]): Uint8Array {
  const encoder = new TextEncoder();

  // Collect parent directories
  const dirSet = new Set<string>();
  for (const f of files) {
    const parts = f.name.split('/');
    let cur = '';
    for (let i = 0; i < parts.length - 1; i++) {
      cur += parts[i] + '/';
      dirSet.add(cur);
    }
  }

  const allEntries: { name: string; data: Uint8Array; isDir: boolean }[] = [];
  dirSet.forEach((dir) => {
    allEntries.push({ name: dir, data: new Uint8Array(0), isDir: true });
  });
  for (const file of files) {
    allEntries.push({
      name: file.name,
      data: typeof file.data === 'string' ? encoder.encode(file.data) : file.data,
      isDir: false,
    });
  }

  const fileEntries: {
    nameBuf: Uint8Array;
    dataBuf: Uint8Array;
    localHeader: Uint8Array;
    offset: number;
    crc: number;
    size: number;
    isDir: boolean;
  }[] = [];
  let offset = 0;

  for (const item of allEntries) {
    const dataBuf = item.data;
    const nameBuf = encoder.encode(item.name);
    const crc = item.isDir ? 0 : crc32(dataBuf);
    const size = dataBuf.length;

    const localHeader = new Uint8Array(30 + nameBuf.length);
    const dv = new DataView(localHeader.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 0, true);
    dv.setUint16(8, 0, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, size, true);
    dv.setUint32(22, size, true);
    dv.setUint16(26, nameBuf.length, true);
    dv.setUint16(28, 0, true);
    localHeader.set(nameBuf, 30);

    fileEntries.push({ nameBuf, dataBuf, localHeader, offset, crc, size, isDir: item.isDir });
    offset += localHeader.length + size;
  }

  const centralDirEntries: Uint8Array[] = [];
  let centralDirSize = 0;
  for (const entry of fileEntries) {
    const cdHeader = new Uint8Array(46 + entry.nameBuf.length);
    const dv = new DataView(cdHeader.buffer);
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 20, true);
    dv.setUint16(8, 0, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint16(14, 0, true);
    dv.setUint32(16, entry.crc, true);
    dv.setUint32(20, entry.size, true);
    dv.setUint32(24, entry.size, true);
    dv.setUint16(28, entry.nameBuf.length, true);
    dv.setUint16(30, 0, true);
    dv.setUint16(32, 0, true);
    dv.setUint16(34, 0, true);
    dv.setUint16(36, 0, true);
    dv.setUint32(38, entry.isDir ? 0x10 : 0, true);
    dv.setUint32(42, entry.offset, true);
    cdHeader.set(entry.nameBuf, 46);

    centralDirEntries.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  const eocd = new Uint8Array(22);
  const dvEocd = new DataView(eocd.buffer);
  dvEocd.setUint32(0, 0x06054b50, true);
  dvEocd.setUint16(4, 0, true);
  dvEocd.setUint16(6, 0, true);
  dvEocd.setUint16(8, fileEntries.length, true);
  dvEocd.setUint16(10, fileEntries.length, true);
  dvEocd.setUint32(12, centralDirSize, true);
  dvEocd.setUint32(16, offset, true);
  dvEocd.setUint16(20, 0, true);

  const totalLength = offset + centralDirSize + 22;
  const out = new Uint8Array(totalLength);
  let pos = 0;
  for (const entry of fileEntries) {
    out.set(entry.localHeader, pos);
    pos += entry.localHeader.length;
    out.set(entry.dataBuf, pos);
    pos += entry.dataBuf.length;
  }
  for (const cd of centralDirEntries) {
    out.set(cd, pos);
    pos += cd.length;
  }
  out.set(eocd, pos);

  return out;
}

/**
 * Standard styles.xml definitions with borders, fills, fonts, and alignments.
 *
 * Cell Style IDs:
 *  0: Default / none
 *  1: Header Center (Navy blue #1E3A8A, bold white, thin border, center)
 *  2: Header Left (Navy blue #1E3A8A, bold white, thin border, left)
 *  3: Header Right (Navy blue #1E3A8A, bold white, thin border, right)
 *  4: Table Data Left (Plain text, thin border 1, left)
 *  5: Table Data Center (Plain text, thin border 1, center)
 *  6: Table Data Number (Plain number #,##0.00, thin border 1, right)
 *  7: Table Data Currency (Plain currency ₹#,##0.00, thin border 1, right)
 *  8: Total Count Label (Bold dark text, soft gray #F1F5F9 fill, thin border 1, left)
 *  9: Total Count Number (Bold dark text, soft gray #F1F5F9 fill, thin border 1, right)
 * 10: Rate × Count Text (Muted italic text, thin border 1, center)
 * 11: Total Row Label (Bold amber text, soft amber #FEF3C7 fill, top thin / bottom double border, left)
 * 12: Total Row Currency (Bold amber text, soft amber #FEF3C7 fill, top thin / bottom double border, right)
 * 13: Grand Total Highlight (Bold dark amber text, vibrant amber #FDE68A fill, top thin / bottom double border, right)
 * 14: Subheader Left (Bold dark text, slate #E2E8F0 fill, thin border 1, left)
 * 15: Muted Text Left (Muted italic text, thin border 1, left)
 */
const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2">
    <numFmt numFmtId="164" formatCode="&quot;₹&quot;#,##0.00"/>
    <numFmt numFmtId="165" formatCode="#,##0.##"/>
  </numFmts>
  <fonts count="6">
    <font><sz val="10"/><name val="Segoe UI"/><color rgb="FF1E293B"/></font>
    <font><b/><sz val="10.5"/><name val="Segoe UI"/><color rgb="FFFFFFFF"/></font>
    <font><b/><sz val="10"/><name val="Segoe UI"/><color rgb="FF0F172A"/></font>
    <font><i/><sz val="9"/><name val="Segoe UI"/><color rgb="FF64748B"/></font>
    <font><b/><sz val="10.5"/><name val="Segoe UI"/><color rgb="FF92400E"/></font>
    <font><b/><sz val="11.5"/><name val="Segoe UI"/><color rgb="FF78350F"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFDE68A"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/></patternFill></fill>
  </fills>
  <borders count="4">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
    </border>
    <border>
      <left style="thin"><color rgb="FF3B82F6"/></left>
      <right style="thin"><color rgb="FF3B82F6"/></right>
      <top style="thin"><color rgb="FF1E3A8A"/></top>
      <bottom style="medium"><color rgb="FF1E3A8A"/></bottom>
    </border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFD97706"/></top>
      <bottom style="double"><color rgb="FFD97706"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="16">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="165" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="164" fontId="4" fillId="4" borderId="3" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="5" fillId="5" borderId="3" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

function colName(index: number): string {
  return String.fromCharCode(64 + index);
}

/**
 * Generates cell XML with explicit cell coordinates and style IDs.
 */
function strCell(col: number, row: number, text: any, styleId: number): string {
  const r = `${colName(col)}${row}`;
  const val = escapeXml(text);
  return `<c r="${r}" t="inlineStr" s="${styleId}"><is><t>${val}</t></is></c>`;
}

function numCell(col: number, row: number, num: number, styleId: number): string {
  const r = `${colName(col)}${row}`;
  const n = isNaN(num) ? 0 : num;
  return `<c r="${r}" s="${styleId}"><v>${n}</v></c>`;
}

function emptyCell(col: number, row: number, styleId: number): string {
  const r = `${colName(col)}${row}`;
  return `<c r="${r}" s="${styleId}"/>`;
}

/**
 * Builds the Wages worksheet strictly within columns A–F.
 */
function buildWagesWorksheet(data: MultiSheetReportData): string {
  const { dailyWages, projects, projectName, projectCode } = data;

  const sortedWages = [...dailyWages].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const pRef = projects.find((p) => p.name === projectName || p.code === projectCode);
  const contractorRate = sortedWages.find((w) => w.contractorRate)?.contractorRate || pRef?.contractorWage || 1500;
  const maesthriRate = sortedWages.find((w) => w.maesthriRate)?.maesthriRate || pRef?.maesthriWage || 1200;
  const gentsRate = sortedWages.find((w) => w.gentsRate)?.gentsRate || pRef?.gentsWage || 900;
  const ladiesRate = sortedWages.find((w) => w.ladiesRate)?.ladiesRate || pRef?.ladiesWage || 700;

  let sumContractorCount = 0;
  let sumMaesthriCount = 0;
  let sumGentsCount = 0;
  let sumLadiesCount = 0;

  let sumContractorAmount = 0;
  let sumMaesthriAmount = 0;
  let sumGentsAmount = 0;
  let sumLadiesAmount = 0;
  let sumExtraAmount = 0;

  sortedWages.forEach((w) => {
    const cCount = Number(w.contractorCount) || 0;
    const mCount = Number(w.maesthriCount) || 0;
    const gCount = Number(w.gentsCount) || 0;
    const lCount = Number(w.ladiesCount) || 0;

    sumContractorCount = Math.round((sumContractorCount + cCount) * 100) / 100;
    sumMaesthriCount = Math.round((sumMaesthriCount + mCount) * 100) / 100;
    sumGentsCount = Math.round((sumGentsCount + gCount) * 100) / 100;
    sumLadiesCount = Math.round((sumLadiesCount + lCount) * 100) / 100;

    sumContractorAmount += Number(w.contractorTotal) || (cCount * (w.contractorRate || contractorRate));
    sumMaesthriAmount += Number(w.maesthriTotal) || (mCount * (w.maesthriRate || maesthriRate));
    sumGentsAmount += Number(w.gentsTotal) || (gCount * (w.gentsRate || gentsRate));
    sumLadiesAmount += Number(w.ladiesTotal) || (lCount * (w.ladiesRate || ladiesRate));
    sumExtraAmount += Number(w.extraWorkersTotal) || 0;
  });

  const grandWagesTotal = sumContractorAmount + sumMaesthriAmount + sumGentsAmount + sumLadiesAmount + sumExtraAmount;

  let rowsXml = '';
  let rowIdx = 1;

  // Header row (Columns A-G: Date, Contractors, Maesthri, Gents, Ladies, Extra Workers, Day Grand Total)
  rowsXml += `    <row r="${rowIdx}" ht="26" customHeight="1">
      ${strCell(1, rowIdx, 'Date', 1)}
      ${strCell(2, rowIdx, 'Contractors', 1)}
      ${strCell(3, rowIdx, 'Maesthri', 1)}
      ${strCell(4, rowIdx, 'Gents', 1)}
      ${strCell(5, rowIdx, 'Ladies', 1)}
      ${strCell(6, rowIdx, 'Extra Workers', 1)}
      ${strCell(7, rowIdx, 'Day Grand Total', 1)}
    </row>\n`;
  rowIdx++;

  // Data rows
  if (sortedWages.length === 0) {
    rowsXml += `    <row r="${rowIdx}" ht="20" customHeight="1">
      ${strCell(1, rowIdx, 'No wage records for selected criteria', 4)}
      ${emptyCell(2, rowIdx, 4)}
      ${emptyCell(3, rowIdx, 4)}
      ${emptyCell(4, rowIdx, 4)}
      ${emptyCell(5, rowIdx, 4)}
      ${emptyCell(6, rowIdx, 4)}
      ${numCell(7, rowIdx, 0, 7)}
    </row>\n`;
    rowIdx++;
  } else {
    sortedWages.forEach((w) => {
      const cCount = Number(w.contractorCount) || 0;
      const mCount = Number(w.maesthriCount) || 0;
      const gCount = Number(w.gentsCount) || 0;
      const lCount = Number(w.ladiesCount) || 0;

      // Extra workers formatted: "Painter [Daily Wage] (3 × ₹500), Carpenter [Contractor] (3 × ₹1000)"
      let extraStr = '-';
      let extraDayTotal = 0;
      if (w.extraWorkers && w.extraWorkers.length > 0) {
        const parts = w.extraWorkers.map((e) => {
          const c = Number(e.count) || 0;
          const r = Number(e.ratePerDay) || 0;
          extraDayTotal += (Number(e.total) || (c * r));
          const catLabel = e.category ? ` [${e.category}]` : '';
          return `${e.nameOrRole || 'Worker'}${catLabel} (${c} × ₹${r})`;
        });
        extraStr = parts.join(', ');
      } else if (Number(w.extraWorkersTotal) > 0) {
        extraDayTotal = Number(w.extraWorkersTotal) || 0;
        extraStr = `Extra: ₹${extraDayTotal}`;
      }

      const standardTotal = 
        (cCount * (w.contractorRate || contractorRate)) +
        (mCount * (w.maesthriRate || maesthriRate)) +
        (gCount * (w.gentsRate || gentsRate)) +
        (lCount * (w.ladiesRate || ladiesRate));

      const dayTotal = Number(w.totalAmount) || (standardTotal + extraDayTotal);

      rowsXml += `    <row r="${rowIdx}" ht="22" customHeight="1">
      ${strCell(1, rowIdx, formatDate(w.date), 5)}
      ${numCell(2, rowIdx, cCount, 6)}
      ${numCell(3, rowIdx, mCount, 6)}
      ${numCell(4, rowIdx, gCount, 6)}
      ${numCell(5, rowIdx, lCount, 6)}
      ${strCell(6, rowIdx, extraStr, 4)}
      ${numCell(7, rowIdx, dayTotal, 7)}
    </row>\n`;
      rowIdx++;
    });
  }

  // Row: Total Count
  rowsXml += `    <row r="${rowIdx}" ht="22" customHeight="1">
      ${strCell(1, rowIdx, 'Total Count', 8)}
      ${numCell(2, rowIdx, sumContractorCount, 9)}
      ${numCell(3, rowIdx, sumMaesthriCount, 9)}
      ${numCell(4, rowIdx, sumGentsCount, 9)}
      ${numCell(5, rowIdx, sumLadiesCount, 9)}
      ${emptyCell(6, rowIdx, 8)}
      ${emptyCell(7, rowIdx, 8)}
    </row>\n`;
  rowIdx++;

  // Row: Rate x Count
  rowsXml += `    <row r="${rowIdx}" ht="20" customHeight="1">
      ${strCell(1, rowIdx, 'Rate × Count', 10)}
      ${strCell(2, rowIdx, `${contractorRate} × ${sumContractorCount}`, 10)}
      ${strCell(3, rowIdx, `${maesthriRate} × ${sumMaesthriCount}`, 10)}
      ${strCell(4, rowIdx, `${gentsRate} × ${sumGentsCount}`, 10)}
      ${strCell(5, rowIdx, `${ladiesRate} × ${sumLadiesCount}`, 10)}
      ${strCell(6, rowIdx, sumExtraAmount > 0 ? `Extra Total: ₹${sumExtraAmount}` : '-', 10)}
      ${emptyCell(7, rowIdx, 10)}
    </row>\n`;
  rowIdx++;

  // Row: Total Row (Amber highlighted, strictly columns A-G)
  rowsXml += `    <row r="${rowIdx}" ht="25" customHeight="1">
      ${strCell(1, rowIdx, 'Total', 11)}
      ${numCell(2, rowIdx, sumContractorAmount, 12)}
      ${numCell(3, rowIdx, sumMaesthriAmount, 12)}
      ${numCell(4, rowIdx, sumGentsAmount, 12)}
      ${numCell(5, rowIdx, sumLadiesAmount, 12)}
      ${numCell(6, rowIdx, sumExtraAmount, 12)}
      ${numCell(7, rowIdx, grandWagesTotal, 13)}
    </row>\n`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="2" width="16" customWidth="1"/>
    <col min="3" max="3" width="16" customWidth="1"/>
    <col min="4" max="4" width="16" customWidth="1"/>
    <col min="5" max="5" width="16" customWidth="1"/>
    <col min="6" max="6" width="38" customWidth="1"/>
    <col min="7" max="7" width="22" customWidth="1"/>
  </cols>
  <sheetData>
${rowsXml}  </sheetData>
</worksheet>`;
}

/**
 * Builds the Vendor Bills worksheet strictly within columns A–E.
 */
function buildVendorWorksheet(data: MultiSheetReportData): string {
  const { vendorBills, vendors, projects, projectName } = data;

  const sortedBills = [...vendorBills].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  let rowsXml = '';
  let rowIdx = 1;

  // Header row (Columns A-E)
  rowsXml += `    <row r="${rowIdx}" ht="26" customHeight="1">
      ${strCell(1, rowIdx, 'Date', 1)}
      ${strCell(2, rowIdx, 'Project Name', 1)}
      ${strCell(3, rowIdx, 'Material / Description', 1)}
      ${strCell(4, rowIdx, 'Unit / Qty', 1)}
      ${strCell(5, rowIdx, 'Total Amount', 1)}
    </row>\n`;
  rowIdx++;

  let grandVendorTotal = 0;

  if (sortedBills.length === 0) {
    rowsXml += `    <row r="${rowIdx}" ht="20" customHeight="1">
      ${strCell(1, rowIdx, 'No vendor bills for selected criteria', 4)}
      ${emptyCell(2, rowIdx, 4)}
      ${emptyCell(3, rowIdx, 4)}
      ${emptyCell(4, rowIdx, 4)}
      ${numCell(5, rowIdx, 0, 7)}
    </row>\n`;
    rowIdx++;
  } else {
    sortedBills.forEach((vt) => {
      const vName = vendors.find((v) => v.id === vt.vendorId)?.name || 'Vendor';
      const pName = projects.find((p) => p.id === vt.projectId)?.name || projectName;
      const billTotal = Number(vt.totalAmount) || 0;
      grandVendorTotal += billTotal;

      const hasTransport = Boolean(vt.transportVehicleType || (Number(vt.transportCharges) > 0));
      const hasService = Boolean(Number(vt.serviceCharge) > 0);

      // Section header for bill
      rowsXml += `    <row r="${rowIdx}" ht="22" customHeight="1">
      ${strCell(1, rowIdx, formatDate(vt.date), 14)}
      ${strCell(2, rowIdx, pName, 14)}
      ${strCell(3, rowIdx, `${vName} (Bill #${vt.billNumber || 'N/A'})`, 14)}
      ${emptyCell(4, rowIdx, 14)}
      ${emptyCell(5, rowIdx, 14)}
    </row>\n`;
      rowIdx++;

      // Material items or single material description
      if (vt.items && vt.items.length > 0) {
        vt.items.forEach((item) => {
          rowsXml += `    <row r="${rowIdx}" ht="20" customHeight="1">
      ${strCell(1, rowIdx, formatDate(vt.date), 5)}
      ${strCell(2, rowIdx, pName, 4)}
      ${strCell(3, rowIdx, item.material || 'Material', 4)}
      ${strCell(4, rowIdx, `${item.quantity || 1} ${item.unit || 'units'}`, 5)}
      ${numCell(5, rowIdx, Number(item.total) || 0, 7)}
    </row>\n`;
          rowIdx++;
        });
      } else {
        const materialTotal = billTotal - (Number(vt.transportCharges) || 0) - (Number(vt.serviceCharge) || 0);
        rowsXml += `    <row r="${rowIdx}" ht="20" customHeight="1">
      ${strCell(1, rowIdx, formatDate(vt.date), 5)}
      ${strCell(2, rowIdx, pName, 4)}
      ${strCell(3, rowIdx, vt.material || 'Construction Materials', 4)}
      ${strCell(4, rowIdx, `${vt.quantity || 1} ${vt.unit || 'Lots'}`, 5)}
      ${numCell(5, rowIdx, materialTotal > 0 ? materialTotal : billTotal, 7)}
    </row>\n`;
        rowIdx++;
      }

      // Transport charge row
      if (hasTransport) {
        rowsXml += `    <row r="${rowIdx}" ht="20" customHeight="1">
      ${emptyCell(1, rowIdx, 4)}
      ${emptyCell(2, rowIdx, 4)}
      ${strCell(3, rowIdx, `Transport: ${vt.transportVehicleType || 'Commercial Vehicle'}`, 15)}
      ${strCell(4, rowIdx, 'Delivery', 10)}
      ${numCell(5, rowIdx, Number(vt.transportCharges) || 0, 7)}
    </row>\n`;
        rowIdx++;
      }

      // Service charge row
      if (hasService) {
        rowsXml += `    <row r="${rowIdx}" ht="20" customHeight="1">
      ${emptyCell(1, rowIdx, 4)}
      ${emptyCell(2, rowIdx, 4)}
      ${strCell(3, rowIdx, 'Direct Service Charge', 15)}
      ${strCell(4, rowIdx, 'Service Fee', 10)}
      ${numCell(5, rowIdx, Number(vt.serviceCharge) || 0, 7)}
    </row>\n`;
        rowIdx++;
      }

      // Bill Total in Bold
      rowsXml += `    <row r="${rowIdx}" ht="23" customHeight="1">
      ${emptyCell(1, rowIdx, 8)}
      ${emptyCell(2, rowIdx, 8)}
      ${strCell(3, rowIdx, `Bill #${vt.billNumber || 'N/A'} Total`, 8)}
      ${emptyCell(4, rowIdx, 8)}
      ${numCell(5, rowIdx, billTotal, 9)}
    </row>\n`;
      rowIdx++;
    });
  }

  // Grand Total Row
  rowsXml += `    <row r="${rowIdx}" ht="25" customHeight="1">
      ${strCell(1, rowIdx, 'Grand Total Vendor Bills', 11)}
      ${emptyCell(2, rowIdx, 11)}
      ${emptyCell(3, rowIdx, 11)}
      ${emptyCell(4, rowIdx, 11)}
      ${numCell(5, rowIdx, grandVendorTotal, 13)}
    </row>\n`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="2" width="24" customWidth="1"/>
    <col min="3" max="3" width="34" customWidth="1"/>
    <col min="4" max="4" width="16" customWidth="1"/>
    <col min="5" max="5" width="22" customWidth="1"/>
  </cols>
  <sheetData>
${rowsXml}  </sheetData>
</worksheet>`;
}

/**
 * Builds the Site Expenses worksheet strictly within columns A–D (Date, Project Name, Category, Amount).
 */
function buildExpensesWorksheet(data: MultiSheetReportData): string {
  const { projectExpenses, projects, projectName } = data;

  const sortedExpenses = [...projectExpenses].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  let rowsXml = '';
  let rowIdx = 1;

  // Header row (Columns A-D: Date, Project Name, Category / Expense Item, Amount)
  rowsXml += `    <row r="${rowIdx}" ht="26" customHeight="1">
      ${strCell(1, rowIdx, 'Date', 1)}
      ${strCell(2, rowIdx, 'Project Name', 1)}
      ${strCell(3, rowIdx, 'Category / Expense Item', 1)}
      ${strCell(4, rowIdx, 'Amount', 1)}
    </row>\n`;
  rowIdx++;

  let grandExpTotal = 0;

  if (sortedExpenses.length === 0) {
    rowsXml += `    <row r="${rowIdx}" ht="20" customHeight="1">
      ${strCell(1, rowIdx, 'No direct site expenses for selected criteria', 4)}
      ${emptyCell(2, rowIdx, 4)}
      ${emptyCell(3, rowIdx, 4)}
      ${numCell(4, rowIdx, 0, 7)}
    </row>\n`;
    rowIdx++;
  } else {
    sortedExpenses.forEach((pe) => {
      const pName = projects.find((p) => p.id === pe.projectId)?.name || projectName;
      const amt = Number(pe.amount) || 0;
      grandExpTotal += amt;

      const desc = pe.category 
        ? `${pe.category.toUpperCase()}${pe.notes ? ` - ${pe.notes}` : ''}`
        : (pe.notes || 'GENERAL');

      rowsXml += `    <row r="${rowIdx}" ht="20" customHeight="1">
      ${strCell(1, rowIdx, formatDate(pe.date), 5)}
      ${strCell(2, rowIdx, pName, 4)}
      ${strCell(3, rowIdx, desc, 4)}
      ${numCell(4, rowIdx, amt, 7)}
    </row>\n`;
      rowIdx++;
    });
  }

  // Grand Total Row
  rowsXml += `    <row r="${rowIdx}" ht="25" customHeight="1">
      ${strCell(1, rowIdx, 'Grand Total Site Expenses', 11)}
      ${emptyCell(2, rowIdx, 11)}
      ${emptyCell(3, rowIdx, 11)}
      ${numCell(4, rowIdx, grandExpTotal, 13)}
    </row>\n`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="2" width="24" customWidth="1"/>
    <col min="3" max="3" width="36" customWidth="1"/>
    <col min="4" max="4" width="20" customWidth="1"/>
  </cols>
  <sheetData>
${rowsXml}  </sheetData>
</worksheet>`;
}

/**
 * Builds the Client Billing Summary worksheet strictly within columns A–C (no status column).
 */
function buildSummaryWorksheet(data: MultiSheetReportData): string {
  const { vendorBills, dailyWages, projectExpenses, projectName, startDate, endDate } = data;

  const totalVendor = vendorBills.reduce((s, v) => s + (Number(v.totalAmount) || 0), 0);
  const totalWages = dailyWages.reduce((s, w) => s + (Number(w.totalAmount) || 0), 0);
  const totalExpenses = projectExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const grandTotal = totalVendor + totalWages + totalExpenses;

  let rowsXml = '';
  let rowIdx = 1;

  // Header row (Columns A-C)
  rowsXml += `    <row r="${rowIdx}" ht="26" customHeight="1">
      ${strCell(1, rowIdx, 'Billing Category', 1)}
      ${strCell(2, rowIdx, 'Description / Scope', 1)}
      ${strCell(3, rowIdx, 'Amount', 1)}
    </row>\n`;
  rowIdx++;

  // Project Info Row
  rowsXml += `    <row r="${rowIdx}" ht="22" customHeight="1">
      ${strCell(1, rowIdx, 'Project', 14)}
      ${strCell(2, rowIdx, `${projectName} (${formatDate(startDate)} to ${formatDate(endDate)})`, 14)}
      ${emptyCell(3, rowIdx, 14)}
    </row>\n`;
  rowIdx++;

  // 1. Vendor Bills
  rowsXml += `    <row r="${rowIdx}" ht="21" customHeight="1">
      ${strCell(1, rowIdx, '1. Vendor Material & Supply Bills', 4)}
      ${strCell(2, rowIdx, `${vendorBills.length} Invoices / Bills included`, 4)}
      ${numCell(3, rowIdx, totalVendor, 7)}
    </row>\n`;
  rowIdx++;

  // 2. Wages
  rowsXml += `    <row r="${rowIdx}" ht="21" customHeight="1">
      ${strCell(1, rowIdx, '2. Daily Labour & Work Wages', 4)}
      ${strCell(2, rowIdx, `${dailyWages.length} Wage log sheets (Mason, Gents, Ladies)`, 4)}
      ${numCell(3, rowIdx, totalWages, 7)}
    </row>\n`;
  rowIdx++;

  // 3. Site Expenses
  rowsXml += `    <row r="${rowIdx}" ht="21" customHeight="1">
      ${strCell(1, rowIdx, '3. Direct Site Operations Expenses', 4)}
      ${strCell(2, rowIdx, `${projectExpenses.length} Site expense vouchers`, 4)}
      ${numCell(3, rowIdx, totalExpenses, 7)}
    </row>\n`;
  rowIdx++;

  // Grand Total Row
  rowsXml += `    <row r="${rowIdx}" ht="26" customHeight="1">
      ${strCell(1, rowIdx, 'Grand Total Client Payable', 11)}
      ${strCell(2, rowIdx, 'Sum of all eligible operations & materials', 11)}
      ${numCell(3, rowIdx, grandTotal, 13)}
    </row>\n`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="34" customWidth="1"/>
    <col min="2" max="2" width="48" customWidth="1"/>
    <col min="3" max="3" width="24" customWidth="1"/>
  </cols>
  <sheetData>
${rowsXml}  </sheetData>
</worksheet>`;
}

/**
 * Generates a genuine OpenXML Microsoft Excel (.xlsx) spreadsheet with independent tabs,
 * clean table borders, zero cell-color bleeding, and full compatibility across Excel, Numbers, and Google Sheets.
 */
export function generateMultiSheetXlsx(data: MultiSheetReportData): Uint8Array {
  const { billType } = data;

  interface SheetDef {
    name: string;
    filename: string;
    content: string;
  }

  const sheets: SheetDef[] = [];

  if (billType === 'wages') {
    sheets.push({ name: 'Wages', filename: 'sheet1.xml', content: buildWagesWorksheet(data) });
  } else if (billType === 'vendor') {
    sheets.push({ name: 'Vendor Bills', filename: 'sheet1.xml', content: buildVendorWorksheet(data) });
  } else if (billType === 'expenses') {
    sheets.push({ name: 'Site Expenses', filename: 'sheet1.xml', content: buildExpensesWorksheet(data) });
  } else {
    sheets.push({ name: 'Wages', filename: 'sheet1.xml', content: buildWagesWorksheet(data) });
    sheets.push({ name: 'Vendor Bills', filename: 'sheet2.xml', content: buildVendorWorksheet(data) });
    sheets.push({ name: 'Site Expenses', filename: 'sheet3.xml', content: buildExpensesWorksheet(data) });
    sheets.push({ name: 'Client Billing Summary', filename: 'sheet4.xml', content: buildSummaryWorksheet(data) });
  }

  // Build [Content_Types].xml
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>\n`;

  sheets.forEach((s) => {
    contentTypesXml += `  <Override PartName="/xl/worksheets/${s.filename}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n`;
  });
  contentTypesXml += `</Types>`;

  // Build _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // Build xl/_rels/workbook.xml.rels
  let wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n`;
  sheets.forEach((s, idx) => {
    wbRelsXml += `  <Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/${s.filename}"/>\n`;
  });
  wbRelsXml += `  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>\n`;
  wbRelsXml += `</Relationships>`;

  // Build xl/workbook.xml
  let workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>\n`;
  sheets.forEach((s, idx) => {
    workbookXml += `    <sheet name="${escapeXml(s.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>\n`;
  });
  workbookXml += `  </sheets>
</workbook>`;

  const zipFiles: ZipFileItem[] = [
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: rootRelsXml },
    { name: 'xl/_rels/workbook.xml.rels', data: wbRelsXml },
    { name: 'xl/workbook.xml', data: workbookXml },
    { name: 'xl/styles.xml', data: STYLES_XML },
  ];

  sheets.forEach((s) => {
    zipFiles.push({ name: `xl/worksheets/${s.filename}`, data: s.content });
  });

  return createZip(zipFiles);
}

/**
 * Triggers a browser download of the multi-sheet Excel .xlsx file.
 */
export function downloadMultiSheetExcel(
  dataOrFilename: MultiSheetReportData | string,
  maybeData?: MultiSheetReportData
) {
  let xlsxBytes: Uint8Array;
  let filename: string;

  if (typeof dataOrFilename === 'object') {
    xlsxBytes = generateMultiSheetXlsx(dataOrFilename);
    const cleanProj = (dataOrFilename.projectCode || dataOrFilename.projectName || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
    const typeLabel = dataOrFilename.billType && dataOrFilename.billType !== 'all'
      ? dataOrFilename.billType.toUpperCase() + '_Report'
      : 'Weekly_Billing_Package';
    filename = `${typeLabel}_${cleanProj}_${dataOrFilename.startDate}_to_${dataOrFilename.endDate}.xlsx`;
  } else {
    filename = dataOrFilename.endsWith('.xlsx')
      ? dataOrFilename
      : `${dataOrFilename.replace(/\.xls$|\.csv$/, '')}.xlsx`;
    xlsxBytes = maybeData ? generateMultiSheetXlsx(maybeData) : new Uint8Array(0);
  }

  const blob = new Blob([xlsxBytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
