"use client";
import {useState} from 'react';
import { FormControlLabel, FormGroup, Switch } from "@mui/material";
import { setPumpState,setWellState } from "../lib/gpio";

export default function FireControlSwitches(props){
    const {gpioState} = props;
    const [well, setWell] = useState(gpioState.well);
    const [pump, setPump] = useState(gpioState.pump);

    async function wellChanged(e) {
        setWell(await setWellState(e.target.checked));
    }

    async function pumpChanged(e) {
        setPump(await setPumpState(e.target.checked));
    }

    return (
        <FormGroup>
            <FormControlLabel control={<Switch checked={well} onChange={wellChanged} />} label="Well Pump" />
            <FormControlLabel control={<Switch checked={pump} onChange={pumpChanged} />} label="Fire Pump" />
        </FormGroup>
    );
}

