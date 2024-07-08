import { unstable_noStore as noStore } from "next/cache";
import { InfluxDB } from "@influxdata/influxdb-client";

const token = process.env.TOKEN;
const org = process.env.ORG;
const url = process.env.URL;

export async function fetchSolar() {
  noStore();
  try {
    let query = `
        from(bucket: "telegraf")
        |> range(start:-5m)
        |> filter(fn: (r) => r["_measurement"] == "solar")
        |> limit(n: 1)
        |> yield(name: "results")`;
    const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);
    var res = {};

    for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
      const o = tableMeta.toObject(values);
      res[o._field] = o._value;
    }
    return res;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}

export async function fetchSolarHistory() {
  noStore();
  try {
    // let query = `
    //   from(bucket: "telegraf")            // ?? Source
    //     |> range(start: -1d)                    // ?? Filter on time
    //     |> filter(fn: (r) => r._measurement == "solar") // ?? Filter on column values
    //     |> filter(fn: (r) => r._field  == "dispavgVbatt" or r._field  == "dispavgVpv" or r._field  == "AmpHours")
    //     |> aggregateWindow(every: 30m, fn: last, createEmpty: false)`;
    let query = `
    import "influxdata/influxdb/schema"
    from(bucket: "telegraf")            // ?? Source
      |> range(start: -1d)                    // ?? Filter on time
      |> filter(fn: (r) => r._measurement == "solar") // ?? Filter on column values
      |> aggregateWindow(every: 30m, fn: last, createEmpty: false)
      |> schema.fieldsAsCols()`        
    const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);
    var res = [];

    for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
      const o = tableMeta.toObject(values);
      //console.log(o);
      // var row = {
      //   field: o._field,
      //   val: o._value,
      //   time: o._time
      // }
      res.push(o);
    }
    return res;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}

export async function fetchSensorHistory() {
  noStore();
  try {
    // let query = `
    //   from(bucket: "telegraf")            // ?? Source
    //     |> range(start: -1d)                    // ?? Filter on time
    //     |> filter(fn: (r) => r._measurement == "sensors") // ?? Filter on column values
    //     |> filter(fn: (r) => r._field  == "ext_f" or r._field  == "case_f" or r._field  == "humidity" or r._field  == "inHg")
    //     |> aggregateWindow(every: 30m, fn: last, createEmpty: false)`;
    let query = `
      import "influxdata/influxdb/schema"
      from(bucket: "telegraf")            // ?? Source
        |> range(start: -1d)                    // ?? Filter on time
        |> filter(fn: (r) => r._measurement == "sensors") // ?? Filter on column values
        |> aggregateWindow(every: 30m, fn: last, createEmpty: false)
        |> schema.fieldsAsCols()`          
    const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);
    var res = [];

    for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
      res.push(tableMeta.toObject(values));
    }
    return res;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}

export async function fetchSensors() {
    noStore();
    try {
      let query = `
          from(bucket: "telegraf")
          |> range(start:-5m)
          |> filter(fn: (r) => r["_measurement"] == "sensors")
          |> limit(n: 1)
          |> yield(name: "results")`;
      const queryApi = await new InfluxDB({ url, token }).getQueryApi(org);
      var res = {};
  
      for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
        const o = tableMeta.toObject(values);
        res[o._field] = o._value;
      }
      return res;
    } catch (err) {
      console.error("Database Error:", err);
      throw new Error("Failed to fetch all customers.");
    }
  }
  