interface Env {
  cabinpi_db: D1Database;
}

export async function onRequest(context: { env: Env }) {
  try {
    const db = context.env.cabinpi_db;

    // Query the latest measurement from D1
    const result = await db.prepare(`
      SELECT
        date, ampHours, avgStrikeDistance, batteryState, chargeState, classicState,
        dailyAccumulation, dispavgVbatt, dispavgVpv, extF, extHumidity, humidity,
        ibattDisplay, illuminance, inHg, intF, inverterAacOut, inverterFault,
        inverterMode, inverterOn, inverterVacOut, kwhours, niteMinutesNoPwr,
        pvInputCurrent, rain, solarRadiation, strikeCount, uv, vocLastMeasured,
        watts, windAvg, windDirection, windGust
      FROM measurements
      ORDER BY date DESC
      LIMIT 1
    `).first();

    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No measurements found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert inverterOn from integer to boolean
    const data = {
      ...result,
      inverterOn: result.inverterOn === 1
    };

    return new Response(JSON.stringify({
      success: true,
      count: 1,
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
