import React from 'react';
import AvatarPortrait from './AvatarPortrait';
export const PORTRAITS=[
 {id:'nova',label:'Nova',skin:'#edb58c',hair:'#332337',shirt:'#248adb',long:true,bg:'#bfefff'},
 {id:'kai',label:'Kai',skin:'#c98860',hair:'#392622',shirt:'#efae39',bg:'#ffedb9'},
 {id:'sage',label:'Sage',skin:'#925937',hair:'#211d29',shirt:'#3db6a3',curls:true,bg:'#bcf1dc'},
 {id:'leo',label:'Leo',skin:'#efc6a1',hair:'#573221',shirt:'#7e65c5',glasses:true,bg:'#ded5ff'},
 {id:'luna',label:'Luna',skin:'#dca580',hair:'#202437',shirt:'#ea789c',long:true,bg:'#ffd6e6'},
 {id:'ash',label:'Ash',skin:'#f2cba8',hair:'#c78d35',shirt:'#276dba',bg:'#cce3ff'}
];
export default function ProfilePortrait({id='nova',guide=false,className=''}){
 const index=Math.max(0,PORTRAITS.findIndex(p=>p.id===id));
 if(guide)return <img className={'profile-portrait '+className} src="/assets/bhell-guide.png" alt="Bhell, your science guide"/>;
 return <AvatarPortrait id={id} className={className}/>;
}
