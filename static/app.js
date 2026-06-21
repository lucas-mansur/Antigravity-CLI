// Estado global da aplicação
let allReleases = [];
let filteredReleases = []; // Guarda a lista que está sendo exibida no momento
let selectedRelease = null;
let currentCategory = 'all'; // Categoria ativa de filtro rápido

// Elementos do DOM
const btnRefresh = document.getElementById('btn-refresh');
const refreshIcon = document.getElementById('refresh-icon');
const btnExportCsv = document.getElementById('btn-export-csv');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const inputSearch = document.getElementById('input-search');
const releasesList = document.getElementById('releases-list');
const countBadge = document.getElementById('releases-count');
const categoryFiltersContainer = document.getElementById('category-filters');
const toastContainer = document.getElementById('toast-container');

// Elementos de Detalhes
const detailsPlaceholder = document.getElementById('details-placeholder');
const detailsContent = document.getElementById('details-content');
const detailDate = document.getElementById('detail-date');
const detailOriginalLink = document.getElementById('detail-original-link');
const detailTitle = document.getElementById('detail-title');
const detailBody = document.getElementById('detail-body');
const btnShareTwitter = document.getElementById('btn-share-twitter');
const btnToggleExpand = document.getElementById('btn-toggle-expand');
const mainContentGrid = document.querySelector('.app-main-content');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Carrega o tema salvo no localStorage
    initTheme();
    
    fetchReleases();

    // Event listeners globais
    btnRefresh.addEventListener('click', fetchReleases);
    btnExportCsv.addEventListener('click', exportToCsv);
    btnThemeToggle.addEventListener('click', toggleTheme);
    inputSearch.addEventListener('input', () => filterAndRender());
    btnShareTwitter.addEventListener('click', shareOnTwitter);
    btnToggleExpand.addEventListener('click', toggleReaderMode);

    // Event listener para as Pills de Categorias
    setupCategoryFilters();
});

// Inicializa o tema padrão do usuário
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

// Alterna entre os temas claro e escuro
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

// Configura os botões de pílula de categorias
function setupCategoryFilters() {
    const pills = categoryFiltersContainer.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            currentCategory = pill.getAttribute('data-category');
            filterAndRender();
        });
    });
}

// Alterna o visualizador para o Modo Leitura Focada (Reader Mode)
function toggleReaderMode() {
    const isReader = mainContentGrid.classList.toggle('reader-mode');
    const icon = btnToggleExpand.querySelector('i');
    
    if (isReader) {
        icon.className = 'fa-solid fa-compress';
        btnToggleExpand.setAttribute('title', 'Recolher Leitura');
        showToast("Modo de Foco ativado", "success");
    } else {
        icon.className = 'fa-solid fa-expand';
        btnToggleExpand.setAttribute('title', 'Expandir Leitura');
    }
}

// Exibe notificações Toast modernas na interface
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconClass = type === 'success' ? 'fa-solid fa-circle-check success-icon' : 'fa-solid fa-circle-xmark error-icon';
    
    toast.innerHTML = `
        <i class="${iconClass}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animação de saída e remoção automática após 3 segundos
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// Busca as notas de versão do backend
async function fetchReleases() {
    try {
        setLoadingState(true);
        
        const response = await fetch('/api/releases');
        if (!response.ok) throw new Error('Não foi possível conectar com o servidor do feed.');
        
        const result = await response.json();
        
        if (result.status === 'success') {
            allReleases = result.data;
            
            // Guarda qual estava selecionado antes de atualizar para manter o estado
            const previouslySelectedId = selectedRelease ? selectedRelease.id : null;
            
            filterAndRender();
            
            // Tenta preservar a seleção do card após atualização
            if (filteredReleases.length > 0) {
                const stillExists = filteredReleases.find(r => previouslySelectedId && r.id === previouslySelectedId);
                if (stillExists) {
                    // Re-seleciona o mesmo card no DOM
                    const cards = releasesList.querySelectorAll('.release-card');
                    const index = filteredReleases.findIndex(r => r.id === previouslySelectedId);
                    if (index !== -1 && cards[index]) {
                        selectRelease(stillExists, cards[index]);
                    }
                } else {
                    // Seleciona o primeiro
                    const firstCard = releasesList.querySelector('.release-card');
                    selectRelease(filteredReleases[0], firstCard);
                }
            } else {
                showEmptyState("Nenhuma nota de versão encontrada.");
            }
            
            showToast("Notas de versão atualizadas!", "success");
        } else {
            throw new Error(result.message || 'Erro ao carregar dados.');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        showEmptyState(`Erro: ${error.message}`);
        showToast(error.message, "error");
    } finally {
        setLoadingState(false);
    }
}

// Configura o estado de carregamento na interface
function setLoadingState(isLoading) {
    if (isLoading) {
        btnRefresh.classList.add('loading');
        btnRefresh.disabled = true;
        btnExportCsv.disabled = true;
        
        // Exibe skeletons na lista
        releasesList.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        `;
    } else {
        btnRefresh.classList.remove('loading');
        btnRefresh.disabled = false;
        btnExportCsv.disabled = false;
    }
}

