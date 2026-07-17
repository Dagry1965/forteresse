import * as Handlebars from "handlebars";

export function registerPdfHelpers() {
  Handlebars.registerHelper("multiply", (a, b) => {
    return (Number(a) * Number(b)).toFixed(2);
  });

  Handlebars.registerHelper("formatDate", (date) => {
    return new Date(date).toLocaleDateString("fr-CH");
  });

  Handlebars.registerHelper("formatMoney", (value) => {
    return Number(value).toFixed(2);
  });
}
