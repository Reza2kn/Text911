#!/usr/bin/env python3
"""Independent 10-area check against the FCC workbook XML (not the refresh parser)."""
from pathlib import Path
import zipfile,xml.etree.ElementTree as E,json,re,datetime,hashlib
root=Path(__file__).resolve().parents[1];ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
blob=(root/'data/source/fcc-registry.xlsx').read_bytes();z=zipfile.ZipFile(root/'data/source/fcc-registry.xlsx')
strings=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)]
rows=[]
for row in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('m:sheetData/m:row',ns):
 cells={}
 for c in row:
  v=c.find('m:v',ns)
  if v is not None:cells[re.sub(r'\d','',c.attrib['r'])]=(strings[int(v.text)] if c.attrib.get('t')=='s' else v.text).strip()
 if cells.get('A') and re.fullmatch('[A-Z]{2}',cells['A']) and cells.get('C'):rows.append({'row':int(row.attrib['r']),**cells})
data=json.loads((root/'data/registry.json').read_text());counties={c['id']:c for c in data['counties']}
checks=[('53033','King','WA','supported'),('06037','Los Angeles','CA','supported'),('17031','Cook','IL','supported'),('48201','Harris','TX','supported'),('12086','Miami-Dade','FL','supported'),('39099','Mahoning','OH','supported'),('39117','Morrow','OH','unknown'),('01097','Mobile','AL','supported'),('35003','Catron','NM','not-listed'),('09110','Capitol','CT','unknown')]
lines=['# Ten county spot-checks','', 'Checked October 12, 2026. FCC registry dated September 15, 2026. Source: **Master by Notice Date** sheet in the official FCC workbook. These checks verify registry interpretation, not emergency message delivery.','',f'Workbook SHA-256: `{hashlib.sha256(blob).hexdigest()}`','', '| County or equivalent | FIPS | Expected / app | Source evidence | Result |','| --- | --- | --- | --- | --- |']
for fips,name,state,expected in checks:
 c=counties[fips];assert c['status']==expected
 matching=[]
 for r in rows:
  if r['A']!=state:continue
  tokens=re.split(r'[,;/\n&]|\band\b',r.get('D',''),flags=re.I)
  if any(t.strip().lower().replace(' county','')==name.lower() for t in tokens):matching.append(r)
 if expected=='supported':
  eligible=[]
  for r in matching:
   try:
    deadline=(datetime.date(1899,12,30)+datetime.timedelta(days=float(r.get('U','')))).isoformat()
    notice=(datetime.date(1899,12,30)+datetime.timedelta(days=float(r.get('T','')))).isoformat()
   except ValueError:continue
   if any(r.get(k,'') for k in ['N','O','P','R']) and deadline<=data['meta']['dataDate'] and notice<=data['meta']['dataDate']:eligible.append((r,deadline))
  assert eligible,fips
  r,deadline=eligible[0];assert any(data['records'][i]['row']==r['row'] for i in c['records']),fips
  evidence=f"Row {r['row']}: {r['C']} (ID {r.get('B','not recorded')}); SMS method recorded; carrier deadline {deadline}."
 elif fips=='39117':
  r=next(r for r in matching if r['row']==6);assert float(r['U'])>float(r['T']);deadline=(datetime.date(1899,12,30)+datetime.timedelta(days=float(r['U']))).isoformat();assert deadline>'2026-09-15';evidence=f"Row 6: Morrow County Sheriffs Office, ID 5437. Deadline {deadline} follows snapshot date; remains Unknown."
 elif expected=='not-listed':
  assert not matching;assert not c['records'];evidence='Full-sheet search found no NM / Catron county entry. Voluntary registry: absence is not proof of unavailability.'
 else:
  r=next(r for r in rows if r['A']=='CT' and r.get('D')=='Hartford');assert not c['records'];evidence=f"Connecticut uses legacy county names (e.g. row {r['row']}, Hartford). Current Capitol Planning Region has no defensible direct join; remains Unknown."
 lines.append(f"| {c['name']}, {state} | {fips} | {expected} / {c['status']} | {evidence} | Pass |")
lines+=['','All 10 checks passed. Supported means at least one eligible readiness listing, not full county coverage. The pending and unmatched cases explicitly remain Unknown.','', '[Official FCC registry](https://www.fcc.gov/general/psap-text-911-readiness-and-certification-form)','']
(root/'reports/county-spot-checks.md').write_text('\n'.join(lines));print('10/10 independent registry checks passed')
