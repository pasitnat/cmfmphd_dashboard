let STUDENTS = [];
let sortKey = null;
let sortAsc = true;
let charts = [];

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

// ---- Rendering ----

function badge(value) {
  const v = (value || '').toLowerCase();
  let cls = 'delayed';
  if (v.includes('on track') || v.includes('passed') || v.includes('approved') || v === 'closed') cls = 'ontrack';
  else if (v.includes('at risk') || v.includes('not yet')) cls = 'atrisk';
  else if (v.includes('delayed')) cls = 'delayed';
  return `<span class="badge ${cls}">${value}</span>`;
}

function riskClass(risk) {
  return risk === 'On Track' ? 'ontrack' : 'atrisk';
}

function count(arr, pred) {
  return arr.filter(pred).length;
}

function renderStats() {
  const total = STUDENTS.length;
  const onTrack = count(STUDENTS, s => s.risk === 'On Track');
  const atRisk = count(STUDENTS, s => s.risk === 'At Risk');
  const active = count(STUDENTS, s => s.status === 'Active');
  const extension = count(STUDENTS, s => s.status === 'Extension');
  const totalPubs = STUDENTS.reduce((sum, s) => sum + s.publications, 0);

  const cards = [
    { label: 'Total Students', value: total, color: 'var(--accent)' },
    { label: 'On Track', value: onTrack, color: 'var(--green)' },
    { label: 'At Risk', value: atRisk, color: 'var(--red)' },
    { label: 'Active', value: active, color: 'var(--text)' },
    { label: 'Extension', value: extension, color: 'var(--amber)' },
    { label: 'Total Publications', value: totalPubs, color: 'var(--accent)' },
  ];

  document.getElementById('stats').innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="value" style="color:${c.color}">${c.value}</div>
      <div class="label">${c.label}</div>
    </div>
  `).join('');
}

function renderCharts() {
  charts.forEach(c => c.destroy());
  charts = [];

  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = '#334155';

  // Risk chart
  const riskCounts = {};
  STUDENTS.forEach(s => riskCounts[s.risk] = (riskCounts[s.risk] || 0) + 1);
  charts.push(new Chart(document.getElementById('riskChart'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(riskCounts),
      datasets: [{ data: Object.values(riskCounts), backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#a78bfa'] }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  }));

  // Year chart
  const years = [...new Set(STUDENTS.map(s => s.year))].sort((a, b) => a - b);
  const yearCounts = years.map(y => count(STUDENTS, s => s.year === y));
  charts.push(new Chart(document.getElementById('yearChart'), {
    type: 'bar',
    data: {
      labels: years.map(y => `Year ${y}`),
      datasets: [{ label: 'Students', data: yearCounts, backgroundColor: '#38bdf8' }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  }));

  // Milestone progress chart
  const milestones = ['qe', 'proposal', 'thesisDefense'];
  const labels = ['QE', 'Proposal', 'Thesis Defense'];
  const passed = milestones.map(m => count(STUDENTS, s => s[m] === 'Passed'));
  const onTrack = milestones.map(m => count(STUDENTS, s => s[m] === 'On Track'));
  const delayed = milestones.map(m => count(STUDENTS, s => s[m] === 'Delayed'));
  charts.push(new Chart(document.getElementById('milestoneChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Passed', data: passed, backgroundColor: '#22c55e' },
        { label: 'On Track', data: onTrack, backgroundColor: '#38bdf8' },
        { label: 'Delayed', data: delayed, backgroundColor: '#f59e0b' },
      ]
    },
    options: { plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } }
  }));

  // Status chart
  const statusCounts = {};
  STUDENTS.forEach(s => statusCounts[s.status] = (statusCounts[s.status] || 0) + 1);
  charts.push(new Chart(document.getElementById('statusChart'), {
    type: 'pie',
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#38bdf8', '#f59e0b', '#a78bfa', '#22c55e'] }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  }));
}

function getFilteredData() {
  const search = document.getElementById('searchBox').value.trim().toLowerCase();
  const riskFilter = document.getElementById('riskFilter').value;
  const yearFilter = document.getElementById('yearFilter').value;

  let data = STUDENTS.filter(s => {
    if (riskFilter && s.risk !== riskFilter) return false;
    if (yearFilter && String(s.year) !== yearFilter) return false;
    if (search) {
      const hay = `${s.id} ${s.name} ${s.advisor}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  if (sortKey) {
    data = [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }
  return data;
}

function renderTable() {
  const data = getFilteredData();
  document.getElementById('tableBody').innerHTML = data.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${s.year}</td>
      <td>${s.status}</td>
      <td>${s.advisor}</td>
      <td>${badge(s.qe)}</td>
      <td>${badge(s.proposal)}</td>
      <td>${badge(s.thesisDefense)}</td>
      <td>${badge(s.english)}</td>
      <td>${s.publications}</td>
      <td><span class="badge ${riskClass(s.risk)}">${s.risk}</span></td>
    </tr>
  `).join('');
  document.getElementById('count').textContent = data.length;
}

function setupFilters() {
  const yearFilter = document.getElementById('yearFilter');
  yearFilter.innerHTML = '<option value="">All Years</option>';
  const years = [...new Set(STUDENTS.map(s => s.year))].sort((a, b) => a - b);
  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = `Year ${y}`;
    yearFilter.appendChild(opt);
  });

  const riskFilter = document.getElementById('riskFilter');
  riskFilter.innerHTML = '<option value="">All Risk Statuses</option>';
  [...new Set(STUDENTS.map(s => s.risk))].sort().forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    riskFilter.appendChild(opt);
  });

  document.getElementById('searchBox').value = '';
  sortKey = null;
  sortAsc = true;

  document.getElementById('searchBox').addEventListener('input', renderTable);
  riskFilter.addEventListener('change', renderTable);
  yearFilter.addEventListener('change', renderTable);

  document.querySelectorAll('#studentTable th[data-key]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.key;
      if (sortKey === key) sortAsc = !sortAsc;
      else { sortKey = key; sortAsc = true; }
      renderTable();
    });
  });
}

function renderDashboard(students) {
  STUDENTS = students;
  document.getElementById('uploadScreen').hidden = true;
  document.getElementById('dashboard').hidden = false;
  renderStats();
  renderCharts();
  setupFilters();
  renderTable();
}

// ---- Upload handling ----

function showUploadError(message) {
  document.getElementById('uploadError').textContent = message;
}

function handleFile(file) {
  if (!file) return;
  showUploadError('');
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const students = csvToStudents(reader.result);
      renderDashboard(students);
    } catch (err) {
      showUploadError(err.message || 'Failed to parse the CSV file.');
    }
  };
  reader.onerror = () => showUploadError('Could not read the file.');
  reader.readAsText(file, 'utf-8');
}

function setupUpload() {
  const dropzone = document.getElementById('dropzone');
  const input = document.getElementById('csvInput');
  const changeFileBtn = document.getElementById('changeFileBtn');

  input.addEventListener('change', () => handleFile(input.files[0]));

  ['dragenter', 'dragover'].forEach(evt =>
    dropzone.addEventListener(evt, e => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    })
  );
  dropzone.addEventListener('drop', e => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  });

  changeFileBtn.addEventListener('click', () => {
    document.getElementById('dashboard').hidden = true;
    document.getElementById('uploadScreen').hidden = false;
    showUploadError('');
    input.value = '';
  });
}

setupUpload();
