export const SENSOR_UNITS = {
  temp: '°C',
  air_temp: '°C',
  humidity: '%',
  air_hum: '%RH',
  soil_moist: '%',
  soil_temp: '°C',
  light: 'lux',
  soil_k: 'mg/kg',
  soil_ph: 'pH',
  soil_n: 'mg/kg',
  soil_p: 'mg/kg',
  soil_ec: 'µS/cm',
  soil_cond: 'dS/m',
  soil_salinity: 'ppt',
  soil_tds: 'ppm',
  co2: 'ppm'
};

export function getDisplayUnit(sensorKey, rawUnit) {
  if (!rawUnit || rawUnit.toLowerCase() === 'raw') {
    return SENSOR_UNITS[sensorKey] || '';
  }
  return rawUnit;
}
