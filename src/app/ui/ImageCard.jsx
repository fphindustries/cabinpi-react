import { Card, CardHeader, CardBody } from "react-bootstrap";
import { format } from "date-fns";

export default function ImageCard(params) {
  const file = params.file;
  const fileParts = file.split("-");
  const fileDate = format(
    new Date(fileParts[0], fileParts[1]-1, fileParts[2], fileParts[3], fileParts[4]),
    "eeee, M/d/y h:mm bb");
  console.log(fileDate);
  return (
    <Card>
      <CardHeader>{fileDate}</CardHeader>
      <CardBody>
        <a href={`/images/${file}`}>
          {/* <Image
              src={`/images/${file}`}
              alt={file}
              width="3280"
              height="2460"
            ></Image> */}
          <img
            src={`/images/${file}`}
            alt={file}
            width="3280"
            height="2460"
          ></img>{" "}
        </a>
      </CardBody>
    </Card>
  );
}
