import jsdom from "jsdom";
import fs from "fs";
import fetch from "node-fetch";

const { JSDOM } = jsdom;

const delayMili = 500;

async function fetchLinkTitleSummary(filmeLink) {
  try {
    const fullFilmeLink = filmeLink.startsWith("http")
      ? filmeLink
      : `https://www.boxofficemojo.com${filmeLink}`;
    await delay(delayMili);
    const response = await fetch(fullFilmeLink);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const titleSummaryLinkElement = document.querySelector(
      "a.a-link-normal.mojo-title-link.refiner-display-highlight"
    );
    if (titleSummaryLinkElement) {
      return `https://www.boxofficemojo.com${titleSummaryLinkElement.getAttribute(
        "href"
      )}`;
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      `Erro ao coletar o Title Summary para o link ${filmeLink}:`,
      error
    );
    return null;
  }
}

async function fetchFilmesPorAno(ano) {
  try {
    const response = await fetch(
      `https://www.boxofficemojo.com/year/world/${ano}/`
    );
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const filmes = Array.from(
      document.querySelectorAll(
        "td.a-text-left.mojo-field-type-release_group a"
      )
    ).map((link) => {
      const filmeLink = `https://www.boxofficemojo.com${link.getAttribute(
        "href"
      )}`;
      return filmeLink;
    });

    let filmesComTitleSummary = [];

    for (const filmeLink of filmes) {
      const titleSummaryLink = await fetchLinkTitleSummary(filmeLink);
      filmesComTitleSummary.push({ filmeLink, titleSummaryLink });
    }

    return { ano, filmes: filmesComTitleSummary };
  } catch (error) {
    console.error(`Erro ao coletar dados para o ano ${ano}:`, error);
    return { ano, filmes: [] };
  }
}

function delay(mili) {
  return new Promise((resolve) => setTimeout(resolve, mili));
}

async function init() {
  const anos = Array.from({ length: 2024 - 1977 + 1 }, (_, i) => i + 1977);
  const filmesPorAno = {};

  for (const ano of anos) {
    console.log(`Coletando dados para o ano ${ano}...`);
    await delay(delayMili);
    const dadosAno = await fetchFilmesPorAno(ano);
    filmesPorAno[dadosAno.ano] = dadosAno.filmes;
  }
  const jsonContent = JSON.stringify(filmesPorAno, null, 2);
  fs.writeFileSync("filmes_links_e_title_summary_por_ano.json", jsonContent);

  console.log(
    "Links dos filmes e Title Summary salvos em filmes_links_e_title_summary_por_ano.json"
  );
}

init();
