import jsdom from "jsdom";
import fs from "fs";
import nodeFetch from "node-fetch";
import slugify from "slugify";

const { JSDOM } = jsdom;
const delayMili = 500;

async function fetch(url) {
  if (!fs.existsSync("cache")) {
    fs.mkdirSync("cache");
  }

  const fileName = `cache/${slugify(url)}.html`;
  if (fs.existsSync(fileName)) {
    const cache = (await fs.promises.readFile(fileName)).toString();
    return {
      async text() {
        return cache;
      },
    };
  }

  //await delay(delayMili);

  console.log("HTTP GET ".concat(url));
  const response = await nodeFetch(url);
  const text = await response.text();
  if (response.status === 200) {
    await fs.promises.writeFile(fileName, text);
  } else {
    throw new Error("HTTP Error!");
  }
  response.text = async () => {
    return text;
  };
  return response;
}

async function fetchDomesticProfit(titleSummaryLink, document) {
  try {
    const domesticProfitElement = document.querySelector(
      "br + .a-size-medium.a-text-bold"
    );

    if (domesticProfitElement) {
      return domesticProfitElement.textContent.trim();
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      `Erro ao coletar o lucro domestic do link ${titleSummaryLink}:`,
      error
    );
    return null;
  }
}

async function fetchInternationalProfit(titleSummaryLink, document) {
  try {
    const internationalProfitElement = document.querySelectorAll(
      "br + .a-size-medium.a-text-bold"
    )[1]; // Pegando o segundo "money" para o lucro internacional

    if (internationalProfitElement) {
      return internationalProfitElement.textContent.trim();
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      `Erro ao coletar o lucro internacional do link ${titleSummaryLink}:`,
      error
    );
    return null;
  }
}

async function fetchWorldwideProfit(titleSummaryLink, document) {
  try {
    const worldwideProfitElement = document.querySelectorAll(
      "br + .a-size-medium.a-text-bold"
    )[2]; // Pegando o terceiro "money" para o lucro worldwide

    if (worldwideProfitElement) {
      return worldwideProfitElement.textContent.trim();
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      `Erro ao coletar o lucro worldwide do link ${titleSummaryLink}:`,
      error
    );
    return null;
  }
}

async function fetchDistribuidor(titleSummaryLink, document) {
  try {
    const distribuidorElement = document.querySelector(
      ".a-section.a-spacing-none.mojo-summary-values.mojo-hidden-from-mobile > .a-section.a-spacing-none:first-child"
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
    console.error(
      `Erro ao coletar o distribuidor do link ${titleSummaryLink}:`,
      error
    );
    return null;
  }
}

async function fetchDomesticOpening(titleSummaryLink, document) {
  try {
    const domesticOpeningElement = document.querySelector(
      ".a-section.a-spacing-none.mojo-summary-values.mojo-hidden-from-mobile > .a-section.a-spacing-none:nth-child(2) span.money"
    );

    if (domesticOpeningElement) {
      return domesticOpeningElement.textContent.trim();
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      `Erro ao coletar o Domestic Opening do link ${titleSummaryLink}:`,
      error
    );
    return null;
  }
}

async function fetchReleaseDate(titleSummaryLink, document) {
  try {
    const releaseDateSections = document.querySelectorAll(
      ".a-section.a-spacing-none"
    );

    for (let section of releaseDateSections) {
      const spans = section.querySelectorAll("span");
      for (let span of spans) {
        if (span.textContent.includes("Earliest Release Date")) {
          const releaseDateElement = span.nextElementSibling;
          if (releaseDateElement) {
            let releaseDateText = releaseDateElement.textContent.trim();
            releaseDateText = releaseDateText.split("\n")[0].trim(); // Pegando o texto antes do \n
            return releaseDateText || null;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error(
      `Erro ao coletar a Earliest Release Date do link ${titleSummaryLink}:`,
      error
    );
    return null;
  }
}

async function fetchRunningTime(titleSummaryLink, document) {
  try {
    const runningTimeSections = document.querySelectorAll(
      ".a-section.a-spacing-none"
    );

    for (let section of runningTimeSections) {
      const spans = section.querySelectorAll("span");
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
    console.error(
      `Erro ao coletar o tempo de duração do link ${titleSummaryLink}:`,
      error
    );
    return null;
  }
}

// Função para coletar os gêneros
async function fetchGenres(titleSummaryLink, document) {
  try {
    const genresSections = document.querySelectorAll(
      ".a-section.a-spacing-none"
    );

    for (let section of genresSections) {
      const spans = section.querySelectorAll("span");
      for (let span of spans) {
        if (span.textContent.includes("Genres")) {
          const genresElement = span.nextElementSibling;
          if (genresElement) {
            const genresText = genresElement.textContent.trim();
            const genresList = genresText
              .split("\n") // Divide por quebras de linha
              .map((genre) => genre.trim()) // Remove espaços extras
              .filter((genre) => genre.length > 0); // Filtra valores vazios

            return genresList || null;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error(
      `Erro ao coletar os gêneros do link ${titleSummaryLink}:`,
      error
    );
    return null;
  }
}

function delay(mili) {
  return new Promise((resolve) => setTimeout(resolve, mili));
}

async function processarDadosCombinados(jsonPath) {
  try {
    const rawData = await fs.promises.readFile(jsonPath, "utf-8");
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
          const response = await fetch(titleSummaryLink);
          const html = await response.text();
          const dom = new JSDOM(html);
          const document = dom.window.document;

          const distribuidor = await fetchDistribuidor(
            titleSummaryLink,
            document
          );
          const domesticOpening = await fetchDomesticOpening(
            titleSummaryLink,
            document
          );
          const releaseDate = await fetchReleaseDate(
            titleSummaryLink,
            document
          );
          const runningTime = await fetchRunningTime(
            titleSummaryLink,
            document
          );
          const genres = await fetchGenres(titleSummaryLink, document); // Adicionando a coleta de gêneros
          const domesticProfit = await fetchDomesticProfit(
            titleSummaryLink,
            document
          );
          const internationalProfit = await fetchInternationalProfit(
            titleSummaryLink,
            document
          );
          const worldwideProfit = await fetchWorldwideProfit(
            titleSummaryLink,
            document
          );

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
    await fs.promises.writeFile(
      "filmes_com_dados_combinados.json",
      jsonContent
    );

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
