import { Card, CardHeader, CardBody } from "react-bootstrap";
import { fetchSolar, fetchSolarHistory } from "../lib/data";
import SparkMetricCard from "./SparkMetricCard";
import MetricCard from "./MetricCard";

export default async function SolarCard(params) {
  const solar = await fetchSolar();

  var solarState = "Unknown";
  switch (solar.batteryState) {
    case 0:
      solarState = "Resting";
      break;
    case 3:
      solarState = "Absorb";
      break;
    case 4:
      solarState = "Bulk MPPT";
      break;
    case 5:
      solarState = "Float";
      break;
    case 6:
      solarState = "Float MPPT";
      break;
    case 7:
      solarState = "Equalize";
      break;
    case 10:
      solarState = "Hyper VOC";
      break;
    case 18:
      solarState = "Equalize MPPT";
      break;
  }

  const solarHistory = await fetchSolarHistory();
  return (
    <Card>
      <CardHeader>Solar</CardHeader>
      <CardBody>
        <MetricCard label="System State" value={solarState} />
        <SparkMetricCard
          label="Panel Voltage"
          value={solar.dispavgVpv}
          sparkData={solarHistory}
          sparkField="dispavgVpv"
          unit="V"
        />
        <SparkMetricCard
          label="Battery Voltage"
          value={solar.dispavgVbatt}
          sparkData={solarHistory}
          sparkField="dispavgVbatt"
          unit="V"
        />
        <SparkMetricCard
          label="Amp Hours"
          value={solar.AmpHours}
          sparkData={solarHistory}
          sparkField="AmpHours"
          unit="Ah"
        />
      </CardBody>
    </Card>
  );
}
