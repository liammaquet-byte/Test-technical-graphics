const $ = id => document.getElementById(id);
const C = { bg:'#0c1117', grid:'#26313e', text:'#dfe7f1', muted:'#8fa1b5', ray:'#6cb6ff', green:'#69d391', orange:'#ffb86b', red:'#ff6b6b', yellow:'#e7d66d', white:'#f7fbff', purple:'#c792ea' };
const state = {
  mode:'two', sp:{x:-4,y:0.4,z:-7}, pp:0, obj:{x:0,y:0,z:5,rot:28},
  show:{rays:true,construct:true,grid:true,cone:true,parallel:false,curves:true}, step:0, explain:true, drag:null
};
const steps = [
 ['Locate station point','The station point is the observer eye. Moving it changes every visual ray and therefore the full perspective image.'],
 ['Set picture plane','The picture plane receives the intersection of sight rays. Moving it changes scale without moving the object.'],
 ['Project object points','Every perspective point is where a ray from the station point through a 3D point pierces the picture plane.'],
 ['Construct vanishing points','Parallel 3D directions meet at vanishing points on the horizon when the directions are horizontal.'],
 ['Assess distortion','Geometry outside the cone of vision is flagged because angles and scale become visually unreliable.'],
 ['Use auxiliary vanishing points','Inclined edges vanish above or below the horizon at an auxiliary vanishing point.']
];
const canvases = ['scene','perspective','construction'].map(id=>$(id));
const ctxs = Object.fromEntries(canvases.map(c=>[c.id,c.getContext('2d')]));
function resize(){for(const c of canvases){const r=c.getBoundingClientRect();c.width=r.width*devicePixelRatio;c.height=r.height*devicePixelRatio;c.getContext('2d').setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)} draw();}
addEventListener('resize',resize);
function init(){
  ['spx','spz','eye','pp','rot','objx','objz'].forEach(id=>$(id).addEventListener('input',readControls));
  $('spx').value=state.sp.x; $('spz').value=state.sp.z; $('eye').value=state.sp.y; $('pp').value=state.pp; $('rot').value=state.obj.rot; $('objx').value=state.obj.x; $('objz').value=state.obj.z;
  ['rays','construct','grid','cone','parallel','curves'].forEach(id=>$(id).addEventListener('change',e=>{state.show[id]=e.target.checked;draw()}));
  document.querySelectorAll('.seg').forEach(b=>b.onclick=()=>{document.querySelectorAll('.seg').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.mode=b.dataset.mode;draw();});
  $('stepBtn').onclick=()=>{state.step=(state.step+1)%steps.length; draw();};
  $('explainBtn').onclick=()=>{state.explain=!state.explain;$('explainBtn').textContent='Explain this line: '+(state.explain?'ON':'OFF');$('explainBtn').classList.toggle('active',state.explain)};
  $('resetBtn').onclick=()=>{Object.assign(state,{mode:'two',sp:{x:-4,y:0.4,z:-7},pp:0,obj:{x:0,y:0,z:5,rot:28},step:0});init();resize();};
  setupDrag(); resize();
}
function readControls(){state.sp.x=+spx.value;state.sp.z=+spz.value;state.sp.y=+eye.value;state.pp=+pp.value;state.obj.rot=+rot.value;state.obj.x=+objx.value;state.obj.z=+objz.value;draw();}
function objectPoints(){
 const w=2.4,d=2.0,h=2.0, r=state.obj.rot*Math.PI/180, cs=Math.cos(r), sn=Math.sin(r);
 let pts=[]; for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])for(const y of [0,h]){pts.push(rotPt({x,z,y},cs,sn));}
 if(state.show.curves){ for(let i=0;i<18;i++){const a=i/18*Math.PI*2;pts.push(rotPt({x:Math.cos(a)*.75,z:Math.sin(a)*.75,y:h+.45},cs,sn));} pts.push(rotPt({x:-w/2,z:0,y:h+1.2},cs,sn)); }
 return pts;
}
function rotPt(p,cs,sn){return {x:state.obj.x+p.x*cs-p.z*sn,y:p.y,z:state.obj.z+p.x*sn+p.z*cs};}
const edges=[[0,1],[0,2],[0,4],[3,1],[3,2],[3,7],[5,1],[5,4],[5,7],[6,2],[6,4],[6,7]];
function project(p){const t=(state.pp-state.sp.z)/(p.z-state.sp.z);return {x:state.sp.x+t*(p.x-state.sp.x), y:state.sp.y+t*(p.y-state.sp.y), ok:t>0};}
function mapPers(p,w,h){const scale=55, ground=h*.82;return {x:w/2+(p.x-state.sp.x)*scale, y:ground-p.y*scale};}
function mapPlan(p,w,h){const s=32;return {x:w/2+p.x*s,y:h*.68-p.z*s};}
function mapElev(p,w,h){const s=32;return {x:w/2+p.x*s,y:h*.26-p.y*s};}
function dirVP(dx,dz,dy=0){ if(Math.abs(dz)<.001)return null; const t=(state.pp-state.sp.z)/dz; return {x:state.sp.x+t*dx,y:state.sp.y+t*dy}; }
function drawGrid(ctx,w,h){ctx.strokeStyle=C.grid;ctx.lineWidth=1; for(let x=0;x<w;x+=28){line(ctx,x,0,x,h)} for(let y=0;y<h;y+=28){line(ctx,0,y,w,y)}}
function drawScene(){const ctx=ctxs.scene,w=scene.clientWidth,h=scene.clientHeight;clear(ctx,w,h);if(state.show.grid)drawIsoGrid(ctx,w,h);const pts=objectPoints().map(p=>iso(p,w,h)); drawObj(ctx,pts); const sp=iso(state.sp,w,h); dot(ctx,sp.x,sp.y,6,C.orange,'SP'); const pp1=iso({x:-7,y:0,z:state.pp},w,h), pp2=iso({x:7,y:0,z:state.pp},w,h), pp3=iso({x:7,y:5,z:state.pp},w,h), pp4=iso({x:-7,y:5,z:state.pp},w,h); poly(ctx,[pp1,pp2,pp3,pp4], 'rgba(108,182,255,.08)', C.ray); if(state.show.rays){ctx.globalAlpha=.35;objectPoints().slice(0,8).forEach(p=>{const q=iso(p,w,h);line(ctx,sp.x,sp.y,q.x,q.y,C.ray)});ctx.globalAlpha=1} if(state.show.cone){drawConeIso(ctx,w,h,sp)} label(ctx,14,h-18,'Picture plane, ground plane, station point and cone of vision are spatially related here.',C.muted)}
function iso(p,w,h){return {x:w/2+(p.x-p.z*.55)*30,y:h*.62-(p.y*34)+(p.z*.25+p.x*.1)*30}}
function drawIsoGrid(ctx,w,h){ctx.strokeStyle=C.grid;for(let i=-10;i<=14;i++){let a=iso({x:-8,y:0,z:i},w,h),b=iso({x:8,y:0,z:i},w,h);line(ctx,a.x,a.y,b.x,b.y);a=iso({x:i,y:0,z:-8},w,h);b=iso({x:i,y:0,z:14},w,h);line(ctx,a.x,a.y,b.x,b.y)}}
function drawConeIso(ctx,w,h,sp){const a=iso({x:-5,y:0,z:4},w,h),b=iso({x:5,y:0,z:4},w,h);line(ctx,sp.x,sp.y,a.x,a.y,C.red);line(ctx,sp.x,sp.y,b.x,b.y,C.red);}
function drawPerspective(){const ctx=ctxs.perspective,w=perspective.clientWidth,h=perspective.clientHeight;clear(ctx,w,h); if(state.show.grid)perspGrid(ctx,w,h); const pts=objectPoints(), pr=pts.map(p=>mapPers(project(p),w,h)); const horizon=mapPers({x:0,y:state.sp.y},w,h).y; line(ctx,0,horizon,w,horizon,C.yellow,1.5); label(ctx,12,horizon-7,'HL  horizon line',C.yellow); const groundLine=h*.82; line(ctx,0,groundLine,w,groundLine,C.muted,1.2); label(ctx,12,groundLine-7,'GL  ground line',C.muted); if(state.show.cone){ctx.fillStyle='rgba(255,107,107,.09)';ctx.fillRect(0,0,w*.15,h);ctx.fillRect(w*.85,0,w*.15,h);label(ctx,w*.02,24,'distortion outside cone',C.red);label(ctx,w*.75,24,'distortion outside cone',C.red)} drawObj(ctx,pr); if(state.show.curves)drawCurves(ctx,pr); const r=state.obj.rot*Math.PI/180, vps=[dirVP(Math.cos(r),Math.sin(r)),dirVP(-Math.sin(r),Math.cos(r))]; vps.forEach((v,i)=>{if(v){const m=mapPers(v,w,h);line(ctx,m.x,horizon-25,m.x,horizon+25,C.green);dot(ctx,m.x,horizon,5,C.green,'VP'+(i+1))}}); const aux=dirVP(Math.cos(r),Math.sin(r),.7); if(aux){const m=mapPers(aux,w,h);dot(ctx,m.x,m.y,5,C.purple,'AVP');line(ctx,m.x,horizon,m.x,m.y,C.purple)} if(state.show.parallel){ctx.globalAlpha=.55;const flat=pts.map(p=>({x:w*.78+(p.x-state.obj.x)*42,y:h*.72-p.y*42-p.z*4}));drawObj(ctx,flat,C.orange);label(ctx,w*.68,h*.88,'parallel projection comparison',C.orange);ctx.globalAlpha=1} label(ctx,12,h-16,'Converging edges reveal vanishing points; vertical convergence appears in three-point mode.',C.muted);}
function perspGrid(ctx,w,h){const hy=mapPers({x:0,y:state.sp.y},w,h).y; for(let i=0;i<18;i++){let x=w/2+(i-9)*35; line(ctx,x,h,x+(w/2-x)*.96,hy,C.grid)} for(let j=0;j<10;j++){let y=hy+(h-hy)*(j/10)**1.7;line(ctx,0,y,w,y,C.grid)}}
function drawConstruction(){const ctx=ctxs.construction,w=construction.clientWidth,h=construction.clientHeight;clear(ctx,w,h); if(state.show.grid)drawGrid(ctx,w,h); label(ctx,14,20,'PLAN',C.text); label(ctx,14,h*.5+20,'ELEVATION',C.text); const ppA=mapPlan({x:-9,z:state.pp},w,h), ppB=mapPlan({x:9,z:state.pp},w,h); line(ctx,ppA.x,ppA.y,ppB.x,ppB.y,C.ray,2); label(ctx,ppA.x+8,ppA.y-7,'picture plane',C.ray); const hl=mapElev({x:0,y:state.sp.y},w,h); line(ctx,0,hl.y,w,hl.y,C.yellow,1.5); label(ctx,12,hl.y-7,'horizon = eye level',C.yellow); const sp=mapPlan(state.sp,w,h); dot(ctx,sp.x,sp.y,7,C.orange,'SP'); const pts=objectPoints(); const plan=pts.slice(0,8).map(p=>mapPlan(p,w,h)), elev=pts.slice(0,8).map(p=>mapElev(p,w,h)); drawObj(ctx,plan); drawObj(ctx,elev,C.muted); if(state.show.rays)pts.slice(0,8).forEach(p=>{const a=mapPlan(p,w,h), q=mapPlan(project(p),w,h);line(ctx,sp.x,sp.y,a.x,a.y,C.ray,.8);dot(ctx,q.x,q.y,2.8,C.white)}); const r=state.obj.rot*Math.PI/180, v1=dirVP(Math.cos(r),Math.sin(r)); if(v1){const m=mapPers(v1,w,h); label(ctx,w-220,28,`dynamic VP1 on HL: x=${m.x.toFixed(0)} px`,C.green)} drawStep(ctx,w,h); updateReadouts();}
function drawStep(ctx,w,h){const [t,txt]=steps[state.step];$('lessonTitle').textContent=`${state.step+1}. ${t}`;$('lessonText').textContent=txt;$('feedback').textContent= state.step===4?'Warning: points projected far from the central visual ray are highlighted as distortion-prone.':txt;}
function drawObj(ctx,pts,color=C.white){ctx.strokeStyle=color;ctx.lineWidth=1.3;edges.forEach(e=>{if(pts[e[0]]&&pts[e[1]])line(ctx,pts[e[0]].x,pts[e[0]].y,pts[e[1]].x,pts[e[1]].y,color)});pts.slice(0,8).forEach(p=>dot(ctx,p.x,p.y,2.5,color));}
function drawCurves(ctx,pr){if(pr.length<26)return;const ctx2=ctxs.perspective;ctx2.strokeStyle=C.purple;ctx2.beginPath();for(let i=8;i<26;i++){const p=pr[i]; if(i===8)ctx2.moveTo(p.x,p.y); else ctx2.lineTo(p.x,p.y)}ctx2.closePath();ctx2.stroke();line(ctx2,pr[7].x,pr[7].y,pr[26].x,pr[26].y,C.purple,1.4)}
function clear(ctx,w,h){ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h)}
function line(ctx,x1,y1,x2,y2,c=C.grid,l=1){ctx.strokeStyle=c;ctx.lineWidth=l;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function dot(ctx,x,y,r,c,txt){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill(); if(txt)label(ctx,x+8,y-8,txt,c)}
function poly(ctx,pts,fill,stroke){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.stroke()}
function label(ctx,x,y,t,c=C.text){ctx.fillStyle=c;ctx.font='12px ui-monospace, monospace';ctx.fillText(t,x,y)}
function updateReadouts(){const r=state.obj.rot*Math.PI/180,v1=dirVP(Math.cos(r),Math.sin(r)),v2=dirVP(-Math.sin(r),Math.cos(r)),aux=dirVP(Math.cos(r),Math.sin(r),.7);$('readSP').textContent=`(${state.sp.x.toFixed(1)}, ${state.sp.y.toFixed(1)}, ${state.sp.z.toFixed(1)})`;$('readPP').textContent=`z = ${state.pp.toFixed(1)}`;$('readHL').textContent=`y = ${state.sp.y.toFixed(1)}`;$('readVP').textContent=[v1,v2].map(v=>v?`(${v.x.toFixed(1)},${v.y.toFixed(1)})`:'∞').join('  ');$('readAux').textContent=aux?`(${aux.x.toFixed(1)},${aux.y.toFixed(1)})`:'not active';$('readMP').textContent=`approx. ${(Math.abs(state.sp.z-state.pp)).toFixed(1)} units from VP`;}
function setupDrag(){const c=$('construction');c.onpointerdown=e=>{state.drag='sp';drag(e)};c.onpointermove=e=>{hover(e); if(state.drag)drag(e)};c.onpointerup=()=>state.drag=null;c.onpointerleave=()=>{$('tooltip').style.display='none';state.drag=null};}
function drag(e){const r=construction.getBoundingClientRect(),w=construction.clientWidth,h=construction.clientHeight,s=32;state.sp.x=(e.clientX-r.left-w/2)/s;state.sp.z=(h*.68-(e.clientY-r.top))/s;spx.value=Math.max(-9,Math.min(9,state.sp.x));spz.value=Math.max(-12,Math.min(2,state.sp.z));readControls();}
function hover(e){if(!state.explain)return;const tt=$('tooltip'), r=construction.getBoundingClientRect(), y=e.clientY-r.top, x=e.clientX-r.left;let msg='';const pp=mapPlan({x:0,z:state.pp},construction.clientWidth,construction.clientHeight);const hl=mapElev({x:0,y:state.sp.y},construction.clientWidth,construction.clientHeight);if(Math.abs(y-pp.y)<10)msg='Picture plane: the vertical plane where visual rays are pierced to create the perspective image.';else if(Math.abs(y-hl.y)<10)msg='Horizon line: eye-level trace of all horizontal vanishing points.';else if(Math.hypot(x-mapPlan(state.sp,construction.clientWidth,construction.clientHeight).x,y-mapPlan(state.sp,construction.clientWidth,construction.clientHeight).y)<30)msg='Station point: the observer eye. Drag it to change central visual rays and vanishing points.';else msg='Construction workspace: rays from SP through object points intersect the picture plane to form perspective points.';tt.textContent=msg;tt.style.display='block';tt.style.left=e.clientX+14+'px';tt.style.top=e.clientY+14+'px';}
function draw(){drawScene();drawPerspective();drawConstruction();}
init();
