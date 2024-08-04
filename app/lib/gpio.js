"use server";

import gpiox from "@iiot2k/gpiox";

const WELL_PIN=2;
const PUMP_PIN=3;
gpiox.init_gpio(WELL_PIN, gpiox.GPIO_MODE_OUTPUT,null);//,0);
gpiox.init_gpio(PUMP_PIN, gpiox.GPIO_MODE_OUTPUT,null);//,0);

export async function getGPIOState() {
    //gpiox.init_gpio(2, gpiox.GPIO_MODE_OUTPUT,
    return {
        well: gpiox.get_gpio_num(WELL_PIN)===1,
        pump: gpiox.get_gpio_num(PUMP_PIN)===1,
    }
}

export async function setWellState(state) {
    gpiox.set_gpio(WELL_PIN, state);
    return gpiox.get_gpio_num(WELL_PIN)===1;
}

export async function setPumpState(state) {
    gpiox.set_gpio(PUMP_PIN, state);
    return gpiox.get_gpio_num(PUMP_PIN)===1;
}

