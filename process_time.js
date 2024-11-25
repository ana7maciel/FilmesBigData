import jsdom from "jsdom";
import fs from "fs";
import fetch from "node-fetch";

const { JSDOM } = jsdom;
const delayMili = 500;

async function fetchRunningTime(titleSummaryLink) {
  try {
    await delay(delayMili);
    const response = await fetch(titleSummaryLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Seletor ajustado para buscar o "Running Time"
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

function delay(mili) {
  return new Promise((resolve) => setTimeout(resolve, mili));
}

async function processarRunningTimes(jsonPath) {
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const filmesPorAno = JSON.parse(rawData);

    const anos = Object.keys(filmesPorAno);
    let filmesComRunningTimes = {};

    for (const ano of anos) {
      console.log(`Processando filmes do ano ${ano}...`);
      const filmes = filmesPorAno[ano];

      filmesComRunningTimes[ano] = [];
      const filmesParaTestar = filmes; // Processar todos os filmes

      for (const filme of filmesParaTestar) {
        const { titleSummaryLink, filmeLink } = filme;

        if (titleSummaryLink) {
          const runningTime = await fetchRunningTime(titleSummaryLink);

          filmesComRunningTimes[ano].push({
            filmeLink,
            titleSummaryLink,
            runningTime,
          });
        } else {
          filmesComRunningTimes[ano].push({
            filmeLink,
            titleSummaryLink: null,
            runningTime: null,
          });
        }
      }
    }

    const jsonContent = JSON.stringify(filmesComRunningTimes, null, 2);
    fs.writeFileSync("filmes_com_running_times.json", jsonContent);

    console.log(
      "Dados dos filmes com tempos de duração salvos em filmes_com_running_times.json"
    );
  } catch (error) {
    console.error(`Erro ao processar os tempos de duração:`, error);
  }
}

// Caminho para o arquivo JSON gerado no script.js
const jsonPath = "filmes_links_e_title_summary_por_ano.json";

// Chama a função principal
processarRunningTimes(jsonPath);
