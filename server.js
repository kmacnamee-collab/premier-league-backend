import React, { useState, useEffect } from 'react';
import { RefreshCw, Trophy, Calendar, TrendingUp, Server, History } from 'lucide-react';

const PremierLeagueApp = () => {
  const [activeTab, setActiveTab] = useState('standings');
  const [standings, setStandings] = useState([]);
  const [games, setGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState('http://localhost:3001');
  const [backendStatus, setBackendStatus] = useState('checking');

  const checkBackend = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/health`);
      const data = await response.json();
      if (data.status === 'OK') {
        setBackendStatus('connected');
        return true;
      }
    } catch (error) {
      setBackendStatus('disconnected');
      return false;
    }
  };

  const fetchStandings = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/standings`);
      const data = await response.json();
      if (data.table) {
        setStandings(data.table);
        setError(null);
        return true;
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Cannot connect to backend. Make sure server is running.');
      return false;
    }
  };

  const fetchGames = async () => {
    try {
      const [recent, upcoming] = await Promise.all([
        fetch(`${backendUrl}/api/games`).then(r => r.json()),
        fetch(`${backendUrl}/api/games/upcoming`).then(r => r.json())
      ]);
      
      if (recent.events) setGames(recent.events.slice(0, 15));
      if (upcoming.events) setUpcomingGames(upcoming.events.slice(0, 10));
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const fetchHistoricalStandings = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/standings/history`);
      const data = await response.json();
      
      // Process data to track each team's points across seasons
      const teamHistory = {};
      
      data.forEach(({ season, data: standings }) => {
        if (standings && standings.length > 0) {
          standings.forEach(team => {
            if (!teamHistory[team.strTeam]) {
              teamHistory[team.strTeam] = [];
            }
            teamHistory[team.strTeam].push({
              season,
              points: parseInt(team.intPoints) || 0,
              position: parseInt(team.intRank) || 0,
              played: parseInt(team.intPlayed) || 0
            });
          });
        }
      });
      
      setHistoricalData(teamHistory);
      return true;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    const backendOk = await checkBackend();
    if (!backendOk) {
      setError('Backend server not running. Please start with: npm start');
      setLoading(false);
      return;
    }
    
    await Promise.all([
      fetchStandings(),
      fetchGames(),
      fetchHistoricalStandings()
    ]);
    
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get top teams based on total points across all seasons
  const getTopTeamsOverTime = () => {
    const teamTotals = Object.entries(historicalData).map(([team, seasons]) => {
      const totalPoints = seasons.reduce((sum, s) => sum + s.points, 0);
      const avgPosition = seasons.reduce((sum, s) => sum + s.position, 0) / seasons.length;
      return { team, totalPoints, avgPosition, seasons };
    });
    
    return teamTotals.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Header */}
      <div className="bg-purple-950 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <h1 className="text-xl font-bold">Premier League</h1>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
        
        <div className="max-w-4xl mx-auto mt-2 flex items-center justify-center gap-2 text-xs">
          <Server className="w-3 h-3" />
          <span className="text-purple-300">Backend:</span>
          <span className={`px-2 py-0.5 rounded ${
            backendStatus === 'connected' ? 'bg-green-500/30 text-green-200' :
            backendStatus === 'disconnected' ? 'bg-red-500/30 text-red-200' :
            'bg-yellow-500/30 text-yellow-200'
          }`}>
            {backendStatus === 'connected' ? 'Connected' : 
             backendStatus === 'disconnected' ? 'Disconnected' : 
             'Checking...'}
          </span>
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="ml-2 text-purple-300 hover:text-white text-xs underline"
          >
            Change URL
          </button>
        </div>
        
        {showUrlInput && (
          <div className="max-w-4xl mx-auto mt-2 flex items-center justify-center gap-2">
            <input
              type="text"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://your-app.onrender.com"
              className="bg-purple-900 text-white px-3 py-1 rounded text-xs border border-purple-700 flex-1 max-w-xs"
            />
            <button
              onClick={() => {
                setBackendUrl(tempUrl);
                setShowUrlInput(false);
                setTimeout(loadData, 100);
              }}
              className="bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded text-xs"
            >
              Update
            </button>
          </div>
        )}
        
        {lastUpdate && (
          <div className="text-xs text-purple-300 text-center mt-1">
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-purple-900 border-b border-purple-700">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'standings'
                ? 'bg-purple-800 text-white border-b-2 border-white'
                : 'text-purple-200 hover:bg-purple-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Standings
            </div>
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'games'
                ? 'bg-purple-800 text-white border-b-2 border-white'
                : 'text-purple-200 hover:bg-purple-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              Fixtures
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-purple-800 text-white border-b-2 border-white'
                : 'text-purple-200 hover:bg-purple-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <History className="w-4 h-4" />
              History
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4 text-white">
            <div className="font-semibold mb-2">Setup Required</div>
            <div className="text-sm mb-3">{error}</div>
            <div className="text-xs bg-black/30 p-3 rounded font-mono">
              <div>1. Save server.js and package.json</div>
              <div>2. Run: npm install</div>
              <div>3. Run: npm start</div>
            </div>
          </div>
        )}

        {loading && !standings.length ? (
          <div className="text-white text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <div>Loading Premier League data...</div>
          </div>
        ) : (
          <>
            {/* Current Standings */}
            {activeTab === 'standings' && (
              <div className="space-y-3">
                {standings.map((team, idx) => (
                  <div
                    key={idx}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white hover:bg-white/20 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`text-2xl font-bold w-8 ${
                          idx < 4 ? 'text-green-400' : 
                          idx < 5 ? 'text-blue-400' :
                          idx >= 17 ? 'text-red-400' : 'text-purple-300'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{team.strTeam}</div>
                          <div className="text-xs text-purple-200 mt-1">
                            {team.intPlayed} matches played
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{team.intPoints} pts</div>
                        <div className="text-sm text-purple-200">
                          {team.intWin}W {team.intDraw}D {team.intLoss}L
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/20 flex justify-around text-sm">
                      <div>
                        <div className="text-purple-300 text-xs">GF</div>
                        <div className="font-semibold">{team.intGoalsFor}</div>
                      </div>
                      <div>
                        <div className="text-purple-300 text-xs">GA</div>
                        <div className="font-semibold">{team.intGoalsAgainst}</div>
                      </div>
                      <div>
                        <div className="text-purple-300 text-xs">GD</div>
                        <div className="font-semibold">
                          {(team.intGoalsFor - team.intGoalsAgainst) > 0 ? '+' : ''}
                          {team.intGoalsFor - team.intGoalsAgainst}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Games Tab */}
            {activeTab === 'games' && (
              <div className="space-y-4">
                {upcomingGames.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Upcoming Fixtures
                    </h3>
                    <div className="space-y-3">
                      {upcomingGames.map((game, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                          <div className="text-xs text-purple-300 mb-2">
                            {formatDate(game.dateEvent)} • {formatTime(game.strTime)}
                          </div>
                          <div className="font-medium text-center">
                            {game.strHomeTeam} vs {game.strAwayTeam}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {games.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3 mt-6">Recent Results</h3>
                    <div className="space-y-3">
                      {games.map((game, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                          <div className="text-xs text-purple-300 mb-2">
                            {formatDate(game.dateEvent)}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="font-medium">{game.strHomeTeam}</div>
                              <div className="text-2xl font-bold">{game.intHomeScore}</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="font-medium">{game.strAwayTeam}</div>
                              <div className="text-2xl font-bold">{game.intAwayScore}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Historical Standings */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <div className="text-white text-sm mb-4 bg-white/10 p-3 rounded-lg">
                  Total points accumulated across last 5 seasons (2020-2025)
                </div>
                {getTopTeamsOverTime().map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white hover:bg-white/20 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl font-bold text-purple-300 w-8">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{item.team}</div>
                          <div className="text-xs text-purple-200">
                            Avg Position: {item.avgPosition.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-yellow-400">
                          {item.totalPoints}
                        </div>
                        <div className="text-xs text-purple-200">total points</div>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {item.seasons.map((s, i) => (
                        <div
                          key={i}
                          className="bg-white/10 rounded px-3 py-2 min-w-fit"
                        >
                          <div className="text-xs text-purple-300">{s.season}</div>
                          <div className="font-semibold">{s.points} pts</div>
                          <div className="text-xs text-purple-200">#{s.position}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PremierLeagueApp;
