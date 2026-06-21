// Estado global da aplicação
let allReleases = [];
let selectedRelease = null;

// Elementos do DOM
const btnRefresh = document.getElementById('btn-refresh');
const refreshIcon = document.getElementById('refresh-icon');
const inputSearch = document.getElementById('input-search');
const releasesList = document.getElementById('releases-list');
const countBadge = document.getElementById('releases-count');

// Elementos de Detalhes
const detailsPlaceholder = document.getElementById('details-placeholder');
const detailsContent = document.getElementById('details-content');
const detailDate = document.getElementById('detail-date');
const detailOriginalLink = document.getElementById('detail-original-link');
const detailTitle = document.getElementById('detail-title');
const detailBody = document.getElementById('detail-body');
const btnShareTwitter = document.getElementById('btn-share-twitter');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();

    // Event listeners
    btnRefresh.addEventListener('click', fetchReleases);
    inputSearch.addEventListener('input', handleSearch);
    btnShareTwitter.addEventListener('click', shareOnTwitter);
});

// Busca as notas de versão do backend
async function fetchReleases() {
    try {
        setLoadingState(true);
        
        const response = await fetch('/api/releases');
        if (!response.ok) throw new Error('Não foi possível carregar as notas de versão.');
        
        const result = await response.json();
        
        if (result.status === 'success') {
            allReleases = result.data;
            renderReleases(allReleases);
            
            // Seleciona automaticamente o primeiro lançamento por padrão
            if (allReleases.length > 0) {
                const firstCard = releasesList.querySelector('.release-card');
                selectRelease(allReleases[0], firstCard);
            } else {
                showEmptyState("Nenhuma nota de versão encontrada.");
            }
        } else {
            throw new Error(result.message || 'Erro desconhecido ao carregar dados.');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        showEmptyState(`Erro: ${error.message}`);
    } finally {
        setLoadingState(false);
    }
}

// Configura o estado de carregamento na interface
function setLoadingState(isLoading) {
    if (isLoading) {
        btnRefresh.classList.add('loading');
        btnRefresh.disabled = true;
        
        // Exibe skeletons na lista
        releasesList.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        `;
    } else {
        btnRefresh.classList.remove('loading');
        btnRefresh.disabled = false;
    }
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
                <div class="card-tags">${tagsHtml}</div>
            </div>
            <div class="card-preview">${cleanText}</div>
        `;

        card.addEventListener('click', () => selectRelease(release, card));
        releasesList.appendChild(card);
    });
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

// Filtra a lista com base no termo digitado
function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (!query) {
        renderReleases(allReleases);
        return;
    }

    const filtered = allReleases.filter(release => {
        const titleMatch = release.title.toLowerCase().includes(query);
        const tags = detectTags(release.content).join(' ').toLowerCase();
        const tagMatch = tags.includes(query);
        
        // Remove tags HTML para buscar apenas no texto limpo
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = release.content;
        const textContent = tempDiv.textContent.toLowerCase();
        const contentMatch = textContent.includes(query);
        
        return titleMatch || tagMatch || contentMatch;
    });

    renderReleases(filtered);
}

// Compartilha a nota de versão ativa no X (Twitter)
function shareOnTwitter() {
    if (!selectedRelease) return;

    // Converte o HTML em texto limpo para obter um resumo curto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = selectedRelease.content;
    let cleanText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Trunca o texto se for muito longo
    const maxLength = 140;
    if (cleanText.length > maxLength) {
        cleanText = cleanText.substring(0, maxLength) + '...';
    }

    const textToShare = `Confira a novidade do Google BigQuery (${selectedRelease.title}):\n"${cleanText}"\n\n#BigQuery #GoogleCloud #DataEngineering`;
    const shareUrl = selectedRelease.link || 'https://docs.cloud.google.com/bigquery/docs/release-notes';

    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}&url=${encodeURIComponent(shareUrl)}`;
    
    // Abre janela de compartilhamento
    window.open(twitterIntentUrl, '_blank', 'width=550,height=420,toolbar=0,menubar=0,location=0,status=0');
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
