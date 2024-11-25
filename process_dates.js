import jsdom from "jsdom";
import fs from "fs";
import fetch from "node-fetch";

const { JSDOM } = jsdom;

const delayMili = 500;

async function fetchReleaseDate(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Seletor para encontrar a seção que contém o texto "Earliest Release Date"
    const releaseDateSections = document.querySelectorAll('.a-section.a-spacing-none');

    for (let section of releaseDateSections) {
      const spans = section.querySelectorAll('span');
      for (let span of spans) {
        // Encontrar o span que contém o texto "Earliest Release Date"
        if (span.textContent.includes("Earliest Release Date")) {
          // Pega o próximo span com a data de lançamento
          const releaseDateElement = span.nextElementSibling;
          if (releaseDateElement) {
            let releaseDateText = releaseDateElement.textContent.trim();
            // Pegando apenas o texto antes da quebra de linha
            releaseDateText = releaseDateText.split('\n')[0].trim();
            return releaseDateText || null;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Erro ao coletar a data de lançamento do link ${titleSummaryLink}:`, error);
    return null;
  }
}

function delay(mili) {
  return new Promise((resolve) => setTimeout(resolve, mili));
}

async function processarReleaseDates(jsonPath) {
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const filmesPorAno = JSON.parse(rawData);

    const anos = Object.keys(filmesPorAno);
    let filmesComReleaseDates = {};

    for (const ano of anos) {
      console.log(`Processando filmes do ano ${ano}...`);
      const filmes = filmesPorAno[ano];

      filmesComReleaseDates[ano] = [];
      const filmesParaTestar = filmes; // Processar todos os filmes

      for (const filme of filmesParaTestar) {
        const { titleSummaryLink, filmeLink } = filme;

        if (titleSummaryLink) {
          const releaseDate = await fetchReleaseDate(titleSummaryLink);
          filmesComReleaseDates[ano].push({
            filmeLink,
            titleSummaryLink,
            releaseDate,
          });
        } else {
          filmesComReleaseDates[ano].push({
            filmeLink,
            titleSummaryLink: null,
            releaseDate: null,
          });
        }
      }
    }

    const jsonContent = JSON.stringify(filmesComReleaseDates, null, 2);
    fs.writeFileSync("filmes_testados_com_release_date.json", jsonContent);

    console.log(
      "Dados dos filmes com Release Dates salvos em filmes_testados_com_release_date.json"
    );
  } catch (error) {
    console.error(`Erro ao processar Release Dates:`, error);
  }
}

// Caminho para o arquivo JSON gerado no script.js
const jsonPath = "filmes_links_e_title_summary_por_ano.json";

// Chama a função principal
processarReleaseDates(jsonPath);
