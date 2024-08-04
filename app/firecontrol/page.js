"use server";
import {Grid } from "@mui/material";
import { getGPIOState } from "../lib/gpio";
import FireControlSwitches from "./switches";

export default async function FireControl() {
    const gpioState = await getGPIOState();
    return (
        <Grid container spacing={2}>
            <FireControlSwitches gpioState={gpioState}/>
        </Grid>
    );
}