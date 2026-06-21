# 🚀 O Diário de Construção: BigQuery Release Notes Tracker

Bem-vindo ao diário de bordo deste projeto! Este documento detalha, de forma didática, toda a jornada de desenvolvimento do aplicativo "BigQuery Release Notes Tracker". Ele serve como material de estudo e registro arquitetural para desenvolvedores.

---

## 🎯 1. O Desafio e a Solução Arquitetural
**O Problema:** Acompanhar as notas de versão do Google BigQuery diretamente no site oficial pode ser trabalhoso quando precisamos buscar rapidamente por novidades específicas, filtrar por categorias, ou exportar esses dados.

**A Solução:** Construímos uma aplicação web completa com uma **Arquitetura BFF (Backend-For-Frontend)**:
1. **O Backend (Flask / Python):** Atua como um proxy. Ele busca os dados no feed RSS/XML oficial do Google usando a biblioteca nativa `urllib.request`, faz o parsing do XML com o `xml.etree.ElementTree` e devolve um JSON enxuto. Isso evita problemas de bloqueio de CORS (Cross-Origin Resource Sharing) no navegador.
2. **O Frontend (HTML/CSS/Vanilla JS):** Recebe esse JSON via `fetch` assíncrono e injeta a inteligência na interface (busca, filtragem e temas) sem depender de bibliotecas pesadas como React ou Vue.

---

## ✨ 2. Aprimorando a Interface (Roadmap de UX)
Após a versão base rodar, subimos a régua! Foi planejado e executado um pacote robusto de **User Experience (UX)**.

### 2.1. Funcionalidades Premium Adicionadas:
- **Search Highlighter:** Um motor de busca que não só filtra os resultados instantaneamente, como usa Regex dinâmicas para envolver os termos encontrados numa tag `<mark>`, grifando a palavra em amarelo fluorescente.
- **Modo Leitor (Reader Mode):** Uma barra lateral recolhível que permite focar 100% no texto de uma nota de atualização sem as distrações da lista lateral.
- **Navegação por Teclado Acessível:** Implementamos _event listeners_ para as setas do teclado. O usuário pode descer ou subir a lista usando as setas, onde um card recebe a classe visual de "focus" (contorno azul dinâmico). Apertando "Enter", o card abre.

### 2.2. O Desafio do Tooltip (Problemas de Layout)
Durante o desenvolvimento, as tags de categoria ("Feature", "Issue") tinham tooltips feitos em CSS puro. O problema: cards com tamanho limitado recebiam a propriedade `overflow: hidden`, o que literalmente **"cortava" as tooltips**.
* **A Solução:** Criamos um **Motor Global de Tooltip via JavaScript**. Adicionamos uma div única com `id="js-tooltip"` e `position: fixed` no final da página (fora de qualquer container de card). O JS calcula em tempo real o retângulo e as coordenadas dinâmicas do mouse na tela (`getBoundingClientRect`), movendo este único tooltip para cima dos elementos sem nunca sofrer _clipping_.

---

## 🛡️ 3. O Padrão Ouro: Revisão DevSecOps
Para garantir que a aplicação não era apenas um "protótipo bonitinho", mas algo pronto para produção, ativamos a metodologia _Full-Cycle DevSecOps_. Identificamos e corrigimos vulnerabilidades críticas.

### 3.1. Correções de Segurança (Security First)
- **Cross-Site Scripting (XSS):** O aplicativo usava `innerHTML` para injetar os textos da Google no HTML, e também as mensagens de erro geradas. Se a origem fosse manipulada, poderia abrir portas para injeção de scripts maliciosos. **Solução:** Criamos o utilitário `escapeHtml()` que converte `<` em entidades HTML, neutralizando a execução de tags nas mensagens dinâmicas.
- **Exposição de Stack Trace:** Quando o backend falhava, o Python mandava o erro original inteiro ao Frontend (`str(e)`). **Solução:** Substituímos por uma mensagem amigável ("Não foi possível obter as notas") e deixamos o log complexo apenas no terminal do servidor `app.logger.error()`.
- **Prevenção contra Travamento:** O pedido HTTP (`urllib.request.urlopen`) estava sem limite de tempo. Se a Google demorasse a responder, a aplicação travaria. **Solução:** Inserimos o parâmetro de segurança `timeout=15`.

### 3.2. Correções de Performance e Memória
- **Memory Leak no Download CSV:** A exportação para CSV criava uma URL Object (ponteiro em memória para o arquivo gerado) mas nunca apagava, acumulando dados "fantasmas" no RAM do navegador cada vez que o usuário clicava em download. **Solução:** Implementação do `URL.revokeObjectURL(url)` logo após o download.
- **Search Highlighter vs HTML Tags:** O primeiro motor de marca-texto buscava a palavra no meio do HTML completo da nota (ex: buscando `href`, o app tentava inserir o `<mark>` dentro do código-fonte de um link real, "quebrando" o layout). **Solução Avançada:** Implementamos o `document.createTreeWalker()` na API do DOM para iterar *exclusivamente* em nós de texto (`NodeFilter.SHOW_TEXT`), garantindo a preservação absoluta da estrutura do HTML original.
- **Cache Otimizado no Frontend:** Para evitar o recálculo brutal e o _parsing_ de elementos HTML descartáveis sempre que uma tecla era pressionada na barra de pesquisa, os "textos limpos" (`_cleanText`) e as `_tags` passaram a ser mapeados e guardados em memória 1 única vez assim que a aplicação recebe o lote do Backend.

---

## 🏆 4. Resultado Final
O resultado é um painel moderno, super-rápido (carrega instantaneamente via JS sem transitar _megabytes_ de bibliotecas), aderente às melhores práticas de Design System (variáveis CSS dinâmicas para Dark Mode) e, acima de tudo, seguro contra injeções maliciosas e vazamentos de memória.

Um estudo de caso fantástico de ponta a ponta: do levantamento de requisitos ao refinamento de engenharia de software!
