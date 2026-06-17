const EXPECTED_HEADERS = [
  "legalName",
  "tradeName",
  "taxId",
  "contactName",
  "email",
  "phone",
  "website",
  "zipCode",
  "addressLine1",
  "addressLine2",
  "neighborhood",
  "city",
  "state",
] as const;

type CsvRow = Record<(typeof EXPECTED_HEADERS)[number], string>;

function normalizeCell(cell: string) {
  return cell.trim();
}

export function parseCsv(content: string) {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(normalizeCell(currentCell));
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(normalizeCell(currentCell));
      currentCell = "";

      if (currentRow.some((value) => value.length > 0)) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(normalizeCell(currentCell));
  }

  if (currentRow.some((value) => value.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

export function parseCustomerImportCsv(content: string): CsvRow[] {
  const rows = parseCsv(content);

  if (rows.length < 2) {
    throw new Error("CSV sem dados suficientes.");
  }

  const [headerRow, ...dataRows] = rows;
  const normalizedHeaders = headerRow.map((header) => header.trim());

  for (const header of EXPECTED_HEADERS) {
    if (!normalizedHeaders.includes(header)) {
      throw new Error(`Coluna obrigatoria ausente: ${header}`);
    }
  }

  return dataRows.map((row) => {
    const record = {} as CsvRow;

    for (const header of EXPECTED_HEADERS) {
      const columnIndex = normalizedHeaders.indexOf(header);
      record[header] = row[columnIndex] ?? "";
    }

    return record;
  });
}
