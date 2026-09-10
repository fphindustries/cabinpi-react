export const sensorFields = [
  "ampHours",
  "avgStrikeDistance",
  "batteryState",
  "chargeState",
  "classicState",
  "dailyAccumulation",
  "dispavgVbatt",
  "dispavgVpv",
  "extF",
  "extHumidity",
  "humidity",
  "ibattDisplay",
  "illuminance",
  "inHg",
  "intF",
  "inverterAacOut",
  "inverterFault",
  "inverterMode",
  "inverterVacOut",
  "kwhours",
  "niteMinutesNoPwr",
  "pvInputCurrent",
  "rain",
  "solarRadiation",
  "strikeCount",
  "uv",
  "vocLastMeasured",
  "watts",
  "windAvg",
  "windDirection",
  "windGust",
  "dcBusVoltage",
  "dcCurrent",
  "dcPower",
  "dcShuntVoltage",
  "basementF",
  "basementC"
] as const;

export type SensorField = typeof sensorFields[number];
export type SensorData = Partial<Record<SensorField, number | null>> & {
  date?: string;
  inverterOn?: boolean | null;
};
