import data from "./filmes_com_dados_combinados.json" assert { type: "json" };
import fs from "fs";

for (const year in data) {
  data[year] = data[year].map((d) => ({
    ...d,
    domesticProfit:
      d.domesticProfit &&
      Number(d.domesticProfit.replace("$", "").replaceAll(",", "")),
    internationalProfit:
      d.internationalProfit &&
      Number(d.internationalProfit.replace("$", "").replaceAll(",", "")),
    worldwideProfit:
      d.worldwideProfit &&
      Number(d.worldwideProfit.replace("$", "").replaceAll(",", "")),
  }));
}

fs.writeFileSync("data.json", JSON.stringify(data, undefined, 2));
