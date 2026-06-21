// ============================================================
// Estado global da aplicação
// ============================================================
let allReleases = [];
let filteredReleases = [];
let selectedRelease = null;
let currentCategory = 'all';
let keyboardFocusIndex = -1; // índice do card com foco pelo teclado

// ============================================================
// Elementos do DOM
// ============================================================
const btnRefresh = document.getElementById('btn-refresh');
const btnExportCsv = document.getElementById('btn-export-csv');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const inputSearch = document.getElementById('input-search');
const releasesList = document.getElementById('releases-list');
const countBadge = document.getElementById('releases-count');
const categoryFiltersContainer = document.getElementById('category-filters');
const toastContainer = document.getElementById('toast-container');
const detailsPlaceholder = document.getElementById('details-placeholder');
const detailsContent = document.getElementById('details-content');
const detailDate = document.getElementById('detail-date');
const detailOriginalLink = document.getElementById('detail-original-link');
const detailTitle = document.getElementById('detail-title');
const detailBody = document.getElementById('detail-body');
const btnShareTwitter = document.getElementById('btn-share-twitter');
const btnToggleExpand = document.getElementById('btn-toggle-expand');
const mainContentGrid = document.querySelector('.app-main-content');

// ============================================================
// Inicialização
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchReleases();

    btnRefresh.addEventListener('click', fetchReleases);
    btnExportCsv.addEventListener('click', exportToCsv);
    btnThemeToggle.addEventListener('click', toggleTheme);
    inputSearch.addEventListener('input', () => { keyboardFocusIndex = -1; filterAndRender(); });
    btnShareTwitter.addEventListener('click', shareOnTwitter);
    btnToggleExpand.addEventListener('click', toggleReaderMode);
    setupCategoryFilters();

    // 5. Navegação por Teclado
    document.addEventListener('keydown', handleKeyboardNavigation);
});

// ============================================================
// 1. TEMA (Light / Dark)
// ============================================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.className = 'fa-solid fa-sun';
    } else {
        document.body.classList.remove('light-theme');
        themeIcon.className = 'fa-solid fa-moon';
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    if (isLight) {
        localStorage.setItem('theme', 'light');
        themeIcon.className = 'fa-solid fa-sun';
        showToast("Modo Claro ativado", "success");
    } else {
        localStorage.setItem('theme', 'dark');
        themeIcon.className = 'fa-solid fa-moon';
        showToast("Modo Escuro ativado", "success");
    }
}

// ============================================================
// 2. PILLS DE CATEGORIA
// ============================================================
function setupCategoryFilters() {
    const pills = categoryFiltersContainer.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.getAttribute('data-category');
            keyboardFocusIndex = -1;
            filterAndRender();
        });
    });
}

// ============================================================
// 3. MODO DE LEITURA FOCADA
// ============================================================
function toggleReaderMode() {
    const isReader = mainContentGrid.classList.toggle('reader-mode');
    const icon = btnToggleExpand.querySelector('i');
    if (isReader) {
        icon.className = 'fa-solid fa-compress';
        btnToggleExpand.setAttribute('data-tooltip', 'Recolher Leitura');
        showToast("Modo de Foco ativado", "success");
    } else {
        icon.className = 'fa-solid fa-expand';
        btnToggleExpand.setAttribute('data-tooltip', 'Modo de Foco');
    }
}

// ============================================================
// 4. TOASTS
// ============================================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconClass = type === 'success'
        ? 'fa-solid fa-circle-check success-icon'
        : 'fa-solid fa-circle-xmark error-icon';
    toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// ============================================================
// 5. NAVEGAÇÃO POR TECLADO
// ============================================================
function handleKeyboardNavigation(e) {
    const cards = releasesList.querySelectorAll('.release-card');
    if (!cards.length) return;

    // Esc limpa o campo de busca
    if (e.key === 'Escape') {
        inputSearch.value = '';
        keyboardFocusIndex = -1;
        filterAndRender();
        inputSearch.focus();
        return;
    }

    // Setas só funcionam fora do campo de busca
    if (document.activeElement === inputSearch) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        keyboardFocusIndex = Math.min(keyboardFocusIndex + 1, cards.length - 1);
        updateKeyboardFocus(cards);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        keyboardFocusIndex = Math.max(keyboardFocusIndex - 1, 0);
        updateKeyboardFocus(cards);
    } else if (e.key === 'Enter' && keyboardFocusIndex >= 0) {
        e.preventDefault();
        const release = filteredReleases[keyboardFocusIndex];
        if (release) selectRelease(release, cards[keyboardFocusIndex]);
    }
}

