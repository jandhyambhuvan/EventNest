import{NavLink,useNavigate}from'react-router-dom';
import{CalendarDays,LayoutDashboard,LogOut,Bell,PlusCircle,GraduationCap,UserRound,Building2,Users,CheckCheck,ArrowUpRight,ScanLine}from'lucide-react';
import{useAuth}from'../context/AuthContext';
import{useCallback,useEffect,useState}from'react';
import api from'../services/api';import ThemeToggle from'./ThemeToggle';

export default function Layout({children}){
 const{user,logout,setUser}=useAuth(),nav=useNavigate();
 const[notifications,setNotifications]=useState([]),[show,setShow]=useState(false),[profileOpen,setProfileOpen]=useState(false),[profileRegistrations,setProfileRegistrations]=useState([]);
 const refresh=useCallback(async()=>{try{const [n,u]=await Promise.all([api.get('/notifications'),api.get('/auth/me')]);setNotifications(n.data.notifications||[]);setUser(u.data.user);}catch{}},[setUser]);
 useEffect(()=>{refresh();const timer=setInterval(refresh,12000);return()=>clearInterval(timer);},[refresh]);
 const unread=notifications.filter(n=>!n.read).length;
 async function read(n){try{await api.patch(`/notifications/${n._id}/read`);setNotifications(a=>a.map(x=>x._id===n._id?{...x,read:true}:x));}catch{}setShow(false);const eventId=n.event?._id||n.event;if(user.role!=='student'){nav('/organizer');return;}if(n.category==='registration'&&/participation qr|qr code is ready/i.test(n.title||'')){nav('/scan-qr');return;}if(eventId){nav(`/events/${eventId}`);return;}nav('/');}
 async function readAll(){try{await api.patch('/notifications/read-all');setNotifications(a=>a.map(x=>({...x,read:true})));}catch{}}
 async function downloadCertificate(reg){try{const r=await api.get(`/registrations/${reg._id}/certificate`,{responseType:'blob'});const url=URL.createObjectURL(r.data);const a=document.createElement('a');a.href=url;a.download=`${(reg.event?.title||'EventNest').replace(/[^a-z0-9]+/gi,'-')}-certificate.pdf`;a.click();URL.revokeObjectURL(url);}catch(e){alert(e.response?.data?.message||'Certificate is not available yet');}}
 const roleLabel=user.role==='student'?'Student':user.role==='department'?'Department':'Club';
 const organization=user.role==='department'?(user.department||'Department'):user.role==='club'?(user.clubName||'Club'):'Student account';
 return <div className="app-shell">
  <aside className="sidebar">
   <button className="brand brand-home" onClick={()=>nav('/')} title="Go to main dashboard"><div className="brand-icon"><GraduationCap/></div><span>Event<span className="brand-accent">Nest</span></span></button>
   <div className="side-label">{user.role==='student'?'STUDENT WORKSPACE':'ORGANIZER WORKSPACE'}</div>
   <NavLink to="/" end className="nav-item"><LayoutDashboard size={18}/> {user.role==='student'?'My dashboard':'Overview'}</NavLink>
   {user.role!=='student'&&<NavLink to="/organizer" className="nav-item"><PlusCircle size={18}/> Manage events</NavLink>}{user.role==='student'&&<NavLink to="/scan-qr" className="nav-item"><ScanLine size={18}/> Scan event QR</NavLink>}
   <div className="side-bottom"><div className="user-card"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div><div className="user-meta"><b>{user.name}</b><span>{organization}</span></div><button className="icon-button" title="Sign out" onClick={()=>{logout();nav('/login')}}><LogOut size={17}/></button></div></div>
  </aside>
  <main className="main-area">
   <header className="topbar"><div><span className="eyebrow">CAMPUS ACTIVITIES</span><h1>Good day, {user.name?.split(' ')[0]} <span>✦</span></h1></div><div className="top-actions"><ThemeToggle compact/><button className="icon-button notification-button" onClick={()=>{setShow(!show);setProfileOpen(false);}} aria-label="Notifications"><Bell size={19}/>{unread>0&&<i>{unread}</i>}</button><div className="role-chip">{roleLabel} portal</div></div>
    {show&&<div className="notification-pop"><div className="pop-head"><b>Notifications</b><span>{unread} unread</span>{unread>0&&<button className="mark-read" onClick={readAll}>Mark all read</button>}</div>{notifications.length?notifications.slice(0,30).map(n=><button key={n._id} className={`notice ${n.read?'':'unread'}`} onClick={()=>read(n)}><b>{n.title}</b><span>{n.message}</span><small>{new Date(n.createdAt).toLocaleString()}</small></button>):<p className="muted pad">You're all caught up.</p>}</div>}
   </header>
   <section className="page-content">{children}</section>
  </main>
  <div className="profile-dock"><button className="profile-dock-button" onClick={async()=>{const next=!profileOpen;setProfileOpen(next);setShow(false);if(next&&user.role==='student'){try{const r=await api.get('/registrations/mine');setProfileRegistrations(r.data.registrations||[]);}catch{}}}} aria-label="View my profile"><span className="avatar">{user.name?.[0]?.toUpperCase()}</span><span>My profile</span><ArrowUpRight size={15}/></button></div>
  {profileOpen&&<div className="profile-card"><div className="profile-card-head"><div className="avatar profile-avatar">{user.name?.[0]?.toUpperCase()}</div><div><b>{user.name}</b><span>{roleLabel} account</span></div><button className="subtle-btn" onClick={()=>setProfileOpen(false)}>Close</button></div><div className="profile-details"><div><span>Full name</span><b>{user.name||'—'}</b></div><div><span>Email address</span><b>{user.email||'—'}</b></div><div><span>Account type</span><b>{roleLabel}</b></div>{user.studentId&&<div><span>Student ID</span><b>{user.studentId}</b></div>}{user.department&&<div><span>Department</span><b>{user.department}</b></div>}{user.clubName&&<div><span>Club</span><b>{user.clubName}</b></div>}{user.role==='student'&&<><div><span>Credit points</span><b>{user.credits??0}</b></div><div className="profile-event-history"><span>Event participation</span>{profileRegistrations.length?profileRegistrations.slice(0,5).map(reg=><div className="profile-history-item" key={reg._id}><b>{reg.event?.title||'Event'}</b><small className={['verified','attended','participated','success'].includes(reg.participationStatus)?'verified-text':''}>{reg.participationStatus==='success'?'Success · Certificate ready':['verified','attended','participated'].includes(reg.participationStatus)?'Participated · Awaiting results':reg.certificateIssued?'Result published':'Registered'}</small>{reg.participationStatus==='success'&&reg.certificateIssued&&<button className="profile-certificate-btn" onClick={()=>downloadCertificate(reg)}>Download certificate ↓</button>}</div>):<small>No registered events yet.</small>}</div></>}</div><button className="profile-logout" onClick={()=>{logout();nav('/login')}}><LogOut size={15}/> Sign out</button></div>}
 </div>
}
