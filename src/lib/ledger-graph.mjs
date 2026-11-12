import * as d3 from 'd3';

export function relationLabel(relation){
 return relation.replace(/_/g,' ');
}

export function experimentConnections(graph,focus=''){
 const nodes=new Map(graph.nodes.filter(node=>node.revision_id).map(node=>[
  node.id,
  node.node_type==='experiment'&&graph.feedback_counts
   ? {...node,feedbackCount:graph.feedback_counts[node.id]??0}
   : node,
 ]));
 const experiments=[...nodes.values()].filter(node=>node.node_type==='experiment');
 const experimentIds=new Set(experiments.map(node=>node.id));
 const links=graph.edges.map(edge=>({source:edge.from,target:edge.to,relation:edge.relation}));
 for(const {source,relation,target} of graph.references){
  if(!experimentIds.has(source)||!target.document_id||!target.invitation_id)continue;
  if(!nodes.has(target.document_id)){
   nodes.set(target.document_id,{
    id:target.document_id,title:target.title||'Original experiment',node_type:'experiment',
    invitation_id:target.invitation_id,
   });
  }
  links.push({source,target:target.document_id,relation});
 }
 const seen=new Set();
 const visibleLinks=links.filter(link=>{
  if(!nodes.has(link.source)||!nodes.has(link.target))return false;
  if(focus ? link.source!==focus&&link.target!==focus
   : !experimentIds.has(link.source)&&!experimentIds.has(link.target))return false;
  const key=JSON.stringify([link.source,link.target,link.relation]);
  if(seen.has(key))return false;
  seen.add(key);
  return true;
 });
 const ids=new Set(focus?[focus]:experimentIds);
 for(const link of visibleLinks){
  ids.add(link.source);
  ids.add(link.target);
 }
 return {experiments,nodes:[...nodes.values()].filter(node=>ids.has(node.id)),links:visibleLinks};
}

export function feedbackLabel(count){
 return `${count.toLocaleString()} feedback ${count===1?'submission':'submissions'}`;
}

export function renderConnections(element,sourceNodes,sourceLinks){
 const svg=d3.select(element);svg.selectAll('*').remove();
 const width=1000,height=580;
 svg.attr('viewBox',`0 0 ${width} ${height}`);
 const nodes=sourceNodes.map(n=>({...n})),links=sourceLinks.map(l=>({...l}));
 svg.append('title').text('Experiments and their linked documents');
 const titles=new Map(nodes.map(node=>[node.id,node.title]));
 svg.append('defs').append('marker').attr('id','ledger-connection-arrow').attr('viewBox','0 -5 10 10').attr('refX',24).attr('refY',0).attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto').append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#8a9d7c');
 const group=svg.append('g');
 const zoom=d3.zoom().scaleExtent([0.4,3]).on('zoom',event=>group.attr('transform',event.transform));
 svg.call(zoom).on('dblclick.zoom',null);
 const link=group.append('g').selectAll('path').data(links).join('path').attr('fill','none').attr('stroke','#839c79').attr('stroke-width',2).attr('stroke-opacity',0.65).attr('marker-end','url(#ledger-connection-arrow)');
 link.append('title').text(d=>`${titles.get(d.source)} → ${titles.get(d.target)}: ${relationLabel(d.relation)}`);
 const simulation=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(d=>d.id).distance(170)).force('charge',d3.forceManyBody().strength(-650)).force('center',d3.forceCenter(width/2,height/2)).force('collision',d3.forceCollide(65));
 const node=group.append('g').selectAll('g').data(nodes).join('g').call(d3.drag().on('start',(event,d)=>{if(!event.active)simulation.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y;}).on('drag',(event,d)=>{d.fx=event.x;d.fy=event.y;}).on('end',(event,d)=>{if(!event.active)simulation.alphaTarget(0);d.fx=null;d.fy=null;}));
 node.append('circle').attr('r',d=>d.node_type==='experiment'?17:11)
  .attr('fill',d=>d.node_type==='experiment'?'#dce6cf':'#eaddbb').attr('stroke','#8b9d7c');
 node.append('text').attr('text-anchor','middle').attr('dy',34).attr('fill','#53644c').attr('font-size',15)
  .text(d=>d.title.length>30?d.title.slice(0,29)+'…':d.title);
 node.filter(d=>d.feedbackCount!==undefined).append('text')
  .attr('text-anchor','middle').attr('dominant-baseline','central').attr('fill','#314832')
  .attr('font-weight',700).attr('font-size',d=>d.feedbackCount<1000?15:10)
  .text(d=>d.feedbackCount.toLocaleString());
 node.append('title').text(d=>d.feedbackCount===undefined?d.title:`${d.title} · ${feedbackLabel(d.feedbackCount)}`);
 simulation.on('tick',()=>{
  node.attr('transform',d=>`translate(${d.x=Math.max(65,Math.min(width-65,d.x))},${d.y=Math.max(55,Math.min(height-55,d.y))})`);
  link.attr('d',(d,i)=>{if(d.source.id===d.target.id)return `M${d.source.x},${d.source.y}c75,-90 75,90 0,0`;const dx=d.target.x-d.source.x,dy=d.target.y-d.source.y,r=Math.sqrt(dx*dx+dy*dy)+i*12;return `M${d.source.x},${d.source.y}A${r},${r} 0 0,1 ${d.target.x},${d.target.y}`;});
 });
 return ()=>{simulation.stop();svg.on('.zoom',null);};
}
