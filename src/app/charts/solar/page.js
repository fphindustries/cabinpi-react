"use client";

import useSWR from "swr";
import React, { Fragment } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Container,
} from "react-bootstrap";
import Chart from "@/app/ui/Chart";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data, error, isLoading } = useSWR("/api/solar", fetcher);

  if (error) return "An error has occurred.";
  if (isLoading) return "Loading...";

  //const panelData = solarHistory.filter(h => h.field == 'dispavgVpv').map(d => d.val);
  return (
    <Container fluid>
      <Row>
        <Col sm={12}>
          <Chart data={data} />
        </Col>
      </Row>
    </Container>
  );
}
