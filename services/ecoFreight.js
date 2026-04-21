import axios from "axios";

export async function calculateEmissions({ origin, destination, transport_mode, baggage_kg }) {
  const url = process.env.ECOFREIGHT_API_URL;
  const key = process.env.ECOFREIGHT_API_KEY;
  if (!url || !key) {
    const estimate = fakeEstimate(transport_mode, baggage_kg, origin, destination);
    return {
      co2_kg: estimate,
      origin,
      destination,
      transport_mode,
      baggage_kg,
      raw: { simulated: true }
    };
  }
  try {
    const resp = await axios.post(
      url,
      {
        origin,
        destination,
        transport_mode,
        baggage_kg
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );
    const data = resp?.data || {};
    const co2 = data.co2_kg ?? data.co2 ?? data.total_co2_kg ?? null;
    return {
      co2_kg: co2,
      origin,
      destination,
      transport_mode,
      baggage_kg,
      raw: data
    };
  } catch {
    const estimate = fakeEstimate(transport_mode, baggage_kg, origin, destination);
    return {
      co2_kg: estimate,
      origin,
      destination,
      transport_mode,
      baggage_kg,
      raw: { simulated: true }
    };
  }
}

function distanceGuess(a, b) {
  if (!a || !b) return 300;
  const h = Math.abs(a.length - b.length);
  return 300 + h * 60;
}

function fakeEstimate(mode, bagKg, a, b) {
  const d = distanceGuess(a, b);
  const w = Math.max(0, Number(bagKg) || 0);
  const mult = mode === "plane" ? 0.25 : mode === "car" ? 0.12 : mode === "bus" ? 0.06 : 0.04;
  return Math.round((d * mult + w * 0.02) * 100) / 100;
}
