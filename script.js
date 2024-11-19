import jsdom from 'jsdom';
import fs from 'fs';
import fetch from 'node-fetch';

const { JSDOM } = jsdom;

// Função para coletar o link de "Title Summary" de cada filme
async function fetchLinkTitleSummary(filmeLink) {
  try {
    // Garantir que o link tenha o domínio correto
    const fullFilmeLink = filmeLink.startsWith('http') ? filmeLink : `https://www.boxofficemojo.com${filmeLink}`;
    const response = await fetch(fullFilmeLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Agora vamos buscar o link correto dentro da classe 'a-link-normal mojo-title-link refiner-display-highlight'
    const titleSummaryLinkElement = document.querySelector('a.a-link-normal.mojo-title-link.refiner-display-highlight');
    if (titleSummaryLinkElement) {
      // Pega o href e completa com o domínio correto
      return `https://www.boxofficemojo.com${titleSummaryLinkElement.getAttribute('href')}`;
    } else {
      return null; // Caso não encontre o link
    }
  } catch (error) {
    console.error(`Erro ao coletar o Title Summary para o link ${filmeLink}:`, error);
    return null;
  }
}

// Função para coletar filmes de um determinado ano com seus links
async function fetchFilmesPorAno(ano) {
  try {
    const response = await fetch(`https://www.boxofficemojo.com/year/world/${ano}/`);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Seleciona todos os filmes na página e extrai o link do filme
    const filmes = Array.from(document.querySelectorAll('td.a-text-left.mojo-field-type-release_group a'))
      .map(link => {
        const filmeLink = `https://www.boxofficemojo.com${link.getAttribute('href')}`;
        return filmeLink;
      });

    // Para cada filme, vamos coletar o link de "Title Summary"
    const filmesComTitleSummary = await Promise.all(filmes.map(async (filmeLink) => {
      const titleSummaryLink = await fetchLinkTitleSummary(filmeLink);
      return { filmeLink, titleSummaryLink };
    }));

    return { ano, filmes: filmesComTitleSummary };
  } catch (error) {
    console.error(`Erro ao coletar dados para o ano ${ano}:`, error);
    return { ano, filmes: [] };
  }
}

// Função principal para coletar dados de todos os anos
async function init() {
  const anos = Array.from({ length: 2024 - 1977 + 1 }, (_, i) => i + 1977);
  const filmesPorAno = {};

  for (const ano of anos) {
    console.log(`Coletando dados para o ano ${ano}...`);
    const dadosAno = await fetchFilmesPorAno(ano);
    filmesPorAno[dadosAno.ano] = dadosAno.filmes; // Salva como dicionário (ano: [filmes e links])
  }

  // Converte os dados para JSON e salva no arquivo
  const jsonContent = JSON.stringify(filmesPorAno, null, 2);
  fs.writeFileSync("filmes_links_e_title_summary_por_ano.json", jsonContent);

  console.log("Links dos filmes e Title Summary salvos em filmes_links_e_title_summary_por_ano.json");
}

// Inicializa o processo
init();
