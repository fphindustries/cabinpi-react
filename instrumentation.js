import { initGPIO } from './app/lib/gpio';

export function register() {
    console.log('register');
    initGPIO();
}