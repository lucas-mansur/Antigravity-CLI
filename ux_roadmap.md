# 📐 Avaliação de Experiência do Usuário (UX) & Roadmap de Melhorias

Este documento apresenta uma análise da usabilidade da aplicação **BigQuery Release Notes Tracker** sob a perspectiva de UX, juntamente com um catálogo de ideias de melhorias futuras para aprimorar a experiência do usuário.

---

## 🔍 Avaliação da Experiência Atual

### 🟢 Pontos Positivos
*   **Layout Master-Detail Dinâmico:** Listagem à esquerda e conteúdo fixo à direita evitam transições bruscas de tela e facilitam o consumo contínuo.
*   **Micro-interações de Cópia:** O feedback de cópia com ícone dinâmico (copiar ➡️ checkmark verde) confirma a operação instantaneamente de forma sutil.
*   **Carregamento com Skeletons:** A transição visual com *skeleton screen* reduz a percepção de tempo de espera em conexões lentas.
*   **Persistência de Tema:** A escolha de Light/Dark Mode é mantida via `localStorage`, respeitando a preferência de uso a longo prazo.
*   **Exportação Fiel ao Filtro:** Apenas os itens visíveis na tela após a pesquisa são incluídos no CSV exportado.

---

## 🗺️ Roadmap de Melhorias Propostas

Estas são as sugestões de evolução recomendadas para o projeto, organizadas por categorias.

### 1. 🚀 Usabilidade & Facilidade de Uso
*   **Filtros Rápidos por Categoria (Pill Tabs):**
    *   Adicionar botões clicáveis no topo da lista (ex: "Todas", "Features", "Breaking", "Issues") para filtrar instantaneamente por tags com um clique, sem precisar digitar no campo de busca.
*   **Navegação por Teclado:**
    *   Permitir navegar nos cards usando as setas `Cima` e `Baixo` do teclado, e abrir os detalhes ao teclar `Enter`. Pressionar `Esc` deve limpar o campo de busca.
*   **Destaque de Palavras-Chave (Search Highlighter):**
    *   Quando o usuário digitar um termo de pesquisa, as ocorrências correspondentes no card e na área de leitura de detalhes devem ser destacadas visualmente com fundo amarelo (utilizando a tag HTML `<mark>`).

### 2. 🎨 Feedback Visual & Animações
*   **Componente de Toast Personalizado:**
    *   Substituir os pop-ups nativos do navegador (`alert()`) por notificações de Toast flutuantes, elegantes e animadas, no canto inferior da tela (ex: "CSV exportado com sucesso!", "Erro de Conexão").
*   **Preservação de Seleção ao Atualizar:**
    *   Se o usuário estiver com um card aberto e clicar em "Atualizar", a aplicação deve comparar os IDs e manter a mesma nota de versão selecionada e destacada na tela se ela ainda existir na nova busca.

### 3. 🚨 Tratamento de Erros & Mensagens
*   **Visualizador de Erros com Ação (Retry Button):**
    *   Caso o backend falhe em obter o XML, exibir um estado vazio na tela inteira com uma ilustração amigável e um botão destacado "Tentar Novamente".
*   **Dicas de Ajuda na Interface (Tooltips):**
    *   Adicionar tooltips elegantes explicativos ao pairar o mouse sobre as tags e botões para que novos usuários compreendam as funcionalidades rapidamente.

### 4. 📖 Modo de Foco e Acessibilidade
*   **Modo de Leitura Focada (Expand Reader):**
    *   Adicionar um botão no visualizador de detalhes para "Maximizar/Minimizar" o painel de leitura, ocultando temporariamente a barra lateral esquerda de atualizações para permitir uma leitura limpa em tela cheia.
