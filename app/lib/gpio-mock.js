export class gpio_mock {
  constructor() {
    this.well_state = false;
    this.pump_state = false;
  }
  async getGPIOState() {
    //gpiox.init_gpio(2, gpiox.GPIO_MODE_OUTPUT,
    return {
      well: this._well_state,
      pump: this._pump_state,
    };
  }

  async setWellState(state) {
    this._well_state = state;
    return this._well_state;
  }

  async setPumpState(state) {
    this._pump_state = state;
    return this._pump_state;
  }
}
