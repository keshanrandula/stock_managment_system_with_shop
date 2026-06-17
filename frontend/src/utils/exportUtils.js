/**
 * Exports data to a CSV file.
 * @param {Array<string>} headers - Headers to map fields from objects.
 * @param {Array<object>} data - Data list of objects.
 * @param {string} filename - Filename for download.
 * @param {Array<string>} displayHeaders - Custom names for display headers (optional).
 */
export const exportToCSV = (headers, data, filename = 'export.csv', displayHeaders = null) => {
  const csvRows = [];
  
  // Add display headers or keys
  const headerRow = displayHeaders || headers;
  csvRows.push(headerRow.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      // Handle nested properties if headers contain dots, e.g. "product.name"
      let fieldVal = row;
      const parts = header.split('.');
      for (const part of parts) {
        if (fieldVal === undefined || fieldVal === null) {
          fieldVal = '';
          break;
        }
        fieldVal = fieldVal[part];
      }
      
      const valStr = fieldVal !== undefined && fieldVal !== null ? String(fieldVal) : '';
      const escaped = valStr.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
