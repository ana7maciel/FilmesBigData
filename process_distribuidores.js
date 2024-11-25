import jsdom from "jsdom";
import fs from "fs";
import fetch from "node-fetch";

const { JSDOM } = jsdom;

const delayMili = 500;

async function fetchDistribuidor(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Seletor ajustado para buscar o distribuidor
    const distribuidorElement = document.querySelector(
      '.a-section.a-spacing-none.mojo-summary-values.mojo-hidden-from-mobile > .a-section.a-spacing-none:first-child'
    );
    
    if (distribuidorElement) {
      let distribuidorText = distribuidorElement.textContent.trim();

      // Remover os textos indesejados "Domestic Distributor" e "See full company information"
      distribuidorText = distribuidorText
        .replace("Domestic Distributor", "")  // Remove "Domestic Distributor"
        .replace("See full company information", ""); // Remove "See full company information"

      // Remover espaços extras após a remoção dos textos
      distribuidorText = distribuidorText.trim();

      // Se o texto não estiver vazio após a remoção, retorna o distribuidor
      return distribuidorText || null;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Erro ao coletar o distribuidor do link ${titleSummaryLink}:`, error);
    return null;
  }
}

function delay(mili) {
  return new Promise((resolve) => setTimeout(resolve, mili));
}

async function processarDistribuidores(jsonPath) {
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const filmesPorAno = JSON.parse(rawData);

    const anos = Object.keys(filmesPorAno);
    let filmesComDistribuidores = {};

    for (const ano of anos) {
      console.log(`Processando filmes do ano ${ano}...`);
      const filmes = filmesPorAno[ano];

      filmesComDistribuidores[ano] = [];
      const filmesParaTestar = filmes; // Processar todos os filmes

      for (const filme of filmesParaTestar) {
        const { titleSummaryLink, filmeLink } = filme;

        if (titleSummaryLink) {
          const distribuidor = await fetchDistribuidor(titleSummaryLink);
          filmesComDistribuidores[ano].push({
            filmeLink,
            titleSummaryLink,
            distribuidor,
          });
        } else {
          filmesComDistribuidores[ano].push({
            filmeLink,
            titleSummaryLink: null,
            distribuidor: null,
          });
        }
      }
    }

    const jsonContent = JSON.stringify(filmesComDistribuidores, null, 2);
    fs.writeFileSync("filmes_testados_com_distribuidor.json", jsonContent);

    console.log(
      "Dados dos filmes com Distribuidores salvos em filmes_testados_com_distribuidor.json"
    );
  } catch (error) {
    console.error(`Erro ao processar distribuidores:`, error);
  }
}

// Caminho para o arquivo JSON gerado no script.js
const jsonPath = "filmes_links_e_title_summary_por_ano.json";

// Chama a função principal
processarDistribuidores(jsonPath);

// No final de process_distribuidores.js
export { processarDistribuidores };