// Executa o filtro de buscas e de pílulas de categorias, e atualiza a interface
function filterAndRender() {
    const query = inputSearch.value.toLowerCase().trim();
    
    filteredReleases = allReleases.filter(release => {
        // 1. Filtro de Categoria (Pill Tab)
        const tags = detectTags(release.content).map(t => t.toLowerCase());
        const categoryMatch = (currentCategory === 'all' || tags.includes(currentCategory));
        
        // 2. Filtro de Busca por Palavra-chave
        const titleMatch = release.title.toLowerCase().includes(query);
        const tagMatch = tags.join(' ').includes(query);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = release.content;
        const textContent = tempDiv.textContent.toLowerCase();
        const contentMatch = textContent.includes(query);
        
        const searchMatch = !query || titleMatch || tagMatch || contentMatch;
        
        return categoryMatch && searchMatch;
    });
    
    renderReleases(filteredReleases);
}

// Renderiza a lista de cards
function renderReleases(releases) {
    releasesList.innerHTML = '';
    countBadge.textContent = `${releases.length} nota${releases.length !== 1 ? 's' : ''}`;

    if (releases.length === 0) {
        releasesList.innerHTML = `
            <div class="no-results">
                <i class="fa-solid fa-magnifying-glass-minus"></i>
                <p>Nenhuma nota de versão corresponde ao filtro aplicado.</p>
            </div>
        `;
        return;
    }

    releases.forEach((release) => {
        const card = document.createElement('div');
        card.className = 'release-card';
        if (selectedRelease && selectedRelease.id === release.id) {
            card.classList.add('active');
        }

        // Detecta categorias com base no HTML
        const tags = detectTags(release.content);
        const tagsHtml = tags.map(tag => `<span class="tag ${tag.toLowerCase()}">${tag}</span>`).join(' ');

        // Cria uma prévia limpa de texto
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = release.content;
        const cleanText = tempDiv.textContent || tempDiv.innerText || '';
        
        card.innerHTML = `
            <div class="card-header">
                <span class="card-date">${release.title}</span>
                <div class="card-tags-area">
                    <div class="card-tags">${tagsHtml}</div>
                    <button class="btn-copy-card" title="Copiar conteúdo da nota" data-id="${release.id}">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="card-preview">${cleanText}</div>
        `;

        // Lógica de cópia no clique do botão de cópia do card
        const btnCopy = card.querySelector('.btn-copy-card');
        btnCopy.addEventListener('click', (event) => {
            event.stopPropagation(); // Evita selecionar o card
            copyCardToClipboard(release, btnCopy);
        });

        // Clique no card abre os detalhes
        card.addEventListener('click', () => selectRelease(release, card));
        releasesList.appendChild(card);
    });
}

// Copia o conteúdo limpo do card para a área de transferência com animação de feedback
async function copyCardToClipboard(release, btnElement) {
    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = release.content;
        const cleanText = tempDiv.textContent || tempDiv.innerText || '';
        const tags = detectTags(release.content).join(', ');
        
        const formattedText = `BigQuery Release Note - ${release.title}\n` +
                              `Categorias: ${tags}\n` +
                              `Link Oficial: ${release.link || 'N/A'}\n\n` +
                              `Novidade:\n${cleanText}`;

        await navigator.clipboard.writeText(formattedText);
        
        // Efeito visual de sucesso no botão
        btnElement.classList.add('copied');
        const icon = btnElement.querySelector('i');
        icon.className = 'fa-solid fa-check';
        btnElement.setAttribute('title', 'Copiado!');
        
        // Exibe Toast dinâmico
        showToast("Nota de versão copiada!", "success");
        
        // Reseta o estado após 1.5s
        setTimeout(() => {
            btnElement.classList.remove('copied');
            icon.className = 'fa-regular fa-copy';
            btnElement.setAttribute('title', 'Copiar conteúdo da nota');
        }, 1500);
        
    } catch (err) {
        console.error('Falha ao copiar:', err);
        showToast('Não foi possível copiar para a área de transferência.', 'error');
    }
}

