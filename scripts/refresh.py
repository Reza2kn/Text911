#!/usr/bin/env python3
"""Refresh FCC data. Standard library only. Failures leave the shipped snapshot intact."""
import argparse, datetime as dt, hashlib, json, re, sys, urllib.request, zipfile, xml.etree.ElementTree as ET, io, os
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PAGE = 'https://www.fcc.gov/general/psap-text-911-readiness-and-certification-form'
FILE = 'https://www.fcc.gov/sites/default/files/text_911_master_psap_registry.xlsx'
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def norm(text):
    text = re.sub(r'\b(county|counties|parish|borough|census area|municipality)\b', '', text.lower())
    return re.sub(r'[^a-z0-9]', '', text.replace('saint', 'st'))
def excel_date(value):
    if not value: return None
    try: return (dt.date(1899,12,30) + dt.timedelta(days=float(value))).isoformat()
    except ValueError:
        for fmt in ['%m/%d/%Y', '%m/%d/%y', '%Y-%m-%d']:
            try: return dt.datetime.strptime(value.strip(), fmt).date().isoformat()
            except ValueError: pass
    return None

def parse(blob):
    z = zipfile.ZipFile(io.BytesIO(blob))
    strings = [''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS)] if 'xl/sharedStrings.xml' in z.namelist() else []
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    sheet = next((s for s in wb.findall('m:sheets/m:sheet',NS) if s.attrib['name']=='Master by Notice Date'), None)
    if sheet is None: raise ValueError('Expected Master by Notice Date sheet missing; review changed schema.')
    rid = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    target = next(s.attrib['Target'] for s in rels if s.attrib['Id']==rid)
    path = target.lstrip('/') if target.startswith('/') else 'xl/'+target
    raw=[]; date_candidates=[]; header={}
    for row in ET.fromstring(z.read(path)).findall('m:sheetData/m:row',NS):
        values={}
        for c in row:
            col = re.sub(r'\d', '', c.attrib['r']); v=c.find('m:v',NS)
            if c.attrib.get('t')=='inlineStr': value=''.join(c.find('m:is',NS).itertext())
            elif v is None: continue
            elif c.attrib.get('t')=='s': value=strings[int(v.text)]
            else: value=v.text or ''
            values[col]=value.strip()
        if values.get('B')=='PSAP ID': header=values
        for value in values.values():
            match=re.search(r'Latest Additions.*?([A-Za-z]+ \d{1,2}, \d{4})',value,re.S)
            if match: date_candidates.append(dt.datetime.strptime(match[1],'%B %d, %Y').date())
        if re.fullmatch('[A-Z]{2}',values.get('A','')) and values.get('C'):
            raw.append({'row':int(row.attrib['r']),**values})
    if header.get('D')!='County' or header.get('Q')!='RTT' or not raw or not date_candidates: raise ValueError('Registry schema or publication date could not be verified.')
    return raw, max(date_candidates).isoformat()