function updateKeyboardFocus(cards) {
    cards.forEach(c => c.classList.remove('keyboard-focus'));
    if (keyboardFocusIndex >= 0 && cards[keyboardFocusIndex]) {
        const card = cards[keyboardFocusIndex];
        card.classList.add('keyboard-focus');
        card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

// ============================================================
// 6. BUSCA E FILTRAGEM
// ============================================================
async function fetchReleases() {
    try {
        setLoadingState(true);
        const response = await fetch('/api/releases');
        if (!response.ok) throw new Error('Não foi possível conectar com o servidor do feed.');
        const result = await response.json();

        if (result.status === 'success') {
            allReleases = result.data;
            const previouslySelectedId = selectedRelease ? selectedRelease.id : null;
            filterAndRender();

            if (filteredReleases.length > 0) {
                const stillExists = filteredReleases.find(r => previouslySelectedId && r.id === previouslySelectedId);
                if (stillExists) {
                    const cards = releasesList.querySelectorAll('.release-card');
                    const index = filteredReleases.findIndex(r => r.id === previouslySelectedId);
                    if (index !== -1 && cards[index]) selectRelease(stillExists, cards[index]);
                } else {
                    const firstCard = releasesList.querySelector('.release-card');
                    selectRelease(filteredReleases[0], firstCard);
                }
            } else {
                showEmptyState("Nenhuma nota de versão encontrada.", false);
            }
            showToast("Notas de versão atualizadas!", "success");
        } else {
            throw new Error(result.message || 'Erro ao carregar dados.');
        }
    } catch (error) {
        console.error('Erro:', error);
        showEmptyState(error.message, true);
        showToast(error.message, "error");
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(isLoading) {
    if (isLoading) {
        btnRefresh.classList.add('loading');
        btnRefresh.disabled = true;
        btnExportCsv.disabled = true;
        releasesList.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>`;
    } else {
        btnRefresh.classList.remove('loading');
        btnRefresh.disabled = false;
        btnExportCsv.disabled = false;
    }
}

function filterAndRender() {
    const query = inputSearch.value.toLowerCase().trim();

    filteredReleases = allReleases.filter(release => {
        const tags = detectTags(release.content).map(t => t.toLowerCase());
        const categoryMatch = currentCategory === 'all' || tags.includes(currentCategory);

        const titleMatch = release.title.toLowerCase().includes(query);
        const tagMatch = tags.join(' ').includes(query);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = release.content;
        const contentMatch = tempDiv.textContent.toLowerCase().includes(query);
        const searchMatch = !query || titleMatch || tagMatch || contentMatch;

        return categoryMatch && searchMatch;
    });

    renderReleases(filteredReleases, query);
}

// ============================================================
// 7. RENDERIZAÇÃO DOS CARDS (com Search Highlighter)
// ============================================================
function highlightText(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>');
}

function renderReleases(releases, query = '') {
    releasesList.innerHTML = '';
    countBadge.textContent = `${releases.length} nota${releases.length !== 1 ? 's' : ''}`;

    if (releases.length === 0) {
        releasesList.innerHTML = `
            <div class="no-results">
                <i class="fa-solid fa-magnifying-glass-minus"></i>
                <p>Nenhuma nota corresponde ao filtro aplicado.</p>
            </div>`;
        return;
    }

    releases.forEach((release) => {
        const card = document.createElement('div');
        card.className = 'release-card';
        card.setAttribute('tabindex', '0');
        if (selectedRelease && selectedRelease.id === release.id) card.classList.add('active');

        const tags = detectTags(release.content);
        const tagsHtml = tags.map(tag =>
            `<span class="tag ${tag.toLowerCase()}" data-tooltip="${tagTooltip(tag)}">${tag}</span>`
        ).join(' ');

        // Pré-visualização com destaque de busca
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = release.content;
        const cleanText = (tempDiv.textContent || tempDiv.innerText || '').slice(0, 200);
        const highlightedTitle = highlightText(release.title, query);
        const highlightedPreview = highlightText(cleanText, query);

        card.innerHTML = `
            <div class="card-header">
                <span class="card-date">${highlightedTitle}</span>
                <div class="card-tags-area">
                    <div class="card-tags">${tagsHtml}</div>
                    <button class="btn-copy-card" data-tooltip="Copiar nota" data-id="${release.id}">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="card-preview">${highlightedPreview}</div>`;

        card.querySelector('.btn-copy-card').addEventListener('click', e => {
            e.stopPropagation();
            copyCardToClipboard(release, card.querySelector('.btn-copy-card'));
        });
        card.addEventListener('click', () => selectRelease(release, card));
        releasesList.appendChild(card);
    });
}

function tagTooltip(tag) {
    const map = {
        'Feature': 'Nova funcionalidade disponível',
        'Announcement': 'Comunicado ou aviso importante',
        'Change': 'Alteração em comportamento existente',
        'Issue': 'Problema conhecido ou corrigido',
        'Breaking': 'Mudança que pode quebrar integrações existentes'
    };
    return map[tag] || tag;
}

// ============================================================
// 8. COPIAR PARA A ÁREA DE TRANSFERÊNCIA
// ============================================================
async function copyCardToClipboard(release, btnElement) {
    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = release.content;
        const cleanText = tempDiv.textContent || tempDiv.innerText || '';
        const tags = detectTags(release.content).join(', ');
        const formattedText =
            `BigQuery Release Note - ${release.title}\n` +
            `Categorias: ${tags}\n` +
            `Link Oficial: ${release.link || 'N/A'}\n\n` +
            `Novidade:\n${cleanText}`;

        await navigator.clipboard.writeText(formattedText);
        btnElement.classList.add('copied');
        const icon = btnElement.querySelector('i');
        icon.className = 'fa-solid fa-check';
        showToast("Nota de versão copiada!", "success");
        setTimeout(() => {
            btnElement.classList.remove('copied');
            icon.className = 'fa-regular fa-copy';
        }, 1500);
    } catch (err) {
        showToast('Não foi possível copiar para a área de transferência.', 'error');
    }
}

// ============================================================
// 9. EXPORTAR CSV
// ============================================================
function exportToCsv() {
    if (filteredReleases.length === 0) {
        showToast("Não há notas de versão para exportar.", "error");
        return;
    }
    let csvContent = "\uFEFF\"Data\",\"Link\",\"Categorias\",\"Conteudo\"\r\n";
    filteredReleases.forEach(release => {
        const data = release.title.replace(/"/g, '""');
        const link = (release.link || '').replace(/"/g, '""');
        const categorias = detectTags(release.content).join(', ').replace(/"/g, '""');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = release.content;
        const conteudo = (tempDiv.textContent || '').trim().replace(/"/g, '""');
        csvContent += `"${data}","${link}","${categorias}","${conteudo}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().split('T')[0]}.csv`);
    a.style.visibility = 'hidden';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Arquivo CSV baixado!", "success");
}

// ============================================================
// 10. DETECTAR TAGS / CATEGORIAS
// ============================================================
function detectTags(htmlContent) {
    const tags = [];
    const lc = htmlContent.toLowerCase();
    if (lc.includes('<h3>feature</h3>')) tags.push('Feature');
    if (lc.includes('<h3>announcement</h3>')) tags.push('Announcement');
    if (lc.includes('<h3>change</h3>')) tags.push('Change');
    if (lc.includes('<h3>issue</h3>')) tags.push('Issue');
    if (lc.includes('<h3>breaking</h3>')) tags.push('Breaking');
    if (tags.length === 0) {
        if (lc.includes('feature')) tags.push('Feature');
        else if (lc.includes('announcement')) tags.push('Announcement');
        else tags.push('Change');
    }
    return tags;
}

// ============================================================
// 11. SELECIONAR NOTA / DETALHAR
// ============================================================
function selectRelease(release, cardElement) {
    selectedRelease = release;
    releasesList.querySelectorAll('.release-card').forEach(c => c.classList.remove('active', 'keyboard-focus'));
    if (cardElement) cardElement.classList.add('active');

    detailsPlaceholder.classList.add('hidden');
    detailsContent.classList.remove('hidden');

    const query = inputSearch.value.trim();
    detailDate.textContent = release.title;
    detailTitle.textContent = `Atualização de ${release.title}`;

    if (release.link) {
        detailOriginalLink.href = release.link;
        detailOriginalLink.style.display = 'inline-flex';
    } else {
        detailOriginalLink.style.display = 'none';
    }

    // 6. Search Highlighter no painel de detalhes
    if (query) {
        const highlighted = highlightText(release.content, query);
        detailBody.innerHTML = highlighted;
    } else {
        detailBody.innerHTML = release.content;
    }

    detailBody.querySelectorAll('a').forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
}

// ============================================================
// 12. ESTADO DE ERRO com Retry Button
// ============================================================
function showEmptyState(message, showRetry = false) {
    releasesList.innerHTML = '';
    countBadge.textContent = '0 notas';
    detailsContent.classList.add('hidden');
    detailsPlaceholder.classList.remove('hidden');

    const placeholderTitle = detailsPlaceholder.querySelector('h3');
    const placeholderText = detailsPlaceholder.querySelector('p');

    if (showRetry) {
        detailsPlaceholder.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-triangle-exclamation error-state-icon"></i>
                <h4>Falha ao carregar as notas</h4>
                <p>${message}</p>
                <button class="btn-retry" id="btn-retry-fetch">
                    <i class="fa-solid fa-rotate-right"></i>
                    Tentar Novamente
                </button>
            </div>`;
        document.getElementById('btn-retry-fetch').addEventListener('click', fetchReleases);
    } else {
        placeholderTitle.textContent = "Nenhum resultado";
        placeholderText.textContent = message;
    }
}

// Compartilha no X (Twitter)
function shareOnTwitter() {
    if (!selectedRelease) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = selectedRelease.content;
    let cleanText = (tempDiv.textContent || '').slice(0, 140) + '...';
    const text = `Novidade no Google BigQuery (${selectedRelease.title}):\n"${cleanText}"\n\n#BigQuery #GoogleCloud #DataEngineering`;
    const url = selectedRelease.link || 'https://docs.cloud.google.com/bigquery/docs/release-notes';
    window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        '_blank', 'width=550,height=420,toolbar=0,menubar=0,location=0,status=0'
    );
}
