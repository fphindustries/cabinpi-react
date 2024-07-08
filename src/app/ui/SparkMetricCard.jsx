import sparkline from "node-sparkline";
import parse from "html-react-parser";
import { Card, CardHeader, CardBody, Row, Col } from "react-bootstrap";

export default async function SparkMetricCard({
  label,
  value,
  sparkData,
  sparkField,
  unit
}) {
  const fieldData = sparkData
    .map((d) => d[sparkField]);

  const svg = sparkline({
    values: fieldData,
    width: 135,
    height: 50,
    stroke: "#57bd0f",
    strokeWidth: 1.25,
    strokeOpacity: 1,
  });
  return (
    <Card className="mb-2">
      <CardBody>
        <div className="row align-items-center">
          <div className="col-6">
            <p className="text-3xl">{value} <span className="text-gray-400">{unit}</span></p>
            <p className="text-sm italic">{label}</p>
          </div>
          <div className="col-6 align-middle">
            {parse(svg)}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
