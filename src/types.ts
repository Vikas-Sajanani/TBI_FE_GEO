// src/types.ts
import * as am5 from "@amcharts/amcharts5";

export interface ExcelRow {
  Country: string;
  Region: string;
  sentiment: number | string;
}

export interface MapDataItem {
  id: string;          // country or region id
  sentiment: number;   // 0, 1, 2
  fill: am5.Color;
}