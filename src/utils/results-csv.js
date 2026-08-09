const stripBom = (text) => text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;

export const parseCsv = (input) => {
  if (typeof input !== "string") throw new TypeError("El CSV debe ser texto.");
  const source = stripBom(input);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let justClosedQuote = false;

  const pushField = () => {
    row.push(field);
    field = "";
    justClosedQuote = false;
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          justClosedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (justClosedQuote && ![",", "\r", "\n"].includes(character)) {
      throw new SyntaxError(`CSV inválido: contenido después de comillas en la posición ${index + 1}.`);
    }
    if (character === '"') {
      if (field !== "") {
        throw new SyntaxError(`CSV inválido: comillas dentro de un campo en la posición ${index + 1}.`);
      }
      quoted = true;
    } else if (character === ",") {
      pushField();
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      pushRow();
    } else {
      field += character;
    }
  }

  if (quoted) throw new SyntaxError("CSV inválido: campo entre comillas sin cerrar.");
  if (field !== "" || row.length > 0 || justClosedQuote) pushRow();
  return rows;
};

export const csvWorkbook = (text, sheet = "CSV") => ({
  sheets: [{ sheet, data: parseCsv(text) }],
});
