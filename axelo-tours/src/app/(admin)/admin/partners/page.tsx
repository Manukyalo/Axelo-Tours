'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import React from 'react';
import { approvePartnerAction } from './actions';
import { toast } from 'react-hot-toast';
import {
  CheckCircle, XCircle, Clock, Users, DollarSign,
  RefreshCw, Key, Eye, EyeOff, Building2,
  TrendingUp, AlertTriangle
} from 'lucide-react';

interface Partner {
  id: string;
  company_name: string;
  company_type: string;
  country: string;
  annual_pax: number | null;
  contact_name: string;
  contact_email: string;
  phone: string | null;
  website: string | null;
  status: string;
  tier: string;
  net_rate_discount_pct: number;
  api_key: string | null;
  created_at: string;
  approved_at: string | null;
}

const TIER_COLORS: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-700 border-gray-200',
  silver: 'bg-slate-100 text-slate-700 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  platinum: 'bg-purple-100 text-purple-700 border-purple-200',
};

const STATUS_BADGE: Record<string, { cls: string; icon: React.ElementType }> = {
  pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  active: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  rejected: { cls: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const rand = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `axelo_live_${rand}`;
}

export default function AdminPartnersPage() {
  const supabase = createClient();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [tierEditing, setTierEditing] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });
    setPartners(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleApprove = async (partner: Partner) => {
    setActionLoading(partner.id);
    const apiKey = generateApiKey();
    
    try {
      await approvePartnerAction(partner.id, apiKey);
      toast.success("Partner approved and email sent!");
      fetchPartners();
    } catch (err: any) {
      console.error("Approval error:", err);
      toast.error(err.message || "Failed to approve partner");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await supabase.from('partners').update({ status: 'rejected' }).eq('id', id);
    setActionLoading(null);
    fetchPartners();
  };

  const handleTierChange = async (id: string, tier: string) => {
    const discountMap: Record<string, number> = {
      standard: 10, silver: 15, gold: 20, platinum: 25,
    };
    await supabase.from('partners').update({ tier, net_rate_discount_pct: discountMap[tier] ?? 10 }).eq('id', id);
    setTierEditing(null);
    fetchPartners();
  };

  const toggleKeyReveal = (id: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = partners.filter(p => p.status === activeTab);
  const counts = {
    pending: partners.filter(p => p.status === 'pending').length,
    active: partners.filter(p => p.status === 'active').length,
    rejected: partners.filter(p => p.status === 'rejected').length,
  };

  const totalRevenue = partners.filter(p => p.status === 'active').length * 12400; // mock

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Partner Management</h1>
          <p className="text-gray-400 mt-1">Review applications, manage active partners &amp; tiers</p>
        </div>
        <button
          onClick={fetchPartners}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Clock, label: 'Pending Review', value: counts.pending, color: 'text-amber-400' },
          { icon: CheckCircle, label: 'Active Partners', value: counts.active, color: 'text-emerald-400' },
          { icon: Users, label: 'Total Partners', value: partners.length, color: 'text-blue-400' },
          { icon: DollarSign, label: 'Est. Partner Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}k`, color: 'text-purple-400' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <kpi.icon className={`w-6 h-6 ${kpi.color} mb-3`} />
            <div className="text-2xl font-display font-bold">{kpi.value}</div>
            <div className="text-sm text-gray-400 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'active', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
            }`}
          >
            {tab}
            <span className="ml-2 text-xs opacity-70">({counts[tab]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No {activeTab} partners</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(partner => {
            const StatusIcon = (STATUS_BADGE[partner.status]?.icon || Clock) as React.ElementType;
            const isLoading = actionLoading === partner.id;

            return (
              <div
                key={partner.id}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-display font-bold text-lg truncate">{partner.company_name}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${TIER_COLORS[partner.tier] || TIER_COLORS.standard}`}>
                        {partner.tier}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize flex items-center gap-1 ${STATUS_BADGE[partner.status]?.cls ?? ''}`}>
                        {React.createElement(StatusIcon, { className: 'w-3 h-3' })}
                        {partner.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                      <span className="capitalize">{partner.company_type?.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>{partner.country}</span>
                      {partner.annual_pax && <><span>·</span><span>{partner.annual_pax.toLocaleString()} pax/yr</span></>}
                      <span>·</span>
                      <a href={`mailto:${partner.contact_email}`} className="hover:text-white transition-colors">
                        {partner.contact_email}
                      </a>
                    </div>
                  </div>

                  {/* Active partner extras */}
                  {partner.status === 'active' && (
                    <div className="flex items-center gap-4">
                      {/* Net rate discount */}
                      <div className="text-center">
                        <div className="text-xl font-bold text-emerald-400">{partner.net_rate_discount_pct}%</div>
                        <div className="text-xs text-gray-500">Net Discount</div>
                      </div>

                      {/* Tier selector */}
                      <div className="relative">
                        {tierEditing === partner.id ? (
                          <div className="flex items-center gap-1.5">
                            {['standard', 'silver', 'gold', 'platinum'].map(t => (
                              <button
                                key={t}
                                onClick={() => handleTierChange(partner.id, t)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                                  partner.tier === t ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                            <button onClick={() => setTierEditing(null)} className="text-gray-500 hover:text-white">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setTierEditing(partner.id)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                          >
                            <TrendingUp className="w-3.5 h-3.5" /> Change Tier
                          </button>
                        )}
                      </div>

                      {/* API Key */}
                      {partner.api_key && (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                          <Key className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <code className="text-xs text-gray-300 font-mono max-w-[140px] truncate">
                            {revealedKeys.has(partner.id) ? partner.api_key : `axelo_live_${'•'.repeat(12)}`}
                          </code>
                          <button onClick={() => toggleKeyReveal(partner.id)} className="text-gray-500 hover:text-white transition-colors">
                            {revealedKeys.has(partner.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {partner.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(partner)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(partner.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 bg-white/10 hover:bg-red-600/30 border border-white/10 hover:border-red-500/40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                    {partner.status === 'active' && !partner.api_key && (
                      <button
                        onClick={() => handleApprove(partner)}
                        className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        <Key className="w-4 h-4" /> Gen API Key
                      </button>
                    )}
                    {partner.status === 'rejected' && (
                      <button
                        onClick={() => handleApprove(partner)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" /> Re-activate
                      </button>
                    )}
                  </div>
                </div>

                {/* Approval notice */}
                {partner.status === 'pending' && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Applied {new Date(partner.created_at).toLocaleDateString()} — Approving will generate an API key and activate the portal.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
