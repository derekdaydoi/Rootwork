(function(g){'use strict';
var R=g.React,D=g.RootworkDomain,S=g.RootworkStore,h=R.createElement;
var U=g.RootworkUI={R:R,D:D,S:S,h:h,LOGO:'brand/rootwork-mark.png?v=20260907-brand-r8'};
var P={
home:['M3.5 10.8 12 4l8.5 6.8','M5.5 9.8v10h13v-10','M9.5 19.8v-6h5v6'],
goal:['M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z','M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z','M12 1v4','M12 19v4','M1 12h4','M19 12h4'],
cal:['M7 3.5v3','M17 3.5v3','M4 8.5h16','M5.5 5.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2z'],
chart:['M5 19V12','M12 19V7','M19 19V4'],
routine:['M20 7v5h-5','M4 17v-5h5','M18.2 9A7 7 0 0 0 6.1 6.8L4 9','M5.8 15A7 7 0 0 0 17.9 17.2L20 15'],
plus:['M12 5v14','M5 12h14'],
settings:['M12 8.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2z','M4.8 9.2 3.7 7.5l2.2-2.2 1.8 1.1 2-.8.5-2.1h3.6l.5 2.1 2 .8 1.8-1.1 2.2 2.2-1.1 1.8.8 2 2.1.5v3.2l-2.1.5-.8 2 1.1 1.8-2.2 2.2-1.8-1.1-2 .8-.5 2.1h-3.6l-.5-2.1-2-.8-1.8 1.1-2.2-2.2 1.1-1.8-.8-2-2.1-.5v-3.2l2.1-.5.8-2z'],
check:['M5 12.5l4.2 4.2L19 7.5'],
left:['M14.5 5.5 8 12l6.5 6.5'],
right:['M9.5 5.5 16 12l-6.5 6.5'],
close:['M6.5 6.5l11 11','M17.5 6.5l-11 11'],
heart:['M20.8 4.8a5.4 5.4 0 0 0-7.7 0L12 5.9l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 21l8.8-8.5a5.4 5.4 0 0 0 0-7.7z'],
briefcase:['M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7','M4 7h16v12H4z','M4 12h16','M10 12v2h4v-2'],
book:['M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z','M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z'],
dumbbell:['M6 9v6','M3.5 10.5v3','M18 9v6','M20.5 10.5v3','M6 12h12'],
leaf:['M20 4c-7 0-12 3.8-12 9.2 0 3.4 2.6 5.8 6 5.8 5.2 0 7-5.2 6-15z','M4 20c3.2-5.6 7.2-8.7 12.3-10.7'],
drop:['M12 3s6 6.6 6 11a6 6 0 1 1-12 0c0-4.4 6-11 6-11z'],
moon:['M19.5 15.2A8 8 0 0 1 8.8 4.5 8 8 0 1 0 19.5 15.2z'],
clock:['M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z','M12 7v5l3.5 2'],
star:['M12 3.4l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z']
};
function I(n,s,w){return h('svg',{width:s||24,height:s||24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:w||2,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':'true'},(P[n]||[]).map(function(d,i){return h('path',{d:d,key:i})}))}
function Logo(c){return h('img',{src:U.LOGO,alt:'',className:c||'logo',draggable:false})}
function pct(a,b){return b?Math.round(a*100/b):0}
function pad(n){return String(n).padStart(2,'0')}
function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function pd(v){var a=String(v||'').split('-').map(Number);return new Date(a[0],(a[1]||1)-1,a[2]||1,12)}
function mi(d){return(d+6)%7}
function tasks(w){var o=[];(w&&w.targets||[]).forEach(function(t){(t.tasks||[]).forEach(function(x){o.push(Object.assign({},x,{weekId:w.id,targetId:t.id,targetTitle:t.title}))})});(w&&w.looseTasks||[]).forEach(function(x){o.push(Object.assign({},x,{weekId:w.id,targetId:null,targetTitle:''}))});return o}
function targetStats(t){var a=t.tasks||[],d=a.filter(function(x){return x.done}).length;return{done:d,total:a.length,percent:pct(d,a.length)}}
function routineStats(r,m){return D.routineSnapshot?D.routineSnapshot(r,m):{hits:0,target:3,percent:0,achieved:false}}
function consistency(data,w){return D.routineConsistency?D.routineConsistency(data.routines||[],w.startDate):0}
function Bar(v,small){return h('div',{className:'bar '+(small?'small':'')},h('i',{style:{width:Math.max(0,Math.min(100,v||0))+'%'}}))}
function Ring(v,size){var p=Math.max(0,Math.min(100,Math.round(v||0)));return h('div',{className:'progress-ring',style:{'--ring-angle':(p*3.6)+'deg','--ring-size':(size||62)+'px'}},h('div',null,h('strong',null,p+'%')))}
function Head(title,action){return h('div',{className:'screen-head'},h('h1',null,title),action||null)}
function Sec(title,action,cb){return h('div',{className:'sec'},h('h2',null,title),cb&&h('button',{onClick:cb},action))}
function Task(q){var m=q.x.time||'Linh hoạt';return h('div',{className:'task '+(q.x.done?'done':'')},h('button',{className:'check '+(q.x.done?'checked':''),onClick:function(){q.toggle(q.x)},'aria-label':q.x.done?'Đánh dấu chưa xong':'Hoàn thành'},q.x.done&&I('check',14,2.6)),h('div',null,h('strong',null,q.x.title),q.x.note&&h('small',null,q.x.note)),h('span',null,m))}
function Frame(q){return h('div',{className:'modal-bg',onMouseDown:function(e){if(e.target===e.currentTarget)q.close()}},h('section',{className:'modal'},h('header',null,h('h2',null,q.title),h('button',{onClick:q.close,'aria-label':'Đóng'},I('close',20))),q.children))}
function Field(l,c){return h('label',{className:'field'},h('span',null,l),c)}
function goalMeta(x,i){var t=((x&&x.title)||'').toLowerCase(),icon='goal',tone='blue';if(/sức|khoẻ|health|fitness|thể dục/.test(t)){icon='heart';tone='teal'}else if(/công|work|việc|nghề|career/.test(t)){icon='briefcase';tone='blue'}else if(/học|study|đọc|learn|book/.test(t)){icon='book';tone='violet'}else if(i%3===0){icon='heart';tone='teal'}else if(i%3===1){icon='briefcase';tone='blue'}else{icon='book';tone='violet'}return{icon:icon,tone:tone}}
function routineMeta(r,i){var t=((r&&r.name)||'').toLowerCase();if(/tập|gym|exercise|workout/.test(t))return{icon:'dumbbell',tone:'blue'};if(/đọc|read|book/.test(t))return{icon:'book',tone:'violet'};if(/thiền|medit|zen/.test(t))return{icon:'leaf',tone:'teal'};if(/nước|water|uống/.test(t))return{icon:'drop',tone:'blue'};if(/ngủ|sleep/.test(t))return{icon:'moon',tone:'violet'};return{icon:'routine',tone:['blue','teal','violet'][i%3]}}
function greeting(){var h0=new Date().getHours();return h0<11?'Chào buổi sáng! 👋':h0<18?'Chào buổi chiều! 👋':'Chào buổi tối! 👋'}
Object.assign(U,{I:I,Logo:Logo,pct:pct,pad:pad,ymd:ymd,pd:pd,mi:mi,tasks:tasks,targetStats:targetStats,routineStats:routineStats,consistency:consistency,Bar:Bar,Ring:Ring,Head:Head,Sec:Sec,Task:Task,Frame:Frame,Field:Field,goalMeta:goalMeta,routineMeta:routineMeta,greeting:greeting});
})(window);
