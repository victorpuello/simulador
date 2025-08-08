export function exportToCSV(
  rows: Array<Record<string, any>>,
  filename: string = 'export.csv'
) {
  if (!rows || rows.length === 0) {
    return;
  }

  const headers = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  const escape = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replaceAll('"', '""');
    // Encerrar en comillas si contiene separadores o saltos
    return /[",\n]/.test(str) ? `"${str}"` : str;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];

  const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


