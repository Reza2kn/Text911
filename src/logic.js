export const LABELS = { supported: 'Supported', 'not-listed': 'Not listed', unknown: 'Unknown' };
export function normalize(text) { return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
export function searchCounties(counties, query, state = '', status = '') {
  const q = normalize(query), words = q.split(' ').filter(Boolean);
  return counties.filter(c => (!state || c.state === state) && (!status || c.status === status) && words.every(w => normalize(`${c.name} ${c.baseName} ${c.state} ${c.stateName}`).split(' ').some(token=>token.startsWith(w))))
    .sort((a,b)=> (normalize(a.baseName) === q ? -1 : normalize(b.baseName) === q ? 1 : a.name.localeCompare(b.name)||a.state.localeCompare(b.state)));
}
export function zipCounties(index, zip, counties) {
  const ids = index[zip]; if (!ids) return null;
  return { counties: ids.map(id=>counties.find(c=>c.id===id)).filter(Boolean), missing: ids.filter(id=>!counties.some(c=>c.id===id)) };
}
export function statusText(c) {
  if (c.status === 'supported') return 'At least one text-ready 911 center is listed in this county and its carrier compliance deadline has passed as of the registry date. This does not establish countywide coverage or verify live service.';
  if (c.status === 'not-listed') return 'No matching text-ready center was found in this FCC snapshot. Registration is voluntary, so texting may still be available. This is not a finding that service is unavailable.';
  return 'We cannot determine text support from this snapshot. Entries may be pending, RTT-only, incomplete, or difficult to match to current county boundaries. Check with your local 911 authority using its non-emergency contact.';
}
