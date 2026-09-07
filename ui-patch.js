(function(g){'use strict';
var U=g.RootworkUI,h=U.h,I=U.I;
function stableTone(value){var s=String(value||''),n=0;for(var i=0;i<s.length;i++)n=(n+s.charCodeAt(i)*(i+1))%997;return['blue','teal','violet'][n%3]}
/* One visual language only: targets for goals, repeat-cycle for routines. */
U.goalMeta=function(x){return{icon:'goal',tone:stableTone((x&&x.id)||(x&&x.title))}};
U.routineMeta=function(r){return{icon:'routine',tone:stableTone((r&&r.id)||(r&&r.name))}};
/* Weekly tasks keep one briefcase glyph; tap the task copy or pencil to edit. */
U.Task=function(q){var m=q.x.time||'Linh hoạt',meta=U.taskMeta(q.x),copy=h('div',null,h('strong',null,q.x.title),q.x.note&&h('small',null,q.x.note));if(q.edit)copy=h('button',{type:'button',className:'task-copy',onClick:function(){q.edit(q.x)},'aria-label':'Sửa '+q.x.title},h('strong',null,q.x.title),q.x.note&&h('small',null,q.x.note));return h('div',{className:'task '+(q.x.done?'done':'')},h('button',{type:'button',className:'check '+(q.x.done?'checked':''),onClick:function(){q.toggle(q.x)},'aria-label':q.x.done?'Đánh dấu chưa xong':'Hoàn thành'},q.x.done&&I('check',14,2.6)),h('span',{className:'task-icon '+meta.tone},I('briefcase',15,1.9)),copy,h('span',{className:'task-time'},m),q.edit&&h('button',{type:'button',className:'edit-btn',onClick:function(){q.edit(q.x)},'aria-label':'Sửa tác vụ'},I('edit',15,1.9)))};
})(window);
