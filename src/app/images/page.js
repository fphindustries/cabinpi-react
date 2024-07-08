import fs, { Stats } from "fs";
import path from "path";
import {
  Container,
  Row,
  Col,
} from "react-bootstrap";
import ImageCard from "../ui/ImageCard";

export const dynamic = "force-dynamic"; // defaults to auto

export default async function Images() {
  const root = "/opt/images";
  const files = fs
    .readdirSync(root)
    .slice(-20)
    .reverse()
    .map((f) => {
      return path.parse(f).name;
    });

  return (
    <Container fluid>
      <Row>
        {files.map((file) => (
          <Col key={file} lg={4} md={6} sm={12}>
            <ImageCard file={file}></ImageCard>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
