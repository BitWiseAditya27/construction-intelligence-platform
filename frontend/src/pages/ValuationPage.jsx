import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  MapPin,
  Building,
  Check,
  Info,
  DollarSign,
  Layers,
  Sparkles,
  HelpCircle,
  Loader2,
  Save,
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { useProject } from '../context/ProjectContext';

const AMENITY_OPTIONS = [
  '24/7 Security & CCTV',
  'Covered Parking',
  'Clubhouse & Gym',
  'Swimming Pool',
  '100% Power Backup',
  'Solar Water Heating',
  'Rainwater Harvesting',
  'EV Charging Bay',
  'Private Garden / Terrace',
  'Smart Home Automation'
];

export const ValuationPage = () => {
  const { activeProject } = useProject();

  const [location, setLocation] = useState(activeProject?.location || 'Worli, Mumbai');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [builtUpArea, setBuiltUpArea] = useState('1850');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('3');
  const [ageYears, setAgeYears] = useState('2');
  const [floorNumber, setFloorNumber] = useState('14');
  const [condition, setCondition] = useState('Excellent');
  const [currency, setCurrency] = useState('INR');
  const [selectedAmenities, setSelectedAmenities] = useState([
    '24/7 Security & CCTV',
    'Covered Parking',
    'Clubhouse & Gym',
    '100% Power Backup'
  ]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleEstimate = async (e) => {
    e.preventDefault();
    if (!location.trim()) {
      setError('Please provide a property location / city.');
      return;
    }
    const areaNum = parseFloat(builtUpArea);
    if (!areaNum || areaNum <= 0) {
      setError('Please enter a valid built-up area in square feet.');
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const payload = {
        location: location.trim(),
        property_type: propertyType,
        built_up_area: areaNum,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        age_years: ageYears ? parseFloat(ageYears) : 0,
        floor_number: floorNumber ? parseInt(floorNumber) : null,
        amenities: selectedAmenities,
        condition: condition,
        currency: currency,
        project_id: activeProject?.id || null,
      };

      const res = await apiClient.estimateValuation(payload);
      setResult(res);
      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Valuation estimation failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (val, curr) => {
    if (val === undefined || val === null) return '0';
    if (curr === 'INR') {
      if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} Lakh`;
      return `₹ ${val.toLocaleString('en-IN')}`;
    }
    return `${curr} ${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              Real Estate Valuation & Pricing Intelligence
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Parametric property pricing models calibrated with structural conditions and amenities stack.
            </p>
          </div>
        </div>
      </div>

      <DisclaimerBanner
        isDemoMode={result?.is_demo_mode}
        text="TRANSPARENT VALUATION NOTICE: This estimate is computed using transparent rule-based econometric baselines. It does NOT constitute an official bank appraisal, government guideline circle rate, or legal transaction deed."
      />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Form & Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleEstimate} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" /> Property Specifications
            </h2>

            {/* Location & Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location / City / Locality <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bandra, Mumbai or Whitefield, Bengaluru"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
            </div>

            {/* Property Type & Built-up Area */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Apartment">Apartment / High-rise</option>
                  <option value="Villa">Gated Villa / Independent</option>
                  <option value="Independent House">Independent Row House</option>
                  <option value="Commercial">Commercial Office / Retail</option>
                  <option value="Plot">Plotted Development</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Built-up Area (sq ft) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="number"
                  value={builtUpArea}
                  onChange={(e) => setBuiltUpArea(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            {/* Beds, Baths, Age, Floor */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Bedrooms</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Bathrooms</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Age (Yrs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={ageYears}
                  onChange={(e) => setAgeYears(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Floor #</label>
                <input
                  type="number"
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Structural & Interior Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="New">Brand New / Under Construction</option>
                <option value="Excellent">Excellent Condition (Pristine)</option>
                <option value="Good">Good / Well Maintained</option>
                <option value="Fair">Fair / Minor Wear</option>
                <option value="Needs Renovation">Needs Substantial Renovation</option>
              </select>
            </div>

            {/* Amenities Checklist */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Amenities & Building Features ({selectedAmenities.length} selected)
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {AMENITY_OPTIONS.map((item) => {
                  const active = selectedAmenities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAmenity(item)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-left flex items-center justify-between border transition-all ${
                        active
                          ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{item}</span>
                      {active && <Check className="w-3 h-3 text-amber-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating Benchmark Valuation...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Estimate Property Value
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Results */}
        <div className="lg:col-span-7 space-y-5">
          {result ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-5 backdrop-blur-sm animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">
                      Valuation Summary: {result.location}
                    </h2>
                    {savedSuccess && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <Save className="w-3 h-3" /> Saved to History
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {result.property_type} • {result.built_up_area.toLocaleString()} sq ft
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">
                    Calibrated Rate
                  </span>
                  <span className="text-sm font-bold text-amber-400">
                    {result.currency} {result.price_per_sqft.toLocaleString()} / sqft
                  </span>
                </div>
              </div>

              {/* Valuation Band Card */}
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-5 text-center shadow-lg">
                <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase">
                  Central Baseline Estimate
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-100 mt-1">
                  {formatPrice(result.estimated_mid_value, result.currency)}
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
                  <span>
                    Range Lower Bound:{' '}
                    <strong className="text-slate-200">
                      {formatPrice(result.estimated_min_value, result.currency)}
                    </strong>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span>
                    Range Upper Bound:{' '}
                    <strong className="text-slate-200">
                      {formatPrice(result.estimated_max_value, result.currency)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Contributing Factors */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Key Value Drivers & Micro-Market Multipliers
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.factors?.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Methodological Assumptions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Econometric Assumptions Made
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {result.assumptions?.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 p-1.5 text-[11px]">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Additional Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Data Points to Refine Valuation Precision
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  {result.suggested_additional_info?.map((item, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence Limitations */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{result.confidence_limitations}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-500 mb-3">
                <Calculator className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">No Valuation Generated</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Enter property parameters on the left to generate an explainable pricing estimate and benchmark report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValuationPage;
