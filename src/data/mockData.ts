import {
  AerixNotification,
  ChatMessage,
  ShortVideo,
  MailMessage,
  CallRecord,
  Contact,
  UserFile,
  MusicTrack,
  UserNote
} from '../types';

export const INITIAL_NOTIFICATIONS: AerixNotification[] = [
  {
    id: 'n1',
    title: 'AERIX Quantum Core Online',
    message: 'All local execution sub-systems stabilized. Neural cache latency: 12ms.',
    timestamp: 'Just now',
    read: false,
    category: 'system'
  },
  {
    id: 'n2',
    title: 'Maps Cache Updated',
    message: 'High-contrast metropolitan vector grid synchronized for offline navigation.',
    timestamp: '14m ago',
    read: false,
    category: 'system'
  },
  {
    id: 'n3',
    title: 'Security Clearance',
    message: 'Local sandbox isolation confirmed. No unauthorized outbound telemetry detected.',
    timestamp: '1h ago',
    read: true,
    category: 'security'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    content: "Greetings. I am AERIX ONE Intelligence. In Phase 1, I am executing locally on your device to coordinate your system, navigation, arcade, media, files, and comms. How can I assist your workflow today?",
    timestamp: '09:00 AM'
  }
];

export const INITIAL_SHORTS: ShortVideo[] = [
  {
    id: 's1',
    creator: {
      name: 'CyberAero Labs',
      handle: '@cyberaero',
      avatar: 'CA',
      verified: true,
      followers: '840K',
      bio: 'Pioneering supersonic urban flight dynamics & autonomous drone grids.'
    },
    description: 'Autonomous flight test #7 over Tokyo Skybridge at Mach 1.8. Gyroscopic dampeners holding at 99.4% stability. 🚀✨',
    tags: ['aerix', 'flight', 'mach1', 'future'],
    audioTitle: 'AERIX Synthetic Pulse 01 - CyberAero',
    likes: 42100,
    comments: 1340,
    shares: 8900,
    saves: 5210,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    videoType: 'neon-city'
  },
  {
    id: 's2',
    creator: {
      name: 'Orbital Architect',
      handle: '@orbital.station',
      avatar: 'OA',
      verified: true,
      followers: '1.2M',
      bio: 'Designing rotating habitat rings for low Earth orbit colonies.'
    },
    description: 'Inside the Elysium Ring biosphere. Gravity simulation set to 0.92G using continuous ring rotation. 🪐🌿',
    tags: ['space', 'architecture', 'orbital', 'science'],
    audioTitle: 'Celestial Ambient Resonance - Orbital Studio',
    likes: 95400,
    comments: 3120,
    shares: 24300,
    saves: 18400,
    isLiked: true,
    isSaved: true,
    isFollowing: true,
    videoType: 'orbital-station'
  },
  {
    id: 's3',
    creator: {
      name: 'Synapse Racing',
      handle: '@synapse.apex',
      avatar: 'SR',
      verified: true,
      followers: '630K',
      bio: 'Formula Zero zero-emission quantum magnetic drift vehicles.'
    },
    description: 'Telemetry readout of the zero-resistance magnetic drift on turn 4! ⚡🏎️ The downforce vector is insane.',
    tags: ['racing', 'electric', 'speed', 'telemetry'],
    audioTitle: 'High Voltage Overdrive - Synapse Audio',
    likes: 67300,
    comments: 890,
    shares: 11200,
    saves: 7400,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    videoType: 'speed-racer'
  },
  {
    id: 's4',
    creator: {
      name: 'Neural Matrix',
      handle: '@neural.matrix',
      avatar: 'NM',
      verified: false,
      followers: '310K',
      bio: 'Explorations in biological computing and silicon photonic lattices.'
    },
    description: 'Visualizing 4096-channel neural synapsing in real-time. Look at that emergent coherence pattern! 🧠⚡',
    tags: ['ai', 'quantum', 'coherence', 'tech'],
    audioTitle: 'Sub-harmonic Theta Waves - Neural Labs',
    likes: 38900,
    comments: 610,
    shares: 4300,
    saves: 8900,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
    videoType: 'quantum-ai'
  }
];

