// Stable save IDs; the UI displays numbered choices without preset names.
export const AVATAR_OPTIONS=[
 {id:'kai',gender:'male',skin:'#c98860',hair:'#30211e',color:'#2465c9',style:'short'},
 {id:'leo',gender:'male',skin:'#efc6a1',hair:'#573221',color:'#2465c9',style:'short',glasses:true},
 {id:'ash',gender:'male',skin:'#f2cba8',hair:'#ba762c',color:'#2465c9',style:'short'},
 {id:'male-4',gender:'male',skin:'#925937',hair:'#211d29',color:'#2465c9',style:'curly'},
 {id:'nova',gender:'female',skin:'#edb58c',hair:'#332337',color:'#2465c9',style:'ponytail'},
 {id:'sage',gender:'female',skin:'#925937',hair:'#211d29',color:'#2465c9',style:'curly'},
 {id:'luna',gender:'female',skin:'#dca580',hair:'#202437',color:'#2465c9',style:'long'},
 {id:'female-4',gender:'female',skin:'#efc6a1',hair:'#573221',color:'#2465c9',style:'ponytail',glasses:true}
];
export function avatarAppearance(picture,gender='female'){
 const actual=gender==='boy'?'male':gender==='girl'?'female':gender;
 return AVATAR_OPTIONS.find(option=>option.id===picture&&(actual==='unspecified'||option.gender===actual))||AVATAR_OPTIONS.find(option=>option.gender===actual)||AVATAR_OPTIONS[4];
}
