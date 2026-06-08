let STUDENTS = [];
let sortKey = null;
let sortAsc = true;
let charts = [];

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

function init() {
  const students = loadStudents();
  if (!students) {
    window.location.href = 'index.html';
    return;
  }
  STUDENTS = students;
  renderStats();
  renderCharts();
  setupFilters();
  renderTable();

  document.getElementById('changeFileBtn').addEventListener('click', () => {
    clearStudents();
    window.location.href = 'index.html';
  });
}

init();
