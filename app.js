/**
 * PYQ Portal — Shared Application Logic
 * =========================================
 * Handles: localStorage CRUD, base64 utilities,
 *          card HTML builder, toast notifications.
 */

const STORAGE_KEY = 'pyq_papers';

// ── STORAGE HELPERS ──────────────────────────────────────────

/** Return all saved papers as an array */
function getPapers() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

/** Save a new paper object */
function savePaper(paper) {
    const papers = getPapers();
    papers.push(paper);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
    } catch (e) {
        // Storage quota exceeded — strip file data and warn
        throw new Error('Storage quota exceeded. Try a smaller file.');
    }
}

// ── FILE UTILITIES ────────────────────────────────────────────

/** Convert a File to a base64 data-URL string */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/** Convert a base64 data-URL back to a Blob for object URLs */
function base64ToBlob(dataUrl, mimeType) {
    const [, base64] = dataUrl.split(',');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType || 'application/octet-stream' });
}

// ── CARD BUILDER ──────────────────────────────────────────────

/**
 * Build HTML markup for a paper card.
 * Clicking the card navigates to viewer.html?id=<paper.id>
 */
function buildPaperCard(paper) {
    const date = paper.uploadedAt
        ? new Date(paper.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
    const hasKey = paper.akData ? '<span class="badge badge-green">🔑 Answer Key</span>' : '';
    const desc = paper.description
        ? `<p class="paper-card-desc">${escapeHtml(paper.description)}</p>` : '';

    return `
  <div class="paper-card" onclick="window.location.href='viewer.html?id=${paper.id}'">
    <div class="paper-card-header">
      <div>
        <div class="paper-card-title">${escapeHtml(paper.subject)} — ${escapeHtml(paper.examName)}</div>
      </div>
      <span class="badge badge-cyan">${escapeHtml(paper.year || '')}</span>
    </div>
    <div class="paper-card-body">
      <div class="paper-card-meta">
        <span class="badge badge-blue">${escapeHtml(paper.subject)}</span>
        ${paper.board ? `<span class="badge badge-purple">${escapeHtml(paper.board)}</span>` : ''}
        ${hasKey}
      </div>
      ${desc}
    </div>
    <div class="paper-card-footer">
      <span class="paper-card-date">📅 ${date}</span>
      <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.location.href='viewer.html?id=${paper.id}'">View →</button>
    </div>
  </div>`;
}

// ── TOAST ─────────────────────────────────────────────────────

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'info') {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

// ── UTILITIES ─────────────────────────────────────────────────

/** Escape HTML to prevent XSS when inserting user content into markup */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
