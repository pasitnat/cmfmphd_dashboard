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
      saveStudents(students);
      window.location.href = 'dashboard.html';
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
}

setupUpload();