export const INITIAL_EMAILS: MailMessage[] = [
  {
    id: 'e1',
    sender: 'AERIX System Dispatch',
    email: 'dispatch@aerix.local',
    subject: 'AERIX ONE Phase 1 Initialization Report',
    snippet: 'System diagnostics complete. All 9 core modules operational...',
    body: `Commander,\n\nWelcome to the AERIX ONE Operating Shell. Phase 1 provides the complete mobile-first tactile interface.\n\nSummary of active subsystems:\n• Unified Dashboard & Ambient Monitor\n• Local Vector Cartography Engine\n• Procedural Shorts Feed\n• AERIX Arcade 4-Game Suite\n• Sandboxed Mail, Comms, Files, Music & Camera\n\nSecurity isolation level: Tier 2 (Air-gapped local sandbox).\nExternal API bridges remain deactivated for security during Phase 1.`,
    date: '10:42 AM',
    unread: true,
    starred: true,
    folder: 'inbox'
  },
  {
    id: 'e2',
    sender: 'Astra Dynamics',
    email: 'engineering@astradynamics.corp',
    subject: 'Hyperloop Route 9 Feasibility Study',
    snippet: 'Preliminary friction coefficients along the Pacific corridor...',
    body: `Regarding the proposed high-speed magnetic transit link:\n\nOur vacuum tube sensors clocked an experimental maglev capsule at 1,180 km/h with 0.02% variance in magnetic levitation gap.\n\nWe have transmitted the coordinate pins directly to your AERIX Maps module for spatial verification.\n\nBest regards,\nAstra Transit Team`,
    date: 'Yesterday',
    unread: false,
    starred: false,
    folder: 'inbox'
  },
  {
    id: 'e3',
    sender: 'Orbital Flight Command',
    email: 'flight@orbital.command',
    subject: 'Telemetry Archive: Shuttle AO-42 Re-entry',
    snippet: 'Thermal shielding performed within nominal parameters...',
    body: `Telemetry data attached for Shuttle AO-42. Angle of attack held at 40 degrees during peak atmospheric ionization.\n\nAll flight records are archived in your AERIX Files repository under the Documents category.`,
    date: 'Oct 02',
    unread: false,
    starred: false,
    folder: 'inbox'
  },
  {
    id: 'e4',
    sender: 'Self Draft',
    email: 'user@aerix.local',
    subject: 'Phase 2 Integration Checklist & Notes',
    snippet: 'Prepare OAuth manifests, verify Maps satellite tile proxy...',
    body: `Draft notes:\n- Review Gemini multimodal tool calling specs\n- Check Google Maps vector and satellite licensing\n- Set up WebRTC signaling channels for real calls`,
    date: 'Oct 01',
    unread: false,
    starred: true,
    folder: 'drafts'
  },
  {
    id: 'e5',
    sender: 'Security Monitor',
    email: 'daemon@aerix.local',
    subject: 'Completed: Local Storage Integrity Scan',
    snippet: '0 anomalies detected across IndexedDB and cache quotas...',
    body: `Integrity check completed successfully. 0 corrupt blocks detected. Storage consumption is optimal.`,
    date: 'Sep 29',
    unread: false,
    starred: false,
    folder: 'sent'
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Elena Rostova',
    role: 'Chief Avionics Engineer',
    number: '+1 (555) 019-4821',
    avatar: 'ER',
    favorite: true
  },
  {
    id: 'c2',
    name: 'Kaelen Vance',
    role: 'Quantum Core Architect',
    number: '+1 (555) 018-9923',
    avatar: 'KV',
    favorite: true
  },
  {
    id: 'c3',
    name: 'Dr. Soraya Lin',
    role: 'Neural Network Lead',
    number: '+1 (555) 014-3312',
    avatar: 'SL',
    favorite: false
  },
  {
    id: 'c4',
    name: 'Marcus Thorne',
    role: 'Security Operations',
    number: '+1 (555) 017-8890',
    avatar: 'MT',
    favorite: false
  }
];

export const INITIAL_CALL_RECORDS: CallRecord[] = [
  {
    id: 'cr1',
    name: 'Elena Rostova',
    number: '+1 (555) 019-4821',
    type: 'incoming',
    time: 'Today, 11:15 AM',
    duration: '4m 32s'
  },
  {
    id: 'cr2',
    name: 'Kaelen Vance',
    number: '+1 (555) 018-9923',
    type: 'outgoing',
    time: 'Yesterday, 3:45 PM',
    duration: '1m 18s'
  },
  {
    id: 'cr3',
    name: '+1 (555) 012-7744',
    number: '+1 (555) 012-7744',
    type: 'missed',
    time: 'Oct 02, 9:20 AM',
    duration: 'Missed'
  }
];

