import * as XLSX from "xlsx";
import type { ExcelRow } from "../types";

/**
 * Fetches the Excel file from a URL and parses it into JSON rows
 * @param url string path to the Excel file (e.g. "/geo_sentiments.xlsx")
 */
export const fetchAndParseExcel = async (url: string): Promise<ExcelRow[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<ExcelRow>(sheet);
  return json;
};
