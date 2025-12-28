-- Add DC Power Monitor fields (INA228)
ALTER TABLE measurements ADD COLUMN dcBusVoltage REAL;
ALTER TABLE measurements ADD COLUMN dcCurrent REAL;
ALTER TABLE measurements ADD COLUMN dcPower REAL;
ALTER TABLE measurements ADD COLUMN dcShuntVoltage REAL;

-- Add Basement temperature fields (DS18B20)
ALTER TABLE measurements ADD COLUMN basementF REAL;
ALTER TABLE measurements ADD COLUMN basementC REAL;
