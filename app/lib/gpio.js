"use server";
import { gpio_mock } from "./gpio-mock";
import { gpio_pi } from "./gpio-pi";

const gpio = process.env.PI_HARDDWARE===true ? new gpio_pi() : new gpio_mock();

export async function getGPIOState() {
    return gpio.getGPIOState();
}

export async function setWellState(state) {
    return gpio.setWellState(state);
}

export async function setPumpState(state) {
    return gpio.setPumpState(state);
}

