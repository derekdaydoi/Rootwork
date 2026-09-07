(function(g){'use strict';
var R=g.React,D=g.RootworkDomain,S=g.RootworkStore,h=R.createElement;
var U=g.RootworkUI={R:R,D:D,S:S,h:h,LOGO:'brand/rootwork-mark.png?v=20260907-brand-r7'};
var P={home:['M3.5 10.8 12 4l8.5 6.8','M5.5 9.8v10h13v-10','M9.5 19.8v-6h5v6'],goal:['M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z','M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z'],cal:['M7 3.5v3','M17 3.5v3','M4 8.5h16','M5.5 5.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z'],chart:['M5 19V12','M12 19V7','M19 19V4'],routine:['M20 7v5h-5','M4 17v-5h5','M18.2 9A7 7 0 0 0 6.1 6.8L4 9','M5.8 15A7 7 0 0 0 17.9 17.2L20 15'],plus:['M12 5v14','M5 12h14'],settings:['M12 8.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2z','M4.8 9.2 3.7 7.5l2.2-2.2 1.8 1.1 2-.8.5-2.1h3.6l.5 2.1 2 .8 1.8-1.1 2.2 2.2-1.1 1.8.8 2 2.1.5v3.2l-2.1.5-.8 2 1.1 1.8-2.2 2.2-1.8-1.1-2 .8-.5 2.1h-3.6l-.5-2.1-2-.8-1.8 1.1-2.2-2.2 1.1-1.8-.8-2-2.1-.5v-3.2l2.1-.5.8-2z'],check:['M5 12.5l4.2 4.2L19 7.5'],left:['M14.5 5.5 8 12l6.5 6.5'],right:['M9.5 5.5 16 12l-6.5 6.5'],close:['M6.5 6.5l11 11','M17.5 6.5l-11 11']};
function I(n,s,w){return h('svg',{width:s||24,height:s||24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:w||2,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':'true'},(P[n]||[]).map(function(d,i){return h('path',{d:d,key:i})}))}
function Logo(c){return h('img',{src:U.LOGO,alt:'',className:c||'logo',draggable:false})}
function pct(a,b){return b?Math.round(a*100/b):0}function pad(n){return String(n).padStart(2,'0')}
function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function pd(v){var a=String(v||'').split('-').map(Number);return new Date(a[0],(a[1]||1)-1,a[2]||1,12)}
function mi(d){return(d+6)%7}
function tasks(w){var o=[];(w&&w.targets||[]).forEach(function(t){(t.tasks||[]).forEach(function(x){o.push(Object.assign({},x,{weekId:w.id,targetId:t.id,targetTitle:t.title}))})});(w&&w.looseTasks||[]).forEach(function(x){o.push(Object.assign({},x,{weekId:w.id,targetId:null,targetTitle:''}))});return o}
function targetStats(t){var a=t.tasks||[],d=a.filter(function(x){return x.done}).length;return{done:d,total:a.length,percent:pct(d,a.length)}}
function routineStats(r,m){return D.routineSnapshot?D.routineSnapshot(r,m):{hits:0,target:3,percent:0,achieved:false}}
function consistency(data,w){return D.routineConsistency?D.routineConsistency(data.routines||[],w.startDate):0}
function Head(title,sub,action){return h('div',{className:'head '+(action?'ha':'')},h('div',null,h('h1',null,title),sub&&h('p',null,sub)),action||null)}
function Bar(v,small){return h('div',{className:'bar '+(small?'small':'')},h('i',{style:{width:Math.max(0,Math.min(100,v||0))+'%'}}))}
function Sec(title,action,cb){return h('div',{className:'sec'},h('h2',null,title),cb&&h('button',{onClick:cb},action))}
function Task(q){var m=q.x.date?pd(q.x.date).getDate()+'/'+(pd(q.x.date).getMonth()+1):'Linh hoạt';return h('div',{className:'task '+(q.x.done?'done':'')},h('button',{className:'check '+(q.x.done?'checked':''),onClick:function(){q.toggle(q.x)},'aria-label':q.x.done?'Đánh dấu chưa xong':'Hoàn thành'},q.x.done&&I('check',14,2.7)),h('div',null,h('strong',null,q.x.title)),h('span',null,m))}
function Frame(q){return h('div',{className:'modal-bg',onMouseDown:function(e){if(e.target===e.currentTarget)q.close()}},h('section',{className:'modal'},h('header',null,h('h2',null,q.title),h('button',{onClick:q.close,'aria-label':'Đóng'},I('close',20))),q.children))}
function Field(l,c){return h('label',{className:'field'},h('span',null,l),c)}
Object.assign(U,{I:I,Logo:Logo,pct:pct,pad:pad,ymd:ymd,pd:pd,mi:mi,tasks:tasks,targetStats:targetStats,routineStats:routineStats,consistency:consistency,Head:Head,Bar:Bar,Sec:Sec,Task:Task,Frame:Frame,Field:Field});
})(window);
