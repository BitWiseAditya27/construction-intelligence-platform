import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Thermometer,
  Wind,
  Droplets,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Search,
  Sliders,
  MapPin,
  Clock,
  Loader2,
  HardHat,
  Info
} from 'lucide-react';
import { apiClient } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { useProject } from '../context/ProjectContext';

const ACTIVITIES = [
  'Concrete Pouring',
  'Exterior Painting',
  'Excavation & Shoring',
  'Crane Operations & High Picks',
  'Roofing & Membrane Waterproofing',
  'Masonry Blockwork',
  'Outdoor Scaffolding Erection'
];

export const WeatherAdvisoryPage = () => {
  const { activeProject } = useProject();

  const [location, setLocation] = useState(activeProject?.location || 'Mumbai');
  const [activity, setActivity] = useState('Concrete Pouring');
  const [manualMode, setManualMode] = useState(false);

  // Manual simulation state
  const [simTemp, setSimTemp] = useState(36);
  const [simHumidity, setSimHumidity] = useState(72);
  const [simWind, setSimWind] = useState(24);
  const [simPrecip, setSimPrecip] = useState(45);
  const [simCondition, setSimCondition] = useState('Scattered Thundershowers');

  const [loading, setLoading] = useState(false);
  const [advisory, setAdvisory] = useState(null);
  const [error, setError] = useState(null);

  const fetchAdvisory = async () => {
    setLoading(true);
    setError(null);

    try {
      if (manualMode) {
        const payload = {
          location: location.trim() || 'Custom Site',
          activity: activity,
          manual_override: {
            temperature_c: parseFloat(simTemp),
            humidity_percent: parseInt(simHumidity),
            wind_speed_kmh: parseFloat(simWind),
            condition: simCondition,
            precipitation_probability: parseInt(simPrecip)
          }
        };
        const res = await apiClient.postWeatherAdvisory(payload);
        setAdvisory(res);
      } else {
        const res = await apiClient.getWeatherAdvisory(location.trim() || 'Mumbai', activity);
        setAdvisory(res);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to fetch weather advisory. Please check connectivity or enable Manual Simulation Mode.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisory();
  }, [activity, manualMode]);

  const getStatusBadge = (status) => {
    if (status === 'optimal') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-4 h-4" /> Operational: Optimal Window
        </span>
      );
    }
    if (status === 'caution') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-4 h-4" /> Operational: Cautionary Safeguards Required
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
        <AlertOctagon className="w-4 h-4" /> Operational: Adverse Weather Risk
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              Weather-Aware Construction Advisory
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Live meteorological intelligence mapped against engineering workability thresholds.
            </p>
          </div>
        </div>
      </div>

      <DisclaimerBanner text="SUPPLEMENTARY ADVISORY NOTICE: Weather assessments are predictive models intended for preliminary work scheduling. Certified site supervisor safety determinations and real-time on-site anemometer readings take precedence." />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setManualMode(true)} className="text-amber-400 underline font-semibold ml-4">
            Switch to Simulation Mode
          </button>
        </div>
      )}

      {/* Main Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-400" /> Activity & Location
              </h2>
              {/* Simulation Mode Toggle */}
              <button
                type="button"
                onClick={() => setManualMode(!manualMode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
                  manualMode
                    ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3 h-3" />
                {manualMode ? 'Simulation: ON' : 'Simulation: OFF'}
              </button>
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Job Site Location</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter city (e.g. Mumbai, Bengaluru, London)"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <button
                  onClick={fetchAdvisory}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Planned Activity Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Planned Construction Operation
              </label>
              <div className="space-y-1.5">
                {ACTIVITIES.map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setActivity(act)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                      activity === act
                        ? 'border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span>{act}</span>
                    {activity === act && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Simulation Controls (Shown when simulation is active) */}
            {manualMode && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 bg-amber-950/10 p-3 rounded-xl border border-amber-500/20">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Manual Weather Simulation Controls
                </span>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Temperature: {simTemp}°C</span>
                    <span className="text-slate-400">{simTemp > 35 ? 'Hot Weather' : simTemp < 5 ? 'Cold Weather' : 'Moderate'}</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="48"
                    value={simTemp}
                    onChange={(e) => setSimTemp(e.target.value)}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Relative Humidity: {simHumidity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={simHumidity}
                    onChange={(e) => setSimHumidity(e.target.value)}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Wind Velocity: {simWind} km/h</span>
                    <span className="text-slate-400">{simWind > 38 ? 'High Crane Risk' : 'Normal'}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="65"
                    value={simWind}
                    onChange={(e) => setSimWind(e.target.value)}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Precipitation Risk: {simPrecip}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simPrecip}
                    onChange={(e) => setSimPrecip(e.target.value)}
                    className="w-full accent-amber-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={fetchAdvisory}
                  className="w-full py-1.5 px-3 rounded-lg bg-amber-600 text-slate-950 font-bold text-xs hover:bg-amber-500"
                >
                  Apply Simulated Parameters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Output Advisory Card */}
        <div className="lg:col-span-7 space-y-4">
          {advisory ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-5 backdrop-blur-sm animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">{advisory.location}</h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {advisory.is_live_data ? 'Live Open-Meteo Feed' : 'Manual Simulation'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Observation Time: {advisory.observation_time}
                  </p>
                </div>
                <div>{getStatusBadge(advisory.operational_status)}</div>
              </div>

              {/* Weather Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Thermometer className="w-4 h-4 text-amber-400" /> Temperature
                  </div>
                  <p className="text-xl font-bold text-slate-100 mt-1">{advisory.temperature_c}°C</p>
                  <span className="text-[10px] text-slate-400">{advisory.condition}</span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Droplets className="w-4 h-4 text-sky-400" /> Humidity
                  </div>
                  <p className="text-xl font-bold text-slate-100 mt-1">{advisory.humidity_percent}%</p>
                  <span className="text-[10px] text-slate-400">Relative moisture</span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Wind className="w-4 h-4 text-teal-400" /> Wind Velocity
                  </div>
                  <p className="text-xl font-bold text-slate-100 mt-1">{advisory.wind_speed_kmh} km/h</p>
                  <span className="text-[10px] text-slate-400">At 10m height</span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <CloudRain className="w-4 h-4 text-indigo-400" /> Rain Probability
                  </div>
                  <p className="text-xl font-bold text-slate-100 mt-1">{advisory.precipitation_probability}%</p>
                  <span className="text-[10px] text-slate-400">Forecast probability</span>
                </div>
              </div>

              {/* Advisory Summary Banner */}
              <div
                className={`p-4 rounded-xl border text-xs font-medium leading-relaxed ${
                  advisory.operational_status === 'optimal'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : advisory.operational_status === 'caution'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                    : 'border-red-500/30 bg-red-950/30 text-red-200'
                }`}
              >
                <strong>Operational Assessment for {advisory.activity}:</strong> {advisory.advisory_summary}
              </div>

              {/* Weather Hazards Detected */}
              {advisory.weather_hazards && advisory.weather_hazards.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Identified Atmospheric Hazards
                  </h3>
                  <div className="space-y-1.5">
                    {advisory.weather_hazards.map((hz, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-red-300 flex items-start gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{hz}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Engineering Recommendations */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Targeted Engineering Recommendations
                </h3>
                <div className="space-y-2">
                  {advisory.specific_recommendations?.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-500 mb-3">
                <CloudSun className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">Loading Weather Intelligence</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Enter site location and select planned trade activity to evaluate workability windows.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherAdvisoryPage;
