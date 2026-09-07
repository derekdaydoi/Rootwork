(function(g){'use strict';
var U=g.RootworkUI,R=U.R,D=U.D,h=U.h,I=U.I,pct=U.pct,ymd=U.ymd,pd=U.pd,mi=U.mi,tasks=U.tasks,ts=U.targetStats,rs=U.routineStats,rc=U.consistency,Bar=U.Bar,Ring=U.Ring,Head=U.Head,Task=U.Task,goalMeta=U.goalMeta,routineMeta=U.routineMeta;

function toneIcon(meta,size){return h('span',{className:'tile-icon '+meta.tone},I(meta.icon,size||22))}
function segmented(items,value,set){return h('div',{className:'segmented'},items.map(function(x){return h('button',{key:x[0],className:value===x[0]?'active':'',onClick:function(){set(x[0])}},x[1])}))}
function Dashboard(q){
  var a=tasks(q.w),done=a.filter(function(x){return x.done}).length,c=pct(done,a.length),goals=q.w.targets||[],remain=Math.max(0,a.length-done);
  var daily=D.weekDates(q.w.startDate).map(function(d){var x=a.filter(function(t){return t.date===d});return pct(x.filter(function(t){return t.done}).length,x.length)});
  return h('div',{className:'page dashboard-page'},
    h('section',{className:'greeting'},h('h1',null,U.greeting()),h('p',null,'Hôm nay là một bước tiến tốt hơn.')),
    h('section',{className:'card week-progress'},
      Ring(c,72),
      h('div',{className:'week-progress-copy'},h('span',null,'Tiến độ tuần'),h('strong',null,done+' / '+a.length+' tác vụ'),h('small',null,c>=70?'Tuyệt vời! Tiếp tục duy trì nhé.':'Giữ nhịp đều, hoàn thành từng việc.'))
    ),
    h('section',{className:'mini-stats'},
      h('article',{className:'card mini-stat blue'},h('strong',null,goals.length),h('span',null,'Mục tiêu')),
      h('article',{className:'card mini-stat teal'},h('strong',null,a.length),h('span',null,'Tác vụ')),
      h('article',{className:'card mini-stat violet'},h('strong',null,done),h('span',null,'Đã hoàn thành')),
      h('article',{className:'card mini-stat danger'},h('strong',null,remain),h('span',null,'Còn lại'))
    ),
    h('section',{className:'section-title'},h('h2',null,'Tiến độ theo ngày (tuần này)')),
    h('section',{className:'card daily-chart'},h('div',{className:'daily-bars'},daily.map(function(v,i){return h('div',{key:i},h('b',null,v+'%'),h('span',null,h('i',{style:{height:Math.max(4,v)+'%'}})),h('small',null,['T2','T3','T4','T5','T6','T7','CN'][i]))})))
  )
}
function Goals(q){
  var f=R.useState('all'),filter=f[0],setFilter=f[1],all=q.w.targets||[];
  var list=all.filter(function(x){var s=ts(x),complete=s.total>0&&s.percent===100;return filter==='all'||(filter==='done'&&complete)||(filter==='active'&&!complete)});
  return h('div',{className:'page'},
    Head('Mục tiêu',h('button',{className:'circle',onClick:q.addGoal,'aria-label':'Thêm mục tiêu'},I('plus',24))),
    segmented([['all','Tất cả'],['active','Đang thực hiện'],['done','Đã hoàn thành']],filter,setFilter),
    list.length?h('div',{className:'goal-list'},list.map(function(x,i){var s=ts(x),meta=goalMeta(x,i);return h('article',{className:'card goal-card',key:x.id},
      h('header',null,toneIcon(meta,22),h('div',null,h('strong',null,x.title),h('small',null,x.description||'Mục tiêu tuần')),h('b',null,s.done+'/'+s.total)),
      Bar(s.percent,true),
      h('div',{className:'goal-task-label'},h('span',null,'Tác vụ tuần ('+(x.tasks||[]).length+')')),
      h('div',{className:'task-list'},(x.tasks||[]).map(function(t){return h(Task,{key:t.id,x:Object.assign({},t,{weekId:q.w.id,targetId:x.id}),toggle:q.toggleTask})})),
      h('button',{className:'add-row',onClick:function(){q.addTask(x.id)}},I('plus',17),'Thêm tác vụ tuần')
    )})):h('section',{className:'empty card'},h('h3',null,'Chưa có mục tiêu phù hợp'),h('p',null,'Tạo mục tiêu rồi chia thành tác vụ tuần.'),h('button',{className:'primary',onClick:q.addGoal},'Thêm mục tiêu'))
  )
}
function Calendar(q){
  var today=D.today(),ini=pd(today),ms=R.useState(new Date(ini.getFullYear(),ini.getMonth(),1,12)),m=ms[0],setM=ms[1],ps=R.useState(today),pick=ps[0],setPick=ps[1];
  var start=new Date(m.getFullYear(),m.getMonth(),1,12),gs=new Date(start);gs.setDate(start.getDate()-mi(start.getDay()));
  var cells=[],idx={};for(var i=0;i<42;i++){var d=new Date(gs);d.setDate(gs.getDate()+i);cells.push(d)}
  (q.data.weeks||[]).forEach(function(w){tasks(w).forEach(function(x){if(x.date){(idx[x.date]||(idx[x.date]=[])).push(Object.assign({},x,{readonly:w.status==='complete'}))}})});
  var picked=idx[pick]||[];
  return h('div',{className:'page'},
    Head('Lịch',h('button',{className:'today-chip',onClick:function(){setM(new Date(ini.getFullYear(),ini.getMonth(),1,12));setPick(today)}},'Hôm nay')),
    h('section',{className:'calendar-panel'},
      h('div',{className:'month-nav'},h('button',{onClick:function(){setM(new Date(m.getFullYear(),m.getMonth()-1,1,12))}},I('left',18)),h('strong',null,m.toLocaleDateString('vi-VN',{month:'long',year:'numeric'})),h('button',{onClick:function(){setM(new Date(m.getFullYear(),m.getMonth()+1,1,12))}},I('right',18))),
      h('div',{className:'weekdays'},['T2','T3','T4','T5','T6','T7','CN'].map(function(n){return h('span',{key:n},n)})),
      h('div',{className:'calendar-grid'},cells.map(function(d){var k=ymd(d),x=idx[k]||[];return h('button',{key:k,className:'calendar-day '+(d.getMonth()!==m.getMonth()?'outside ':'')+(k===pick?'selected ':'')+(k===today?'today ':''),onClick:function(){setPick(k)}},h('span',null,d.getDate()),x.length?h('i',{className:x.every(function(t){return t.done})?'done':'some'}):null)}))
    ),
    h('section',{className:'day-caption'},h('strong',null,pd(pick).toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long'})),h('span',null,picked.length+' tác vụ')),
    h('section',{className:'card day-detail'},
      picked.length?picked.map(function(x){return h('div',{className:'cal-row',key:x.weekId+x.id},h('button',{className:'check '+(x.done?'checked':''),disabled:x.readonly,onClick:function(){if(!x.readonly)q.toggleTask(x)}},x.done&&I('check',14,2.7)),h('div',null,h('strong',null,x.title),h('small',null,(x.time||'Linh hoạt')+(x.targetTitle?' · '+x.targetTitle:''))))}):h('p',{className:'empty-day'},'Ngày này chưa có tác vụ.'),
      pick>=q.w.startDate&&pick<=q.w.endDate&&h('button',{className:'add-row',onClick:function(){q.addTask('',pick)}},I('plus',17),'Thêm tác vụ vào ngày này')
    )
  )
}
function Routines(q){
  var f=R.useState('all'),filter=f[0],setFilter=f[1],all=q.data.routines||[],dates=D.weekDates(q.w.startDate);
  var a=all.filter(function(r){var type=r.recurrence&&r.recurrence.type||'weekly';return filter==='all'||type===filter});
  return h('div',{className:'page'},
    Head('Routine',h('button',{className:'circle',onClick:q.addRoutine,'aria-label':'Thêm routine'},I('plus',24))),
    segmented([['all','Tất cả'],['daily','Hàng ngày'],['weekly','Hàng tuần']],filter,setFilter),
    a.length?h('div',{className:'routine-list'},a.map(function(r,i){var s=rs(r,q.w.startDate),meta=routineMeta(r,i);return h('article',{className:'card routine-card',key:r.id},
      h('header',null,toneIcon(meta,22),h('div',null,h('strong',null,r.name),h('small',null,s.hits+' / '+s.target+' lần tuần')),Ring(s.percent,46)),
      h('div',{className:'routine-days'},dates.map(function(d,j){var checked=!!(r.log&&r.log[d]);return h('button',{key:d,className:checked?'checked':'',onClick:function(){q.toggleRoutine(r.id,d)}},h('span',null,['T2','T3','T4','T5','T6','T7','CN'][j]),h('b',null,checked?I('check',12,2.8):pd(d).getDate()))}))
    )})):h('section',{className:'empty card'},h('h3',null,'Chưa có routine'),h('p',null,'Tạo thói quen lặp lại và ghi nhận theo ngày.'),h('button',{className:'primary',onClick:q.addRoutine},'Thêm routine'))
  )
}
function Progress(q){
  var a=tasks(q.w),done=a.filter(function(x){return x.done}).length,c=pct(done,a.length),goals=q.w.targets||[],routines=q.data.routines||[];
  var best=0;routines.forEach(function(r){best=Math.max(best,D.routineWeekStreak?D.routineWeekStreak(r,q.w.startDate):0)});
  var hist=(q.data.weeks||[]).filter(function(w){return w.status==='complete'}).slice(-3).map(function(w){var x=tasks(w);return pct(x.filter(function(t){return t.done}).length,x.length)});hist.push(c);while(hist.length<4)hist.unshift(0);
  return h('div',{className:'page'},
    Head('Thống kê',h('button',{className:'period-chip'},'4 tuần qua '+String.fromCharCode(8964))),
    h('section',{className:'progress-kpis'},
      h('article',{className:'card'},h('strong',null,c+'%'),h('small',null,'Tỷ lệ hoàn thành')),
      h('article',{className:'card'},h('strong',null,done+'/'+a.length),h('small',null,'Tác vụ đã xong')),
      h('article',{className:'card'},h('strong',null,best),h('small',null,'Chuỗi tuần liên tiếp'))
    ),
    h('section',{className:'section-title'},h('h2',null,'Tiến độ theo mục tiêu')),
    h('section',{className:'card goal-progress-list'},goals.length?goals.map(function(x,i){var s=ts(x),meta=goalMeta(x,i);return h('div',{key:x.id},toneIcon(meta,17),h('strong',null,x.title),Bar(s.percent,true),h('b',null,s.percent+'%'))}):h('p',{className:'empty-day'},'Chưa có mục tiêu.')),
    h('section',{className:'section-title'},h('h2',null,'Biểu đồ hoàn thành theo tuần')),
    h('section',{className:'card weekly-chart'},h('div',null,hist.map(function(v,i){return h('section',{key:i},h('b',null,v+'%'),h('span',null,h('i',{style:{height:Math.max(5,v)+'%'}})),h('small',null,'Tuần '+(i+1)))}))),
    h('section',{className:'section-title'},h('h2',null,'Hoạt động tuần này')),
    h('section',{className:'card activity-card'},h('span',{className:'activity-icon'},I('clock',25)),h('div',null,h('strong',null,done+' tác vụ'),h('small',null,'Đã hoàn thành trong tuần hiện tại')),h('span',{className:'mini-bars'},I('chart',24))),
    best>0&&h('section',{className:'recent-title'},h('h2',null,'Thành tựu gần đây')),
    best>0&&h('section',{className:'card achievement'},h('span',null,I('star',23)),h('div',null,h('strong',null,'Kiên trì'),h('small',null,'Duy trì '+best+' tuần liên tiếp')))
  )
}
function Nav(q){function b(v,n,l){return h('button',{className:q.v===v?'active':'',onClick:function(){q.go(v)}},I(n,24,2),h('span',null,l))}return h('nav',{className:'nav'},b('dashboard','home','Trang chủ'),b('goals','goal','Mục tiêu'),b('calendar','cal','Lịch'),b('routines','routine','Routine'),b('progress','chart','Thống kê'))}
Object.assign(U,{Dashboard:Dashboard,Goals:Goals,Calendar:Calendar,Routines:Routines,Progress:Progress,Nav:Nav});
})(window);
