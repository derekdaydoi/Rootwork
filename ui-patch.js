(function(g){'use strict';
var U=g.RootworkUI,h=U.h,I=U.I;
/* Canonical visual language: one glyph + one fixed color per entity type. */
U.goalMeta=function(){return{icon:'goal',tone:'blue'}};
U.routineMeta=function(){return{icon:'routine',tone:'violet'}};
U.taskMeta=function(){return{icon:'briefcase',tone:'teal'}};
/* Weekly tasks keep one briefcase glyph; tap the task copy or pencil to edit. */
U.Task=function(q){var m=q.x.time||'Linh hoạt',meta=U.taskMeta(q.x),copy=h('div',null,h('strong',null,q.x.title),q.x.note&&h('small',null,q.x.note));if(q.edit)copy=h('button',{type:'button',className:'task-copy',onClick:function(){q.edit(q.x)},'aria-label':'Sửa '+q.x.title},h('strong',null,q.x.title),q.x.note&&h('small',null,q.x.note));return h('div',{className:'task '+(q.x.done?'done':'')},h('button',{type:'button',className:'check '+(q.x.done?'checked':''),onClick:function(){q.toggle(q.x)},'aria-label':q.x.done?'Đánh dấu chưa xong':'Hoàn thành'},q.x.done&&I('check',14,2.6)),h('span',{className:'task-icon '+meta.tone},I('briefcase',15,1.9)),copy,h('span',{className:'task-time'},m),q.edit&&h('button',{type:'button',className:'edit-btn',onClick:function(){q.edit(q.x)},'aria-label':'Sửa tác vụ'},I('edit',15,1.9)))};
})(window);
