import jsdom from "jsdom";
import fs from "fs";
import fetch from "node-fetch";

const { JSDOM } = jsdom;
const delayMili = 500;

async function fetchDomesticProfit(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Seletor ajustado para pegar o lucro domestic (primeira classe "money")
    const domesticProfitElement = document.querySelector(
      '.a-section.a-spacing-none .a-size-medium.a-text-bold .money'
    );

    if (domesticProfitElement) {
      return domesticProfitElement.textContent.trim();
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Erro ao coletar o lucro domestic do link ${titleSummaryLink}:`, error);
    return null;
  }
}

async function fetchInternationalProfit(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Seletor ajustado para pegar o lucro internacional (segunda classe "money")
    const internationalProfitElement = document.querySelectorAll(
      '.a-section.a-spacing-none .a-size-medium.a-text-bold .money'
    )[1]; // Pegando o segundo "money" para o lucro internacional

    if (internationalProfitElement) {
      return internationalProfitElement.textContent.trim();
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Erro ao coletar o lucro internacional do link ${titleSummaryLink}:`, error);
    return null;
  }
}

async function fetchWorldwideProfit(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Seletor ajustado para pegar o lucro worldwide (terceira classe "money")
    const worldwideProfitElement = document.querySelectorAll(
      '.a-section.a-spacing-none .a-size-medium.a-text-bold .money'
    )[2]; // Pegando o terceiro "money" para o lucro worldwide

    if (worldwideProfitElement) {
      return worldwideProfitElement.textContent.trim();
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Erro ao coletar o lucro worldwide do link ${titleSummaryLink}:`, error);
    return null;
  }
}

function delay(mili) {
  return new Promise((resolve) => setTimeout(resolve, mili));
}

async function processarLucros(jsonPath) {
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const filmesPorAno = JSON.parse(rawData);

    const anos = Object.keys(filmesPorAno);
    let filmesComLucros = {};

    for (const ano of anos) {
      console.log(`Processando lucros dos filmes do ano ${ano}...`);
      const filmes = filmesPorAno[ano];

      filmesComLucros[ano] = [];
      const filmesParaTestar = filmes; // Processar todos os filmes

      for (const filme of filmesParaTestar) {
        const { titleSummaryLink, filmeLink } = filme;

        if (titleSummaryLink) {
          const domesticProfit = await fetchDomesticProfit(titleSummaryLink);
          const internationalProfit = await fetchInternationalProfit(titleSummaryLink);
          const worldwideProfit = await fetchWorldwideProfit(titleSummaryLink);

          filmesComLucros[ano].push({
            filmeLink,
            titleSummaryLink,
            domesticProfit,
            internationalProfit,
            worldwideProfit,
          });
        } else {
          filmesComLucros[ano].push({
            filmeLink,
            titleSummaryLink: null,
            domesticProfit: null,
            internationalProfit: null,
            worldwideProfit: null,
          });
        }
      }
    }

    const jsonContent = JSON.stringify(filmesComLucros, null, 2);
    fs.writeFileSync("filmes_com_lucros.json", jsonContent);

    console.log(
      "Dados dos filmes com Lucros Domestic, International e Worldwide salvos em filmes_com_lucros.json"
    );
  } catch (error) {
    console.error(`Erro ao processar os lucros dos filmes:`, error);
  }
}

// Caminho para o arquivo JSON gerado no script.js
const jsonPath = "filmes_links_e_title_summary_por_ano.json";

// Chama a função principal
processarLucros(jsonPath);
