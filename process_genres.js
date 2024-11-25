import jsdom from "jsdom";
import fs from "fs";
import fetch from "node-fetch";

const { JSDOM } = jsdom;
const delayMili = 500;

async function fetchGenres(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Seletor ajustado para buscar os gêneros
    const genresSections = document.querySelectorAll('.a-section.a-spacing-none');

    for (let section of genresSections) {
      const spans = section.querySelectorAll('span');
      for (let span of spans) {
        if (span.textContent.includes("Genres")) {
          const genresElement = span.nextElementSibling;
          if (genresElement) {
            // Limpando e separando os gêneros
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

async function processarGenres(jsonPath) {
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const filmesPorAno = JSON.parse(rawData);

    const anos = Object.keys(filmesPorAno);
    let filmesComGenres = {};

    for (const ano of anos) {
      console.log(`Processando filmes do ano ${ano}...`);
      const filmes = filmesPorAno[ano];

      filmesComGenres[ano] = [];
      const filmesParaTestar = filmes; // Processar todos os filmes

      for (const filme of filmesParaTestar) {
        const { titleSummaryLink, filmeLink } = filme;

        if (titleSummaryLink) {
          const genres = await fetchGenres(titleSummaryLink);

          filmesComGenres[ano].push({
            filmeLink,
            titleSummaryLink,
            genres,
          });
        } else {
          filmesComGenres[ano].push({
            filmeLink,
            titleSummaryLink: null,
            genres: null,
          });
        }
      }
    }

    const jsonContent = JSON.stringify(filmesComGenres, null, 2);
    fs.writeFileSync("filmes_com_genres.json", jsonContent);

    console.log(
      "Dados dos filmes com Gêneros salvos em filmes_com_genres.json"
    );
  } catch (error) {
    console.error(`Erro ao processar os gêneros:`, error);
  }
}

// Caminho para o arquivo JSON gerado no script.js
const jsonPath = "filmes_links_e_title_summary_por_ano.json";

// Chama a função principal
processarGenres(jsonPath);
