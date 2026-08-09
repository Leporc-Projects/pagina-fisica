export const readResultsWorkbook = async (file) => {
  const { default: readExcelFile } = await import("read-excel-file/browser");
  const sheets = await readExcelFile(file);
  return { sheets };
};

export const writeResultsWorkbook = async (workbook, fileName) => {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  await writeExcelFile(workbook, {
    fontFamily: "Arial",
    fontSize: 10,
  }).toFile(fileName);
};