// Exporta as notas de versão exibidas no momento na tela para arquivo CSV
function exportToCsv() {
    if (filteredReleases.length === 0) {
        showToast("Não há notas de versão para exportar.", "error");
        return;
    }

    // Estrutura do cabeçalho
    let csvContent = "\uFEFF"; // Byte Order Mark (BOM) para o Excel ler caracteres acentuados corretamente em UTF-8
    csvContent += '"Data","Link","Categorias","Conteudo"\r\n';

    filteredReleases.forEach(release => {
        const data = release.title.replace(/"/g, '""'); // Escape de aspas duplas no CSV
        const link = (release.link || '').replace(/"/g, '""');
        const categorias = detectTags(release.content).join(', ').replace(/"/g, '""');
        
        // Remove tags HTML para colocar texto limpo no CSV
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = release.content;
        const textoLimpo = (tempDiv.textContent || tempDiv.innerText || '').trim();
        const conteudo = textoLimpo.replace(/"/g, '""');

        csvContent += `"${data}","${link}","${categorias}","${conteudo}"\r\n`;
    });

    // Cria o download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    const dataAtual = new Date().toISOString().split('T')[0];
    
    downloadLink.setAttribute("href", url);
    downloadLink.setAttribute("download", `bigquery_release_notes_${dataAtual}.csv`);
    downloadLink.style.visibility = 'hidden';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    showToast("Arquivo CSV baixado!", "success");
}

// Detecta palavras-chave/categorias baseadas nas tags do BigQuery
function detectTags(htmlContent) {
    const tags = [];
    const lowerContent = htmlContent.toLowerCase();
    
    if (lowerContent.includes('<h3>feature</h3>')) tags.push('Feature');
    if (lowerContent.includes('<h3>announcement</h3>')) tags.push('Announcement');
    if (lowerContent.includes('<h3>change</h3>')) tags.push('Change');
    if (lowerContent.includes('<h3>issue</h3>')) tags.push('Issue');
    if (lowerContent.includes('<h3>breaking</h3>')) tags.push('Breaking');
    
    // Fallback caso não ache tags H3 específicas, mas tenha menção no texto
    if (tags.length === 0) {
        if (lowerContent.includes('feature')) tags.push('Feature');
        else if (lowerContent.includes('announcement')) tags.push('Announcement');
        else tags.push('Change'); // categoria padrão
    }
    
    return tags;
}

// Seleciona um lançamento e mostra no painel de detalhes
function selectRelease(release, cardElement) {
    selectedRelease = release;

    // Remove classe ativa de outros cards e adiciona no atual
    const cards = releasesList.querySelectorAll('.release-card');
    cards.forEach(c => c.classList.remove('active'));
    if (cardElement) {
        cardElement.classList.add('active');
    }

    // Mostra o container de conteúdo e esconde o placeholder
    detailsPlaceholder.classList.add('hidden');
    detailsContent.classList.remove('hidden');

    // Popula dados nos campos
    detailDate.textContent = release.title;
    detailTitle.textContent = `Atualização de ${release.title}`;
    
    if (release.link) {
        detailOriginalLink.href = release.link;
        detailOriginalLink.style.display = 'inline-flex';
    } else {
        detailOriginalLink.style.display = 'none';
    }

    // Renderiza o corpo do HTML vindo do XML
    detailBody.innerHTML = release.content;

    // Ajusta links injetados para abrirem em nova aba
    const bodyLinks = detailBody.querySelectorAll('a');
    bodyLinks.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
}

// Exibe estado vazio na direita em caso de erro ou sem dados
function showEmptyState(message) {
    releasesList.innerHTML = '';
    countBadge.textContent = '0 notas';
    
    detailsContent.classList.add('hidden');
    detailsPlaceholder.classList.remove('hidden');
    
    const placeholderTitle = detailsPlaceholder.querySelector('h3');
    const placeholderText = detailsPlaceholder.querySelector('p');
    
    placeholderTitle.textContent = "Houve um problema";
    placeholderText.textContent = message;
}
