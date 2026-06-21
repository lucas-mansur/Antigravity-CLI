// Estado global da aplicação
let allReleases = [];
let filteredReleases = []; // Guarda a lista que está sendo exibida no momento
let selectedRelease = null;

// Elementos do DOM
const btnRefresh = document.getElementById('btn-refresh');
const refreshIcon = document.getElementById('refresh-icon');
const btnExportCsv = document.getElementById('btn-export-csv');
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
    btnExportCsv.addEventListener('click', exportToCsv);
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
            filteredReleases = [...allReleases]; // Inicializa a lista filtrada com todos
            renderReleases(filteredReleases);
            
            // Seleciona automaticamente o primeiro lançamento por padrão
            if (filteredReleases.length > 0) {
                const firstCard = releasesList.querySelector('.release-card');
                selectRelease(filteredReleases[0], firstCard);
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
        
        // Efeito visual de sucesso
        btnElement.classList.add('copied');
        const icon = btnElement.querySelector('i');
        icon.className = 'fa-solid fa-check';
        btnElement.setAttribute('title', 'Copiado!');
        
        // Reseta o estado após 1.5s
        setTimeout(() => {
            btnElement.classList.remove('copied');
            icon.className = 'fa-regular fa-copy';
            btnElement.setAttribute('title', 'Copiar conteúdo da nota');
        }, 1500);
        
    } catch (err) {
        console.error('Falha ao copiar:', err);
        alert('Não foi possível copiar o conteúdo para a área de transferência.');
    }
}

// Exporta as notas de versão exibidas no momento na tela para arquivo CSV
function exportToCsv() {
    if (filteredReleases.length === 0) {
        alert("Não há notas de versão para exportar.");
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
        filteredReleases = [...allReleases];
        renderReleases(filteredReleases);
        return;
    }

    filteredReleases = allReleases.filter(release => {
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

    renderReleases(filteredReleases);
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
