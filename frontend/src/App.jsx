import { useMemo, useState, useRef, useEffect } from 'react'
import {
  ArrowLeft, Bell, Camera, Check, ChevronRight, CircleHelp, Clock3,
  FileCheck2, Filter, Globe2, ImagePlus, Landmark, Languages, LocateFixed,
  LogOut, MapPin, MessageCircleQuestion, Navigation, Plus, Search, Send,
  Share2, Sparkles, Target, UserRound, X, AlertTriangle, ShieldCheck
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { api } from './services/api'

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createMarkerIcon = (color) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const getStatusColor = (status) => {
  switch(status) {
    case 'Pending': return '#ef4444';
    case 'In Progress': return '#3b82f6';
    case 'Under Review': return '#3b82f6';
    case 'Assigned': return '#f97316';
    case 'Resolved': return '#22c55e';
    default: return '#ef4444';
  }
}

function timeAgo(dateString) {
  if (!dateString) return 'Just now'
  const date = new Date(dateString)
  const seconds = Math.floor((new Date() - date) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' years ago'
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' months ago'
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' days ago'
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' hours ago'
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' mins ago'
  return 'Just now'
}

function formatDate(dateString) {
  if (!dateString) return 'Today'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const mapBackendComplaint = (c) => ({
  id: c._id,
  title: c.issueType || 'New Issue',
  location: (c.latitude && c.longitude) ? `${c.latitude.toFixed(4)}° N, ${c.longitude.toFixed(4)}° E` : 'Unknown location',
  time: timeAgo(c.createdAt),
  date: formatDate(c.createdAt),
  status: c.status || 'Pending',
  tone: 'road',
  icon: Landmark,
  image: c.image ? (c.image.startsWith('data:') ? c.image : `http://localhost:5000/${c.image.replace(/\\/g, '/')}`) : null,
  latitude: c.latitude,
  longitude: c.longitude,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  priorityScore: c.priorityScore || 0,
  priorityLevel: c.priorityLevel || 'Low',
  aiSuggestedCategory: c.aiSuggestedCategory || null
})

const languages = [
  ['English', 'English'], ['हिंदी', 'Hindi'], ['मराठी', 'Marathi'], ['ગુજરાતી', 'Gujarati'], ['தமிழ்', 'Tamil'],
]

function StatusBadge({ status }) {
  const displayStatus = status === 'In Progress' ? 'Under Review' : status;
  return <span className={`status status-${displayStatus.toLowerCase().replace(' ', '-')}`}><span />{displayStatus}</span>
}

function SkeletonCard() {
  return (
    <div className="complaint-card" style={{opacity: 0.5}}>
      <div className="complaint-thumb" style={{background: '#2a2a2a'}}></div>
      <div className="complaint-info">
        <div style={{height: 14, width: '80%', background: '#2a2a2a', borderRadius: 4, marginBottom: 6}}></div>
        <div style={{height: 10, width: '60%', background: '#2a2a2a', borderRadius: 4, marginBottom: 6}}></div>
        <div style={{height: 10, width: '40%', background: '#2a2a2a', borderRadius: 4}}></div>
      </div>
    </div>
  )
}

function Navbar({ onLanguage, onNotifications }) {
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Landmark size={19} /></span><span>Civic<span>IQ</span></span></div>
      <div className="top-actions">
        <button className="icon-button" aria-label="Choose language" onClick={onLanguage}><Globe2 size={20} /></button>
        <button className="icon-button notification-button" aria-label="Notifications" onClick={onNotifications}><Bell size={20} /><i /></button>
      </div>
    </header>
  )
}

function BottomNav({ active, onChange }) {
  const items = [['home', 'Home', Landmark], ['report', 'Report', Plus], ['track', 'Track', Target], ['map', 'Map', MapPin], ['profile', 'Profile', UserRound]]
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map(([key, label, Icon]) => (
        <button key={key} className={active === key ? 'nav-item active' : 'nav-item'} onClick={() => onChange(key)}>
          <span className="nav-icon"><Icon size={20} strokeWidth={active === key ? 2.5 : 2} /></span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

function ComplaintCard({ complaint, onClick }) {
  const Icon = complaint.icon
  return (
    <button className="complaint-card" onClick={onClick}>
      <div className={`complaint-thumb ${complaint.tone}`} style={complaint.image ? {backgroundImage: `url(${complaint.image})`, backgroundSize: 'cover', backgroundPosition: 'center'} : {}}>
        {!complaint.image && <Icon size={28} />}
      </div>
      <div className="complaint-info">
        <strong>{complaint.title}</strong>
        <span><MapPin size={13} />{complaint.location}</span>
        <small><Clock3 size={13} />{complaint.time}</small>
      </div>
      <StatusBadge status={complaint.status} />
    </button>
  )
}

function Home({ onReport, onDetail, onLanguage, onTrack, complaints, loading }) {
  const quickActions = [
    { title: 'Track Complaint', icon: Target, action: () => onTrack('track') },
    { title: 'Nearby Issues', icon: MapPin, action: () => onTrack('map') },
    { title: 'My Reports', icon: FileCheck2, action: () => onTrack('track') },
    { title: 'Help', icon: CircleHelp, action: () => {} },
  ]
  const recent = complaints.slice(0, 3)

  return (
    <div className="screen home-screen">
      <Navbar onLanguage={onLanguage} onNotifications={() => {}} />
      <div className="bg-glow"></div>
      
      <section className="hero-premium">
        <div className="city-graphic"></div>
        <div className="float-card float-left"><Landmark size={20}/></div>
        <div className="float-card float-right"><Check size={20}/></div>
        <div className="ai-badge pulse-anim"><Sparkles size={14} /> AI Powered</div>
        <h1 className="gradient-text">Report an Issue</h1>
        <p>Take a photo or upload from gallery.</p>
        <button className="hero-camera-btn" onClick={onReport}><div className="camera-icon-wrapper"><Camera size={34}/></div></button>
      </section>

      <section className="quick-actions">
        {quickActions.map(action => (
          <button key={action.title} className="glass action-card" onClick={action.action}>
            <action.icon size={24} className="action-icon" />
            <span>{action.title}</span>
          </button>
        ))}
      </section>

      <section className="section recent-section">
        <div className="section-heading">
          <div><span className="section-kicker">Your community</span><h2>Recent uploads</h2></div>
          <button className="text-button" onClick={() => onTrack('track')}>View all <ChevronRight size={16} /></button>
        </div>
        <div className="complaint-list">
          {loading ? (
             <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <div style={{opacity: 0.5}}><FileCheck2 size={30} /></div>
              <strong>No recent reports</strong>
              <span>Be the first to report an issue.</span>
            </div>
          ) : (
            recent.map(c => <ComplaintCard key={c.id} complaint={c} onClick={() => onDetail(c)} />)
          )}
        </div>
      </section>
    </div>
  )
}

function Report({ onSubmit }) {
  const [uploaded, setUploaded] = useState(false)
  const [located, setLocated] = useState(false)
  const [description, setDescription] = useState('')
  const [issueType, setIssueType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationText, setLocationText] = useState("We'll add coordinates automatically")
  const [coords, setCoords] = useState(null)
  const [loadingLoc, setLoadingLoc] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  
  const fileInputRef = useRef(null)

  const handleCameraClick = () => fileInputRef.current?.click()
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setUploaded(true)
      setDuplicateWarning(null)
      setAiSuggestion(null)
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation is not supported by your browser")
    setLoadingLoc(true)
    setLocationText("Detecting location...")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ latitude, longitude })
        setLocated(true)
        setLocationText(`${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`)
        setLoadingLoc(false)
      },
      (err) => {
        console.error(err)
        alert("Unable to retrieve your location")
        setLocationText("We'll add coordinates automatically")
        setLoadingLoc(false)
      }
    )
  }

  const proceedWithSubmit = async (duplicateReference = null, confirmedCategory = null) => {
    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('issueType', confirmedCategory || issueType)
    formData.append('description', description)
    formData.append('latitude', coords.latitude)
    formData.append('longitude', coords.longitude)
    if (duplicateReference) formData.append('duplicateReference', duplicateReference)
    if (confirmedCategory) formData.append('aiSuggestedCategory', confirmedCategory)
    if (imageFile) formData.append('image', imageFile)

    try {
      await api.submitComplaint(formData)
      onSubmit()
    } catch (err) {
      console.error(err)
      if (err.message === 'Backend offline') {
        alert('Backend is offline. Please start the server on port 5000.')
      } else {
        alert(`Validation Error: ${err.message}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!issueType) return alert('Please select an issue type')
    if (!coords) return alert('Please provide your location')

    if (duplicateWarning || aiSuggestion) {
      return proceedWithSubmit()
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('issueType', issueType)
    formData.append('description', description)
    formData.append('latitude', coords.latitude)
    formData.append('longitude', coords.longitude)
    if (imageFile) formData.append('image', imageFile)

    try {
      const { duplicates, suggestion } = await api.precheckComplaint(formData)
      
      let shouldStop = false;
      if (duplicates && duplicates.length > 0) {
        setDuplicateWarning(duplicates[0].id)
        shouldStop = true;
      }
      if (suggestion && suggestion.suggestedCategory && suggestion.suggestedCategory !== issueType) {
        setAiSuggestion(suggestion)
        shouldStop = true;
      }

      if (!shouldStop) {
        return await proceedWithSubmit()
      }
    } catch (err) {
      console.error("Precheck error:", err)
      return await proceedWithSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="screen inner-screen">
      <div className="page-heading">
        <div><span className="section-kicker">Make a difference</span><h1>Report an issue</h1></div>
        <span className="step-count">1 of 1</span>
      </div>

      {duplicateWarning && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', padding: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '10px' }}>
            <AlertTriangle size={20} /><strong>Similar complaint found nearby</strong>
          </div>
          <p style={{ fontSize: '13px', margin: '0 0 15px', color: '#ccc' }}>ID: {duplicateWarning.substring(duplicateWarning.length - 6).toUpperCase()} is within 25 meters.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => proceedWithSubmit(duplicateWarning)} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>Support Existing</button>
            <button onClick={() => proceedWithSubmit()} style={{ flex: 1, background: 'transparent', color: '#fff', border: '1px solid #555', padding: '8px', borderRadius: '8px' }}>Submit Anyway</button>
          </div>
        </div>
      )}

      {aiSuggestion && (
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '12px', padding: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', marginBottom: '5px' }}>
            <Sparkles size={20} />
            <strong>{aiSuggestion.confidence >= 90 ? 'AI confirmed category' : 'AI suggests changing category'}</strong>
          </div>
          <p style={{ fontSize: '13px', margin: '0 0 5px', color: '#ccc' }}>Suggested: <strong>{aiSuggestion.suggestedCategory}</strong> ({aiSuggestion.confidence}%)</p>
          <p style={{ fontSize: '12px', margin: '0 0 15px', color: '#999' }}>{aiSuggestion.shortReason}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => proceedWithSubmit(null, aiSuggestion.suggestedCategory)} style={{ flex: 1, background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>Accept & Submit</button>
            <button onClick={() => proceedWithSubmit()} style={{ flex: 1, background: 'transparent', color: '#fff', border: '1px solid #555', padding: '8px', borderRadius: '8px' }}>Keep Mine</button>
          </div>
        </div>
      )}

      <input 
        type="file" accept="image/*" capture="environment" ref={fileInputRef} 
        onChange={handleFileChange} style={{ display: 'none' }} 
      />

      {!uploaded ? (
        <button className="upload-zone" onClick={handleCameraClick}>
          <span className="upload-icon"><ImagePlus size={27} /></span>
          <strong>Add a photo</strong>
          <small>Take a photo or choose from gallery</small>
        </button>
      ) : (
        <div style={{ position: 'relative', margin: '25px 0 20px', borderRadius: '24px', overflow: 'hidden', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button 
            style={{ position: 'absolute', bottom: '15px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 16px', borderRadius: '99px', fontSize: '13px', fontWeight: 'bold', backdropFilter: 'blur(8px)' }}
            onClick={handleCameraClick}
          >
            Retake Photo
          </button>
        </div>
      )}

      <label className="field-label">Issue type
        <select value={issueType} onChange={e => setIssueType(e.target.value)}>
          <option value="" disabled>Select an issue type</option>
          <option>Roads & potholes</option>
          <option>Streetlight</option>
          <option>Waste management</option>
          <option>Water & drainage</option>
        </select>
      </label>

      <button className={`location-button ${located ? 'located' : ''}`} onClick={handleGetLocation} disabled={loadingLoc}>
        <LocateFixed size={20} />
        <span>
          <strong>{located ? 'Location added' : 'Use current location'}</strong>
          <small>{locationText}</small>
        </span>
        <ChevronRight size={19} />
      </button>

      <label className="field-label">Description
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell us a little more (optional)" rows={4} />
      </label>

      {(!duplicateWarning && !aiSuggestion) && (
        <button className="primary-button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <Clock3 size={19} className="pulse-anim" /> : <Send size={19} />}
          {isSubmitting ? 'Checking details...' : 'Submit report'}
        </button>
      )}
    </div>
  )
}

function SearchBar({ value, onChange }) { return <label className="search-bar"><Search size={19} /><input value={value} onChange={e => onChange(e.target.value)} placeholder="Search your reports" /><Filter size={18} /></label> }

function Track({ onDetail, complaints, loading }) {
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('All')
  
  const filtered = useMemo(() => complaints.filter(c => {
    const searchStatus = c.status === 'In Progress' ? 'Under Review' : c.status;
    return (filter === 'All' || searchStatus === filter) && 
    `${c.title} ${c.location} ${c.id}`.toLowerCase().includes(query.toLowerCase())
  }), [filter, query, complaints])
  
  return <div className="screen inner-screen">
    <div className="page-heading"><div><span className="section-kicker">Stay informed</span><h1>Track reports</h1></div><span className="report-count">{complaints.length} reports</span></div>
    <SearchBar value={query} onChange={setQuery} />
    <div className="filter-row">
      {['All', 'Pending', 'Under Review', 'Assigned', 'Resolved'].map(f => 
        <button key={f} className={filter === f ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter(f)}>{f}</button>
      )}
    </div>
    <div className="track-list">
      {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : filtered.map(c => 
        <button className="track-card" key={c.id} onClick={() => onDetail(c)}>
          <div className={`complaint-thumb ${c.tone}`} style={c.image ? {backgroundImage: `url(${c.image})`, backgroundSize: 'cover', backgroundPosition: 'center'} : {}}>
            {!c.image && <c.icon size={26} />}
          </div>
          <div className="track-info">
            <strong>{c.title}</strong>
            <span>{c.id.substring(c.id.length - 6).toUpperCase()} · {c.date}</span>
          </div>
          <StatusBadge status={c.status} />
          <ChevronRight size={17} />
        </button>
      )}
      {!loading && !filtered.length && <div className="empty-state">
        <div><Search size={30} /></div>
        <strong>No reports found</strong>
        <span>Try another search or filter.</span>
      </div>}
    </div>
  </div>
}

const STATUS_STAGES = ['Pending', 'In Progress', 'Assigned', 'Resolved']

function Timeline({ status, createdAt, updatedAt }) {
  const currentIdx = STATUS_STAGES.indexOf(status) > -1 ? STATUS_STAGES.indexOf(status) : 0
  
  const steps = [
    { title: 'Submitted', text: formatDate(createdAt) },
    { title: 'Under Review', text: (currentIdx >= 1 && updatedAt && status !== 'Pending') ? formatDate(updatedAt) : '' },
    { title: 'Assigned to civic team', text: (currentIdx >= 2 && updatedAt && status !== 'Pending' && status !== 'In Progress') ? formatDate(updatedAt) : '' },
    { title: 'Resolved', text: (currentIdx === 3 && updatedAt) ? formatDate(updatedAt) : '' },
  ]
  
  return (
    <div className="timeline">
      {steps.map((step, i) => {
        const isDone = i <= currentIdx
        const isActive = i === currentIdx
        const isWaiting = isActive && i < steps.length - 1
        
        return (
          <div className={`timeline-item ${isDone ? 'done' : ''}`} key={String(step.title)}>
            <span className="timeline-dot">{isDone ? <Check size={13} /> : <Clock3 size={13} />}</span>
            <div>
              <strong>{step.title}</strong>
              <small>{step.text || (isWaiting ? 'Waiting for update' : (isDone ? 'Completed' : 'Pending'))}</small>
            </div>
            {i < 3 && <i />}
          </div>
        )
      })}
    </div>
  )
}

function Detail({ complaint, onBack }) { 
  const getScoreColor = (level) => {
    switch (level) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#eab308';
      default: return '#3b82f6';
    }
  }

  return (
    <div className="screen inner-screen detail-screen">
      <div className="detail-top">
        <button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button>
        <strong>Report details</strong>
        <button className="back-button" aria-label="Share report"><Share2 size={19} /></button>
      </div>
      <div className={`detail-photo ${complaint.tone}`} style={complaint.image ? {backgroundImage: `url(${complaint.image})`, backgroundSize: 'cover', backgroundPosition: 'center'} : {}}>
        {!complaint.image && <complaint.icon size={52} />}
      </div>
      
      <div style={{ margin: '-20px 20px 15px', position: 'relative', zIndex: 5, background: 'var(--bg-card)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '45px', height: '45px', borderRadius: '50%', border: `3px solid ${getScoreColor(complaint.priorityLevel)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: getScoreColor(complaint.priorityLevel) }}>
          {complaint.priorityScore}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: getScoreColor(complaint.priorityLevel) }}>
            <ShieldCheck size={16} /> <strong style={{ fontSize: '14px' }}>AI Priority: {complaint.priorityLevel}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>Calculated by CivicLens AI</div>
        </div>
      </div>

      <div className="detail-title">
        <div><span className="section-kicker">ID: {complaint.id.substring(complaint.id.length - 6).toUpperCase()}</span><h1>{complaint.title}</h1></div>
        <StatusBadge status={complaint.status} />
      </div>
      <div className="detail-location">
        <MapPin size={18} /><span><strong>{complaint.location}</strong><small>Reported {complaint.date}</small></span><ChevronRight size={18} />
      </div>
      <div className="detail-section">
        <div className="section-heading"><div><span className="section-kicker">Progress</span><h2>Report timeline</h2></div></div>
        <Timeline status={complaint.status} createdAt={complaint.createdAt} updatedAt={complaint.updatedAt} />
      </div>
    </div>
  )
}

