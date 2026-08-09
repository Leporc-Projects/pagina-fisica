export const downloadLocalFile = ({ contents, mimeType, filename }) => {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const copyLocalText = async (contents) => {
  await navigator.clipboard.writeText(contents);
};
