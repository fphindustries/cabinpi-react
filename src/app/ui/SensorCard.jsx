import { Card, CardHeader, CardBody } from "react-bootstrap";
import { fetchSensors, fetchSensorHistory } from "../lib/data";
import SparkMetricCard from "./SparkMetricCard";

export default async function SensorCard() {
  const sensors = await fetchSensors();
  const sensorHistory = await fetchSensorHistory();
  return (
    <Card>
      <CardHeader>Climate</CardHeader>
      <CardBody>
        <SparkMetricCard
          label="Outside Temp"
          value={sensors.ext_f.toFixed(1)}
          sparkData={sensorHistory}
          sparkField="ext_f"
          unit="°"
        />
        <SparkMetricCard
          label="Inside Temp"
          value={sensors.case_f.toFixed(1)}
          sparkData={sensorHistory}
          sparkField="case_f"
          unit="°"
        />
        <SparkMetricCard
          label="Humidity"
          value={sensors.humidity.toFixed(1)}
          sparkData={sensorHistory}
          sparkField="humidity"
          unit="%"
        />
        <SparkMetricCard
          label="Pressure"
          value={sensors.inHg.toFixed(1)}
          sparkData={sensorHistory}
          sparkField="inHg"
          unit="inHg"
        />
      </CardBody>
    </Card>
  );
}
