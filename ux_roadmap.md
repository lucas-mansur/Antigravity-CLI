# 📐 Avaliação de Experiência do Usuário (UX) & Roadmap de Melhorias

Este documento apresenta uma análise da usabilidade da aplicação **BigQuery Release Notes Tracker** sob a perspectiva de UX, juntamente com o catálogo de melhorias que foram propostas e implementadas ao longo do desenvolvimento.

---

## 🔍 Avaliação da Experiência Atual

### 🟢 Pontos Positivos
*   **Layout Master-Detail Dinâmico:** Listagem à esquerda e conteúdo fixo à direita evitam transições bruscas de tela e facilitam o consumo contínuo.
*   **Micro-interações de Cópia:** O feedback de cópia com ícone dinâmico (copiar ➡️ checkmark verde) confirma a operação instantaneamente de forma sutil.
*   **Carregamento com Skeletons:** A transição visual com *skeleton screen* reduz a percepção de tempo de espera em conexões lentas.
*   **Persistência de Tema:** A escolha de Light/Dark Mode é mantida via `localStorage`, respeitando a preferência de uso a longo prazo.
*   **Exportação Fiel ao Filtro:** Apenas os itens visíveis na tela após a pesquisa são incluídos no CSV exportado.

---

## 🗺️ Roadmap de Melhorias

### 1. 🚀 Usabilidade & Facilidade de Uso

*   ✅ **Filtros Rápidos por Categoria (Pill Tabs):**
    *   Botões de filtro rápido abaixo do campo de busca permitem filtrar por `Feature`, `Announcement`, `Change`, `Issue` e `Breaking` com um único clique.

*   ✅ **Navegação por Teclado:**
    *   Navegue nos cards com as setas `↑` e `↓`, abra os detalhes com `Enter` e limpe o campo de busca com `Esc`.

*   ✅ **Destaque de Palavras-Chave (Search Highlighter):**
    *   As ocorrências do termo digitado são destacadas com fundo amarelo (`<mark>`) tanto nos cards da lista quanto no painel de detalhes, nos dois temas (claro e escuro).

### 2. 🎨 Feedback Visual & Animações

*   ✅ **Componente de Toast Personalizado:**
    *   Notificações flutuantes e animadas no canto inferior direito substituem todos os `alert()` nativos. Suportam os estados `success` (verde) e `error` (vermelho) com ícones e fade-out automático após 3 segundos.

*   ✅ **Preservação de Seleção ao Atualizar:**
    *   Ao clicar em "Atualizar", a aplicação compara os IDs e mantém o card que estava sendo lido ativo e visível na nova lista.

### 3. 🚨 Tratamento de Erros & Mensagens

*   ✅ **Visualizador de Erros com Ação (Retry Button):**
    *   Em caso de falha de conexão ou indisponibilidade do feed, a interface exibe um estado de erro amigável com ícone de aviso, mensagem clara e botão "Tentar Novamente" que re-executa a busca.

*   ✅ **Dicas de Ajuda na Interface (Tooltips):**
    *   Tooltips CSS puro e animados aparecem ao passar o cursor sobre os botões do cabeçalho, botão de expandir leitura, link de documentação e tags de categoria — com textos descritivos e suporte a ambos os temas.

### 4. 📖 Modo de Foco e Acessibilidade

*   ✅ **Modo de Leitura Focada (Expand Reader):**
    *   Botão de maximizar/minimizar no painel de detalhes recolhe a coluna de lista lateral com transição animada, liberando 100% da largura para leitura focada.

---

> **Status: ✅ Todos os itens do roadmap foram implementados.**
