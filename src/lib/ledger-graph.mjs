// Adapted from RegenSkagit's d3-flows.js: force layout, dragging, directed
// links, and count-scaled strokes. Only site-wide aggregates reach this graph.
import * as d3 from 'd3';
export function label(kind){return kind.replace(/^document:/,'').replace(/_/g,' ');}
export function filterSummary(summary,kind='',focus=''){
 const links=summary.links.filter(l=>(!kind||l.kind===kind)&&(!focus||l.source===focus||l.target===focus));
 const ids=new Set(links.flatMap(l=>[l.source,l.target]));
 const nodes=summary.nodes.filter(n=>(!focus&&!kind)||ids.has(n.id)||n.id===focus);
 return {nodes,links};
}
export function renderSummary(element,sourceNodes,sourceLinks){
 const svg=d3.select(element);svg.selectAll('*').remove();
 const width=1000,height=580;
 svg.attr('viewBox',`0 0 ${width} ${height}`);
 const nodes=sourceNodes.map(n=>({...n})),links=sourceLinks.map(l=>({...l}));
 svg.append('title').text('Site-wide ledger summary. Each node represents a category, not an individual record.');
 svg.append('defs').append('marker').attr('id','ledger-summary-arrow').attr('viewBox','0 -5 10 10').attr('refX',30).attr('refY',0).attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto').append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#8a9d7c');
 const group=svg.append('g');
 const zoom=d3.zoom().scaleExtent([0.4,3]).on('zoom',event=>group.attr('transform',event.transform));
 svg.call(zoom).on('dblclick.zoom',null);
 const link=group.append('g').selectAll('path').data(links).join('path').attr('fill','none').attr('stroke',d=>d.kind==='event'?'#af9662':'#839c79').attr('stroke-width',d=>Math.min(1+Math.sqrt(d.count),8)).attr('stroke-opacity',0.65).attr('stroke-dasharray',d=>d.kind==='event'?'5 4':null).attr('marker-end','url(#ledger-summary-arrow)');
 link.append('title').text(d=>`${label(d.source)} → ${label(d.target)}: ${label(d.relation)} · ${d.count}`);
 const simulation=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(d=>d.id).distance(170)).force('charge',d3.forceManyBody().strength(-650)).force('center',d3.forceCenter(width/2,height/2)).force('collision',d3.forceCollide(65));
 const node=group.append('g').selectAll('g').data(nodes).join('g').call(d3.drag().on('start',(event,d)=>{if(!event.active)simulation.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y;}).on('drag',(event,d)=>{d.fx=event.x;d.fy=event.y;}).on('end',(event,d)=>{if(!event.active)simulation.alphaTarget(0);d.fx=null;d.fy=null;}));
 node.append('circle').attr('r',d=>Math.min(18+Math.sqrt(d.count)*2,40)).attr('fill',d=>d.id.startsWith('document:')?'#dce6cf':'#eaddbb').attr('stroke','#8b9d7c');
 node.append('text').attr('text-anchor','middle').attr('dy','0.35em').attr('fill','#314832').attr('font-size',12).text(d=>d.count);
 node.append('text').attr('text-anchor','middle').attr('dy',d=>Math.min(18+Math.sqrt(d.count)*2,40)+20).attr('fill','#53644c').attr('font-size',12).text(d=>label(d.id));
 node.append('title').text(d=>`${label(d.id)}: ${d.count} records`);
 simulation.on('tick',()=>{
  node.attr('transform',d=>`translate(${d.x=Math.max(65,Math.min(width-65,d.x))},${d.y=Math.max(55,Math.min(height-55,d.y))})`);
  link.attr('d',(d,i)=>{if(d.source.id===d.target.id)return `M${d.source.x},${d.source.y}c75,-90 75,90 0,0`;const dx=d.target.x-d.source.x,dy=d.target.y-d.source.y,r=Math.sqrt(dx*dx+dy*dy)+i*12;return `M${d.source.x},${d.source.y}A${r},${r} 0 0,1 ${d.target.x},${d.target.y}`;});
 });
 return ()=>{simulation.stop();svg.on('.zoom',null);};
}
