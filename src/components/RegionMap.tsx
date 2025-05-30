import React, { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import type { MapDataItem, ExcelRow } from "../types";
import type { FeatureCollection, Feature } from "geojson";

import statesProvincesGeoJson from "../geojsons/states_provinces.json";
const geoJsonData = statesProvincesGeoJson as FeatureCollection;

interface RegionMapProps {
  data: ExcelRow[];
  countryId: string;
}

const sentimentColors = {
  0: am5.color(0xff6b6b),
  1: am5.color(0xfed766),
  2: am5.color(0x70c1b3),
};

const RegionMap: React.FC<RegionMapProps> = ({ data, countryId }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const root = useRef<am5.Root | null>(null);
  const polygonSeries = useRef<am5map.MapPolygonSeries | null>(null);

  // Get regions in the selected country and map sentiment
  const regionData = React.useMemo(() => {
    // Filter geoJSON features for this country
    const featuresForCountry = geoJsonData.features.filter(
      (f: Feature) => f.properties?.admin === countryId
    );

    // Map data sentiment by region (Region = state/province id)
    const sentimentByRegion: Record<string, number> = {};
    data
      .filter((d) => d.Country === countryId)
      .forEach(({ Region, sentiment }) => {
        const s = typeof sentiment === "string" ? parseInt(sentiment) : sentiment;
        sentimentByRegion[Region] = s;
      });

    return featuresForCountry.map((feature: Feature) => {
      const regionId = feature.properties?.iso_3166_2 || feature.id;
      const sentiment = sentimentByRegion[regionId];
      return {
        id: regionId,
        sentiment,
        fill: sentimentColors[sentiment as 0 | 1 | 2] || am5.color(0x999999),
        name: feature.properties?.name,
      };
    });
  }, [countryId, data]);

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
        geoJSON: {
          type: "FeatureCollection",
          features: geoJsonData.features.filter(
            (f: Feature) => f.properties?.admin === countryId
          ),
        },
        valueField: "sentiment",
        calculateAggregates: true,
      })
    );

    polygonSeries.current.mapPolygons.template.setAll({
      tooltipText: "{name}\nSentiment: {sentiment}",
      interactive: true,
    });

    polygonSeries.current.data.setAll(regionData);

    polygonSeries.current.mapPolygons.template.adapters.add("fill", (fill, target) => {
      const dataContext = target.dataItem?.dataContext as MapDataItem | undefined;
      return dataContext?.fill || fill;
    });

    return () => {
      root.current?.dispose();
      root.current = null;
      polygonSeries.current = null;
    };
  }, [countryId]);

  useEffect(() => {
    if (!polygonSeries.current) return;
    polygonSeries.current.data.setAll(regionData);
  }, [regionData]);

  return <div ref={chartRef} className="w-full h-[600px]" />;
};

export default RegionMap;
