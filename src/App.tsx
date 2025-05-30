import React, { useEffect, useState } from "react";
import type { ExcelRow } from "./types";
import { fetchAndParseExcel } from "./utils/parseXls";
import SentimentMap from "./components/SentimentMap";

const App: React.FC = () => {
  const [data, setData] = useState<ExcelRow[]>([]);

  useEffect(() => {
    fetchAndParseExcel("/geo_sentiments.xlsx")
      .then(setData)
      .catch((err) => console.error("Failed to load Excel file:", err));
  }, []);

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Global Sentiment Heatmap</h1>
      {data.length === 0 ? (
        <p className="text-center">Loading data...</p>
      ) : (
        <SentimentMap data={data} />
      )}
    </div>
  );
};

export default App;
