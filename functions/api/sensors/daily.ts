interface Env {
  cabinpi_db: D1Database;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const start = url.searchParams.get('start');
  const stop = url.searchParams.get('stop');

  if (!start || !stop) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing start or stop parameter'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = context.env.cabinpi_db;

    // Query measurements aggregated by day with MAX values for each field
    const results = await db.prepare(`
      SELECT
        DATE(date) as date,
        MAX(ampHours) as ampHours,
        MAX(avgStrikeDistance) as avgStrikeDistance,
        MAX(batteryState) as batteryState,
        MAX(chargeState) as chargeState,
        MAX(classicState) as classicState,
        MAX(dailyAccumulation) as dailyAccumulation,
        MAX(dispavgVbatt) as dispavgVbatt,
        MAX(dispavgVpv) as dispavgVpv,
        MAX(extF) as extF,
        MAX(extHumidity) as extHumidity,
        MAX(humidity) as humidity,
        MAX(ibattDisplay) as ibattDisplay,
        MAX(illuminance) as illuminance,
        MAX(inHg) as inHg,
        MAX(intF) as intF,
        MAX(inverterAacOut) as inverterAacOut,
        MAX(inverterFault) as inverterFault,
        MAX(inverterMode) as inverterMode,
        MAX(inverterOn) as inverterOn,
        MAX(inverterVacOut) as inverterVacOut,
        MAX(kwhours) as kwhours,
        MAX(niteMinutesNoPwr) as niteMinutesNoPwr,
        MAX(pvInputCurrent) as pvInputCurrent,
        MAX(rain) as rain,
        MAX(solarRadiation) as solarRadiation,
        MAX(strikeCount) as strikeCount,
        MAX(uv) as uv,
        MAX(vocLastMeasured) as vocLastMeasured,
        MAX(watts) as watts,
        MAX(windAvg) as windAvg,
        MAX(windDirection) as windDirection,
        MAX(windGust) as windGust
      FROM measurements
      WHERE date >= ?1 AND date <= ?2
      GROUP BY DATE(date)
      ORDER BY date DESC
    `).bind(start, stop).all();

    // Convert inverterOn from integer to boolean for all results
    const data = results.results?.map(row => ({
      ...row,
      inverterOn: row.inverterOn === 1
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      count: data.length,
      data
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
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
