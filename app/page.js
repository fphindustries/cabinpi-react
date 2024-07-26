import { css } from "@emotion/react";
import styles from "./page.module.css";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from '@mui/material/Typography';
import Title from "./ui/title";
import Link from "next/link";



export default function Home() {
  return (
    <main className={styles.main}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid xs={8}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: 240,
              }}
            >
              <Title>Recent Deposits</Title>
              <Typography component="p" variant="h4">
                $3,024.00
              </Typography>
              <Typography color="text.secondary" sx={{ flex: 1 }}>
                on 15 March, 2019
              </Typography>
              <div>
                <Link color="primary" href="#" >
                  View balance
                </Link>
              </div>
            </Paper>
          </Grid>
          <Grid xs={4}>
            <Paper>xs=4</Paper>
          </Grid>
          <Grid xs={4}>
            <Paper>xs=4</Paper>
          </Grid>
          <Grid xs={8}>
            <Paper>xs=8</Paper>
          </Grid>
        </Grid>
      </Box>
    </main>
  );
}
