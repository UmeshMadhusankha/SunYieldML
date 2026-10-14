import {number} from '../lib/format';
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function MonthlyChart({months}){
  const max=Math.max(1,...months.map(m=>m.generatedKwh));
  return <div className="chart" role="img" aria-label="Monthly solar energy in kilowatt hours"><div className="bar-chart">{months.map((m,i)=><div className="bar-column" key={m.month}><span className="bar-value">{number(m.generatedKwh)}</span><div className="bar" style={{height:`${Math.max(1,m.generatedKwh/max*150)}px`}} title={`${MONTHS[i]}: ${number(m.generatedKwh)} kWh`}/><span>{MONTHS[i]}</span></div>)}</div><p className="caption">Estimated generation · kWh per month</p></div>;
}
export function ForecastChart({points,timezone}){
  const max=Math.max(1,...points.map(p=>p.powerKw));
  const coordinates=points.map((p,i)=>`${i/Math.max(1,points.length-1)*600},${150-p.powerKw/max*130}`).join(' ');
  return <div><svg className="forecast-chart" viewBox="0 0 600 170" role="img" aria-label="Hourly solar power forecast"><line x1="0" y1="150" x2="600" y2="150" stroke="#c8d8cf"/><polyline points={coordinates} fill="none" stroke="#248766" strokeWidth="3"/></svg><div className="forecast-labels">{[points[0],points.at(-1)].filter(Boolean).map(p=><span key={p.end}>{new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(new Date(p.end))}</span>)}</div><p className="caption">Hourly average AC power · kW · {timezone}. Times mark interval ends.</p><details><summary>View forecast values</summary><div className="table-scroll"><table><thead><tr><th>Interval end</th><th>Power (kW)</th><th>Energy (kWh)</th></tr></thead><tbody>{points.map(p=><tr key={p.end}><td>{new Date(p.end).toLocaleString('en',{timeZone:timezone})}</td><td>{number(p.powerKw)}</td><td>{number(p.energyKwh)}</td></tr>)}</tbody></table></div></details></div>;
}
