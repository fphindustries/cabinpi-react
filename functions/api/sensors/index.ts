interface Env {
  cabinpi_db: D1Database;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const start = url.searchParams.get('start');
  const stop = url.searchParams.get('stop');
  const limitStr = url.searchParams.get('limit') || '1000';
  const limit = parseInt(limitStr, 10);

  if (!start || !stop) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing start or stop parameter'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate limit
  if (isNaN(limit) || limit < 1 || limit > 1000) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid limit parameter (must be 1-1000)'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = context.env.cabinpi_db;

    // Query measurements within the date range
    const results = await db.prepare(`
      SELECT
        date, ampHours, avgStrikeDistance, batteryState, chargeState, classicState,
        dailyAccumulation, dispavgVbatt, dispavgVpv, extF, extHumidity, humidity,
        ibattDisplay, illuminance, inHg, intF, inverterAacOut, inverterFault,
        inverterMode, inverterOn, inverterVacOut, kwhours, niteMinutesNoPwr,
        pvInputCurrent, rain, solarRadiation, strikeCount, uv, vocLastMeasured,
        watts, windAvg, windDirection, windGust
      FROM measurements
      WHERE date >= ?1 AND date <= ?2
      ORDER BY date DESC
      LIMIT ?3
    `).bind(start, stop, limit).all();

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
