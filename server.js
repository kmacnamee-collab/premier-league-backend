<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premier League Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; padding: 0; }
        .form-box { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <script type="text/babel">
        const { useState, useEffect } = React;
        
        // Icons
        const RefreshCw = ({ className, spinning }) => (
            <svg className={className + (spinning ? ' animate-spin' : '')} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
        );
        
        const Trophy = ({ className }) => (
            <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
        );
        
        const Calendar = ({ className }) => (
            <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
        );
        
        const TrendingUp = ({ className }) => (
            <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
            </svg>
        );
        
        const ChevronDown = ({ className }) => (
            <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
            </svg>
        );

        const Target = ({ className }) => (
            <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
            </svg>
        );

        const PremierLeagueApp = () => {
            const [activeTab, setActiveTab] = useState('standings');
            const [standings, setStandings] = useState([]);
            const [allMatches, setAllMatches] = useState([]);
            const [teams, setTeams] = useState([]);
            const [scorers, setScorers] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);
            const [lastUpdate, setLastUpdate] = useState(null);
            const [backendUrl, setBackendUrl] = useState('https://premier-league-backend.onrender.com');
            const [backendStatus, setBackendStatus] = useState('checking');
            const [expandedTeam, setExpandedTeam] = useState(null);
            const [expandedMatch, setExpandedMatch] = useState(null);
            const [currentSeason, setCurrentSeason] = useState('');

            const checkBackend = async () => {
                try {
                    setBackendStatus('checking');
                    const response = await fetch(`${backendUrl}/api/health`);
                    const data = await response.json();
                    if (data.status === 'OK') {
                        setBackendStatus('connected');
                        return true;
                    }
                    setBackendStatus('disconnected');
                    return false;
                } catch (error) {
                    setBackendStatus('disconnected');
                    return false;
                }
            };

            const fetchStandings = async () => {
                try {
                    const response = await fetch(`${backendUrl}/api/standings`);
                    const data = await response.json();
                    
                    if (data.standings && data.standings[0]) {
                        setStandings(data.standings[0].table);
                        if (data.season) {
                            setCurrentSeason(`${data.season.startDate.slice(0,4)}-${data.season.endDate.slice(0,4)}`);
                        }
                        setError(null);
                        return true;
                    }
                    return false;
                } catch (err) {
                    console.error('Error fetching standings:', err);
                    setError('Cannot connect to backend. Make sure server is running.');
                    return false;
                }
            };

            const fetchMatches = async () => {
                try {
                    const response = await fetch(`${backendUrl}/api/matches`);
                    const data = await response.json();
                    
                    if (data.matches) {
                        setAllMatches(data.matches);
                        return true;
                    }
                    return false;
                } catch (err) {
                    console.error('Error fetching matches:', err);
                    return false;
                }
            };

            const fetchTeams = async () => {
                try {
                    const response = await fetch(`${backendUrl}/api/teams`);
                    const data = await response.json();
                    
                    if (data.teams) {
                        setTeams(data.teams);
                        return true;
                    }
                    return false;
                } catch (err) {
                    console.error('Error fetching teams:', err);
                    return false;
                }
            };

            const fetchScorers = async () => {
                try {
                    const response = await fetch(`${backendUrl}/api/scorers`);
                    const data = await response.json();
                    
                    if (data.scorers) {
                        setScorers(data.scorers.slice(0, 20));
                        return true;
                    }
                    return false;
                } catch (err) {
                    console.error('Error fetching scorers:', err);
                    return false;
                }
            };

            const loadData = async () => {
                setLoading(true);
                setError(null);
                
                const backendOk = await checkBackend();
                if (!backendOk) {
                    setError('Backend not responding. Wait 60 seconds for Render to wake up.');
                    setLoading(false);
                    return;
                }
                
                await Promise.all([
                    fetchStandings(),
                    fetchMatches(),
                    fetchTeams(),
                    fetchScorers()
                ]);
                
                setLastUpdate(new Date());
                setLoading(false);
            };

            useEffect(() => {
                loadData();
                const interval = setInterval(loadData, 300000);
                return () => clearInterval(interval);
            }, [backendUrl]);

            const formatDate = (dateStr) => {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            };

            const formatTime = (dateStr) => {
                const date = new Date(dateStr);
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            };

            const getTeamLogo = (teamId) => {
                const team = teams.find(t => t.id === teamId);
                return team?.crest || '';
            };

            const getTeamName = (teamId) => {
                const team = teams.find(t => t.id === teamId);
                return team?.shortName || team?.name || '';
            };

            const getTeamMatches = (teamId) => {
                return allMatches
                    .filter(m => 
                        m.status === 'FINISHED' && 
                        (m.homeTeam.id === teamId || m.awayTeam.id === teamId)
                    )
                    .slice(0, 5);
            };

            const getFormGuide = (teamId) => {
                const matches = getTeamMatches(teamId).reverse();
                return matches.map(match => {
                    const isHome = match.homeTeam.id === teamId;
                    const teamScore = isHome ? match.score.fullTime.home : match.score.fullTime.away;
                    const oppScore = isHome ? match.score.fullTime.away : match.score.fullTime.home;
                    
                    if (teamScore > oppScore) return 'W';
                    if (teamScore < oppScore) return 'L';
                    return 'D';
                });
            };

            const getUpcomingMatches = () => {
                return allMatches.filter(m => m.status === 'TIMED' || m.status === 'SCHEDULED').slice(0, 15);
            };

            const getRecentMatches = () => {
                return allMatches.filter(m => m.status === 'FINISHED').slice(0, 20);
            };

            const getHeadToHead = (team1Id, team2Id) => {
                return allMatches
                    .filter(m => 
                        m.status === 'FINISHED' &&
                        ((m.homeTeam.id === team1Id && m.awayTeam.id === team2Id) ||
                         (m.homeTeam.id === team2Id && m.awayTeam.id === team1Id))
                    )
                    .slice(0, 5);
            };

            return (
                <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
                    {/* Header */}
                    <div className="bg-purple-950 text-white p-3 shadow-lg sticky top-0 z-10">
                        <div className="flex justify-between items-center max-w-7xl mx-auto">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5" />
                                <h1 className="text-lg font-bold">Premier League {currentSeason}</h1>
                            </div>
                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className="w-4 h-4" spinning={loading} />
                                <span className="text-sm">Refresh</span>
                            </button>
                        </div>
                        
                        <div className="max-w-7xl mx-auto mt-2 flex items-center justify-center gap-2 text-xs">
                            <span className="text-purple-300">Backend:</span>
                            <span className={`px-2 py-0.5 rounded ${
                                backendStatus === 'connected' ? 'bg-green-500/30 text-green-200' :
                                backendStatus === 'disconnected' ? 'bg-red-500/30 text-red-200' :
                                'bg-yellow-500/30 text-yellow-200'
                            }`}>
                                {backendStatus === 'connected' ? 'Connected (Football-Data.org)' : 
                                 backendStatus === 'disconnected' ? 'Disconnected' : 
                                 'Checking...'}
                            </span>
                        </div>
                        
                        {lastUpdate && (
                            <div className="text-xs text-purple-300 text-center mt-1">
                                Updated: {lastUpdate.toLocaleTimeString()}
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="bg-purple-900 border-b border-purple-700">
                        <div className="max-w-7xl mx-auto flex">
                            {['standings', 'fixtures', 'scorers'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                                        activeTab === tab
                                            ? 'bg-purple-800 text-white border-b-2 border-white'
                                            : 'text-purple-200 hover:bg-purple-800'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {tab === 'standings' && <TrendingUp className="w-4 h-4" />}
                                        {tab === 'fixtures' && <Calendar className="w-4 h-4" />}
                                        {tab === 'scorers' && <Target className="w-4 h-4" />}
                                        <span className="capitalize">{tab}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-w-7xl mx-auto p-3">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-3 text-white text-sm">
                                {error}
                            </div>
                        )}

                        {loading && !standings.length ? (
                            <div className="text-white text-center py-12">
                                <RefreshCw className="w-8 h-8 mx-auto mb-2" spinning={true} />
                                <div>Loading Premier League data...</div>
                                <div className="text-xs text-purple-300 mt-2">Using Football-Data.org API</div>
                            </div>
                        ) : (
                            <>
                                {/* STANDINGS TAB */}
                                {activeTab === 'standings' && standings.length > 0 && (
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                                        <div className="bg-purple-900/50 text-white text-xs font-semibold border-b border-purple-700">
                                            <div className="grid grid-cols-12 gap-2 px-3 py-2">
                                                <div className="col-span-1 text-center">#</div>
                                                <div className="col-span-4">Team</div>
                                                <div className="col-span-2 text-center">Form</div>
                                                <div className="col-span-1 text-center">P</div>
                                                <div className="col-span-1 text-center">W</div>
                                                <div className="col-span-1 text-center">D</div>
                                                <div className="col-span-1 text-center">L</div>
                                                <div className="col-span-1 text-center font-bold">Pts</div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            {standings.map((team, idx) => {
                                                const isExpanded = expandedTeam === team.team.id;
                                                const form = getFormGuide(team.team.id);
                                                const recentMatches = getTeamMatches(team.team.id);
                                                
                                                return (
                                                    <div key={idx}>
                                                        <div 
                                                            onClick={() => setExpandedTeam(isExpanded ? null : team.team.id)}
                                                            className="grid grid-cols-12 gap-2 px-3 py-2.5 text-white text-sm border-b border-purple-800/30 items-center hover:bg-white/10 cursor-pointer"
                                                        >
                                                            <div className={`col-span-1 text-center font-bold ${
                                                                team.position <= 4 ? 'text-green-400' : 
                                                                team.position === 5 ? 'text-blue-400' :
                                                                team.position >= 18 ? 'text-red-400' : 'text-purple-300'
                                                            }`}>
                                                                {team.position}
                                                            </div>
                                                            <div className="col-span-4 flex items-center gap-2">
                                                                {team.team.crest && (
                                                                    <img 
                                                                        src={team.team.crest} 
                                                                        alt={team.team.name}
                                                                        className="w-5 h-5 object-contain flex-shrink-0"
                                                                    />
                                                                )}
                                                                <span className="truncate text-xs">{team.team.shortName || team.team.name}</span>
                                                                <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </div>
                                                            <div className="col-span-2 flex gap-0.5 justify-center">
                                                                {form.map((result, i) => (
                                                                    <div 
                                                                        key={i}
                                                                        className={`form-box ${
                                                                            result === 'W' ? 'bg-green-500' :
                                                                            result === 'D' ? 'bg-yellow-500' :
                                                                            'bg-red-500'
                                                                        }`}
                                                                    >
                                                                        {result}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="col-span-1 text-center text-purple-200 text-xs">{team.playedGames}</div>
                                                            <div className="col-span-1 text-center text-xs">{team.won}</div>
                                                            <div className="col-span-1 text-center text-xs">{team.draw}</div>
                                                            <div className="col-span-1 text-center text-xs">{team.lost}</div>
                                                            <div className="col-span-1 text-center font-bold text-xs">{team.points}</div>
                                                        </div>
                                                        
                                                        {isExpanded && (
                                                            <div className="bg-purple-900/30 px-3 py-3 border-b border-purple-800/30">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <div className="text-xs text-purple-300 mb-2 font-semibold">Last 5 Matches:</div>
                                                                        <div className="space-y-2">
                                                                            {recentMatches.map((match, mIdx) => (
                                                                                <div key={mIdx} className="text-xs text-white bg-white/5 rounded px-3 py-2">
                                                                                    <div className="text-purple-300 mb-1">{formatDate(match.utcDate)}</div>
                                                                                    <div className="flex justify-between">
                                                                                        <span className={match.homeTeam.id === team.team.id ? 'font-bold' : ''}>
                                                                                            {match.homeTeam.shortName}
                                                                                        </span>
                                                                                        <span className="font-bold text-yellow-400">
                                                                                            {match.score.fullTime.home} - {match.score.fullTime.away}
                                                                                        </span>
                                                                                        <span className={match.awayTeam.id === team.team.id ? 'font-bold' : ''}>
                                                                                            {match.awayTeam.shortName}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div>
                                                                        <div className="text-xs text-purple-300 mb-2 font-semibold">Season Stats:</div>
                                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                                            <div className="bg-white/5 rounded px-3 py-2">
                                                                                <div className="text-purple-300">Goals For</div>
                                                                                <div className="font-bold text-lg">{team.goalsFor}</div>
                                                                            </div>
                                                                            <div className="bg-white/5 rounded px-3 py-2">
                                                                                <div className="text-purple-300">Goals Against</div>
                                                                                <div className="font-bold text-lg">{team.goalsAgainst}</div>
                                                                            </div>
                                                                            <div className="bg-white/5 rounded px-3 py-2">
                                                                                <div className="text-purple-300">Goal Difference</div>
                                                                                <div className="font-bold text-lg">{team.goalDifference > 0 ? '+' : ''}{team.goalDifference}</div>
                                                                            </div>
                                                                            <div className="bg-white/5 rounded px-3 py-2">
                                                                                <div className="text-purple-300">Win Rate</div>
                                                                                <div className="font-bold text-lg">
                                                                                    {team.playedGames > 0 ? Math.round((team.won / team.playedGames) * 100) : 0}%
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* FIXTURES TAB */}
                                {activeTab === 'fixtures' && (
                                    <div className="space-y-4">
                                        {/* Upcoming */}
                
