// Civic Instrument: a calm, camera-first civic service interface with soft authority, clear status signals, and generous breathing room.
// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Bell, Camera, Check, ChevronRight, CircleHelp, Clock3,
  FileCheck2, Filter, Globe2, ImagePlus, Landmark, Languages, LocateFixed,
  LogOut, MapPin, MessageCircleQuestion, Navigation, Plus, Search, Send,
  Share2, ShieldCheck, Sparkles, Target, UserRound, X, AlertTriangle,
  ArrowUpRight, Activity, Menu, ScanLine, Route, UploadCloud, SlidersHorizontal, Sun, Moon,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { api } from './services/api'

const HERO_IMAGE = '/manus-storage/civiciq-hero-camera_ba59eb21.png'
const MARK_IMAGE = '/manus-storage/civiciq-mark_b09c8187.png'
const ISSUE_IMAGES = {
  road: '/manus-storage/civiciq-issue-pothole_5715a845.jpg',
  streetlight: '/manus-storage/civiciq-issue-light_ccb79939.jpg',
  waste: '/manus-storage/civiciq-issue-waste_472a705b.jpg',
}

const createMarkerIcon = (color) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="map-marker-dot" style="--marker-color:${color}"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return '#d97706'
    case 'In Progress':
    case 'Under Review': return '#2563eb'
    case 'Assigned': return '#7c3aed'
    case 'Resolved': return '#16a34a'
    default: return '#d97706'
  }
}

const timeAgo = (dateString) => {
  if (!dateString) return 'Just now'
  const seconds = Math.max(0, Math.floor((new Date() - new Date(dateString)) / 1000))
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`
  return `${Math.floor(seconds / 31536000)} years ago`
}

const formatDate = (dateString) => {
  if (!dateString) return 'Today'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const getApiOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  try { return new URL(apiUrl).origin; } catch (e) { return window.location.origin; }
}
const API_BASE_URL = getApiOrigin();

const mapBackendComplaint = (c) => ({
  id: c._id,
  title: c.issueType || 'New issue',
  location: (c.latitude && c.longitude) ? `${c.latitude.toFixed(4)}° N, ${c.longitude.toFixed(4)}° E` : 'Unknown location',
  time: timeAgo(c.createdAt),
  date: formatDate(c.createdAt),
  status: c.status || 'Pending',
  tone: c.issueType?.toLowerCase().includes('street') ? 'streetlight' : c.issueType?.toLowerCase().includes('waste') ? 'waste' : 'road',
  icon: c.issueType?.toLowerCase().includes('street') ? Navigation : c.issueType?.toLowerCase().includes('waste') ? Activity : Landmark,
  image: c.image ? (c.image.startsWith('data:') || c.image.startsWith('http') ? c.image : `${API_BASE_URL}/${c.image.replace(/\\/g, '/').replace(/^\//, '')}`) : null,
  latitude: c.latitude,
  longitude: c.longitude,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  priorityScore: c.priorityScore || 0,
  priorityLevel: c.priorityLevel || 'Low',
  aiSuggestedCategory: c.aiSuggestedCategory || null,
})

const PREVIEW_COMPLAINTS = [
  { id: 'preview-road-01', title: 'Roads & potholes', location: '12.9716° N, 77.5946° E', time: '18 mins ago', date: 'Today, 9:42 AM', status: 'Under Review', tone: 'road', icon: Landmark, image: ISSUE_IMAGES.road, priorityScore: 84, priorityLevel: 'High', createdAt: new Date(Date.now() - 18 * 60000).toISOString(), updatedAt: new Date(Date.now() - 12 * 60000).toISOString(), latitude: 12.9716, longitude: 77.5946 },
  { id: 'preview-light-02', title: 'Streetlight', location: '12.9688° N, 77.5890° E', time: 'Yesterday', date: 'Yesterday, 7:16 PM', status: 'Assigned', tone: 'streetlight', icon: Navigation, image: ISSUE_IMAGES.streetlight, priorityScore: 62, priorityLevel: 'Medium', createdAt: new Date(Date.now() - 25 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 22 * 3600000).toISOString(), latitude: 12.9688, longitude: 77.5890 },
  { id: 'preview-waste-03', title: 'Waste management', location: '12.9782° N, 77.5919° E', time: '2 days ago', date: 'Sep 2, 8:03 AM', status: 'Resolved', tone: 'waste', icon: Activity, image: ISSUE_IMAGES.waste, priorityScore: 91, priorityLevel: 'Critical', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 20 * 3600000).toISOString(), latitude: 12.9782, longitude: 77.5919 },
]

const languages = [
  ['English', 'English'], ['हिंदी', 'Hindi'], ['मराठी', 'Marathi'], ['ગુજરાતી', 'Gujarati'], ['தமிழ்', 'Tamil'],
]

