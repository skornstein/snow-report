'use client';

import { useEffect, useState } from 'react';
import { MountainData, LiftCondition, TrailCondition } from '@/lib/types';
import { Wind, ChevronDown, ChevronUp, Snowflake, Map as MapIcon, CableCar } from 'lucide-react';

export default function SnowWidget({ defaultSlug = 'mount-snow' }: { defaultSlug?: string }) {
    const [slug, setSlug] = useState(defaultSlug);
    const [data, setData] = useState<MountainData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'lifts' | 'trails'>('trails');
    const [showSubscribe, setShowSubscribe] = useState(false);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`/api/mountain?slug=${slug}`);
                if (!res.ok) throw new Error('Failed to load data');
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError('Unable to load mountain report.');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [slug]);

    if (loading && !data) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 animate-pulse">
            Loading Conditions...
        </div>
    );

    if (error || !data) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500">
            {error}
        </div>
    );

    const { snowReport, weather, liftsTerrain, summary, mountain } = data;

    // Sorting Logic
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortData = (items: any[]) => {
        if (!sortConfig) return items;
        return [...items].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const sortedLifts = sortData(liftsTerrain.lifts);
    const sortedTrails = sortData(liftsTerrain.trails);

    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-900 pb-12 relative">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="w-full px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        {/* Logo */}
                        <img
                            src="https://www.valleyviewvt.com/wp-content/uploads/2024/10/Valley_View_Villa_Logo_Grey_White_Circle_Transparent_Background-768x635.png"
                            alt="Valley View Villa"
                            className="h-12 w-auto"
                        />
                        <div className="border-l-2 border-slate-200 pl-4 h-10 flex flex-col justify-center">
                            <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900 leading-none">
                                Valley View Villa
                            </h1>
                            <span className="text-sm text-slate-500 font-medium">Snow Report</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Mountain Selector */}
                        <div className="relative group">
                            <select
                                className="appearance-none bg-white border-2 border-slate-200 group-hover:border-blue-400 rounded-lg py-2 pl-4 pr-10 text-sm font-bold text-slate-700 cursor-pointer shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                            >
                                <option value="mount-snow">Mount Snow</option>
                                <option value="okemo">Okemo</option>
                                <option value="stratton">Stratton</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 group-hover:text-blue-500 transition-colors">
                                <ChevronDown size={16} strokeWidth={3} />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSubscribe(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                            Subscribe
                        </button>

                    </div>
                </div>
            </header>

            <main className="w-full px-2 py-6 space-y-6">

                {/* Mountain Title & Live Status */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-slate-200 pb-4 mx-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                            {mountain.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Live Data</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-sm font-medium text-slate-500">
                                Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Hero Section: 3-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Col 1: Current Weather */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden h-full min-h-[220px]">
                        <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
                            <Snowflake size={140} />
                        </div>

                        <div className="relative z-10 w-full flex flex-col h-full">
                            <div className="flex flex-col items-start mb-2">
                                <div className="text-sm font-bold uppercase text-slate-400">Current Weather</div>
                                <div className="text-xs font-bold text-slate-500 mt-0.5">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-5xl font-black tracking-tighter">{Math.round(weather.currentTempF)}°</span>
                                    <div className="flex flex-col">
                                        <span className="text-lg font-medium text-slate-600 leading-tight">{weather.conditions}</span>
                                        <span className="text-xs font-bold text-blue-600 mt-0.5">
                                            {weather.daily[0]?.snowIn > 0 ? `${Math.round(weather.daily[0].snowIn)}" Snow Today` : 'No Snow Expected Today'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
                                <span className="flex items-center gap-1"><Wind size={14} /> {Math.round(weather.windMph)} <span className="text-[10px]">MPH</span></span>
                                <span>H: {Math.round(weather.todayHighF)}°</span>
                                <span>L: {Math.round(weather.todayLowF)}°</span>
                            </div>
                        </div>
                    </div>

                    {/* Col 2: Snow Summary */}
                    <div className="bg-gradient-to-br from-slate-50 to-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden h-full min-h-[220px]">
                        <div className="text-sm font-bold uppercase text-indigo-400 mb-4">Snow Summary</div>
                        {snowReport.conditions === 'Data Unavailable' || snowReport.conditions === 'Scraping Blocked' ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 text-indigo-300">
                                <Snowflake className="mb-2" size={32} />
                                <span className="text-indigo-900 font-bold">Resort Report Unavailable</span>
                                <span className="text-indigo-400 text-xs mt-1">Weather data is live</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6 flex-1 content-center">
                                <SnowStat label="Last 24 Hours" value={`${Math.round(snowReport.snow24hIn)}"`} highlight={false} dark />
                                <SnowStat label="Last 48 Hours" value={`${Math.round(snowReport.snow48hIn)}"`} dark />
                                <SnowStat label="Base Depth" value={`${Math.round(snowReport.baseDepthIn.max)}"`} dark />
                                <SnowStat label="Season Total" value={snowReport.seasonSnowIn > 0 ? `${Math.round(snowReport.seasonSnowIn)}"` : '--'} dark />
                            </div>
                        )}
                    </div>

                    {/* Col 3: Terrain Status (Gauge) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden h-full min-h-[220px]">
                        <div className="text-sm font-bold uppercase text-slate-400 mb-2">Terrain Status</div>

                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            {/* Gauge Component */}
                            <TerrainGauge percent={liftsTerrain.terrainOpenPct} />
                        </div>

                        <div className="flex justify-between text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide px-2">
                            <span>Trails: {liftsTerrain.trailsOpen}/{liftsTerrain.trailsTotal}</span>
                            <span>Lifts: {liftsTerrain.liftsOpen}/{liftsTerrain.liftsTotal}</span>
                        </div>
                    </div>
                </div>

                {/* Summary Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-blue-900 shadow-sm relative overflow-hidden">
                    <div className="font-bold text-sm uppercase tracking-wide text-blue-400 mb-2">Snow & Terrain Report</div>
                    <div className="font-medium text-lg leading-snug relative z-10 text-slate-800">
                        {summary}
                    </div>
                    <div className="mt-3 text-xs font-bold uppercase tracking-wider text-blue-500 hover:text-blue-700 transition-colors">
                        <a href="https://www.mountsnow.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx" target="_blank" rel="noopener noreferrer">View Official Report →</a>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: 7-Day Forecast (Vertical) - Starts TOMORROW */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden lg:col-span-1 border border-slate-100">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-slate-800">Forecast</h2>
                            <span className="text-xs text-slate-400 font-medium">Next 7 Days</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {/* Slice from index 1 to skip today. Show 7 days. */}
                            {weather.daily.slice(1, 8).map((day) => (
                                <div key={day.date} className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors group">
                                    <div className="flex flex-col w-12">
                                        <span className="font-bold text-slate-700 uppercase">{new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className="text-xs text-slate-400">{new Date(day.date + 'T12:00:00').getDate()}</span>
                                    </div>
                                    <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">{getWeatherIcon(day.conditions)}</div>
                                    <div className="text-right flex flex-col items-end min-w-[3rem]">
                                        <div className="font-bold text-slate-700">{Math.round(day.highF)}° <span className="text-slate-400 font-normal">/ {Math.round(day.lowF)}°</span></div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                                <Wind size={10} /> {Math.round(day.windMph)}
                                            </div>
                                            {day.snowIn > 0 && (
                                                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Snowflake size={10} /> {Math.round(day.snowIn)}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Lifts & Trails (Detailed) */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden lg:col-span-2 flex flex-col h-[600px]">
                        <div className="p-2 bg-slate-50/50 border-b border-slate-100 flex gap-2">
                            <button
                                onClick={() => setActiveTab('trails')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'trails' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <MapIcon size={16} />
                                    Trails ({liftsTerrain.trailsOpen}/{liftsTerrain.trailsTotal})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('lifts')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'lifts' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <CableCar size={16} />
                                    Lifts ({liftsTerrain.liftsOpen}/{liftsTerrain.liftsTotal})
                                </div>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            {activeTab === 'trails' ? (
                                <table className="w-full text-sm text-left relative">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <SortableHeader label="Trail Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                                            <SortableHeader label="Difficulty" sortKey="difficulty" currentSort={sortConfig} onSort={handleSort} className="w-[120px]" align="center" />
                                            <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} align="right" className="w-[100px]" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sortedTrails.map((trail, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-800 w-[180px] break-words">{trail.name}</td>
                                                <td className="px-4 py-3 w-[120px]">
                                                    <div className="flex justify-center">
                                                        <DifficultyBadge difficulty={trail.difficulty} />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right w-[100px]">
                                                    <StatusBadge status={trail.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-sm text-left relative">
                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <SortableHeader label="Lift Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                                            <SortableHeader label="Type" sortKey="type" currentSort={sortConfig} onSort={handleSort} />
                                            <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} align="right" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sortedLifts.map((lift, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-800">{lift.name}</td>
                                                <td className="px-4 py-3 text-slate-500 capitalize">{lift.type || '-'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <StatusBadge status={lift.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-center text-slate-400 text-xs mt-8">
                    Weather source: Open-Meteo • Mountain Report: Official Resort Data
                </div>

            </main>

            {showSubscribe && <SubscribeModal onClose={() => setShowSubscribe(false)} />}
        </div>
    );
}

function SortableHeader({ label, sortKey, currentSort, onSort, align = 'left', className = '' }: any) {
    const isActive = currentSort?.key === sortKey;
    return (
        <th
            className={`px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label}
                <div className="flex flex-col text-slate-300">
                    <ChevronUp size={10} className={isActive && currentSort.direction === 'asc' ? 'text-slate-600' : ''} />
                    <ChevronDown size={10} className={isActive && currentSort.direction === 'desc' ? 'text-slate-600' : ''} />
                </div>
            </div>
        </th>
    );
}

function SubscribeModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState('');
    const [duration, setDuration] = useState('3');
    const [time, setTime] = useState('07:00');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, duration, time }),
            });
            if (res.ok) {
                setStatus('success');
                setTimeout(onClose, 2000);
            } else {
                setStatus('error');
            }
        } catch (err) {
            setStatus('error');
        }
    }

    if (status === 'success') {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">You're Subscribed!</h3>
                    <p className="text-slate-500">Get ready for accurate snow reports delivered straight to your inbox.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Subscribe for Alerts</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Vacation Length (Days)</label>
                        <select
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={duration}
                            onChange={e => setDuration(e.target.value)}
                        >
                            <option value="3">3 Days</option>
                            <option value="5">5 Days</option>
                            <option value="7">7 Days</option>
                            <option value="30">30 Days</option>
                            <option value="Indefinite">Indefinitely</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Delivery Time</label>
                        <input
                            type="time"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all mt-4 disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Subscribing...' : 'Start My Snow Report'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function TerrainGauge({ percent }: { percent: number }) {
    // Logic: Red < 20, Orange 20-60, Green > 60
    let colorClass = 'text-red-500';
    let label = 'Poor';

    if (percent >= 60) {
        colorClass = 'text-green-500';
        label = 'Great';
    } else if (percent >= 20) {
        colorClass = 'text-orange-500';
        label = 'Good';
    }

    // SVG Arc Params
    const radius = 40; // Increased size to fill space
    const circumference = radius * Math.PI; // Half circle
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center -mt-2">
            <div className="relative w-40 h-20 overflow-hidden">
                {/* Background Arc */}
                <svg className="w-40 h-40 transform rotate-180" viewBox="0 0 100 100">
                    <circle
                        cx="50" cy="50" r={radius}
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset="0"
                        className="origin-center"
                    />
                </svg>
                {/* Foreground Arc */}
                <svg className="w-40 h-40 absolute top-0 left-0 transform rotate-180" viewBox="0 0 100 100">
                    <circle
                        cx="50" cy="50" r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={`origin-center transition-all duration-1000 ease-out ${colorClass}`}
                    />
                </svg>
                <div className="absolute bottom-0 w-full text-center flex flex-col items-center">
                    <span className={`text-3xl font-black leading-none ${colorClass}`}>{percent}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Terrain Open</span>
                </div>
            </div>
            <div className={`text-lg font-bold uppercase tracking-tight mt-1 ${colorClass}`}>
                {label}
            </div>
        </div>
    );
}

function SnowStat({ label, value, highlight = false, dark = false }: { label: string, value: string, highlight?: boolean, dark?: boolean }) {
    return (
        <div className={`flex flex-col p-2 rounded-xl ${highlight ? (dark ? 'bg-indigo-100' : 'bg-white/10') : ''}`}>
            <span className={`${dark ? 'text-indigo-400' : 'text-blue-100'} text-xs font-bold uppercase tracking-wider mb-1`}>{label}</span>
            <span className={`text-3xl font-black ${dark ? 'text-slate-900' : ''}`}>{value}</span>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (!status) return null;
    const s = String(status).toLowerCase();
    if (s === 'open') return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700">Open</span>;
    if (s === 'hold') return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700">Hold</span>;
    if (s === 'scheduled') return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">Sched</span>;
    return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500">Closed</span>;
}

function DifficultyBadge({ difficulty }: { difficulty?: string | number }) {
    if (!difficulty) return <div className="w-3 h-3 rounded-full bg-slate-200"></div>;

    const d = String(difficulty).toLowerCase();

    let icon = <div className="w-3 h-3 rounded-full bg-slate-200"></div>;
    let label = '';

    if (d.includes('green') || d.includes('novice') || d === '1') {
        icon = <div className="w-3 h-3 rounded-full bg-emerald-500"></div>;
        label = 'Easiest';
    } else if (d.includes('blue') || d.includes('intermediate') || d === '2') {
        icon = <div className="w-3 h-3 rounded bg-blue-500"></div>;
        label = 'Intermediate';
    } else if (d.includes('double') || d === '4' || d.includes('expert')) {
        // Check double black before black to avoid partial match overlap if strict checking wasn't used
        icon = <div className="w-3 h-3 rotate-45 bg-black ring-2 ring-black ring-offset-1"></div>;
        label = 'Expert';
    } else if (d.includes('black') || d.includes('advanced') || d === '3') {
        icon = <div className="w-3 h-3 rotate-45 bg-black"></div>;
        label = 'Advanced';
    } else if (d.includes('park') || d.includes('terrain') || d === '5') {
        icon = <div className="w-6 h-3 rounded-sm bg-orange-500 border-2 border-orange-500"></div>;
        label = 'Terrain Park';
    }

    return (
        <div className="flex items-center gap-2 min-w-[110px]" title={label}>
            <div className="flex items-center justify-center w-6">{icon}</div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
        </div>
    );
}

function getWeatherIcon(condition: string) {
    const c = condition.toLowerCase();
    if (c.includes('snow')) return '❄️';
    if (c.includes('rain')) return '🌧️';
    if (c.includes('cloud')) return '☁️';
    if (c.includes('sun') || c.includes('clear')) return '☀️';
    if (c.includes('fog')) return '🌫️';
    return '⛅';
}
