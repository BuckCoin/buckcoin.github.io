/* Approved R5 source SHA-256: e2243645e83589accad79264763346cf50887c93c0261facd9d35fa8ea9e081e; only canvas target and visibility pause adapted. */

(()=>{'use strict';const canvas=document.getElementById('buck-r5-canvas'),ctx=canvas.getContext('2d'),host=canvas.parentNode;let raf=0,w=0,h=0,dpr=1,mode='fast',nodes=[],paths=[],flashes=[],last=0,spawn=0,shown=true;const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');let reduce=motionQuery.matches;const R=34;const TAU=Math.PI*2;function setup(){let b=host.getBoundingClientRect();w=Math.max(1,b.width);h=Math.max(1,b.height);dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);nodes=[];paths=[];flashes=[];const dx=Math.sqrt(3)*R,dy=1.5*R;const x0=Math.max(0,w*.35)-R*3;const cols=Math.ceil((w-x0)/dx)+3,rows=Math.ceil(h/dy)+2;const byPos=new Map();const key=(x,y)=>`${Math.round(x)}:${Math.round(y)}`;for(let j=-1;j<rows;j++){for(let i=0;i<cols;i++){const cx=x0+i*dx+(j%2?dx/2:0),cy=j*dy;const verts=[];for(let k=0;k<6;k++){let a=(30+k*60)*Math.PI/180;let x=cx+R*Math.cos(a),y=cy+R*Math.sin(a),id=key(x,y);if(!byPos.has(id)){byPos.set(id,{x,y,links:[]})}verts.push(id)}for(let k=0;k<6;k++){let a=verts[k],b=verts[(k+1)%6],na=byPos.get(a),nb=byPos.get(b);if(!na.links.includes(b))na.links.push(b);if(!nb.links.includes(a))nb.links.push(a)} }}nodes=[...byPos.entries()].map(([id,p])=>({id,...p}));let map=new Map(nodes.map(n=>[n.id,n]));const seen=new Set();for(let n of nodes){for(let id of n.links){let k=[n.id,id].sort().join('|');if(seen.has(k))continue;seen.add(k);let nn=map.get(id);if(nn)paths.push([n,nn])}}}
function pos(n,t){
  // Two traveling, non-uniform deformation fields: visible motion of the grid itself.
  const amp=21, speed=.82; // R3 grid: identical in both comparison modes
  const u=n.x*.010+n.y*.004-t*speed;
  const v=n.y*.012-n.x*.003+t*speed*.77;
  const cross=n.x*.005-n.y*.009+t*speed*.51;
  return {
    x:n.x+amp*(.72*Math.sin(u)+.28*Math.sin(v+1.3)),
    y:n.y+amp*(.68*Math.cos(v)+.32*Math.sin(cross))
  };
}function makeFlash(){let visible=nodes.filter(n=>n.x>w*.40&&n.x<w-30&&n.y>30&&n.y<h-30);if(!visible.length)return;let start=visible[Math.floor(Math.random()*visible.length)],map=new Map(nodes.map(n=>[n.id,n])),list=[start],visited=new Set([start.id]);const count=13; /* original R3 path length */for(let i=0;i<count;i++){let cur=list.at(-1),options=cur.links.map(id=>map.get(id)).filter(n=>n&&!visited.has(n.id)&&n.x>w*.33&&n.x<w);if(!options.length)break;const pick=options[Math.floor(Math.random()*options.length)];list.push(pick);visited.add(pick.id)}if(list.length>2)flashes.push({list,born:performance.now(),duration:mode==='fast'?720:1170 /* R4 speed vs original R3 */})}
function draw(tm){raf=0;if(!shown)return;const t=tm*.001,dt=Math.min(.05,(tm-last)*.001||0);last=tm;ctx.clearRect(0,0,w,h);let moving=mode!=='off'&&!reduce;const contrast=.82; /* original R3 grid tone */ctx.lineWidth=.65;ctx.strokeStyle=`rgba(99,184,167,${.32*contrast})`;ctx.beginPath();for(const [a,b] of paths){let pa=pos(a,moving?t:0),pb=pos(b,moving?t:0);ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y)}ctx.stroke();if(moving){spawn+=dt*1.55; /* original R3 pulse frequency */while(spawn>1){spawn--;makeFlash()}}flashes=flashes.filter(f=>tm-f.born<f.duration);for(const f of flashes){let percent=Math.max(0,(tm-f.born)/f.duration),seg=.30; /* original R3 trail length */let front=percent*(f.list.length-1+seg);let start=Math.max(0,front-seg*(f.list.length-1)),end=Math.min(f.list.length-1,front);if(start>=end)continue;let grad=ctx.createLinearGradient(pos(f.list[0],t).x,pos(f.list[0],t).y,pos(f.list.at(-1),t).x,pos(f.list.at(-1),t).y);grad.addColorStop(0,'rgba(142,222,192,.55)');grad.addColorStop(.5,'#eafff7');grad.addColorStop(1,'#8edec0');ctx.shadowBlur=10; /* original R3 glow */ctx.shadowColor='#8edec0';ctx.lineWidth=1.25; /* original R3 line weight */ctx.strokeStyle=grad;ctx.beginPath();const point=at(start,f.list,t);ctx.moveTo(point.x,point.y);for(let k=Math.ceil(start);k<end;k++){let p=pos(f.list[k],t);ctx.lineTo(p.x,p.y)}let endp=at(end,f.list,t);ctx.lineTo(endp.x,endp.y);ctx.stroke();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(endp.x,endp.y,1.4,0,TAU); /* original R3 subtle endpoint */ctx.fillStyle='#dbfff0';ctx.fill()}if(shown&&!reduce&&mode!=='off'&&!raf)raf=requestAnimationFrame(draw)}
function at(index,list,t){let i=Math.min(list.length-2,Math.floor(index)),a=pos(list[i],t),b=pos(list[i+1],t),mix=index-i;return{x:a.x+(b.x-a.x)*mix,y:a.y+(b.y-a.y)*mix}}
// One animation scheduler, shared by visibility, viewport, resize and motion preference.
// In reduced-motion mode we paint one static honeycomb frame and schedule no RAF.
let hostVisible=true;
let active=true;
function halt(){
  if(raf)cancelAnimationFrame(raf);
  raf=0;flashes=[];spawn=0;last=0;
}
function paint(){
  if(!shown||!active)return;
  if(raf)cancelAnimationFrame(raf);
  raf=requestAnimationFrame(draw); // draw schedules no successor when reduce or mode=off
}
function sync(){
  const next=active&&!document.hidden&&hostVisible;
  if(!next){shown=false;halt();return;}
  if(!shown){shown=true;last=0;flashes=[];spawn=0;paint();}
}
function onPreferenceChange(event){
  reduce=event.matches;
  halt();
  if(shown)paint();
}
function onResize(){setup();halt();if(shown)paint();}
function onVisibility(){sync();}
function onPageHide(){active=false;shown=false;halt();}
function onPageShow(){active=true;shown=false;sync();}
const io=new IntersectionObserver(entries=>{
  hostVisible=entries[0].isIntersecting;
  sync();
},{threshold:0});
io.observe(host);
document.addEventListener('visibilitychange',onVisibility);
window.addEventListener('resize',onResize);
window.addEventListener('pagehide',onPageHide);
window.addEventListener('pageshow',onPageShow);
// Modern browsers support addEventListener; older engines use addListener.
if(motionQuery.addEventListener)motionQuery.addEventListener('change',onPreferenceChange);
else if(motionQuery.addListener)motionQuery.addListener(onPreferenceChange);
for(const b of document.querySelectorAll('[data-mode]')){
  b.addEventListener('click',()=>{
    mode=b.dataset.mode;
    halt();
    for(const n of document.querySelectorAll('[data-mode]'))
      n.setAttribute('aria-pressed',String(n===b));
    if(shown)paint();
  });
}
setup();
shown=!document.hidden;
sync();
paint();
})();
