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

async function fetchDistribuidor(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const distribuidorElement = document.querySelector(
      '.a-section.a-spacing-none.mojo-summary-values.mojo-hidden-from-mobile > .a-section.a-spacing-none:first-child'
    );

    if (distribuidorElement) {
      let distribuidorText = distribuidorElement.textContent.trim();
      distribuidorText = distribuidorText
        .replace("Domestic Distributor", "")
        .replace("See full company information", "");
      return distribuidorText.trim() || null;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Erro ao coletar o distribuidor do link ${titleSummaryLink}:`, error);
    return null;
  }
}

async function fetchDomesticOpening(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const domesticOpeningElement = document.querySelector(
      '.a-section.a-spacing-none.mojo-summary-values.mojo-hidden-from-mobile > .a-section.a-spacing-none:nth-child(2) span.money'
    );

    if (domesticOpeningElement) {
      return domesticOpeningElement.textContent.trim();
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Erro ao coletar o Domestic Opening do link ${titleSummaryLink}:`, error);
    return null;
  }
}

async function fetchReleaseDate(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const releaseDateSections = document.querySelectorAll('.a-section.a-spacing-none');

    for (let section of releaseDateSections) {
      const spans = section.querySelectorAll('span');
      for (let span of spans) {
        if (span.textContent.includes("Earliest Release Date")) {
          const releaseDateElement = span.nextElementSibling;
          if (releaseDateElement) {
            let releaseDateText = releaseDateElement.textContent.trim();
            releaseDateText = releaseDateText.split('\n')[0].trim(); // Pegando o texto antes do \n
            return releaseDateText || null;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Erro ao coletar a Earliest Release Date do link ${titleSummaryLink}:`, error);
    return null;
  }
}

async function fetchRunningTime(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const runningTimeSections = document.querySelectorAll('.a-section.a-spacing-none');

    for (let section of runningTimeSections) {
      const spans = section.querySelectorAll('span');
      for (let span of spans) {
        if (span.textContent.includes("Running Time")) {
          const runningTimeElement = span.nextElementSibling;
          if (runningTimeElement) {
            const runningTimeText = runningTimeElement.textContent.trim();
            return runningTimeText || null;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Erro ao coletar o tempo de duração do link ${titleSummaryLink}:`, error);
    return null;
  }
}

// Função para coletar os gêneros
async function fetchGenres(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const genresSections = document.querySelectorAll('.a-section.a-spacing-none');

    for (let section of genresSections) {
      const spans = section.querySelectorAll('span');
      for (let span of spans) {
        if (span.textContent.includes("Genres")) {
          const genresElement = span.nextElementSibling;
          if (genresElement) {
            const genresText = genresElement.textContent.trim();
            const genresList = genresText
              .split("\n")  // Divide por quebras de linha
              .map((genre) => genre.trim()) // Remove espaços extras
              .filter((genre) => genre.length > 0); // Filtra valores vazios

            return genresList || null;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Erro ao coletar os gêneros do link ${titleSummaryLink}:`, error);
    return null;
  }
}

function delay(mili) {
  return new Promise((resolve) => setTimeout(resolve, mili));
}

async function processarDadosCombinados(jsonPath) {
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const filmesPorAno = JSON.parse(rawData);

    const anos = Object.keys(filmesPorAno);
    let filmesComDadosCombinados = {};

    for (const ano of anos) {
      console.log(`Processando filmes do ano ${ano}...`);
      const filmes = filmesPorAno[ano];

      filmesComDadosCombinados[ano] = [];
      const filmesParaTestar = filmes; // Processar todos os filmes

      for (const filme of filmesParaTestar) {
        const { titleSummaryLink, filmeLink } = filme;

        if (titleSummaryLink) {
          const distribuidor = await fetchDistribuidor(titleSummaryLink);
          const domesticOpening = await fetchDomesticOpening(titleSummaryLink);
          const releaseDate = await fetchReleaseDate(titleSummaryLink);
          const runningTime = await fetchRunningTime(titleSummaryLink);
          const genres = await fetchGenres(titleSummaryLink); // Adicionando a coleta de gêneros
          const domesticProfit = await fetchDomesticProfit(titleSummaryLink);
          const internationalProfit = await fetchInternationalProfit(titleSummaryLink);
          const worldwideProfit = await fetchWorldwideProfit(titleSummaryLink);

          filmesComDadosCombinados[ano].push({
            filmeLink,
            titleSummaryLink,
            distribuidor,
            domesticOpening,
            releaseDate,
            runningTime,
            genres,
            domesticProfit,
            internationalProfit,
            worldwideProfit,
          });
        } else {
          filmesComDadosCombinados[ano].push({
            filmeLink,
            titleSummaryLink: null,
            distribuidor: null,
            domesticOpening: null,
            releaseDate: null,
            runningTime: null,
            genres: null,
            domesticProfit: null,
            internationalProfit: null,
            worldwideProfit: null,
          });
        }
      }
    }

    const jsonContent = JSON.stringify(filmesComDadosCombinados, null, 2);
    fs.writeFileSync("filmes_com_dados_combinados.json", jsonContent);

    console.log(
      "Dados dos filmes com Distribuidores, Domestic Opening, Earliest Release Date, Running Time, Gêneros e Lucros salvos em filmes_com_dados_combinados.json"
    );
  } catch (error) {
    console.error(`Erro ao processar os dados combinados:`, error);
  }
}

// Caminho para o arquivo JSON gerado no script.js
const jsonPath = "filmes_links_e_title_summary_por_ano.json";

// Chama a função principal
processarDadosCombinados(jsonPath);