function MapScreen({ complaints, onDetail, onBack }) {
  const [userLoc, setUserLoc] = useState([12.9716, 77.5946])
  const [locErr, setLocErr] = useState(false)
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        () => setLocErr(true)
      )
    }
  }, [])
  
  return (
    <div className="screen inner-screen" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
      <div className="detail-top" style={{ padding: '20px 20px 10px', background: 'var(--bg-card)', zIndex: 10 }}>
        <button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button>
        <strong>Nearby Issues</strong>
        <div style={{width: 38}}></div>
      </div>
      {locErr && <div style={{padding: '10px 20px', background: 'rgba(255,0,0,0.1)', color: '#ef4444', fontSize: '13px', zIndex: 10}}>Location access denied. Showing default area.</div>}
      
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={userLoc} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {complaints.map(c => {
            if (!c.latitude || !c.longitude) return null;
            return (
              <Marker key={c.id} position={[c.latitude, c.longitude]} icon={createMarkerIcon(getStatusColor(c.status))}>
                <Popup>
                  <div style={{ padding: '2px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: 'bold' }}>{c.title}</h3>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#666' }}>Status: <strong>{c.status}</strong></p>
                    <button 
                      onClick={() => onDetail(c)}
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%' }}
                    >
                      Open Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}

function Profile({ onLanguage }) { const items = [['My Reports', Target, '3 reports'], ['Notifications', Bell, 'Up to date'], ['Language', Languages, 'English'], ['Help & Support', MessageCircleQuestion, "We're here to help"], ['About CivicIQ', CircleHelp, 'Version 1.0']]; return <div className="screen inner-screen profile-screen"><div className="page-heading"><div><span className="section-kicker">Your civic journey</span><h1>Profile</h1></div><button className="icon-button"><Bell size={20} /></button></div><div className="profile-card"><div className="avatar">AS</div><div><h2>Arjun Sharma</h2><span>Making Bengaluru better</span></div><ChevronRight size={19} /></div><div className="profile-menu">{items.map(([label, Icon, text]) => <button key={label} onClick={label === 'Language' ? onLanguage : undefined}><span className="menu-icon"><Icon size={19} /></span><span className="menu-copy"><strong>{label}</strong><small>{text}</small></span><ChevronRight size={17} /></button>)}</div><button className="logout-button"><LogOut size={18} />Log out</button></div> }

function LanguageSheet({ onClose }) { return <div className="sheet-backdrop" onClick={() => onClose()}><div className="language-sheet" onClick={e => e.stopPropagation()}><div className="sheet-handle" /><div className="sheet-header"><div><span className="section-kicker">Choose your language</span><h2>Language</h2></div><button className="back-button" onClick={() => onClose()}><X size={19} /></button></div><div className="language-options">{languages.map(([native, english], i) => <button key={english} onClick={() => onClose(english)}><span>{native}</span><small>{english}</small>{i === 0 && <Check size={19} />}</button>)}</div></div></div> }

export default function App() { 
  const [screen, setScreen] = useState('home'); 
  const [detail, setDetail] = useState(null); 
  const [languageOpen, setLanguageOpen] = useState(false); 
  const [toast, setToast] = useState('')
  const [complaintsData, setComplaintsData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const data = await api.getComplaints()
      setComplaintsData(data.map(mapBackendComplaint))
    } catch (err) {
      console.error(err)
      showToast('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2500) }
  const goDetail = (c) => { setDetail(c); setScreen('detail') }

  return (
    <main className="app-shell">
      <div className="app-content">
        {screen === 'home' && <Home onReport={() => setScreen('report')} onDetail={goDetail} onLanguage={() => setLanguageOpen(true)} onTrack={setScreen} complaints={complaintsData} loading={loading} />}
        {screen === 'report' && <Report onSubmit={() => { fetchComplaints(); setScreen('home'); showToast('Report submitted successfully') }} />}
        {screen === 'track' && <Track onDetail={goDetail} complaints={complaintsData} loading={loading} />}
        {screen === 'profile' && <Profile onLanguage={() => setLanguageOpen(true)} />}
        {screen === 'detail' && detail && <Detail complaint={detail} onBack={() => setScreen('track')} />}
        {screen === 'map' && <MapScreen complaints={complaintsData} onDetail={goDetail} onBack={() => setScreen('home')} />}
      </div>
      {(screen !== 'detail' && screen !== 'map') && <BottomNav active={screen} onChange={setScreen} />}
      {languageOpen && <LanguageSheet onClose={lang => { setLanguageOpen(false); if (lang) showToast(`Language set to ${lang}`) }} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </main>
  )
}
