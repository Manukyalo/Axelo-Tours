"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, Bus, MapPin, Bed, FileText, Plus, X, 
  Sparkles, RefreshCw, AlertTriangle, CheckCircle2, ChevronRight, Save
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Types based on the DB schema
type ParkFee = {
  id: string; park_name: string; destination: string; client_type: string;
  fee_usd: number; fee_kes: number; season: string;
};

type Property = {
  id: string; name: string; destination: string;
};

type LineItem = { id: string; name: string; amount: number; };

export default function CostingAgentPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  // Data references
  const [parkFeesList, setParkFeesList] = useState<ParkFee[]>([]);
  const [propertiesList, setPropertiesList] = useState<Property[]>([]);

  // State: Trip
  const [destination, setDestination] = useState("Maasai Mara");
  const [selectedParkId, setSelectedParkId] = useState("");
  const [durationDays, setDurationDays] = useState(3);
  const [durationNights, setDurationNights] = useState(2);
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [clientType, setClientType] = useState("non_resident");
  
  // State: Accommodation
  const [lodgeTier, setLodgeTier] = useState("mid_range");
  const [propertyId, setPropertyId] = useState("");
  const [mealPlan, setMealPlan] = useState("FB");
  const [ratePerPersonNight, setRatePerPersonNight] = useState(0);
  const [season, setSeason] = useState("high");
  
  // State: Transport
  const [transportType, setTransportType] = useState("road");
  const [transportKm, setTransportKm] = useState(0);
  const [transportCharterUsd, setTransportCharterUsd] = useState(0);
  const [driverDays, setDriverDays] = useState(3);
  
  // State: Additional Costs
  const [additionalCosts, setAdditionalCosts] = useState<LineItem[]>([
    { id: "guide", name: "Guide Allowance (USD)", amount: 20 },
    { id: "airstrip", name: "Airstrip Fees (USD)", amount: 40 }
  ]);
  
  // State: Margins
  const [b2cMarginPct, setB2cMarginPct] = useState(25);
  const [b2bMarginPct, setB2bMarginPct] = useState(12);

  // State: AI Analysis
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<{ isCompetitive?: boolean; missingCosts?: string[]; recommendations?: string[] } | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      // Fetch parks
      const { data: pfees } = await supabase.from('park_fees').select('*');
      if (pfees) setParkFeesList(pfees);
      if (pfees && pfees.length > 0) setSelectedParkId(pfees[0].id);

      // Fetch properties
      const { data: props } = await supabase.from('properties').select('id, name, destination');
      if (props) setPropertiesList(props);
      
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  // Derived properties filtered by destination
  const filteredProperties = propertiesList.filter(p => p.destination === destination);

  // Auto-detect season based on current date
  useEffect(() => {
    const month = new Date().getMonth(); // 0-11
    // East Africa Seasons:
    // Peak: July, August, September, December
    // High: January, February, June, October
    // Low: March, April, May, November
    if ([6, 7, 8, 11].includes(month)) setSeason("peak");
    else if ([2, 3, 4, 10].includes(month)) setSeason("low");
    else setSeason("high");
  }, []);

  // Calculations
  const calcParkFees = () => {
    const park = parkFeesList.find(p => p.id === selectedParkId);
    if (!park) return 0;
    return park.fee_usd * durationDays * (numAdults + (numChildren * 0.5));
  };

  const calcAccommodation = () => {
    return ratePerPersonNight * durationNights * (numAdults + (numChildren * 0.5));
  };

  const calcTransport = () => {
    if (transportType === "road") {
      const roadUsd = (transportKm * 20) / 130;
      const driverUsd = driverDays * 20;
      return Math.round(roadUsd + driverUsd);
    } else if (transportType === "charter") {
      return transportCharterUsd;
    }
    return 0;
  };

  const calcAdditional = () => additionalCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const netTotalUsd = calcParkFees() + calcAccommodation() + calcTransport() + calcAdditional();
  const totalPax = numAdults + numChildren;
  
  const b2cTotalUsd = netTotalUsd / (1 - (b2cMarginPct / 100));
  const b2bTotalUsd = netTotalUsd / (1 - (b2bMarginPct / 100));
  const grossMarginUsd = b2cTotalUsd - netTotalUsd;

  const handleAddCost = () => {
    setAdditionalCosts([...additionalCosts, { id: Math.random().toString(), name: "Custom Line Item", amount: 0 }]);
  };
  const updateCost = (id: string, name: string, amount: number) => {
    setAdditionalCosts(additionalCosts.map(c => c.id === id ? { ...c, name, amount } : c));
  };
  const removeCost = (id: string) => {
    setAdditionalCosts(additionalCosts.filter(c => c.id !== id));
  };

  const runAiAnalysis = async () => {
    setAiAnalyzing(true);
    try {
      const payload = {
        destination,
        numAdults,
        numChildren,
        parkFees: calcParkFees(),
        accommodation: calcAccommodation(),
        transport: calcTransport(),
        netTotalUsd,
        b2cTotalUsd,
        grossMarginUsd
      };
      
      const res = await fetch('/api/costing/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setAiInsights(data);
    } catch (err) {
      console.error(err);
    }
    setAiAnalyzing(false);
  };

  const saveCostSheet = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('cost_sheets').insert([{
        title: `${destination} - ${numAdults} Pax`,
        destination,
        duration_days: durationDays,
        duration_nights: durationNights,
        num_adults: numAdults,
        num_children: numChildren,
        client_type: clientType,
        property_id: propertyId || null,
        lodge_tier: lodgeTier,
        meal_plan: mealPlan,
        rate_per_person_night: ratePerPersonNight,
        season,
        transport_type: transportType,
        transport_km: transportKm,
        transport_charter_usd: transportCharterUsd,
        driver_days: driverDays,
        additional_costs: additionalCosts,
        b2c_margin_pct: b2cMarginPct,
        b2b_margin_pct: b2bMarginPct,
        net_total_usd: netTotalUsd,
        b2c_per_person_usd: b2cTotalUsd / (totalPax || 1),
        b2b_per_person_usd: b2bTotalUsd / (totalPax || 1),
        gross_margin_usd: grossMarginUsd,
        status: 'saved'
      }]);

      if (error) throw error;
      alert("Cost sheet saved to Logistics Vault");
    } catch (err: any) {
      alert("Save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center">Loading Data Modules...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Tactical Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500/70">Financial Logistics Node</span>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tightest leading-none">
            Costing_Engine
          </h1>
          <p className="text-gray-400 mt-4 font-bold max-w-xl text-lg leading-relaxed opacity-70 italic">
            Dynamic live quoting with deep AI margin analysis and competitive risk scanning.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={runAiAnalysis} disabled={aiAnalyzing} className="h-14 px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] text-white font-black text-[11px] uppercase tracking-widest border-none shadow-2xl shadow-indigo-200 transition-all">
            {aiAnalyzing ? <RefreshCw className="w-5 h-5 mr-3 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3" />}
            AI_Margin_Audit
          </Button>
          <Button onClick={saveCostSheet} className="h-14 px-8 bg-gray-900 text-white hover:bg-black font-black text-[11px] uppercase tracking-widest border-none transition-all active:scale-[0.95] shadow-xl">
            <Save className="w-5 h-5 mr-3" /> Commit_To_Logistics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: Inputs */}
        <div className="lg:col-span-8 space-y-6">
            <SectionHeader icon={<MapPin className="text-blue-500 w-5 h-5"/>} title="TRIP_DEPLOYMENT_CONFIG" />
            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-8">
              <InputGroup label="Core Destination">
                <input value={destination} onChange={e => setDestination(e.target.value)} className="w-full px-5 py-4 border-gray-100 border rounded-2xl bg-gray-50/50 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              </InputGroup>
              <InputGroup label="Duration Day Cycle">
                <input type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} className="w-full px-5 py-4 border-gray-100 border rounded-2xl bg-gray-50/50 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              </InputGroup>
              <InputGroup label="Nights Log">
                <input type="number" value={durationNights} onChange={e => setDurationNights(Number(e.target.value))} className="w-full px-5 py-4 border-gray-100 border rounded-2xl bg-gray-50/50 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              </InputGroup>
              <InputGroup label="Demographic Node">
                <select value={clientType} onChange={e => setClientType(e.target.value)} className="w-full px-5 py-4 border-gray-100 border rounded-2xl bg-gray-50/50 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer">
                  <option value="non_resident">NON_RESIDENT</option>
                  <option value="resident">LOCAL_RESIDENT</option>
                  <option value="east_african">EAST_AFRICAN_EAC</option>
                </select>
              </InputGroup>
              
              <InputGroup label="Adult PAX">
                <input type="number" value={numAdults} onChange={e => setNumAdults(Number(e.target.value))} className="w-full px-5 py-4 border-gray-100 border rounded-2xl bg-gray-50/50 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              </InputGroup>
              <InputGroup label="Child PAX">
                <input type="number" value={numChildren} onChange={e => setNumChildren(Number(e.target.value))} className="w-full px-5 py-4 border-gray-100 border rounded-2xl bg-gray-50/50 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              </InputGroup>
              <InputGroup label="Park Intel (Reference)">
                <select value={selectedParkId} onChange={e => setSelectedParkId(e.target.value)} className="w-full px-5 py-4 border-gray-100 border rounded-2xl bg-gray-50/50 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all col-span-2 text-ellipsis overflow-hidden cursor-pointer">
                  {parkFeesList.map(p => <option key={p.id} value={p.id}>{p.park_name}::{p.client_type}::{p.season}</option>)}
                </select>
              </InputGroup>
            </div>

          <SectionHeader icon={<Bed className="text-orange-500 w-5 h-5"/>} title="Accommodation" />
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
            <InputGroup label="Property">
              <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20">
                <option value="">Select Property</option>
                {filteredProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </InputGroup>
            <InputGroup label="Tier">
              <select value={lodgeTier} onChange={e => setLodgeTier(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20">
                <option value="budget">Budget</option>
                <option value="mid_range">Mid-Range</option>
                <option value="luxury">Luxury</option>
                <option value="ultra_luxury">Ultra Luxury</option>
              </select>
            </InputGroup>
            <InputGroup label="Rate (PPP Night USD)">
              <input type="number" value={ratePerPersonNight} onChange={e => setRatePerPersonNight(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20" />
            </InputGroup>
             <InputGroup label="Meal Plan">
              <select value={mealPlan} onChange={e => setMealPlan(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20">
                <option value="BB">BB</option>
                <option value="HB">HB</option>
                <option value="FB">FB</option>
                <option value="AI">AI</option>
              </select>
            </InputGroup>
            <InputGroup label="Season">
              <select value={season} onChange={e => setSeason(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20">
                <option value="high">High</option>
                <option value="low">Low</option>
                <option value="peak">Peak</option>
              </select>
            </InputGroup>
          </div>

          <SectionHeader icon={<Bus className="text-green-500 w-5 h-5"/>} title="Transport" />
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-4">
             <InputGroup label="Type">
              <select value={transportType} onChange={e => setTransportType(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20">
                <option value="road">Road</option>
                <option value="charter">Charter</option>
                <option value="scheduled">Scheduled Flights</option>
              </select>
            </InputGroup>
            {transportType === "road" && (
              <>
                 <InputGroup label="Total Distance (KM)">
                  <input type="number" value={transportKm} onChange={e => setTransportKm(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20" />
                </InputGroup>
                 <InputGroup label="Driver Days">
                  <input type="number" value={driverDays} onChange={e => setDriverDays(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20" />
                </InputGroup>
              </>
            )}
            {transportType === "charter" && (
               <InputGroup label="Total Charter USD">
                  <input type="number" value={transportCharterUsd} onChange={e => setTransportCharterUsd(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20" />
                </InputGroup>
            )}
          </div>

          <SectionHeader icon={<FileText className="text-gray-500 w-5 h-5"/>} title="Additional Costs & Margins" />
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="space-y-3 mb-6">
              {additionalCosts.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <input value={c.name} onChange={e => updateCost(c.id, e.target.value, c.amount)} className="font-medium text-sm flex-1 px-3 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary/20" placeholder="Description" />
                  <input type="number" value={c.amount} onChange={e => updateCost(c.id, c.name, Number(e.target.value))} className="w-32 px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 font-mono" placeholder="USD" />
                  <button onClick={() => removeCost(c.id)} className="p-2 text-gray-400 hover:text-red-500"><X className="w-5 h-5"/></button>
                </div>
              ))}
              <button onClick={handleAddCost} className="text-xs font-bold text-primary flex items-center gap-1"><Plus className="w-3 h-3"/> Add Line Item</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
              <InputGroup label="B2C Margin (%)">
                  <input type="number" value={b2cMarginPct} onChange={e => setB2cMarginPct(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 font-bold text-lg text-primary" />
              </InputGroup>
              <InputGroup label="B2B Margin (%)">
                  <input type="number" value={b2bMarginPct} onChange={e => setB2bMarginPct(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 font-bold" />
              </InputGroup>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live Preview */}
        <div className="lg:col-span-4 space-y-6 lg:sticky top-6">
          <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Calculator className="w-32 h-32" />
            </div>
            
            <h3 className="text-gray-400 font-bold tracking-widest uppercase text-xs mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Cost Sheet
            </h3>

            <div className="space-y-4 mb-8">
              <PreviewRow label="Park Fees" value={calcParkFees()} />
              <PreviewRow label="Accommodation" value={calcAccommodation()} />
              <PreviewRow label="Transport" value={calcTransport()} />
              <PreviewRow label="Additional" value={calcAdditional()} />
            </div>

            <div className="pt-4 border-t border-gray-800 space-y-4">
              <PreviewRow label="Net Cost (USD)" value={netTotalUsd} isBold />
            </div>

            <div className="mt-8 bg-gray-800/50 p-5 rounded-2xl border border-gray-700/50 space-y-4 backdrop-blur-sm">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-gray-300">Gross Margin</span>
                <span className="text-xl font-mono text-green-400">${grossMarginUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="h-px bg-gray-700/50 my-2" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-gray-300">B2C Target</span>
                <span className="text-2xl font-black text-white font-mono">${b2cTotalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
               <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium text-gray-500">Per Person B2C</span>
                <span className="text-sm font-mono text-gray-400">${(b2cTotalUsd / (totalPax || 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            
             <div className="mt-4 bg-gray-800/20 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
              <span className="text-sm text-gray-400 tracking-wider font-medium">B2B Trade Rate</span>
              <span className="font-mono text-gray-300 font-bold">${b2bTotalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
             </div>
          </div>

          {/* AI Insights Card */}
          <AnimatePresence>
            {aiInsights && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100 p-6 rounded-3xl shadow-sm">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500"/> AI Margin Analysis</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-indigo-50">
                    <div className={`p-2 rounded-full ${aiInsights.isCompetitive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {aiInsights.isCompetitive ? <CheckCircle2 className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Competitiveness</div>
                      <div className="font-medium text-sm text-gray-900">{aiInsights.isCompetitive ? "Highly Competitive" : "Above Market Average"}</div>
                    </div>
                  </div>

                  {aiInsights.missingCosts && aiInsights.missingCosts.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-yellow-100">
                      <div className="text-xs text-yellow-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Potential Missing Costs</div>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc marker:text-yellow-400">
                        {aiInsights.missingCosts.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}

                  {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                     <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
                      <div className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">Recommendations</div>
                      <ul className="text-sm text-gray-600 space-y-2">
                        {aiInsights.recommendations.map((c, i) => (
                           <li key={i} className="flex gap-2 items-start">
                             <ChevronRight className="w-4 h-4 text-indigo-300 mt-0.5 shrink-0" /> 
                             <span className="leading-snug">{c}</span>
                           </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-xs font-black text-gray-400 mb-5 tracking-[0.25em] uppercase">
      {icon} {title}
    </h2>
  );
}

function InputGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3 flex flex-col">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );
}

function PreviewRow({ label, value, isBold = false }: { label: string, value: number, isBold?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${isBold ? 'text-lg font-bold text-white' : 'text-sm text-gray-300 font-medium'}`}>
      <span>{label}</span>
      <span className="font-mono tracking-tight">${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
    </div>
  );
}

function Button({ children, onClick, className, disabled }: any) {
  return (
    <button disabled={disabled} onClick={onClick} className={`px-4 py-2 rounded-xl flex items-center justify-center transition-all ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {children}
    </button>
  );
}
