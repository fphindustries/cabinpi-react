import { Card, CardHeader, CardBody, Row, Col } from "react-bootstrap";

export default async function MetricCard({ label, value }) {
  return (
    <Card className="mb-2">
      <CardBody>
        <div className="row align-items-center">
          <div className="col-12">
            <p className="text-3xl">{value}</p>
            <p className="text-sm italic">{label}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
