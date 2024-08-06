import { css } from "@emotion/react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import Title from "./ui/title";
import Link from "next/link";
import { fetchSensorData } from "./lib/data";
import StatCard from "./ui/stat-card";
import { Card } from "@mui/material";
import { CardHeader } from "@mui/material";
import { CardContent } from "@mui/material";
import { Avatar } from "@mui/material";
import PageviewIcon from "@mui/icons-material/Pageview";
import MonitorHeart from "@mui/icons-material/MonitorHeart";
import { SolarPower } from "@mui/icons-material";
import {BatteryChargingFull, ElectricalServices, PowerSettingsNew, Bolt} from "@mui/icons-material";

export default function Home() {
  const sensorData = fetchSensorData();
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid>
          <Card>
            <CardHeader
              avatar={
                <Avatar>
                  <MonitorHeart />
                </Avatar>
              }
              title="Solar State"
            />
            <CardContent>
              <Typography variant="h4">MPPT</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card>
            <CardHeader
              avatar={
                <Avatar>
                  <SolarPower />
                </Avatar>
              }
              title="Panel Voltage"
            />
            <CardContent>
              <Typography variant="h4">48V</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card>
            <CardHeader
              avatar={
                <Avatar>
                  <BatteryChargingFull />
                </Avatar>
              }
              title="Battery Voltage"
            />
            <CardContent>
              <Typography variant="h4">13.8V</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card>
            <CardHeader
              avatar={
                <Avatar>
                  <Bolt />
                </Avatar>
              }
              title="Amp Hours"
            />
            <CardContent>
              <Typography variant="h4">64Ah</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid>
          <Card>
            <CardHeader
              avatar={
                <Avatar>
                  <PowerSettingsNew />
                </Avatar>
              }
              title="Inverter"
            />
            <CardContent>
              <Typography variant="h4">ON</Typography>
            </CardContent>
          </Card>
        </Grid>   
        <Grid>
          <Card>
            <CardHeader
              avatar={
                <Avatar>
                  <ElectricalServices />
                </Avatar>
              }
              title="Inverter Amps"
            />
            <CardContent>
              <Typography variant="h4">5.3A</Typography>
            </CardContent>
          </Card>
        </Grid>              
        <Grid xs={4}>
          <Paper>xs=4</Paper>
        </Grid>
        <Grid xs={8}>
          <Paper>xs=8</Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
