import jsdom from "jsdom";
import fs from "fs";
import fetch from "node-fetch";

const { JSDOM } = jsdom;

const delayMili = 500; //Definindo um atraso entre requisições (500ms)

async function fetchDistribuidor(titleSummaryLink) {
  try {
    await delay(delayMili); //Atraso entre as requisições para evitar bloqueios
    const response = await fetch(titleSummaryLink); //Realiza a requisição para o link do Title Summary
    const html = await response.text(); //Obtém o conteúdo da página em HTML
    const dom = new JSDOM(html); //Cria um DOM a partir do HTML
    const document = dom.window.document; //Acessa o documento HTML

    const distribuidorElement = document.querySelector(
      '.a-section.a-spacing-none.mojo-summary-values.mojo-hidden-from-mobile > .a-section.a-spacing-none:first-child'
    ); //Seletor CSS ajustado para buscar o distribuidor na página
    
    if (distribuidorElement) {
      let distribuidorText = distribuidorElement.textContent.trim(); //Obtém o texto do distribuidor e remove espaços em excesso

      distribuidorText = distribuidorText
        .replace("Domestic Distributor", "") //Remove o texto "Domestic Distributor"
        .replace("See full company information", ""); //Remove o texto "See full company information"

      distribuidorText = distribuidorText.trim(); //Remove espaços extras após a remoção dos textos

      return distribuidorText || null; //Se o texto do distribuidor não estiver vazio, retorna o nome do distribuidor
    } else {
      return null; //Se o distribuidor não for encontrado, retorna null
    }
  } catch (error) {
    console.error(`Erro ao coletar o distribuidor do link ${titleSummaryLink}:`, error); //Loga o erro caso ocorra
    return null; //Retorna null em caso de erro
  }
}

function delay(mili) {
  return new Promise((resolve) => setTimeout(resolve, mili)); //Retorna uma Promise para o atraso
}

async function processarDistribuidores(jsonPath) {
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8"); //Lê o arquivo JSON com os filmes
    const filmesPorAno = JSON.parse(rawData); //Converte o conteúdo JSON para um objeto JavaScript

    const anos = Object.keys(filmesPorAno); //Obtém os anos como chaves do objeto
    let filmesComDistribuidores = {}; //Objeto para armazenar os filmes com distribuidores

    for (const ano of anos) {
      console.log(`Processando filmes do ano ${ano}...`); //Loga o ano que está sendo processado
      const filmes = filmesPorAno[ano]; //Obtém os filmes para o ano atual

      filmesComDistribuidores[ano] = []; //Inicializa o array para filmes do ano
      const filmesParaTestar = filmes; //Aqui é decidido processar todos os filmes

      for (const filme of filmesParaTestar) {
        const { titleSummaryLink, filmeLink } = filme; //Desestrutura os links do filme

        if (titleSummaryLink) {
          const distribuidor = await fetchDistribuidor(titleSummaryLink); //Tenta buscar o distribuidor
          filmesComDistribuidores[ano].push({
            filmeLink,
            titleSummaryLink,
            distribuidor, //Adiciona o distribuidor no objeto do filme
          });
        } else {
          filmesComDistribuidores[ano].push({
            filmeLink,
            titleSummaryLink: null,
            distribuidor: null, //Adiciona um objeto sem distribuidor
          });
        }
      }
    }

    const jsonContent = JSON.stringify(filmesComDistribuidores, null, 2); //Converte os dados dos filmes com distribuidores para JSON
    fs.writeFileSync("filmes_testados_com_distribuidor.json", jsonContent); //Salva os dados em um arquivo JSON

    console.log(
      "Dados dos filmes com Distribuidores salvos em filmes_testados_com_distribuidor.json"
    ); //Loga quando os dados forem salvos com sucesso
  } catch (error) {
    console.error(`Erro ao processar distribuidores:`, error); //Loga o erro caso ocorra
  }
}

const jsonPath = "filmes_links_e_title_summary_por_ano.json"; //Caminho para o arquivo JSON com os links dos filmes e Title Summary

processarDistribuidores(jsonPath); //Chama a função principal para processar os distribuidores

export { processarDistribuidores }; //Exporta a função principal para ser reutilizada em outros arquivos