export const INITIAL_FILES: UserFile[] = [
  {
    id: 'f1',
    name: 'aerix_core_schematic.svg',
    category: 'image',
    size: '1.4 MB',
    updatedAt: '2h ago'
  },
  {
    id: 'f2',
    name: 'suborbital_flight_test.mp4',
    category: 'video',
    size: '48.2 MB',
    updatedAt: 'Yesterday'
  },
  {
    id: 'f3',
    name: 'phase_1_system_architecture.pdf',
    category: 'document',
    size: '3.8 MB',
    updatedAt: 'Oct 02'
  },
  {
    id: 'f4',
    name: 'ambient_synth_frequencies.wav',
    category: 'audio',
    size: '12.6 MB',
    updatedAt: 'Oct 01'
  },
  {
    id: 'f5',
    name: 'aerix_firmware_v1.0.bin',
    category: 'download',
    size: '8.1 MB',
    updatedAt: 'Sep 28'
  }
];

export const INITIAL_TRACKS: MusicTrack[] = [
  {
    id: 't1',
    title: 'Neon Horizon',
    artist: 'AERIX Sound Engine',
    album: 'Zero Gravity Vol. 1',
    duration: 184,
    bpm: 110,
    genre: 'Synthwave / Cyberpunk',
    frequencies: [220, 277, 330, 440, 554]
  },
  {
    id: 't2',
    title: 'Orbital Drift',
    artist: 'AERIX Sound Engine',
    album: 'Deep Space Reverie',
    duration: 215,
    bpm: 85,
    genre: 'Ambient Space Chill',
    frequencies: [174, 220, 261, 349, 440]
  },
  {
    id: 't3',
    title: 'Quantum Synapse',
    artist: 'AERIX Sound Engine',
    album: 'Zero Gravity Vol. 1',
    duration: 198,
    bpm: 128,
    genre: 'Futuristic Electro',
    frequencies: [261, 329, 392, 523, 659]
  },
  {
    id: 't4',
    title: 'Solitude in Orbit',
    artist: 'AERIX Sound Engine',
    album: 'Atmospheric Layers',
    duration: 240,
    bpm: 72,
    genre: 'Binaural Drone',
    frequencies: [130, 196, 261, 392, 523]
  }
];

export const INITIAL_NOTES: UserNote[] = [
  {
    id: 'n1',
    title: 'AERIX ONE Architectural Philosophy',
    content: `Phase 1 Objective: Establish an unshakeable, hyper-responsive mobile-first foundation.\n\nGuiding pillars:\n1. Zero Dead Buttons — every single interaction provides immediate feedback or clearly details the Phase 2 roadmap.\n2. Local Autonomy — the OS must remain entirely functional even when offline.\n3. High-Fidelity Feedback — smooth glassmorphism, responsive tactile physics, and zero lag.`,
    updatedAt: 'Today, 10:15 AM',
    pinned: true,
    folder: 'System'
  },
  {
    id: 'n2',
    title: 'Ideas for Arcade Modules',
    content: `Arcade is fully playable:\n- Electric Car Racing: 2D lane-switching reflex test with score multipliers.\n- Space Defender: Intercept incoming asteroids using laser cannons.\n- Reaction Velocity: Test biological reaction time down to milliseconds.\n- Neural Memory: 4x4 card matching grid for synaptic training.`,
    updatedAt: 'Yesterday',
    pinned: true,
    folder: 'Projects'
  },
  {
    id: 'n3',
    title: 'Personal Coordinates & Travel',
    content: `Saved destination pins:\n• AERIX Quantum Headquarters (Central Hub)\n• Skyline Hyperloop Terminal\n• Neo Lumina Plaza\n\nEnsure offline map vectors are pre-cached before transit.`,
    updatedAt: 'Oct 02',
    pinned: false,
    folder: 'Personal'
  }
];

export const INITIAL_BOOKMARKS = [
  { id: 'b1', title: 'AERIX Documentation', url: 'https://docs.aerix.local', category: 'Dev' },
  { id: 'b2', title: 'Metropolitan Transit Feed', url: 'https://transit.metro.net', category: 'Transit' },
  { id: 'b3', title: 'Orbital Space Weather', url: 'https://spaceweather.orbital', category: 'Science' },
  { id: 'b4', title: 'Quantum Computing Consortium', url: 'https://quantum.org', category: 'Tech' },
];