const pathToScreen = (pathname) => {
  const cleanPath = pathname.replace(/\/+$/, '') || '/'
  if (cleanPath === '/report') return 'report'
  if (cleanPath === '/track') return 'track'
  if (cleanPath === '/nearby' || cleanPath === '/map') return 'map'
  if (cleanPath === '/profile') return 'profile'
  return 'home'
}

const screenToPath = (screen) => ({ home: '/', report: '/report', track: '/track', map: '/nearby', profile: '/profile' }[screen] || '/')

function StatusBadge({ status }) {
  const displayStatus = status === 'In Progress' ? 'Under Review' : status
  return <span className={`status status-${displayStatus.toLowerCase().replaceAll(' ', '-')}`}><span />{displayStatus}</span>
}

function SkeletonCard() {
  return <div className="skeleton-card" aria-hidden="true"><div className="skeleton-thumb shimmer" /><div className="skeleton-copy"><span className="shimmer" /><span className="shimmer short" /><span className="shimmer tiny" /></div><span className="skeleton-pill shimmer" /></div>
}

function ThemeToggle({ theme, onToggle }) {
  return <button className={`theme-toggle ${theme === 'dark' ? 'is-dark' : ''}`} type="button" onClick={onToggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'}><span className="theme-toggle-track"><Sun size={12} /><Moon size={12} /><span className="theme-toggle-thumb" /></span><span className="theme-toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span></button>
}

function Navbar({ onLanguage, onNotifications, screen = 'home', theme, onToggleTheme }) {
  return <header className="topbar">
    <button className="brand" aria-label="CivicIQ home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <span className="brand-mark"><span className="crosshair-mark" aria-hidden="true"><i /><i /><i /><i /></span><img src={MARK_IMAGE} alt="" /></span>
      <span className="brand-name">Civic<span>IQ</span></span>
    </button>
    <div className="topbar-context"><span className="context-dot" />{screen === 'home' ? 'Bengaluru civic network' : 'CivicIQ workspace'}</div>
    <div className="top-actions">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      <button className="icon-button language-trigger" aria-label="Choose language" onClick={onLanguage}><Globe2 size={19} /><span>EN</span></button>
      <button className="icon-button notification-button" aria-label="Notifications" onClick={onNotifications}><Bell size={19} /><i /></button>
      <button className="avatar-mini" aria-label="Open profile">AS</button>
    </div>
  </header>
}

function BottomNav({ active, onChange }) {
  const items = [['home', 'Home', Landmark], ['report', 'Report', Plus], ['track', 'Track', Target], ['map', 'Nearby', MapPin], ['profile', 'Profile', UserRound]]
  return <nav className="bottom-nav" aria-label="Main navigation">
    {items.map(([key, label, Icon]) => <button key={key} className={active === key ? 'nav-item active' : 'nav-item'} onClick={() => onChange(key)} aria-current={active === key ? 'page' : undefined}>
      <span className="nav-icon"><Icon size={19} strokeWidth={active === key ? 2.5 : 1.9} /></span><span>{label}</span>
    </button>)}
  </nav>
}

function ComplaintCard({ complaint, onClick }) {
  const Icon = complaint.icon
  const [imgError, setImgError] = useState(false)
  return <button className="complaint-card" onClick={onClick} aria-label={`Open ${complaint.title} report`}>
    <div className={`complaint-thumb ${complaint.tone}`}>
      {complaint.image && !imgError ? <img src={complaint.image} alt={complaint.title} loading="lazy" onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon size={25} />}
    </div>
    <div className="complaint-info"><strong>{complaint.title}</strong><span><MapPin size={13} />{complaint.location}</span><small><Clock3 size={13} />{complaint.time}</small></div>
    <StatusBadge status={complaint.status} /><ChevronRight className="card-chevron" size={17} />
  </button>
}

function Home({ onReport, onDetail, onLanguage, onTrack, onNotifications, onHelp, complaints, loading, theme, onToggleTheme }) {
  const recent = complaints.slice(0, 3)
  const total = complaints.length

  const [isDragging, setIsDragging] = useState(false)
  const [localImage, setLocalImage] = useState(null)
  const [localPreview, setLocalPreview] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLocalImage(file); setLocalPreview(URL.createObjectURL(file));
    }
  }
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalImage(file); setLocalPreview(URL.createObjectURL(file));
    }
  }

  const handleDetectionAction = () => {
    if (localImage) {
      setIsProcessing(true);
      setTimeout(() => onReport(localImage), 600); // Simulate brief processing/loading state before navigation
    } else {
      onReport();
    }
  }

  return <div className="screen home-screen">
    <Navbar onLanguage={onLanguage} onNotifications={onNotifications} theme={theme} onToggleTheme={onToggleTheme} />
    <div className="home-gridline" aria-hidden="true" />
    <section className="hero-premium">
      <div className="hero-copy">
        <div className="eyebrow-row"><span className="eyebrow"><span className="eyebrow-mark" />CivicIQ / Field guide</span><span className="live-signal"><span />Live service</span></div>
        <h1>Report smarter.<br /><em>Resolve faster.</em></h1>
        <p>Capture a civic issue. AI prioritizes it. Authorities resolve it—so your neighborhood keeps moving.</p>
        <div className="hero-actions"><button className="primary-button hero-primary" onClick={handleDetectionAction} disabled={isProcessing}>{isProcessing ? <Clock3 size={18} className="spin" /> : <Camera size={18} />}{isProcessing ? 'Analyzing...' : (localPreview ? 'Detect Issue' : 'Report an issue')} <ArrowUpRight size={17} /></button><button className="secondary-button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}><span className="play-ring">→</span> See how it works</button></div>
        <div className="hero-proof"><div className="proof-avatar-stack"><span>AS</span><span>RK</span><span>+</span></div><p><strong>Built for everyday action.</strong><br />One clear signal at a time.</p></div>
      </div>
      <div className="hero-visual">
        <div className="visual-ambient ambient-one" /><div className="visual-ambient ambient-two" />
        <div className={`camera-surface ${isDragging ? 'drag-active' : ''} ${localPreview ? 'has-preview' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} hidden />
          <div className="camera-topline"><span><span className="camera-led" />CivicLens AI</span><span>{localPreview ? 'IMAGE SELECTED' : 'READY'}</span></div>
          <img src={localPreview || HERO_IMAGE} alt="CivicIQ camera capture surface" style={localPreview ? { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' } : {}} />
          {localPreview && <div className="replace-overlay"><ImagePlus size={18} /> Replace Image</div>}
          <div className="camera-controls"><span className="camera-control"><ScanLine size={16} /> Focus area</span><button onClick={(e) => { e.stopPropagation(); handleDetectionAction(); }} aria-label="Open camera report flow"><span className="shutter-inner"><Camera size={22} /></span></button><span className="camera-control">Auto-tag <Sparkles size={15} /></span></div>
        </div>
        <div className="float-context context-pothole"><span className="signal-icon blue"><Landmark size={16} /></span><span><strong>Pothole detected</strong><small>Confidence 96%</small></span><Check size={15} /></div>
        <div className="float-context context-priority"><span className="signal-icon amber"><AlertTriangle size={16} /></span><span><strong>High priority</strong><small>Near a school zone</small></span></div>
        <span className="orbit-label"><span />Coordinates locked</span>
      </div>
    </section>

    <section className="quick-actions-section" aria-labelledby="quick-actions-title"><div className="section-heading compact-heading"><div><span className="section-kicker">At a glance</span><h2 id="quick-actions-title">Choose your next civic action</h2></div><span className="section-index">01 / 04</span></div><div className="quick-actions">
      <button className="action-card action-report" onClick={onReport}><span className="action-number">01</span><span className="action-icon"><Camera size={21} /></span><span className="action-copy"><strong>Report an issue</strong><small>Capture what needs attention</small></span><ArrowUpRight size={18} /></button>
      <button className="action-card" onClick={() => onTrack('track')}><span className="action-number">02</span><span className="action-icon"><Target size={21} /></span><span className="action-copy"><strong>Track a report</strong><small>Follow it from sent to solved</small></span><ArrowUpRight size={18} /></button>
      <button className="action-card" onClick={() => onTrack('map')}><span className="action-number">03</span><span className="action-icon"><MapPin size={21} /></span><span className="action-copy"><strong>Explore nearby</strong><small>See issues around you</small></span><ArrowUpRight size={18} /></button>
      <button className="action-card" onClick={onHelp}><span className="action-number">04</span><span className="action-icon"><CircleHelp size={21} /></span><span className="action-copy"><strong>Read the civic guide</strong><small>Understand the next best step</small></span><ArrowUpRight size={18} /></button>
    </div></section>

    <section className="recent-section" aria-labelledby="recent-title"><div className="section-heading"><div><span className="section-kicker">Your activity</span><h2 id="recent-title">Recent reports</h2></div><button className="text-button" onClick={() => onTrack('track')}>View all <ChevronRight size={16} /></button></div><div className="activity-note"><span className="activity-icon"><Activity size={16} /></span><span><strong>{total > 0 ? `${total} reports in your workspace` : 'Your workspace is clear'}</strong><small>Updates appear here as your reports move forward.</small></span><span className="activity-status"><span />Synced</span></div><div className="complaint-list">{loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : recent.length === 0 ? <div className="empty-state"><div><FileCheck2 size={28} /></div><strong>No recent reports</strong><span>Be the first to point CivicIQ toward what needs attention.</span><button className="secondary-button" onClick={onReport}>Create a report <ArrowUpRight size={16} /></button></div> : recent.map(c => <ComplaintCard key={c.id} complaint={c} onClick={() => onDetail(c)} />)}</div></section>

    <section className="how-section" id="how-it-works"><div className="how-intro"><span className="section-kicker">From signal to service</span><h2>Three steps.<br /><em>One better block.</em></h2><p>CivicIQ turns a quick observation into a structured handoff that the right team can act on.</p></div><div className="how-steps"><div><span>01</span><div className="step-line" /><strong>Capture</strong><small>One photo. Location attached automatically.</small></div><div><span>02</span><div className="step-line" /><strong>Prioritize</strong><small>AI flags urgency and merges duplicates.</small></div><div><span>03</span><div className="step-line" /><strong>Resolve</strong><small>Follow the progress, without chasing.</small></div></div></section>
    <footer className="app-footer"><span>© 2026 CivicIQ</span><span>Public signal <span className="footer-dot" /> Private by design</span></footer>
  </div>
}

function Report({ onSubmit, initialImageFile, onClearInitial, ...navProps }) {
  const [uploaded, setUploaded] = useState(!!initialImageFile)
  const [located, setLocated] = useState(false)
  const [description, setDescription] = useState('')
  const [issueType, setIssueType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationText, setLocationText] = useState("We'll add coordinates automatically")
  const [coords, setCoords] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(initialImageFile ? URL.createObjectURL(initialImageFile) : null)
  const [imageFile, setImageFile] = useState(initialImageFile || null)
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [detections, setDetections] = useState(null)
  const [imgDim, setImgDim] = useState(null)
  const fileInputRef = useRef(null)

  // Clear global image file once mounted
  useEffect(() => {
    if (initialImageFile && onClearInitial) {
      onClearInitial()
    }
  }, [initialImageFile, onClearInitial])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file); 
      setPreviewUrl(URL.createObjectURL(file)); 
      setUploaded(true); 
      setDuplicateWarning(null); 
      setAiSuggestion(null);
      setDetections(null);

      const formData = new FormData();
      formData.append('image', file);
      if (coords) {
        formData.append('latitude', coords.latitude);
        formData.append('longitude', coords.longitude);
      }

      try {
        const result = await api.detectIssue(formData);
        if (result.duplicate) {
          setDuplicateWarning('AI Flag: Possible Duplicate');
        }
        if (result.detections && result.detections.length > 0) {
          setDetections(result.detections);
          // Suggest category if not set
          if (!issueType) setIssueType('Roads & potholes');
        }
      } catch (err) {
        console.error('Detection failed:', err);
      }
    }
  }
  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported by your browser')
    setIsSubmitting(false); setLocationText('Detecting your location…')
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setCoords({ latitude, longitude, accuracy }); setLocated(true); setLocationText(`${Number(latitude).toFixed(4)}° N, ${Number(longitude).toFixed(4)}° E`)
    }, () => { alert('Unable to retrieve your location'); setLocationText("We'll add coordinates automatically") })
  }
  const proceedWithSubmit = async (duplicateReference = null, confirmedCategory = null) => {
    setIsSubmitting(true)
    let lat = Number(coords.latitude);
    let lng = Number(coords.longitude);
    let acc = Number(coords.accuracy);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setIsSubmitting(false);
      return alert('Invalid coordinates. Latitude must be between -90 and 90, and longitude between -180 and 180.');
    }

    const payload = {
      issueType: confirmedCategory || issueType,
      description: description,
      latitude: lat,
      longitude: lng,
      accuracy: acc
    };
    console.log(payload);

    const formData = new FormData()
    formData.append('issueType', payload.issueType); 
    formData.append('description', payload.description); 
    formData.append('latitude', payload.latitude); 
    formData.append('longitude', payload.longitude);
    if (!Number.isNaN(payload.accuracy)) formData.append('accuracy', payload.accuracy);
    if (duplicateReference) formData.append('duplicateReference', duplicateReference)
    if (confirmedCategory) formData.append('aiSuggestedCategory', confirmedCategory)
    if (imageFile) formData.append('image', imageFile)
    try { await api.submitComplaint(formData); onSubmit() } catch (err) { if (err.message === 'Backend offline') alert('Backend is offline. Please start the server on port 5000.'); else alert(`Validation Error: ${err.message}`) } finally { setIsSubmitting(false) }
  }
  const handleSubmit = async () => {
    if (!issueType) return alert('Please select an issue type')
    if (!coords) return alert('Please provide your location')
    if (duplicateWarning || aiSuggestion) return proceedWithSubmit()
    setIsSubmitting(true)
    let lat = Number(coords.latitude);
    let lng = Number(coords.longitude);
    let acc = Number(coords.accuracy);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setIsSubmitting(false);
      return alert('Invalid coordinates. Latitude must be between -90 and 90, and longitude between -180 and 180.');
    }

    const payload = {
      issueType: issueType,
      description: description,
      latitude: lat,
      longitude: lng,
      accuracy: acc
    };
    console.log(payload);

    const formData = new FormData(); 
    formData.append('issueType', payload.issueType); 
    formData.append('description', payload.description); 
    formData.append('latitude', payload.latitude); 
    formData.append('longitude', payload.longitude); 
    if (!Number.isNaN(payload.accuracy)) formData.append('accuracy', payload.accuracy);
    if (imageFile) formData.append('image', imageFile)
    
    try {
      const { duplicates, suggestion } = await api.precheckComplaint(formData)
      let shouldStop = false
      if (duplicates?.length) { setDuplicateWarning(duplicates[0].id); shouldStop = true }
      if (suggestion?.suggestedCategory && suggestion.suggestedCategory !== issueType) { setAiSuggestion(suggestion); shouldStop = true }
      if (!shouldStop) await proceedWithSubmit()
    } catch (err) { await proceedWithSubmit() } finally { setIsSubmitting(false) }
  }

  return <div className="screen inner-screen report-screen"><Navbar {...navProps} screen="report" /><div className="page-heading"><div><span className="section-kicker">Make a difference</span><h1>Report an issue</h1><p>Give your city a clear signal to act on.</p></div><div className="step-rail"><span className="active">01</span><i /><span>01</span></div></div>
    <div className="report-layout"><div className="report-main">
      {duplicateWarning && <div className="decision-card decision-danger"><div className="decision-icon"><AlertTriangle size={19} /></div><div><strong>Similar complaint found nearby</strong><p>{duplicateWarning.startsWith('AI Flag') ? 'Our AI detected a highly similar image submitted recently.' : `ID: ${duplicateWarning.substring(duplicateWarning.length - 6).toUpperCase()} is within 25 meters.`}</p><div className="decision-actions"><button className="danger-button" onClick={() => proceedWithSubmit(duplicateWarning.startsWith('AI') ? 'AI_DUP' : duplicateWarning)}>Support existing</button><button className="ghost-button" onClick={() => proceedWithSubmit()}>Submit anyway</button></div></div></div>}
      {aiSuggestion && <div className="decision-card decision-ai"><div className="decision-icon"><Sparkles size={19} /></div><div><strong>{aiSuggestion.confidence >= 90 ? 'AI confirmed category' : 'AI suggests changing category'}</strong><p>Suggested: <b>{aiSuggestion.suggestedCategory}</b> ({aiSuggestion.confidence}%)<br /><span>{aiSuggestion.shortReason}</span></p><div className="decision-actions"><button className="primary-button" onClick={() => proceedWithSubmit(null, aiSuggestion.suggestedCategory)}>Accept & submit</button><button className="ghost-button" onClick={() => proceedWithSubmit()}>Keep mine</button></div></div></div>}
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} hidden />
      {!uploaded ? <button className="upload-zone" onClick={() => fileInputRef.current?.click()}><span className="upload-orb"><Camera size={27} /></span><span className="upload-copy"><strong>Start with a photo</strong><small>Take a photo or choose one from your gallery</small></span><span className="upload-action"><UploadCloud size={18} /> Add image</span></button> : <div className="preview-frame" style={{ position: 'relative' }}><img src={previewUrl} alt="Selected civic issue" onLoad={(e) => setImgDim({ w: e.target.naturalWidth, h: e.target.naturalHeight })} />
      {detections && imgDim && detections.map((det, idx) => (
        <div key={idx} style={{ position: 'absolute', border: '2px solid #3b82f6', borderRadius: '4px', left: `${(det.box[0] / imgDim.w) * 100}%`, top: `${(det.box[1] / imgDim.h) * 100}%`, width: `${((det.box[2] - det.box[0]) / imgDim.w) * 100}%`, height: `${((det.box[3] - det.box[1]) / imgDim.h) * 100}%`, pointerEvents: 'none' }}>
          <span style={{ position: 'absolute', top: '-24px', left: '-2px', backgroundColor: '#3b82f6', color: 'white', padding: '2px 6px', fontSize: '11px', fontWeight: 600, borderRadius: '4px 4px 4px 0', whiteSpace: 'nowrap' }}>
            {Math.round(det.confidence * 100)}% {det.severity}
          </span>
        </div>
      ))}
      <div className="preview-overlay"><span><Check size={15} /> Photo ready</span><button onClick={() => fileInputRef.current?.click()}>Retake photo</button></div></div>}
      <div className="form-section-label"><span>02</span><div><strong>Tell us what happened</strong><small>A little context helps the right team move faster.</small></div></div>
      <label className="field-label">Issue type<select value={issueType} onChange={e => setIssueType(e.target.value)}><option value="" disabled>Select an issue type</option><option>Roads & potholes</option><option>Streetlight</option><option>Waste management</option><option>Water & drainage</option></select></label>
      <button className={`location-button ${located ? 'located' : ''}`} onClick={handleGetLocation}><span className="location-icon"><LocateFixed size={19} /></span><span><strong>{located ? 'Location added' : 'Use current location'}</strong><small>{locationText}</small></span><ChevronRight size={18} /></button>
      <label className="field-label">Description <span className="optional">Optional</span><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell us a little more…" rows={5} /></label>
      <button className="primary-button submit-button" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <Clock3 size={18} className="spin" /> : <Send size={18} />}{isSubmitting ? 'Checking details…' : 'Submit report'}<ArrowUpRight size={17} /></button>
    </div><aside className="report-aside"><div className="aside-card"><span className="aside-number">03</span><span className="section-kicker">What happens next</span><h3>A clear handoff, not a black box.</h3><p>CivicLens checks for duplicates and helps categorize the issue before it reaches the right civic team.</p><div className="aside-flow"><span><Camera size={15} /></span><i /><span><Sparkles size={15} /></span><i /><span><Landmark size={15} /></span></div><small>Private by design · Location only used for this report</small></div></aside></div>
  </div>
}

function SearchBar({ value, onChange }) { return <label className="search-bar"><Search size={19} /><input value={value} onChange={e => onChange(e.target.value)} placeholder="Search your reports" /><button type="button" aria-label="Filter reports"><SlidersHorizontal size={17} /></button></label> }

function Track({ onDetail, complaints, loading, onLanguage, onNotifications, theme, onToggleTheme }) {
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('All')
  const filtered = useMemo(() => complaints.filter(c => { const searchStatus = c.status === 'In Progress' ? 'Under Review' : c.status; return (filter === 'All' || searchStatus === filter) && `${c.title} ${c.location} ${c.id}`.toLowerCase().includes(query.toLowerCase()) }), [filter, query, complaints])
  return <div className="screen inner-screen track-screen"><Navbar onLanguage={onLanguage} onNotifications={onNotifications} theme={theme} onToggleTheme={onToggleTheme} screen="track" /><div className="page-heading"><div><span className="section-kicker">Stay informed / Report register</span><h1>Track reports</h1><p>Every update, in one calm view.</p></div><span className="report-count"><span />{complaints.length} reports</span></div><div className="track-overview"><div className="register-title"><span className="register-mark"><i /><i /><i /><i /></span><div><strong>Report register</strong><small>Live view of your civic signals</small></div></div><div className="register-metrics"><div><span className="metric-value">{complaints.filter(c => ['Pending', 'In Progress'].includes(c.status)).length}</span><small>Needs attention</small></div><div><span className="metric-value">{complaints.filter(c => c.status === 'Assigned').length}</span><small>With civic team</small></div><div><span className="metric-value">{complaints.filter(c => c.status === 'Resolved').length}</span><small>Resolved</small></div></div></div><SearchBar value={query} onChange={setQuery} /><div className="filter-row">{['All', 'Pending', 'Under Review', 'Assigned', 'Resolved'].map(f => <button key={f} className={filter === f ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter(f)}>{f}</button>)}</div><div className="track-list">{loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : filtered.map((c, index) => <button className="track-card" key={c.id} onClick={() => onDetail(c)}><span className="track-rail">{String(index + 1).padStart(2, '0')}</span><div className={`complaint-thumb ${c.tone}`} style={c.image ? { backgroundImage: `url(${c.image})` } : {}}>{!c.image && <c.icon size={23} />}</div><div className="track-info"><strong>{c.title}</strong><span>{c.id.substring(c.id.length - 6).toUpperCase()} <i /> {c.date}</span></div><StatusBadge status={c.status} /><ChevronRight size={17} /></button>)}{!loading && !filtered.length && <div className="empty-state"><div><Search size={28} /></div><strong>No reports found</strong><span>Try another search or filter.</span></div>}</div></div>
}

const STATUS_STAGES = ['Pending', 'In Progress', 'Assigned', 'Resolved']
function Timeline({ status, createdAt, updatedAt }) {
  const currentIdx = STATUS_STAGES.indexOf(status) > -1 ? STATUS_STAGES.indexOf(status) : 0
  const steps = [{ title: 'Submitted', text: formatDate(createdAt) }, { title: 'Under review', text: (currentIdx >= 1 && updatedAt && status !== 'Pending') ? formatDate(updatedAt) : '' }, { title: 'Assigned to civic team', text: (currentIdx >= 2 && updatedAt && status !== 'Pending' && status !== 'In Progress') ? formatDate(updatedAt) : '' }, { title: 'Resolved', text: (currentIdx === 3 && updatedAt) ? formatDate(updatedAt) : '' }]
  return <div className="timeline">{steps.map((step, i) => { const isDone = i <= currentIdx; const isActive = i === currentIdx; return <div className={`timeline-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`} key={step.title}><span className="timeline-dot">{isDone ? <Check size={13} /> : <Clock3 size={13} />}</span><div><strong>{step.title}</strong><small>{step.text || (isActive ? 'Waiting for update' : (isDone ? 'Completed' : 'Pending'))}</small></div>{i < 3 && <i />}</div> })}</div>
}

function Detail({ complaint, onBack, onShare }) {
  const getScoreColor = (level) => level === 'Critical' ? '#dc2626' : level === 'High' ? '#d97706' : level === 'Medium' ? '#b45309' : '#2563eb'
  return <div className="screen inner-screen detail-screen"><div className="detail-top"><button className="back-button" onClick={onBack} aria-label="Back to reports"><ArrowLeft size={20} /></button><span className="detail-label"><span className="context-dot" />Report details</span><button className="back-button" aria-label="Share report" onClick={onShare}><Share2 size={19} /></button></div><div className={`detail-photo ${complaint.tone}`} style={complaint.image ? { backgroundImage: `url(${complaint.image})` } : {}}>{!complaint.image && <complaint.icon size={52} />}<span className="photo-label">CIVICIQ / FIELD IMAGE</span></div><div className="priority-card"><div className="priority-score" style={{ '--score-color': getScoreColor(complaint.priorityLevel) }}>{complaint.priorityScore}</div><div><span className="section-kicker">CivicLens analysis</span><strong><ShieldCheck size={15} /> AI priority: {complaint.priorityLevel}</strong><small>Calculated from proximity, category, and community context.</small></div><ArrowUpRight size={17} /></div><div className="detail-title"><div><span className="section-kicker">ID: {complaint.id.substring(complaint.id.length - 6).toUpperCase()}</span><h1>{complaint.title}</h1></div><StatusBadge status={complaint.status} /></div><div className="detail-location"><span className="location-icon"><MapPin size={18} /></span><span><strong>{complaint.location}</strong><small>Reported {complaint.date}</small></span><ChevronRight size={18} /></div><div className="detail-section"><div className="section-heading"><div><span className="section-kicker">Progress</span><h2>Report timeline</h2></div><span className="section-index">04 / 04</span></div><Timeline status={complaint.status} createdAt={complaint.createdAt} updatedAt={complaint.updatedAt} /></div><button className="share-button" onClick={onShare}><Share2 size={17} />Share report <ArrowUpRight size={16} /></button></div>
}

function MapScreen({ complaints, onDetail, onBack }) {
  const [userLoc, setUserLoc] = useState([12.9716, 77.5946]); const [locErr, setLocErr] = useState(false)
  useEffect(() => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => setUserLoc([pos.coords.latitude, pos.coords.longitude]), () => setLocErr(true)) }, [])
  return <div className="screen map-screen"><div className="map-header"><button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button><div><span className="section-kicker">Civic map</span><strong>Nearby issues</strong></div><button className="icon-button"><Navigation size={18} /></button></div>{locErr && <div className="map-alert">Location access denied. Showing default area.</div>}<div className="map-wrap"><MapContainer center={userLoc} zoom={13} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />{complaints.map(c => c.latitude && c.longitude ? <Marker key={c.id} position={[c.latitude, c.longitude]} icon={createMarkerIcon(getStatusColor(c.status))}><Popup><div className="map-popup"><span className="section-kicker">{c.status}</span><h3>{c.title}</h3><p>{c.location}</p><button onClick={() => onDetail(c)}>Open details <ArrowUpRight size={14} /></button></div></Popup></Marker> : null)}</MapContainer><div className="map-legend"><span><i className="legend-dot blue" />Under review</span><span><i className="legend-dot amber" />Pending</span><span><i className="legend-dot green" />Resolved</span></div><div className="map-summary"><span className="summary-icon"><MapPin size={17} /></span><span><strong>{complaints.length} issues nearby</strong><small>Updated just now · Move the map to explore</small></span></div></div></div>
}

function Profile({ onLanguage, onNotifications, onTrack, theme, onToggleTheme }) {
  const items = [['My reports', Target, '3 reports', () => onTrack('track')], ['Notifications', Bell, 'Up to date', onNotifications], ['Language', Languages, 'English', onLanguage], ['Help & support', MessageCircleQuestion, "We're here to help", () => {}], ['About CivicIQ', CircleHelp, 'Version 1.0', () => {}]]
  return <div className="screen inner-screen profile-screen"><Navbar onLanguage={onLanguage} onNotifications={onNotifications} theme={theme} onToggleTheme={onToggleTheme} screen="profile" /><div className="page-heading"><div><span className="section-kicker">Your civic journey / Account</span><h1>Profile</h1><p>Your preferences and activity, together.</p></div><button className="icon-button"><Menu size={19} /></button></div><div className="profile-card"><div className="avatar">AS</div><div><span className="section-kicker">Citizen account</span><h2>Arjun Sharma</h2><span>Making Bengaluru better, one signal at a time.</span></div><ChevronRight size={19} /></div><div className="profile-activity"><div className="activity-register-head"><div><span className="section-kicker">Activity register</span><strong>Your civic footprint</strong></div><span className="activity-register-status"><span />Current</span></div><div className="profile-metrics"><div><strong>03</strong><span>Reports made</span></div><div><strong>02</strong><span>Issues resolved</span></div><div><strong>14d</strong><span>Active since</span></div></div><div className="profile-progress"><span><i /></span><small>Your reports are helping the civic team see the whole picture.</small></div></div><div className="profile-menu">{items.map(([label, Icon, text, action]) => <button key={label} onClick={action}><span className="menu-icon"><Icon size={18} /></span><span className="menu-copy"><strong>{label}</strong><small>{text}</small></span><ChevronRight size={17} /></button>)}</div><button className="logout-button"><LogOut size={17} />Log out</button></div>
}

function LanguageSheet({ onClose }) { return <div className="sheet-backdrop" onClick={onClose}><div className="language-sheet" onClick={e => e.stopPropagation()}><div className="sheet-handle" /><div className="sheet-header"><div><span className="section-kicker">Choose your language</span><h2>Language</h2></div><button className="back-button" onClick={onClose}><X size={19} /></button></div><div className="language-options">{languages.map(([native, english], i) => <button key={english} onClick={() => onClose(english)}><span>{native}</span><small>{english}</small>{i === 0 && <Check size={19} />}</button>)}</div></div></div> }

function AppContent() {
  const [theme, setTheme] = useState(() => (localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark')) ? 'dark' : 'light')
  const toggleTheme = () => setTheme(previous => {
    const next = previous === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('theme', next)
    return next
  })
  const [screen, setScreen] = useState(() => pathToScreen(window.location.pathname)); const [detail, setDetail] = useState(null); const [languageOpen, setLanguageOpen] = useState(false); const [toast, setToast] = useState(''); const [complaintsData, setComplaintsData] = useState([]); const [loading, setLoading] = useState(true)
  const [globalImageFile, setGlobalImageFile] = useState(null)
  const showToast = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3000) }
  const fetchComplaints = async () => { setLoading(true); try { const data = await api.getComplaints(); setComplaintsData(data.map(mapBackendComplaint)) } catch (err) { setComplaintsData(PREVIEW_COMPLAINTS); showToast('Preview mode · connect your civic backend for live reports') } finally { setLoading(false) } }
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  useEffect(() => {
    fetchComplaints()
    const onPopState = () => setScreen(pathToScreen(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  const goDetail = (c) => { setDetail(c); window.history.pushState({}, '', '/detail'); setScreen('detail') }
  const shareDetail = async () => { if (navigator.share && detail) { try { await navigator.share({ title: `CivicIQ · ${detail.title}`, text: `Track this civic report: ${detail.location}` }) } catch {} } else showToast('Report link copied to clipboard') }
  const go = (next) => { window.history.pushState({}, '', screenToPath(next)); setScreen(next) }
  const common = { onLanguage: () => setLanguageOpen(true), onNotifications: () => showToast('Notifications are up to date'), theme, onToggleTheme: toggleTheme }
  return <main className="app-shell"><div className="app-content">
    {screen === 'home' && <Home {...common} onReport={(file) => { if (file instanceof File) setGlobalImageFile(file); else setGlobalImageFile(null); go('report'); }} onDetail={goDetail} onTrack={go} onHelp={() => showToast('Help centre is coming soon')} complaints={complaintsData} loading={loading} />}
    {screen === 'report' && <Report {...common} initialImageFile={globalImageFile} onClearInitial={() => setGlobalImageFile(null)} onSubmit={() => { fetchComplaints(); setGlobalImageFile(null); go('home'); showToast('Report submitted successfully') }} />}
    {screen === 'track' && <Track {...common} onDetail={goDetail} complaints={complaintsData} loading={loading} />}
    {screen === 'profile' && <Profile {...common} onTrack={go} />}
    {screen === 'detail' && detail && <Detail complaint={detail} onBack={() => go('track')} onShare={shareDetail} />}
    {screen === 'map' && <MapScreen complaints={complaintsData} onDetail={goDetail} onBack={() => go('home')} />}
  </div>{(screen !== 'detail' && screen !== 'map') && <BottomNav active={screen} onChange={go} />}{languageOpen && <LanguageSheet onClose={lang => { setLanguageOpen(false); if (lang) showToast(`Language set to ${lang}`) }} />}{toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}</main>
}

export default function App() {
  return <AppContent />
}
