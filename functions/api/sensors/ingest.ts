interface Env {
  DB: D1Database;
  CF_ACCESS_CLIENT_ID?: string;
  CF_ACCESS_CLIENT_SECRET?: string;
}

interface SensorRecord {
  date: string;
  ampHours?: number;
  avgStrikeDistance?: number;
  batteryState?: number;
  chargeState?: number;
  classicState?: number;
  dailyAccumulation?: number;
  dispavgVbatt?: number;
  dispavgVpv?: number;
  extF?: number;
  extHumidity?: number;
  humidity?: number;
  ibattDisplay?: number;
  illuminance?: number;
  inHg?: number;
  intF?: number;
  inverterAacOut?: number;
  inverterFault?: number;
  inverterMode?: number;
  inverterOn?: boolean;
  inverterVacOut?: number;
  kwhours?: number;
  niteMinutesNoPwr?: number;
  pvInputCurrent?: number;
  rain?: number;
  solarRadiation?: number;
  strikeCount?: number;
  uv?: number;
  vocLastMeasured?: number;
  watts?: number;
  windAvg?: number;
  windDirection?: number;
  windGust?: number;
}

interface IngestRequest {
  records: SensorRecord[];
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {

    // Parse request body
    const body = await context.request.json() as IngestRequest;

    if (!body.records || !Array.isArray(body.records) || body.records.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request: records array is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare batch insert
    const db = context.env.cabinpi_db;
    const insertedCount = { count: 0 };

    for (const record of body.records) {
      // Validate required fields
      if (!record.date) {
        continue; // Skip records without date
      }

      // Apply inverter validation rules
      // If inverterFault > 0 or inverterOn is false, set inverter outputs to null
      if ((record.inverterFault && record.inverterFault > 0) || !record.inverterOn) {
        record.inverterAacOut = undefined;
        record.inverterVacOut = undefined;
        record.inverterOn = false;
      }

      // Insert record
      await db.prepare(`
        INSERT INTO measurements (
          date, ampHours, avgStrikeDistance, batteryState, chargeState, classicState,
          dailyAccumulation, dispavgVbatt, dispavgVpv, extF, extHumidity, humidity,
          ibattDisplay, illuminance, inHg, intF, inverterAacOut, inverterFault,
          inverterMode, inverterOn, inverterVacOut, kwhours, niteMinutesNoPwr,
          pvInputCurrent, rain, solarRadiation, strikeCount, uv, vocLastMeasured,
          watts, windAvg, windDirection, windGust
        ) VALUES (
          ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16,
          ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30,
          ?31, ?32, ?33
        )
      `).bind(
        record.date,
        record.ampHours ?? null,
        record.avgStrikeDistance ?? null,
        record.batteryState ?? null,
        record.chargeState ?? null,
        record.classicState ?? null,
        record.dailyAccumulation ?? null,
        record.dispavgVbatt ?? null,
        record.dispavgVpv ?? null,
        record.extF ?? null,
        record.extHumidity ?? null,
        record.humidity ?? null,
        record.ibattDisplay ?? null,
        record.illuminance ?? null,
        record.inHg ?? null,
        record.intF ?? null,
        record.inverterAacOut ?? null,
        record.inverterFault ?? null,
        record.inverterMode ?? null,
        record.inverterOn ? 1 : 0,
        record.inverterVacOut ?? null,
        record.kwhours ?? null,
        record.niteMinutesNoPwr ?? null,
        record.pvInputCurrent ?? null,
        record.rain ?? null,
        record.solarRadiation ?? null,
        record.strikeCount ?? null,
        record.uv ?? null,
        record.vocLastMeasured ?? null,
        record.watts ?? null,
        record.windAvg ?? null,
        record.windDirection ?? null,
        record.windGust ?? null
      ).run();

      insertedCount.count++;
    }

    return new Response(JSON.stringify({
      success: true,
      inserted: insertedCount.count,
      total: body.records.length
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
