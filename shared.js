const STORAGE_KEY = 'milestoneStudents';

function saveStudents(students) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function loadStudents() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) && data.length ? data : null;
  } catch {
    return null;
  }
}

function clearStudents() {
  sessionStorage.removeItem(STORAGE_KEY);
}

// ---- CSV parsing ----

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function cleanName(raw) {
  // Strip trailing "(https://notion.so/...)" links from names
  return (raw || '').replace(/\s*\(https?:\/\/[^)]*\)\s*$/i, '').trim();
}

function cleanRisk(raw) {
  // Strip leading emoji/symbols, keep "On Track" / "At Risk" text
  const v = (raw || '').trim();
  if (/at risk/i.test(v)) return 'At Risk';
  if (/on track/i.test(v)) return 'On Track';
  return v.replace(/^[^\w]+/, '').trim();
}

const HEADER_ALIASES = {
  'ids': 'id',
  'students': 'name',
  'year': 'year',
  'student status': 'status',
  'advisors': 'advisor',
  'qe status': 'qe',
  'proposal defense status': 'proposal',
  'thesis defense status': 'thesisDefense',
  'thesis submission': 'thesisSubmission',
  'english requirement': 'english',
  'ec approval': 'ec',
  'publications': 'publications',
  'risk status': 'risk',
};

function csvToStudents(text) {
  const rows = parseCSV(text).filter(r => r.some(cell => cell.trim() !== ''));
  if (!rows.length) throw new Error('The file appears to be empty.');

  const header = rows[0].map(h => h.trim().toLowerCase());
  const keyForCol = header.map(h => HEADER_ALIASES[h] || null);

  if (!keyForCol.includes('id') || !keyForCol.includes('name')) {
    throw new Error('Could not find expected columns (e.g. "IDs", "Students"). Please check the CSV format.');
  }

  const students = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    const rec = {};
    keyForCol.forEach((key, idx) => {
      if (key) rec[key] = (cells[idx] || '').trim();
    });
    if (!rec.id && !rec.name) continue;

    students.push({
      id: rec.id || '',
      name: cleanName(rec.name),
      year: parseInt(rec.year, 10) || 0,
      status: rec.status || '',
      advisor: rec.advisor || '',
      qe: rec.qe || '',
      proposal: rec.proposal || '',
      thesisDefense: rec.thesisDefense || '',
      thesisSubmission: rec.thesisSubmission || '',
      english: rec.english || '',
      ec: rec.ec || '',
      publications: parseInt(rec.publications, 10) || 0,
      risk: cleanRisk(rec.risk),
    });
  }

  if (!students.length) throw new Error('No student rows were found in the file.');
  return students;
}
