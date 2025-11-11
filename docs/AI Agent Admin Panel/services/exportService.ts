// src/services/exportService.ts
export const exportService = {
  downloadCSV: (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      console.warn("No data to export.");
      throw new Error("No data available for export.");
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')]; // Header row

    for (const row of data) {
      const values = headers.map(header => {
        let cell = row[header];
        if (cell === null || cell === undefined) {
          cell = "";
        } else if (Array.isArray(cell)) {
          cell = cell.join('; '); // Join arrays into a string
        } else if (typeof cell === 'object' && !(cell instanceof Date)) {
          cell = JSON.stringify(cell); // Stringify objects
        } else {
          cell = String(cell);
        }
        // Escape quotes and commas
        cell = cell.replace(/"/g, '""');
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          cell = `"${cell}"`;
        }
        return cell;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
