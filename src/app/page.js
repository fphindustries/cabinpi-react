import React, { Fragment } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Container,
} from "react-bootstrap";
import SolarCard from "./ui/SolarCard";
import SensorCard from "./ui/SensorCard";

export default async function Home() {

  //const panelData = solarHistory.filter(h => h.field == 'dispavgVpv').map(d => d.val);
  return (
    <Container fluid>
      <Row>
        <Col sm>
          <SolarCard />
        </Col>
        <Col sm>
          <SensorCard />
        </Col>
      </Row>
      <Row>
        <Col>
          <Card>
            <CardHeader>Camera</CardHeader>
            <CardBody>
              <img src="/images/latest" alt="Latest"></img>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
