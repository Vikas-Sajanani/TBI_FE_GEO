import React, { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import type { MapDataItem, ExcelRow } from "../types";
import type { FeatureCollection, Feature } from "geojson";

import statesProvincesGeoJson from "../geojsons/states_provinces.json"; // <-- put this JSON in your project
const geoJsonData = statesProvincesGeoJson as FeatureCollection;

interface SentimentMapProps {
  data: ExcelRow[];
  onCountrySelect: (countryId: string) => void;
}

const sentimentColors = {
  0: am5.color(0xff6b6b), // Negative (red)
  1: am5.color(0xfed766), // Neutral (yellow)
  2: am5.color(0x70c1b3), // Positive (green)
};

const SentimentMap: React.FC<SentimentMapProps> = ({ data, onCountrySelect }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const root = useRef<am5.Root | null>(null);
  const polygonSeries = useRef<am5map.MapPolygonSeries | null>(null);

  // Aggregate sentiment by country
  const aggregatedCountrySentiments = React.useMemo(() => {
    const countrySentiments: Record<string, number[]> = {};

    data.forEach(({ Country, sentiment }) => {
      if (!Country) return;
      if (!countrySentiments[Country]) countrySentiments[Country] = [];
      countrySentiments[Country].push(typeof sentiment === "string" ? parseInt(sentiment) : sentiment);
    });

    const avgSentiments: Record<string, number> = {};
    for (const country in countrySentiments) {
      const arr = countrySentiments[country];
      avgSentiments[country] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }
    return avgSentiments;
  }, [data]);

  useEffect(() => {
    if (!chartRef.current) return;

    root.current = am5.Root.new(chartRef.current);

    const chart = root.current.container.children.push(
      am5map.MapChart.new(root.current, {
        panX: "none",
        panY: "none",
        wheelY: "none",
        projection: am5map.geoMercator(),
      })
    );

    polygonSeries.current = chart.series.push(
      am5map.MapPolygonSeries.new(root.current, {
        geoJSON: geoJsonData,
        valueField: "sentiment",
        calculateAggregates: true,
      })
    );

    polygonSeries.current.mapPolygons.template.setAll({
      tooltipText: "{admin}\nSentiment: {sentiment}",
      interactive: true,
      cursorOverStyle: "pointer",
    });

polygonSeries.current.mapPolygons.template.events.on("click", (ev) => {
  const dataContext = ev.target.dataItem?.dataContext as MapDataItem | undefined;
  const countryId = dataContext?.id;
  if (countryId) {
    onCountrySelect(countryId);
  }
});

    polygonSeries.current.mapPolygons.template.adapters.add("fill", (fill, target) => {
      const dataContext = target.dataItem?.dataContext as MapDataItem | undefined;
      return dataContext?.fill || fill;
    });

    return () => {
      root.current?.dispose();
      root.current = null;
      polygonSeries.current = null;
    };
  }, [onCountrySelect]);

  useEffect(() => {
    if (!polygonSeries.current) return;

    // Color all states based on their country's aggregated sentiment
const dataWithFill = geoJsonData.features.map((feature: Feature) => {
  const countryId = feature.properties?.admin;
  const sentiment = aggregatedCountrySentiments[countryId as string];
  return {
    id: feature.properties?.iso_3166_2 || feature.id,
    sentiment,
    fill: sentimentColors[sentiment as 0 | 1 | 2] || am5.color(0x999999),
    admin: countryId,
  };
});

    polygonSeries.current.data.setAll(dataWithFill);
  }, [aggregatedCountrySentiments]);

  return <div ref={chartRef} className="w-full h-[600px]" />;
};

export default SentimentMap;
