
export function fetchSensorHistory() {
  let results = [];
  let start = new Date(Date.now());
  for (let i = 0; i < 288; i++) {
    results.push({
      date: new Date(start.getTime() - i * 60000),
      absorbTime: Math.floor(Math.random() * 7200),
      ampHours: Math.floor(Math.random() * 50),
      equalizeTime: Math.floor(Math.random() * 7200),
      floatTime: Math.floor(Math.random() * 7200),
      highestVinputLog: Math.random() * 150,
      ibattDisplay: Math.random() * 25.4,
      niteMinutesNoPwr: 0,
      pvInputCurrent: Math.random() * 12,
      vocLastMeasured: Math.random() * 150,
      batteryState: 4,
      chargeState: 1027,
      classicState: 3,
      dispavgVbatt: Math.random() * 15,
      dispavgVpv: Math.random() * 80,
      kWHours: Math.random(),
      watts: Math.floor(Math.random() * 500),
      case_f: Math.random() *  80,
      ext_f: Math.random() * 100,
      humidity: Math.random() * 100,
      inHg: Math.random() * 30,
      int_f: Math.random() * 90,
    });
  }
  return results;
}

export function fetchSensorData() {
    return fetchSensorHistory()[0];
}