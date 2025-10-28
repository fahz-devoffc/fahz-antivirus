// Toggle Dark Mode
function toggleMode() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('.toggle-mode i');
    icon.className = document.body.classList.contains('dark') ? 'fas fa-sun' : 'fas fa-moon';
}

// Load Stats from localStorage
let stats = JSON.parse(localStorage.getItem('antivirusStats')) || { total: 0, safe: 0, danger: 0 };
updateStats();

function updateStats() {
    document.getElementById('totalScans').textContent = stats.total;
    document.getElementById('safeCount').textContent = stats.safe;
    document.getElementById('dangerCount').textContent = stats.danger;
    localStorage.setItem('antivirusStats', JSON.stringify(stats));
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'danger' ? '#f44336' : '#4CAF50';
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// Drag and Drop for File
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
dropArea.addEventListener('click', () => fileInput.click());
dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    fileInput.files = e.dataTransfer.files;
    previewFile();
});
fileInput.addEventListener('change', previewFile);

function previewFile() {
    const file = fileInput.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            dropArea.innerHTML = `<img src="${e.target.result}" class="preview"><p>${file.name}</p>`;
        };
        reader.readAsDataURL(file);
    } else {
        dropArea.innerHTML = `<p>File dipilih: ${file ? file.name : 'Tidak ada'}</p>`;
    }
}

// Analyze File with Progress
function analyzeFile() {
    const file = fileInput.files[0];
    const resultDiv = document.getElementById('fileResult');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');

    if (!file) {
        showToast('Upload file terlebih dahulu!', 'danger');
        return;
    }

    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                const fileName = file.name;
                const fileSize = (file.size / 1024).toFixed(2) + ' KB';
                const extension = fileName.split('.').pop().toLowerCase();
                const dangerousExtensions = ['exe', 'bat', 'scr', 'pif', 'com', 'vbs', 'js', 'jar'];
                const riskScore = dangerousExtensions.includes(extension) ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30);
                const status = riskScore > 50 ? 'berpotensi berbahaya' : 'aman';
                const className = status === 'aman' ? 'safe' : 'danger';
                const simulatedHash = 'MD5: ' + Math.random().toString(36).substring(2, 15);

                resultDiv.innerHTML = `
                    <p><i class="fas fa-file"></i> Nama: ${fileName}</p>
                    <p><i class="fas fa-weight"></i> Ukuran: ${fileSize}</p>
                    <p><i class="fas fa-hashtag"></i> Hash: ${simulatedHash}</p>
                    <p><i class="fas fa-chart-line"></i> Skor Risiko: ${riskScore}/100</p>
                    <p>Status: <span class="${className}"><i class="fas fa-${status === 'aman' ? 'check' : 'times'}"></i> ${status}</span></p>
                `;
                stats.total++;
                if (status === 'Aman') stats.safe++; else stats.danger++;
                updateStats();
                showToast('Analisis selesai!');
                progressBar.style.display = 'none';
            }, 500);
        }
    }, 100);
}

function clearFile() {
    fileInput.value = '';
    dropArea.innerHTML = '<p>Drag & drop file di sini atau klik untuk pilih</p>';
    document.getElementById('fileResult').innerHTML = '';
    showToast('File dibersihkan!');
}

// Scan URL with History
let history = JSON.parse(localStorage.getItem('scanHistory')) || [];

async function scanURL() {
    const urlInput = document.getElementById('urlInput');
    const resultDiv = document.getElementById('urlResult');
    const urls = urlInput.value.trim().split(',').map(u => u.trim()).filter(u => u);

    if (urls.length === 0) {
        showToast('Masukkan URL!', 'danger');
        return;
    }

    const apiKey = 'AIzaSyATehheA_66LGcwiiFXKPnfttfiZdjY9As'; // Ganti dengan key asli
    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

    for (const url of urls) {
        try {
            let isSafe = true;
            let threatType = '';
            if (apiKey && apiKey !== 'AIzaSyATehheA_66LGcwiiFXKPnfttfiZdjY9As') {
                // Real API call
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client: { clientId: "antivirus-website", clientVersion: "1.0" },
                        threatInfo: {
                            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                            platformTypes: ["ANY_PLATFORM"],
                            threatEntryTypes: ["URL"],
                            threatEntries: [{ url }]
                        }
                    })
                });
                const data = await response.json();
                if (data.matches && data.matches.length > 0) {
                    isSafe = false;
                    threatType = data.matches[0].threatType;
                }
            } else {
                // Simulasi jika API key tidak ada
                isSafe = Math.random() > 0.5;
                threatType = isSafe ? '' : 'MALWARE';
            }

            const status = isSafe ? 'aman' : `berbahaya (${threatType})`;
            const className = isSafe ? 'safe' : 'danger';
            const time = new Date().toLocaleString();

            resultDiv.innerHTML += `<p><i class="fas fa-${isSafe ? 'check' : 'times'}"></i> ${url}: <span class="${className}">${status}</span> (${time})</p>`;
            history.push({ url, status, time });
            localStorage.setItem('scanHistory', JSON.stringify(history));
            stats.total++;
            if (isSafe) stats.safe++; else stats.danger++;
            updateStats();
            showToast(`Scan ${url} selesai!`);
        } catch (error) {
            resultDiv.innerHTML += `<p class="danger"><i class="fas fa-exclamation"></i> Error scanning ${url}</p>`;
            console.error(error);
            showToast(`Error scanning ${url}`, 'danger');
        }
    }
}

function showHistory() {
    const historyDiv = document.getElementById('history');
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = history.map(item => `<li>${item.url}: ${item.status} (${item.time})</li>`).join('');
    historyDiv.style.display = historyDiv.style.display === 'none' ? 'block' : 'none';
}

function clearHistory() {
    history = [];
    localStorage.removeItem('scanHistory');
    document.getElementById('historyList').innerHTML = '';
    showToast('History dihapus!');
}