def generate(blob):
    raw,data_date=parse(blob)
    if len(raw)<3000: raise ValueError('Unexpectedly small registry; review before replacing data.')
    states=json.loads((ROOT/'data/states.json').read_text())
    geography=json.loads((ROOT/'data/source/counties.geojson').read_text())
    counties=[]; lookup={}
    for feature in geography['features']:
        p=feature['properties']; state=states.get(p['STATE'])
        if not state: continue
        c={'id':p['GEOID'],'name':p['NAME'],'baseName':p['BASENAME'],'state':state[0],'stateName':state[1],'records':[],'uncertain':False}
        counties.append(c)
        lookup.setdefault((state[0],norm(p['BASENAME'])),[]).append(c)
        lookup.setdefault((state[0],norm(p['NAME'])),[])
        if c not in lookup[(state[0],norm(p['NAME']))]: lookup[(state[0],norm(p['NAME']))].append(c)
    records=[]; unmatched=[]
    for r in raw:
        methods=[label for col,label in [('N','Text to TTY'),('O','Web browser'),('P','Direct IP'),('Q','RTT'),('R','Other text method')] if r.get(col,'').strip()]
        sms=any(r.get(col,'').strip() for col in ['N','O','P','R'])
        compliance=excel_date(r.get('U','')); notice=excel_date(r.get('T',''))
        active=bool(sms and compliance and compliance<=data_date and notice and notice<=data_date)
        record={'row':r['row'],'id':r.get('B') or None,'name':r['C'],'state':r['A'],'county':r.get('D',''),'noticeDate':notice,'complianceDate':compliance,'methods':methods,'smsListed':bool(sms),'eligible':active,'notes':r.get('V','')}
        idx=len(records);records.append(record)
        county_text=r.get('D',''); direct=lookup.get((r['A'],norm(county_text)),[])
        matched=[]
        if len(direct)==1: matched=direct
        elif norm(county_text) in ['all','allstate','statewide']:
            matched=[c for c in counties if c['state']==r['A']]
        else:
            tokens=re.split(r'[,;/\n&]|\band\b',county_text,flags=re.I)
            for token in tokens:
                candidates=lookup.get((r['A'],norm(token)),[])
                if len(candidates)==1: matched.extend(candidates)
                else: unmatched.append({'row':r['row'],'state':r['A'],'county':token.strip(),'psap':r['C']})
        if not matched and direct:
            for c in direct: c['uncertain']=True
        for c in matched:
            if idx not in c['records']: c['records'].append(idx)
    # An unresolved county entry can be relevant anywhere in that state. Avoid false absence claims.
    uncertain_states={r['state'] for r in unmatched}
    for c in counties:
        c['status']='supported' if any(records[i]['eligible'] for i in c['records']) else 'unknown' if c['records'] or c['uncertain'] or c['state'] in uncertain_states else 'not-listed'
        c['uncertain']=c['uncertain'] or c['state'] in uncertain_states
    counties.sort(key=lambda c:(c['stateName'],c['name']))
    meta={'dataDate':data_date,'retrievedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'sourceUrl':FILE,'registryPage':PAGE,'sheet':'Master by Notice Date','sha256':hashlib.sha256(blob).hexdigest(),'recordCount':len(records),'countyCount':len(counties),'unmatchedCount':len(unmatched),'boundarySource':'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1','boundaryRetrievedDate':'2026-10-12','uncertainStates':sorted(uncertain_states),'rulesVersion':1}
    return {'meta':meta,'counties':counties,'records':records}, unmatched

def atomic(path, content):
    path.parent.mkdir(parents=True,exist_ok=True); temp=path.with_suffix(path.suffix+'.tmp');temp.write_bytes(content);os.replace(temp,path)

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--file',type=Path,help='Official FCC workbook downloaded in a browser if FCC blocks automated downloads');p.add_argument('--allow-older',action='store_true');args=p.parse_args()
    try:
        blob=args.file.read_bytes() if args.file else urllib.request.urlopen(urllib.request.Request(FILE,headers={'User-Agent':'Text911 registry refresh; public information lookup'}),timeout=45).read()
        data,unmatched=generate(blob)
        previous=ROOT/'data/registry.json'
        if previous.exists() and not args.allow_older and data['meta']['dataDate']<json.loads(previous.read_text())['meta']['dataDate']: raise ValueError('Refusing to replace newer data with an older workbook.')
        atomic(previous,(json.dumps(data,separators=(',',':'),ensure_ascii=False)+'\n').encode())
        atomic(ROOT/'data/unmatched.json',(json.dumps(unmatched,indent=2)+'\n').encode())
        atomic(ROOT/'data/source/fcc-registry.xlsx',blob)
        print(json.dumps(data['meta'],indent=2))
    except Exception as e:
        print(f'Refresh failed; existing snapshot preserved: {e}. If FCC returns 403, download the workbook from {PAGE} and use --file /path/to/workbook.xlsx.',file=sys.stderr);sys.exit(1)
if __name__=='__main__':main()
