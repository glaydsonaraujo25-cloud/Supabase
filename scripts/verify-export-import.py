"""Independent parser roundtrip; requires icalendar==7.3.0, no external accounts."""
import csv, io, json, sys
from datetime import date
from icalendar import Calendar
fixture=json.load(sys.stdin)
rows=list(csv.reader(io.StringIO(fixture['csv'].lstrip('\ufeff')),delimiter=';'))
assert rows[1]==[fixture['title'],'2']
assert rows[2][0]=="'=1+1"
cal=Calendar.from_ical(fixture['ics'].encode('utf-8'))
events=cal.walk('VEVENT')
assert len(events)==1
assert str(events[0]['SUMMARY'])==fixture['title']
assert events[0].decoded('DTSTART')==date(2024,2,29)
assert events[0].decoded('DTEND')==date(2024,3,1)
assert str(events[0]['UID'])=='fixture-1@meus-estudos'
print('PASS: independent CSV and iCalendar imports, accents, multiline, formula neutralization and leap-day dates')
