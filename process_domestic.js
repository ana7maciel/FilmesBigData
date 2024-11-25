import jsdom from "jsdom";
import fs from "fs";
import fetch from "node-fetch";

const { JSDOM } = jsdom;

const delayMili = 500;

async function fetchDomesticOpening(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Seletor ajustado para buscar o valor de "Domestic Opening"
    const domesticOpeningElement = document.querySelector(
      '.a-section.a-spacing-none.mojo-summary-values.mojo-hidden-from-mobile > .a-section.a-spacing-none:nth-child(2) span.money'
    );

    if (domesticOpeningElement) {
      // Extrair o valor e limpar espaços
      return domesticOpeningElement.textContent.trim();
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Erro ao coletar o Domestic Opening do link ${titleSummaryLink}:`, error);
    return null;
  }
}

function delay(mili) {
  return new Promise((resolve) => setTimeout(resolve, mili));
}

async function processarDomesticOpenings(jsonPath) {
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const filmesPorAno = JSON.parse(rawData);

    const anos = Object.keys(filmesPorAno);
    let filmesComDomesticOpenings = {};

    for (const ano of anos) {
      console.log(`Processando filmes do ano ${ano}...`);
      const filmes = filmesPorAno[ano];

      filmesComDomesticOpenings[ano] = [];
      const filmesParaTestar = filmes; // Processar todos os filmes

      for (const filme of filmesParaTestar) {
        const { titleSummaryLink, filmeLink } = filme;

        if (titleSummaryLink) {
          const domesticOpening = await fetchDomesticOpening(titleSummaryLink);
          filmesComDomesticOpenings[ano].push({
            filmeLink,
            titleSummaryLink,
            domesticOpening,
          });
        } else {
          filmesComDomesticOpenings[ano].push({
            filmeLink,
            titleSummaryLink: null,
            domesticOpening: null,
          });
        }
      }
    }

    const jsonContent = JSON.stringify(filmesComDomesticOpenings, null, 2);
    fs.writeFileSync("filmes_testados_com_domestic_opening.json", jsonContent);

    console.log(
      "Dados dos filmes com Domestic Opening salvos em filmes_testados_com_domestic_opening.json"
    );
  } catch (error) {
    console.error(`Erro ao processar Domestic Opening:`, error);
  }
}

// Caminho para o arquivo JSON gerado no script.js
const jsonPath = "filmes_links_e_title_summary_por_ano.json";

// Chama a função principal
processarDomesticOpenings(jsonPath);

// No final de process_domestic.js
export { processarDomesticOpenings };
