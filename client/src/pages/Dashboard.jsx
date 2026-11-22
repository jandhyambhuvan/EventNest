import { useEffect, useState } from 'react';
import { MapPin, ArrowUpRight, Ticket, Star, Trophy, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function EventCard({ event, registered = false, registration = null }) {
  async function certificate() {
    try {
      const r = await api.get(`/registrations/${registration._id}/certificate`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url; a.download = `${event.title}-certificate.pdf`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { alert(e.response?.data?.message || 'Certificate is not available yet'); }
  }
  const status = registration?.participationStatus;
  const successful = status === 'success';
  const participated = ['participated', 'success', 'verified', 'attended'].includes(status);
  return <article className="event-card"><div className={`event-art ${event.type}`}><span className="event-type">{event.type === 'club' ? 'CLUB EVENT' : 'DEPARTMENT EVENT'}</span><div className="art-symbol">{event.type === 'club' ? '✳' : '◈'}</div></div><div className="event-info"><div className="event-date">{new Date(event.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })} · {new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div><h3>{event.title}</h3><p>{event.description}</p><div className="event-meta"><span><MapPin size={14}/>{event.venue}</span><span><Star size={14}/>{event.baseCredits} base credits</span></div><div className="event-bottom"><span className="fee">{event.fee > 0 ? `₹${event.fee}` : 'Free'}</span><div className="card-actions">{registered && <span className={`registered-pill ${participated ? 'verified' : ''}`}>{successful ? 'Success' : participated ? 'Participated' : 'Registered'}</span>}{registered && successful && registration?.certificateIssued && <button className="text-link cert-link" onClick={certificate}>Certificate ↓</button>}<Link className="text-link" to={`/events/${event._id}`}>View details <ArrowUpRight size={15}/></Link></div></div></div></article>;
}

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [events, setEvents] = useState([]), [registered, setRegistered] = useState([]), [tab, setTab] = useState('future'), [filter, setFilter] = useState('all'), [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([api.get('/events'), api.get('/registrations/mine').catch(() => ({ data: { registrations: [] } })), api.get('/auth/me')]).then(([a,b,c]) => { setEvents(a.data.events || []); setRegistered(b.data.registrations || []); setUser(c.data.user); }).finally(() => setLoading(false)); }, []);
  const successfulRegistrations = registered.filter(r => r.event && r.participationStatus === 'success');
  const visible = tab === 'future' ? events.filter(e => new Date(e.startsAt) > new Date() && !registered.some(r => r.event?._id === e._id)) : tab === 'completed' ? successfulRegistrations.map(r => r.event) : registered.map(r => r.event).filter(Boolean);
  const filtered = visible.filter(e => filter === 'all' || e.type === filter);
  const registrationFor = id => registered.find(r => r.event?._id === id);
  return <><div className="welcome-strip"><div><span className="eyebrow">YOUR CAMPUS EXPERIENCE</span><h2>Find your next <em>big thing.</em></h2><p>Show up, get involved, and turn your experiences into achievements.</p></div><div className="welcome-graphic">✦</div></div>
    {user.role === 'student' ? <div className="metric-row"><div className="metric-card"><div className="metric-icon violet"><Wallet/></div><div><span>YOUR CREDIT POINTS</span><b>{user.credits || 0}</b><small>Accumulated achievements</small></div></div><div className="metric-card"><div className="metric-icon orange"><Ticket/></div><div><span>REGISTERED EVENTS</span><b>{registered.length}</b><small>Events you're part of</small></div></div><div className="metric-card"><div className="metric-icon green"><Trophy/></div><div><span>SUCCESSFUL EVENTS</span><b>{successfulRegistrations.length}</b><small>Completed participation records</small></div></div></div> : <div className="organizer-callout"><b>Organizer workspace</b><span>Publish events, manage registrations and award credits after the event.</span><Link to="/organizer">Open organizer tools →</Link></div>}
    {user.role === 'student' && <div className="student-qr-cta"><div><b>Attended an event?</b><span>Scan the QR provided by your organizer to add verified participation to your profile.</span></div><Link className="primary-btn" to="/scan-qr">Scan event QR <ArrowUpRight size={15}/></Link></div>}
    <div className="section-heading"><div><span className="eyebrow">DISCOVER & PARTICIPATE</span><h2>{tab === 'completed' ? 'Successfully completed events' : 'Events for you'}</h2></div><div className="tabs"><button className={tab === 'future' ? 'active' : ''} onClick={() => setTab('future')}>Future events</button><button className={tab === 'registered' ? 'active' : ''} onClick={() => setTab('registered')}>Registered events <span className="tab-count">{registered.length}</span></button><button className={tab === 'completed' ? 'active' : ''} onClick={() => setTab('completed')}>Completed <span className="tab-count">{successfulRegistrations.length}</span></button></div></div>
    <div className="filter-row">{[['all','All events'],['club','Club events'],['department','Department events']].map(([v,l]) => <button key={v} className={filter === v ? 'filter-active' : ''} onClick={() => setFilter(v)}>{l}</button>)}<span className="result-count">{filtered.length} events</span></div>
    {loading ? <div className="empty-state">Loading events…</div> : filtered.length ? <div className="event-grid">{filtered.map(e => <EventCard key={e._id} event={e} registered={tab !== 'future'} registration={registrationFor(e._id)}/>)}</div> : <div className="empty-state"><div>✳</div><h3>{tab === 'completed' ? 'No successfully completed events yet' : tab === 'registered' ? 'No registered events yet' : 'No events found'}</h3><p>{tab === 'completed' ? 'Events appear here after you scan the event QR successfully and the organizer publishes the results.' : tab === 'registered' ? 'Explore future events and register to see them here.' : 'Try another category or check back later for new campus activities.'}</p></div>}
  </>;
}
