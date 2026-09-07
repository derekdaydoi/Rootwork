(function(g){'use strict';
var U=g.RootworkUI,R=U.R,h=U.h,I=U.I,ts=U.targetStats,Bar=U.Bar,Head=U.Head,Task=U.Task,goalMeta=U.goalMeta;
function toneIcon(meta,size){return h('span',{className:'tile-icon '+meta.tone},I(meta.icon,size||22))}
function segmented(items,value,set){return h('div',{className:'segmented'},items.map(function(x){return h('button',{key:x[0],className:value===x[0]?'active':'',onClick:function(){set(x[0])}},x[1])}))}
U.Goals=function(q){
  var f=R.useState('all'),filter=f[0],setFilter=f[1],all=q.w.targets||[];
  var list=all.filter(function(x){var s=ts(x),complete=s.total>0&&s.percent===100;return filter==='all'||(filter==='done'&&complete)||(filter==='active'&&!complete)});
  return h('div',{className:'page'},
    Head('Mục tiêu',h('button',{className:'circle',onClick:q.addGoal,'aria-label':'Thêm mục tiêu'},I('plus',24))),
    segmented([['all','Tất cả'],['active','Đang thực hiện'],['done','Đã hoàn thành']],filter,setFilter),
    list.length?h('div',{className:'goal-list'},list.map(function(x,i){var s=ts(x),meta=goalMeta(x,i);return h('article',{className:'card goal-card',key:x.id},
      h('header',null,toneIcon(meta,22),h('div',null,h('strong',null,x.title),h('small',null,x.description||'Mục tiêu tuần')),h('div',{className:'goal-tools'},h('b',null,s.done+'/'+s.total),h('button',{type:'button',className:'edit-btn goal-edit',onClick:function(){q.editGoal(x)},'aria-label':'Sửa mục tiêu'},I('edit',15,1.9)))),
      Bar(s.percent,true),
      h('div',{className:'goal-task-label'},h('span',null,'Tác vụ tuần ('+(x.tasks||[]).length+')')),
      h('div',{className:'task-list'},(x.tasks||[]).map(function(t){return h(Task,{key:t.id,x:Object.assign({},t,{weekId:q.w.id,targetId:x.id}),toggle:q.toggleTask,edit:q.editTask})})),
      h('button',{className:'add-row',onClick:function(){q.addTask(x.id)}},I('plus',17),'Thêm tác vụ tuần')
    )})):h('section',{className:'empty card'},h('h3',null,'Chưa có mục tiêu phù hợp'),h('p',null,'Tạo mục tiêu rồi chia thành tác vụ tuần.'),h('button',{className:'primary',onClick:q.addGoal},'Thêm mục tiêu'))
  )
};
})(window);
