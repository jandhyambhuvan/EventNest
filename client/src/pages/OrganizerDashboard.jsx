import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Users, ClipboardList, Plus, ArrowUpRight, Building2, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function EventRows({ events, emptyTitle, emptyText, emptyAction = false, completed = false }) {
  if (!events.length) return <div className="empty-state"><div>✳</div><h3>{emptyTitle}</h3><p>{emptyText}</p>{emptyAction && <Link className="primary-btn" to="/organizer"><Plus size={16}/> Create your first event</Link>}</div>;
  return <div className="table-panel organizer-upcoming">{events.map(e => <div className="manage-event" key={e._id}><div className={`mini-art ${e.type}`}>{e.type === 'club' ? '✳' : '◈'}</div><div className="manage-event-info"><b>{e.title}</b><span>{new Date(e.startsAt).toLocaleString()} · {e.venue}</span></div><span className="status-pill">{completed ? 'Completed' : (e.status || 'Published')}</span><Link className="outline-btn" to="/organizer">Manage</Link></div>)}</div>;
}

export default function OrganizerDashboard() {
  const { user } = useAuth(); const [events, setEvents] = useState([]), [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/events/mine/created').then(r => setEvents(r.data.events || [])).catch(() => setEvents([])).finally(() => setLoading(false)); }, []);
  const now = new Date();
  const upcoming = useMemo(() => events.filter(e => new Date(e.startsAt) >= now && e.status !== 'cancelled').sort((a,b) => new Date(a.startsAt)-new Date(b.startsAt)), [events]);
  const completedEvents = useMemo(() => events.filter(e => e.status !== 'cancelled' && (e.status === 'completed' || new Date(e.endsAt) < now)).sort((a,b) => new Date(b.endsAt)-new Date(a.endsAt)), [events]);
  const label = user.role === 'department' ? (user.department || user.name) : (user.clubName || user.name); const kind = user.role === 'department' ? 'Department' : 'Club';
  return <><div className="welcome-strip organizer-welcome"><div><span className="eyebrow">{kind.toUpperCase()} PORTAL · VERIFIED ORGANIZER</span><h2>Welcome, <em>{label}</em></h2><p>This workspace is dedicated to your {kind.toLowerCase()}. Create events, manage registrations and publish student results.</p><Link className="primary-btn organizer-cta" to="/organizer"><Plus size={16}/> Manage your events <ArrowUpRight size={15}/></Link></div><div className="welcome-graphic">{user.role === 'department' ? <Building2 size={72}/> : <Users size={72}/>}</div></div>
    <div className="organizer-overview-grid"><div className="metric-card"><div className="metric-icon violet"><CalendarDays/></div><div><span>TOTAL EVENTS</span><b>{events.length}</b><small>Created by this {kind.toLowerCase()}</small></div></div><div className="metric-card"><div className="metric-icon green"><ClipboardList/></div><div><span>UPCOMING EVENTS</span><b>{upcoming.length}</b><small>Published activities ahead</small></div></div><div className="metric-card"><div className="metric-icon orange"><GraduationCap/></div><div><span>COMPLETED EVENTS</span><b>{completedEvents.length}</b><small>Past events created by your organization</small></div></div></div>
    <div className="section-heading organizer-section-heading"><div><span className="eyebrow">YOUR ORGANIZATION</span><h2>Upcoming events</h2></div><Link className="text-link" to="/organizer">Open event management <ArrowUpRight size={15}/></Link></div>
    {loading ? <div className="empty-state">Loading your events…</div> : <EventRows events={upcoming.slice(0,5)} emptyTitle="No upcoming events" emptyText="Your upcoming published events will appear here." emptyAction={!events.length}/>}
    <div className="section-heading organizer-section-heading"><div><span className="eyebrow">EVENT ARCHIVE</span><h2>Completed events</h2></div><span className="result-count">{completedEvents.length} completed</span></div>
    {loading ? <div className="empty-state">Loading completed events…</div> : <EventRows events={completedEvents} emptyTitle="No completed events yet" emptyText="Events move into this section automatically after their scheduled end time, or when marked completed." completed/>}
  </>;
}
