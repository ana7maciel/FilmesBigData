import jsdom from "jsdom"; //Biblioteca para manipular o DOM em um ambiente de servidor (sem navegador)
import fs from "fs"; //Biblioteca para manipulação de arquivos no sistema de arquivos
import nodeFetch from "node-fetch"; //Biblioteca para fazer requisições HTTP
import slugify from "slugify"; //Biblioteca para criar slugs de URLs

const { JSDOM } = jsdom; //Desestruturando JSDOM para usar no código

//Definindo um atraso entre requisições em milissegundos (500ms)
const delayMili = 500;

//Função personalizada de fetch com cache
async function fetch(url) {
  //Verifica se a pasta "cache" existe, caso contrário, cria
  if (!fs.existsSync("cache")) {
    fs.mkdirSync("cache");
  }

  //Nome do arquivo de cache baseado no slug da URL
  const fileName = `cache/${slugify(url)}.html`;

  //Verifica se o arquivo já existe no cache
  if (fs.existsSync(fileName)) {
    console.log("Hit cache at ".concat(fileName)); //Se o arquivo existe, usa o cache
    const cache = (await fs.promises.readFile(fileName)).toString();
    return {
      async text() {
        return cache; //Retorna o conteúdo do cache
      },
    };
  }

  //Se o arquivo não está no cache, faz a requisição HTTP
  //await delay(delayMili); // Adiciona um atraso entre as requisições

  console.log("HTTP GET ".concat(url)); //Log para saber qual URL está sendo acessada
  const response = await nodeFetch(url); //Faz a requisição GET
  const text = await response.text(); //Extrai o conteúdo da resposta

  //Se a resposta for bem-sucedida (status 200), armazena o conteúdo no cache
  if (response.status === 200) {
    await fs.promises.writeFile(fileName, text);
  } else {
    throw new Error("HTTP Error!"); //Se o status não for 200, lança um erro
  }
  
  //Modifica a função `text` para retornar o conteúdo da resposta
  response.text = async () => {
    return text;
  };

  return response; //Retorna a resposta com o conteúdo
}

// Função para buscar o link do "Title Summary" de um filme
async function fetchLinkTitleSummary(filmeLink) {
  try {
    // Garante que o link seja completo (adicionando o domínio se necessário)
    const fullFilmeLink = filmeLink.startsWith("http")
      ? filmeLink
      : `https://www.boxofficemojo.com${filmeLink}`;

    //Faz a requisição para o link do filme
    const response = await fetch(fullFilmeLink);
    const html = await response.text(); //Obtém o conteúdo HTML da página

    //Cria um novo DOM a partir do conteúdo HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    //Tenta encontrar o elemento que contém o link para o Title Summary
    const titleSummaryLinkElement = document.querySelector(
      "a.a-link-normal.mojo-title-link.refiner-display-highlight"
    );

    //Se o link for encontrado, retorna a URL completa do Title Summary
    if (titleSummaryLinkElement) {
      return `https://www.boxofficemojo.com${titleSummaryLinkElement.getAttribute("href")}`;
    } else {
      return null; //Se não encontrar, retorna null
    }
  } catch (error) {
    //Em caso de erro, loga a falha e retorna null
    console.error(`Erro ao coletar o Title Summary para o link ${filmeLink}:`, error);
    return null;
  }
}

//Função para buscar os filmes de um determinado ano
async function fetchFilmesPorAno(ano) {
  try {
    //Realiza uma requisição HTTP para buscar os filmes do ano especificado
    const response = await fetch(`https://www.boxofficemojo.com/year/world/${ano}/`);
    const html = await response.text(); // Obtém o conteúdo HTML

    //Cria um novo DOM com o HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    //Encontra todos os links dos filmes na página
    const filmes = Array.from(
      document.querySelectorAll("td.a-text-left.mojo-field-type-release_group a")
    ).map((link) => {
      const filmeLink = `https://www.boxofficemojo.com${link.getAttribute("href")}`;
      return filmeLink;
    });

    let filmesComTitleSummary = []; //Array para armazenar filmes com links de Title Summary

    //Para cada link de filme, tenta coletar o Title Summary
    for (const filmeLink of filmes) {
      const titleSummaryLink = await fetchLinkTitleSummary(filmeLink);
      filmesComTitleSummary.push({ filmeLink, titleSummaryLink }); //Adiciona ao array
    }

    return { ano, filmes: filmesComTitleSummary }; //Retorna o ano e a lista de filmes com Title Summary
  } catch (error) {
    //Em caso de erro, loga e retorna um array vazio
    console.error(`Erro ao coletar dados para o ano ${ano}:`, error);
    return { ano, filmes: [] };
  }
}

//Função para adicionar um atraso entre as requisições
function delay(mili) {
  return new Promise((resolve) => setTimeout(resolve, mili));
}

//Função principal para iniciar o processo
async function init() {
  //Cria um array com os anos de 1977 a 2024
  const anos = Array.from({ length: 2024 - 1977 + 1 }, (_, i) => i + 1977);
  const filmesPorAno = {}; // Objeto para armazenar os filmes por ano

  //Para cada ano, coleta os dados
  for (const ano of anos) {
    console.log(`Coletando dados para o ano ${ano}...`);
    const dadosAno = await fetchFilmesPorAno(ano);
    filmesPorAno[dadosAno.ano] = dadosAno.filmes; //Armazena os dados no objeto
  }

  //Converte os dados para JSON e salva em um arquivo
  const jsonContent = JSON.stringify(filmesPorAno, null, 2);
  await fs.promises.writeFile(
    "filmes_links_e_title_summary_por_ano.json",
    jsonContent
  );

  console.log(
    "Links dos filmes e Title Summary salvos em filmes_links_e_title_summary_por_ano.json"
  );
}

init();
