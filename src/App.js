import React, { useState, useEffect } from 'react';
import { 
  Users, Building, Gavel, ShieldCheck, PieChart, 
  Plus, Trash2, Edit3, Save, Search, Check, X, 
  AlertCircle, Cloud, RefreshCw, Printer, 
  ExternalLink, Calendar, Menu, ArrowRight, Home,
  Wallet, TrendingUp, TrendingDown, FileText, StickyNote, Link as LinkIcon, DollarSign, XCircle, Minus, AlertTriangle, Info, Clock, Shield, Zap, Lock, LogOut, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDjTZYdwrbljATQVxYbCjzq4CmmtOTXWuk",
  authDomain: "kira-takip-paneli.firebaseapp.com",
  projectId: "kira-takip-paneli",
  storageBucket: "kira-takip-paneli.firebasestorage.app",
  messagingSenderId: "674278884470",
  appId: "1:674278884470:web:5410f743977af2a0d88b57"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HELPER FUNCTIONS ---
const formatDateTR = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
  } catch (e) {
    return dateString;
  }
};

const getRentForMonth = (tenant, monthIndex) => {
  if (!tenant?.rentHistory || tenant.rentHistory.length === 0) return Number(tenant?.startRentAmount) || 0;
  const currentYear = new Date().getFullYear();
  const targetDate = new Date(currentYear, monthIndex + 1, 0); 
  const sortedHistory = [...tenant.rentHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  let applicableRent = Number(tenant.startRentAmount) || 0;
  for (const record of sortedHistory) {
    if (new Date(record.date) <= targetDate) {
      applicableRent = Number(record.amount);
    }
  }
  return applicableRent;
};

const getCurrentRent = (tenant) => {
  return getRentForMonth(tenant, new Date().getMonth());
};

const cyclePaymentStatus = (currentStatus) => {
  if (currentStatus === 'paid') return 'unpaid';
  if (currentStatus === 'unpaid') return null;
  return 'paid';
};

const getNextAnniversary = (baseDateStr) => {
  if (!baseDateStr) return null;
  const today = new Date();
  today.setHours(0,0,0,0); 
  const baseDate = new Date(baseDateStr);
  const currentYear = today.getFullYear();
  const nextDate = new Date(baseDate);
  nextDate.setFullYear(currentYear);
  if (nextDate < today) {
    nextDate.setFullYear(currentYear + 1);
  }
  return nextDate;
};

const getTenureWarning = (startDateStr) => {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  const today = new Date();
  const year5End = new Date(start);
  year5End.setFullYear(start.getFullYear() + 5);
  const diffTime = year5End - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays <= 180) {
    return { 
      date: year5End, 
      daysLeft: diffDays,
      isCritical: diffDays <= 60 
    };
  }
  return null;
};

const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const fullMonths = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

// --- 1. LOGIN COMPONENT ---
const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      let msg = "Giriş başarısız.";
      if (err.code === 'auth/invalid-credential') msg = "E-posta veya şifre hatalı.";
      else if (err.code === 'auth/user-not-found') msg = "Bu e-posta ile kayıtlı kullanıcı yok.";
      else if (err.code === 'auth/wrong-password') msg = "Şifre yanlış.";
      else msg = err.message;
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Vesayet Yönetim</h1>
          <p className="text-slate-500 text-sm mt-1">Yetkili Personel Girişi</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-100 flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-Posta Adresi</label>
            <input 
              type="email" 
              required 
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="ornek@hukuk.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
            <input 
              type="password" 
              required 
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition shadow-md flex justify-center items-center gap-2">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Lock className="w-5 h-5"/>}
            {loading ? "Giriş Yapılıyor..." : "Güvenli Giriş"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS & MODULES (DEFINED BEFORE USE) ---

const MenuButton = ({ active, onClick, icon, label, count }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
    {count !== undefined && count > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-blue-500' : 'bg-slate-700'}`}>{count}</span>}
  </button>
);

const getModuleName = (mod) => {
  if (mod === 'rents') return 'Kira Yönetimi';
  if (mod === 'lawsuits') return 'Dava & İcra Takibi';
  if (mod === 'assets') return 'Varlık Yönetimi';
  if (mod === 'accounting') return 'Hesap Defteri';
  if (mod === 'upcoming') return 'Yaklaşan İşlemler';
  return 'Genel Bakış';
}

const DashboardModule = ({ client }) => {
  const ledger = client.ledger || [];
  const totalIncome = ledger.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = ledger.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const activeLawsuits = (client.lawsuits || []).filter(l => l.status === 'active').length;
  const criticalAssets = (client.assets || []).filter(a => { if (!a.daskDate) return false; const days = (new Date(a.daskDate) - new Date()) / (1000 * 60 * 60 * 24); return days < 30; }).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="text-sm text-slate-500 font-medium uppercase mb-1">Mevcut Bakiye</div><div className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>₺{balance.toLocaleString('tr-TR')}</div></div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="text-sm text-slate-500 font-medium uppercase mb-1">Aktif Kiracılar</div><div className="text-3xl font-bold text-emerald-600">{client.tenants?.length || 0}</div></div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="text-sm text-slate-500 font-medium uppercase mb-1">Davalar</div><div className="text-3xl font-bold text-orange-500">{activeLawsuits}</div></div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><div className="text-sm text-slate-500 font-medium uppercase mb-1">Uyarılar</div><div className={`text-3xl font-bold ${criticalAssets > 0 ? 'text-red-600' : 'text-slate-400'}`}>{criticalAssets}</div></div>
      </div>
    </div>
  );
};

const UpcomingModule = ({ client }) => {
  const events = [];
  (client.lawsuits || []).forEach(l => {
    if (l.nextDate && l.status === 'active') {
      events.push({ type: 'lawsuit', date: new Date(l.nextDate), title: 'Duruşma/İşlem Günü', subtitle: `${l.court} - ${l.fileNo}`, icon: <Gavel className="w-5 h-5 text-orange-600"/>, urgency: 'high' });
    }
  });
  (client.assets || []).forEach(a => {
    const nextDask = getNextAnniversary(a.daskDate);
    if (nextDask) {
      events.push({ type: 'insurance', date: nextDask, title: 'DASK Yenileme', subtitle: a.name, icon: <ShieldCheck className="w-5 h-5 text-blue-600"/>, urgency: 'medium' });
    }
  });
  (client.tenants || []).forEach(t => {
    const nextIncrease = getNextAnniversary(t.startDate);
    if (nextIncrease) {
      events.push({ type: 'rent', date: nextIncrease, title: 'Kira Artış Dönemi', subtitle: `${t.name} (Mevcut: ₺${Number(t.startRentAmount).toLocaleString('tr-TR')})`, icon: <TrendingUp className="w-5 h-5 text-emerald-600"/>, urgency: 'medium' });
    }
    const nextTenantDask = getNextAnniversary(t.daskDate);
    if (nextTenantDask) {
      events.push({ type: 'insurance', date: nextTenantDask, title: 'DASK (Kiracı)', subtitle: t.name, icon: <Shield className="w-5 h-5 text-purple-600"/>, urgency: 'medium' });
    }
    const nextHousingIns = getNextAnniversary(t.housingInsuranceDate);
    if (nextHousingIns) {
      events.push({ type: 'insurance', date: nextHousingIns, title: 'Konut Sigortası', subtitle: t.name, icon: <Home className="w-5 h-5 text-indigo-600"/>, urgency: 'medium' });
    }
    const tenureWarning = getTenureWarning(t.startDate);
    if (tenureWarning) {
      events.push({ 
        type: 'alert', 
        date: tenureWarning.date, 
        title: tenureWarning.isCritical ? 'KİRA TESPİT SÜRESİ DOLUYOR (KRİTİK)' : 'Kira Tespit Süresi Yaklaşıyor (5. Yıl)', 
        subtitle: `${t.name} - İhtarname/Dava Hazırlığı (${tenureWarning.daysLeft} gün kaldı)`, 
        icon: <Zap className={`w-5 h-5 ${tenureWarning.isCritical ? 'text-red-600' : 'text-orange-500'}`}/>, 
        urgency: tenureWarning.isCritical ? 'critical' : 'high' 
      });
    }
  });
  events.sort((a, b) => a.date - b.date);
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2"><Clock className="w-6 h-6 text-blue-600"/> Yaklaşan Kritik Tarihler</h3>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Yaklaşan bir işlem bulunamadı.</div>
          ) : (
            events.map((e, i) => {
              const daysLeft = Math.ceil((e.date - new Date()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysLeft < 0;
              const isUrgent = daysLeft <= 30 || e.urgency === 'critical';
              let bgClass = "hover:bg-slate-50";
              if (e.urgency === 'critical') bgClass = "bg-red-50 hover:bg-red-100 border-l-4 border-red-500";
              else if (isOverdue) bgClass = "bg-slate-100 opacity-70";
              return (
                <div key={i} className={`p-4 flex items-center justify-between ${bgClass}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-white border shadow-sm`}>{e.icon}</div>
                    <div><h4 className={`font-bold text-sm ${e.urgency === 'critical' ? 'text-red-800' : 'text-slate-800'}`}>{e.title}</h4><p className="text-xs text-slate-500">{e.subtitle}</p></div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold text-sm ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-500' : 'text-slate-600'}`}>{e.date.toLocaleDateString('tr-TR')}</div>
                    <div className={`text-[10px] font-bold uppercase ${isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-400' : 'text-green-500'}`}>{isOverdue ? `${Math.abs(daysLeft)} gün geçti` : `${daysLeft} gün kaldı`}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const RentModule = ({ client, updateClient, triggerConfirm }) => {
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState(null);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [detailTab, setDetailTab] = useState('notes'); 
  const [searchTerm, setSearchTerm] = useState("");
  const [newDoc, setNewDoc] = useState({ title: "", link: "" });
  const [newNote, setNewNote] = useState("");
  const [tenantForm, setTenantForm] = useState({ name: "", address: "", startDate: "", startRentAmount: "", previousRent: "", rentHistory: [], hasIncreaseClause: false, daskDate: "", housingInsuranceDate: "" });
  const [insuranceForm, setInsuranceForm] = useState({ daskDate: "", housingInsuranceDate: "" });
  const activeTenants = client.tenants || [];
  const selectedTenant = activeTenants.find(t => t.id === selectedTenantId) || null;
  useEffect(() => { if (selectedTenant) { setInsuranceForm({ daskDate: selectedTenant.daskDate || "", housingInsuranceDate: selectedTenant.housingInsuranceDate || "" }); } }, [selectedTenant]);
  const filteredTenants = activeTenants.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.address.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleSaveTenant = (e) => { e.preventDefault(); if (!tenantForm.name || !tenantForm.startRentAmount) return; let updatedTenants; if (editingTenantId) { updatedTenants = activeTenants.map(t => t.id === editingTenantId ? { ...t, ...tenantForm } : t); } else { updatedTenants = [...activeTenants, { ...tenantForm, id: Date.now(), payments: {}, documents: [], notes: [] }]; } updateClient({ ...client, tenants: updatedTenants }); setShowTenantModal(false); setEditingTenantId(null); setTenantForm({ name: "", address: "", startDate: "", startRentAmount: "", previousRent: "", rentHistory: [], hasIncreaseClause: false, daskDate: "", housingInsuranceDate: "" }); };
  const openEditTenant = (tenant) => { setTenantForm({ name: tenant.name, address: tenant.address, startDate: tenant.startDate, startRentAmount: tenant.startRentAmount, previousRent: tenant.previousRent || "", rentHistory: tenant.rentHistory || [], hasIncreaseClause: tenant.hasIncreaseClause, daskDate: tenant.daskDate || "", housingInsuranceDate: tenant.housingInsuranceDate || "" }); setEditingTenantId(tenant.id); setShowTenantModal(true); };
  const handleSaveInsurance = () => { if (!selectedTenantId) return; const updatedTenants = activeTenants.map(t => { if (t.id === selectedTenantId) { return { ...t, ...insuranceForm }; } return t; }); updateClient({ ...client, tenants: updatedTenants }); alert("Sigorta tarihleri güncellendi."); };
  const handleTogglePayment = (tenantId, monthIndex) => { const updatedTenants = activeTenants.map(t => { if (t.id === tenantId) { const currentStatus = t.payments?.[monthIndex]; const normalizedStatus = currentStatus === true ? 'paid' : currentStatus; const newStatus = cyclePaymentStatus(normalizedStatus); const newPayments = { ...(t.payments || {}) }; if (newStatus === null) delete newPayments[monthIndex]; else newPayments[monthIndex] = newStatus; return { ...t, payments: newPayments }; } return t; }); updateClient({ ...client, tenants: updatedTenants }); };
  const handleDeleteTenant = (id) => { triggerConfirm("Kiracıyı Sil", "Bu kiracıyı silmek istediğinize emin misiniz?", () => { updateClient({ ...client, tenants: activeTenants.filter(t => t.id !== id) }); setSelectedTenantId(null); }); };
  const handleAddDocument = (e) => { e.preventDefault(); if (!newDoc.title || !selectedTenantId) return; const updatedTenants = activeTenants.map(t => { if (t.id === selectedTenantId) { const currentDocs = t.documents || []; return { ...t, documents: [{ id: Date.now(), title: newDoc.title, link: newDoc.link, date: new Date().toLocaleDateString('tr-TR') }, ...currentDocs] }; } return t; }); updateClient({ ...client, tenants: updatedTenants }); setNewDoc({ title: "", link: "" }); };
  const handleDeleteDocument = (docId) => { triggerConfirm("Belgeyi Sil", "Silmek istediğinize emin misiniz?", () => { const updatedTenants = activeTenants.map(t => { if (t.id === selectedTenantId) { return { ...t, documents: (t.documents || []).filter(d => d.id !== docId) }; } return t; }); updateClient({ ...client, tenants: updatedTenants }); }); };
  const handleAddNote = () => { if (!newNote.trim() || !selectedTenantId) return; const updatedTenants = activeTenants.map(t => { if (t.id === selectedTenantId) { const currentNotes = t.notes || []; return { ...t, notes: [{ id: Date.now(), text: newNote, date: new Date().toLocaleDateString('tr-TR') }, ...currentNotes] }; } return t; }); updateClient({ ...client, tenants: updatedTenants }); setNewNote(""); };
  const handleDeleteNote = (noteId) => { triggerConfirm("Notu Sil", "Silmek istediğinize emin misiniz?", () => { const updatedTenants = activeTenants.map(t => { if (t.id === selectedTenantId) { return { ...t, notes: (t.notes || []).filter(n => n.id !== noteId) }; } return t; }); updateClient({ ...client, tenants: updatedTenants }); }); };
  const handlePrint = () => requestAnimationFrame(() => window.print());

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b bg-slate-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2"><div className="relative max-w-xs"><Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Kiracı ara..." className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
        <div className="flex gap-2"><button onClick={() => setShowReportModal(true)} className="text-sm border border-slate-300 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-100 flex items-center gap-1"><Printer className="w-4 h-4"/> Rapor</button><button onClick={() => { setTenantForm({ name: "", address: "", startDate: "", startRentAmount: "", previousRent: "", rentHistory: [], hasIncreaseClause: false, daskDate: "", housingInsuranceDate: "" }); setEditingTenantId(null); setShowTenantModal(true); }} className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 flex items-center gap-1 shadow-sm"><Plus className="w-4 h-4"/> Kiracı Ekle</button></div>
      </div>
      <div className="overflow-auto flex-1 p-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b sticky top-0 z-20">
            <tr><th className="p-3 w-40 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Kiracı</th><th className="p-3 w-48">Mülk</th><th className="p-3 w-24">Kontrat</th><th className="p-3 w-24 text-right">Başlangıç</th><th className="p-3 w-24 text-right text-gray-400">Son(Önceki)</th><th className="p-3 w-24 text-right text-blue-700">Güncel</th><th className="p-3 w-12 text-center">Artış</th>{months.map((m, i) => <th key={i} className="p-2 text-center w-8 border-l border-gray-200">{m}</th>)}<th className="p-3 w-16 text-center">İşlem</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredTenants.length === 0 ? <tr><td colSpan={20} className="p-12 text-center text-gray-400">Kayıt bulunamadı.</td></tr> : filteredTenants.map((tenant) => {
                const currentRent = getCurrentRent(tenant);
                return (
                  <tr key={tenant.id} className="hover:bg-blue-50/50 transition group">
                    <td className="p-3 sticky left-0 bg-white group-hover:bg-blue-50/50 z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer" onClick={() => setSelectedTenantId(tenant.id)}><div className="font-semibold text-gray-900 flex items-center gap-1 hover:text-blue-600">{tenant.name}<ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div></td>
                    <td className="p-3 text-xs text-gray-600 truncate max-w-xs" title={tenant.address}>{tenant.address}</td>
                    <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTR(tenant.startDate)}</td>
                    <td className="p-3 text-right font-mono text-xs text-gray-500">₺{Number(tenant.startRentAmount).toLocaleString('tr-TR')}</td>
                    <td className="p-3 text-right font-mono text-xs text-gray-400">{tenant.previousRent ? `₺${Number(tenant.previousRent).toLocaleString('tr-TR')}` : '-'}</td>
                    <td className="p-3 text-right font-mono font-bold text-blue-700">₺{currentRent.toLocaleString('tr-TR')}</td>
                    <td className="p-3 text-center">{tenant.hasIncreaseClause ? <span className="text-green-600 bg-green-50 px-1 py-0.5 rounded text-[10px] font-bold border border-green-200">VAR</span> : <span className="text-gray-400 text-[10px]">YOK</span>}</td>
                    {months.map((_, index) => {
                      const rentThisMonth = getRentForMonth(tenant, index);
                      const rentPrevMonth = index > 0 ? getRentForMonth(tenant, index - 1) : Number(tenant.startRentAmount);
                      const isIncreaseMonth = rentThisMonth > rentPrevMonth;
                      const status = tenant.payments?.[index];
                      const normalizedStatus = status === true ? 'paid' : status;
                      let btnClass = "bg-gray-100 text-gray-300 hover:bg-gray-200"; let icon = <Minus className="w-3 h-3" />;
                      if (normalizedStatus === 'paid') { btnClass = "bg-green-100 text-green-600 border border-green-200 shadow-sm"; icon = <Check className="w-3 h-3" />; }
                      else if (normalizedStatus === 'unpaid') { btnClass = "bg-red-100 text-red-600 border border-red-200 shadow-sm"; icon = <X className="w-3 h-3" />; }
                      if (isIncreaseMonth) btnClass += " ring-2 ring-orange-400 ring-offset-1";
                      return (<td key={index} className="p-1 text-center border-l border-gray-100 relative"><button onClick={() => handleTogglePayment(tenant.id, index)} className={`w-6 h-6 rounded-md flex items-center justify-center transition-all mx-auto ${btnClass}`} title={`${months[index]}: ₺${rentThisMonth.toLocaleString('tr-TR')}`}>{icon}</button>{isIncreaseMonth && <div className="absolute top-0 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full pointer-events-none"></div>}</td>);
                    })}
                    <td className="p-3 text-center"><div className="flex items-center justify-center gap-1"><button onClick={(e) => { e.stopPropagation(); openEditTenant(tenant); }} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit3 className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); handleDeleteTenant(tenant.id); }} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {showTenantModal && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"><div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10"><h2 className="text-xl font-bold text-slate-800">{editingTenantId ? 'Kiracı Düzenle' : 'Yeni Kiracı Ekle'}</h2><button onClick={() => setShowTenantModal(false)}><X className="w-6 h-6 text-slate-400" /></button></div><form onSubmit={handleSaveTenant} className="p-6 space-y-6"><div className="grid grid-cols-1 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label><input required type="text" className="w-full border p-2.5 rounded-lg" value={tenantForm.name} onChange={e => setTenantForm({...tenantForm, name: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Adres</label><textarea rows="2" className="w-full border p-2.5 rounded-lg" value={tenantForm.address} onChange={e => setTenantForm({...tenantForm, address: e.target.value})} /></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç</label><input type="date" className="w-full border p-2.5 rounded-lg" value={tenantForm.startDate} onChange={e => setTenantForm({...tenantForm, startDate: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Önceki Kira</label><input type="number" className="w-full border p-2.5 rounded-lg" value={tenantForm.previousRent} onChange={e => setTenantForm({...tenantForm, previousRent: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Kira</label><input required type="number" className="w-full border p-2.5 rounded-lg" value={tenantForm.startRentAmount} onChange={e => setTenantForm({...tenantForm, startRentAmount: e.target.value})} /></div></div><div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"><input type="checkbox" id="clause" className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={tenantForm.hasIncreaseClause} onChange={e => setTenantForm({...tenantForm, hasIncreaseClause: e.target.checked})} /><label htmlFor="clause" className="text-sm text-slate-700 cursor-pointer select-none">Sözleşmede <strong>TÜFE/ÜFE Artış Maddesi</strong> var</label></div><div className="space-y-3 pt-4 border-t"><div className="flex justify-between items-center"><h3 className="text-sm font-semibold text-slate-500">Kira Artış Dönemleri</h3><button type="button" onClick={() => setTenantForm({...tenantForm, rentHistory: [...tenantForm.rentHistory, {date: '', amount: ''}]})} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200">+ Dönem</button></div>{tenantForm.rentHistory.map((h, i) => (<div key={i} className="flex gap-2 items-center"><input type="date" className="border p-2 rounded text-sm w-32" value={h.date} onChange={e => { const n = [...tenantForm.rentHistory]; n[i].date = e.target.value; setTenantForm({...tenantForm, rentHistory: n}); }} /><input type="number" placeholder="Tutar" className="border p-2 rounded text-sm w-32" value={h.amount} onChange={e => { const n = [...tenantForm.rentHistory]; n[i].amount = e.target.value; setTenantForm({...tenantForm, rentHistory: n}); }} /><button type="button" onClick={() => { const n = tenantForm.rentHistory.filter((_, idx) => idx !== i); setTenantForm({...tenantForm, rentHistory: n}); }} className="text-red-500"><Trash2 className="w-4 h-4"/></button></div>))}</div><div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowTenantModal(false)} className="flex-1 py-3 border rounded-xl">İptal</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl">Kaydet</button></div></form></div></div>)}
      {showReportModal && (<div id="report-modal" className="fixed inset-0 bg-white z-[60] overflow-auto"><div id="report-content" className="max-w-4xl mx-auto p-8"><div className="flex justify-between items-start mb-8 border-b pb-4"><div><h1 className="text-2xl font-bold">Kira Tahsilat Raporu</h1><p>{new Date().toLocaleDateString('tr-TR')}</p></div><div className="flex gap-2 print:hidden"><button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Yazdır</button><button onClick={() => setShowReportModal(false)} className="px-4 py-2 bg-gray-200 rounded font-bold">Kapat</button></div></div><div className="space-y-6">{activeTenants.map(tenant => { const currentRent = getCurrentRent(tenant); let totalDebt = 0; months.forEach((m, i) => { if (tenant.payments?.[i] === 'unpaid') totalDebt += getRentForMonth(tenant, i); }); return (<div key={tenant.id} className="border p-4 rounded break-inside-avoid"><div className="flex justify-between mb-2"><h3 className="font-bold">{tenant.name}</h3><div>Güncel: ₺{currentRent.toLocaleString('tr-TR')}</div></div><div className="grid grid-cols-12 gap-1 text-[10px] text-center mb-3">{months.map((m, i) => { const st = tenant.payments?.[i] === 'paid' ? 'OK' : tenant.payments?.[i] === 'unpaid' ? 'X' : '-'; return <div key={i} className={`p-1 border ${st === 'OK' ? 'bg-green-100' : st === 'X' ? 'bg-red-100' : 'bg-gray-50'}`}>{m}<br/>{st}</div> })}</div><div className="flex justify-end pt-2 border-t mt-2"><div className="text-right"><span className="text-xs font-bold text-gray-500 uppercase block">Toplam Borç</span><span className={`text-lg font-mono font-bold ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>₺{totalDebt.toLocaleString('tr-TR')}</span></div></div></div>) })}</div></div></div>)}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0"><h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5"/>{selectedTenant.name}</h2><button onClick={() => setSelectedTenantId(null)}><X className="w-6 h-6"/></button></div>
            <div className="flex border-b border-gray-200 bg-gray-50 shrink-0"><button onClick={() => setDetailTab('notes')} className={`flex-1 py-3 text-sm font-medium ${detailTab === 'notes' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500'}`}>Notlar</button><button onClick={() => setDetailTab('documents')} className={`flex-1 py-3 text-sm font-medium ${detailTab === 'documents' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500'}`}>Belgeler</button><button onClick={() => setDetailTab('insurance')} className={`flex-1 py-3 text-sm font-medium ${detailTab === 'insurance' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500'}`}>Sigorta & Detay</button></div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {detailTab === 'documents' && <div className="space-y-4"><div className="bg-blue-50 p-4 rounded border border-blue-200"><form onSubmit={handleAddDocument} className="flex flex-col gap-2"><input type="text" placeholder="Belge Adı" className="border p-2 rounded text-sm" value={newDoc.title} onChange={e => setNewDoc({...newDoc, title: e.target.value})} /><div className="flex gap-2"><input type="text" placeholder="Link" className="border p-2 rounded text-sm flex-1" value={newDoc.link} onChange={e => setNewDoc({...newDoc, link: e.target.value})} /><button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Ekle</button></div></form></div><div className="space-y-2">{(selectedTenant.documents || []).map(doc => (<div key={doc.id} className="flex justify-between items-center bg-white p-3 rounded border"><a href={doc.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{doc.title}</a><button onClick={() => handleDeleteDocument(doc.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></div>))}</div></div>}
              {detailTab === 'notes' && <div className="space-y-4"><div className="bg-yellow-50 p-4 rounded border border-yellow-200"><textarea placeholder="Not ekle..." className="w-full border p-2 rounded text-sm" value={newNote} onChange={e => setNewNote(e.target.value)} /><div className="text-right mt-2"><button onClick={handleAddNote} className="bg-yellow-600 text-white px-3 py-1 rounded text-sm">Kaydet</button></div></div><div className="space-y-2">{(selectedTenant.notes || []).map(note => (<div key={note.id} className="bg-white p-3 rounded border shadow-sm relative group"><div className="text-xs text-gray-400 mb-1">{note.date}</div><p className="text-sm text-gray-800">{note.text}</p><button onClick={() => handleDeleteNote(note.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-3 h-3"/></button></div>))}</div></div>}
              {detailTab === 'insurance' && (<div className="space-y-6"><div className="bg-white p-6 rounded-xl border border-slate-200"><h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600"/> Sigorta Takibi</h3><div className="space-y-4"><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">DASK Yenileme Tarihi</label><input type="date" className="w-full border p-2 rounded text-sm" value={insuranceForm.daskDate} onChange={e => setInsuranceForm({...insuranceForm, daskDate: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Konut Sigortası Tarihi</label><input type="date" className="w-full border p-2 rounded text-sm" value={insuranceForm.housingInsuranceDate} onChange={e => setInsuranceForm({...insuranceForm, housingInsuranceDate: e.target.value})} /></div><div className="pt-2"><button onClick={handleSaveInsurance} className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700">Tarihleri Kaydet</button></div></div></div><div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-xs text-orange-800"><p className="font-bold flex items-center gap-1 mb-1"><Info className="w-4 h-4"/> Bilgi</p>Bu tarihler yaklaştığında "Yaklaşan İşlemler" sayfasında otomatik uyarı göreceksiniz.</div></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MODULE 3: LAWSUITS (DAVALAR - EDİTLENEBİLİR) ---
const LawsuitModule = ({ client, updateClient, triggerConfirm }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ court: '', fileNo: '', type: '', nextDate: '', status: 'active' });
  const [editingId, setEditingId] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    let updatedLawsuits;
    if (editingId) {
      updatedLawsuits = (client.lawsuits || []).map(l => l.id === editingId ? { ...form, id: editingId } : l);
    } else {
      updatedLawsuits = [...(client.lawsuits || []), { ...form, id: Date.now() }];
    }
    updateClient({ ...client, lawsuits: updatedLawsuits });
    setShowModal(false);
    setEditingId(null);
    setForm({ court: '', fileNo: '', type: '', nextDate: '', status: 'active' });
  };

  const openEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    triggerConfirm("Davayı Sil", "Silmek istediğinize emin misiniz?", () => {
      updateClient({ ...client, lawsuits: (client.lawsuits || []).filter(l => l.id !== id) });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><div className="text-sm text-slate-500">Toplam {(client.lawsuits || []).length} dosya</div><button onClick={() => { setForm({ court: '', fileNo: '', type: '', nextDate: '', status: 'active' }); setEditingId(null); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"><Plus className="w-4 h-4"/> Yeni Dava Ekle</button></div>
      <div className="grid grid-cols-1 gap-4">
        {(client.lawsuits || []).map(lawsuit => (
          <div key={lawsuit.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-4"><div className={`p-3 rounded-lg ${lawsuit.status === 'active' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}><Gavel className="w-6 h-6"/></div><div><h4 className="font-bold text-slate-800">{lawsuit.court} - {lawsuit.fileNo}</h4><p className="text-sm text-slate-500">{lawsuit.type}</p>{lawsuit.nextDate && <div className="mt-1 flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded w-fit"><Calendar className="w-3 h-3"/> Duruşma: {new Date(lawsuit.nextDate).toLocaleDateString('tr-TR')}</div>}</div></div>
            <div className="flex items-center gap-2"><span className={`px-2 py-1 text-xs rounded border ${lawsuit.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600'}`}>{lawsuit.status === 'active' ? 'Devam Ediyor' : 'Karara Çıktı'}</span><button onClick={() => openEdit(lawsuit)} className="p-2 text-blue-400 hover:bg-blue-50 rounded"><Edit3 className="w-4 h-4"/></button><button onClick={() => handleDelete(lawsuit.id)} className="p-2 text-slate-400 hover:text-red-600 rounded bg-slate-50"><Trash2 className="w-4 h-4"/></button></div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">{editingId ? 'Dava Düzenle' : 'Dava Ekle'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input required type="text" placeholder="Mahkeme" className="w-full border p-2 rounded" value={form.court} onChange={e => setForm({...form, court: e.target.value})} />
              <input required type="text" placeholder="Dosya No" className="w-full border p-2 rounded" value={form.fileNo} onChange={e => setForm({...form, fileNo: e.target.value})} />
              <input type="text" placeholder="Tür" className="w-full border p-2 rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value})} />
              <div><label className="text-xs text-slate-500">Tarih</label><input type="date" className="w-full border p-2 rounded" value={form.nextDate} onChange={e => setForm({...form, nextDate: e.target.value})} /></div>
              <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">İptal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Kaydet</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MODULE 4: ASSETS (VARLIKLAR - EDİTLENEBİLİR) ---
const AssetModule = ({ client, updateClient, triggerConfirm }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'real_estate', name: '', details: '', daskDate: '' });
  const [editingId, setEditingId] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    let updatedAssets;
    if (editingId) {
      updatedAssets = (client.assets || []).map(a => a.id === editingId ? { ...form, id: editingId } : a);
    } else {
      updatedAssets = [...(client.assets || []), { ...form, id: Date.now() }];
    }
    updateClient({ ...client, assets: updatedAssets });
    setShowModal(false);
    setEditingId(null);
    setForm({ type: 'real_estate', name: '', details: '', daskDate: '' });
  };

  const openEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    triggerConfirm("Varlığı Sil", "Silmek istediğinize emin misiniz?", () => {
      updateClient({ ...client, assets: (client.assets || []).filter(a => a.id !== id) });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><div className="text-sm text-slate-500">Toplam {(client.assets || []).length} varlık</div><button onClick={() => { setForm({ type: 'real_estate', name: '', details: '', daskDate: '' }); setEditingId(null); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"><Plus className="w-4 h-4"/> Varlık Ekle</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(client.assets || []).map(asset => {
          const daysLeft = asset.daskDate ? Math.ceil((new Date(asset.daskDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
          const isCritical = daysLeft !== null && daysLeft < 30;
          return (
            <div key={asset.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
              {isCritical && <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-bl-full -mr-8 -mt-8 z-0"></div>}
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-600">{asset.type === 'real_estate' ? <Home className="w-6 h-6"/> : <Building className="w-6 h-6"/>}</div>
                  <div><h4 className="font-bold text-slate-800">{asset.name}</h4><p className="text-sm text-slate-500">{asset.details}</p>{asset.daskDate && <div className={`mt-2 text-xs font-bold px-2 py-1 rounded w-fit flex items-center gap-1 ${isCritical ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}><ShieldCheck className="w-3 h-3"/> DASK: {new Date(asset.daskDate).toLocaleDateString('tr-TR')}</div>}</div>
                </div>
                <div className="flex gap-1"><button onClick={() => openEdit(asset)} className="p-2 text-blue-400 hover:bg-blue-50 rounded"><Edit3 className="w-4 h-4"/></button><button onClick={() => handleDelete(asset.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button></div>
              </div>
            </div>
          );
        })}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">{editingId ? 'Varlık Düzenle' : 'Varlık Ekle'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <select className="w-full border p-2 rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="real_estate">Taşınmaz</option><option value="vehicle">Araç</option><option value="bank">Banka</option><option value="other">Diğer</option></select>
              <input required type="text" placeholder="Varlık Adı" className="w-full border p-2 rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <textarea placeholder="Detaylar" className="w-full border p-2 rounded" rows="2" value={form.details} onChange={e => setForm({...form, details: e.target.value})} />
              {form.type === 'real_estate' && <div><label className="text-xs text-slate-500">DASK Tarihi</label><input type="date" className="w-full border p-2 rounded" value={form.daskDate} onChange={e => setForm({...form, daskDate: e.target.value})} /></div>}
              <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">İptal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Kaydet</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- MODULE 5: ACCOUNTING (HESAP DEFTERİ - EDİTLENEBİLİR) ---
const AccountingModule = ({ client, updateClient, triggerConfirm }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), type: 'expense', category: 'bakim', amount: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [showAnnualReport, setShowAnnualReport] = useState(false);

  const allTransactions = client.ledger || [];

  const calculateRollover = () => {
    const currentPeriodStart = new Date(viewYear, viewMonth, 1);
    return allTransactions.filter(t => new Date(t.date) < currentPeriodStart).reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
  };

  const currentMonthTransactions = allTransactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const monthIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const monthExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const rolloverBalance = calculateRollover();
  const endBalance = rolloverBalance + monthIncome - monthExpense;

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    let updatedLedger;
    if (editingId) {
      updatedLedger = allTransactions.map(t => t.id === editingId ? { ...form, id: editingId } : t);
    } else {
      updatedLedger = [{ ...form, id: Date.now() }, ...allTransactions];
    }
    updateClient({ ...client, ledger: updatedLedger });
    setShowModal(false);
    setEditingId(null);
    setForm({ date: new Date().toISOString().slice(0,10), type: 'expense', category: 'bakim', amount: '', description: '' });
  };

  const openEdit = (item) => {
    setForm(item);
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    triggerConfirm("İşlemi Sil", "Silmek istediğinize emin misiniz?", () => {
      updateClient({ ...client, ledger: allTransactions.filter(t => t.id !== id) });
    });
  };

  const changeMonth = (delta) => {
    let newM = viewMonth + delta;
    let newY = viewYear;
    if (newM > 11) { newM = 0; newY++; }
    if (newM < 0) { newM = 11; newY--; }
    setViewMonth(newM);
    setViewYear(newY);
  };

  const categories = {
    income: [{ id: 'kira', label: 'Kira Geliri' }, { id: 'maas', label: 'Maaş' }, { id: 'satis', label: 'Satış' }, { id: 'diger_gelir', label: 'Diğer' }],
    expense: [{ id: 'bakim', label: 'Bakım' }, { id: 'saglik', label: 'Sağlık' }, { id: 'fatura', label: 'Fatura' }, { id: 'vergi', label: 'Vergi' }, { id: 'hukuk', label: 'Avukatlık' }, { id: 'avans', label: 'Avans' }, { id: 'tadilât', label: 'Tadilat' }, { id: 'diger_gider', label: 'Diğer' }]
  };

  const getCatLabel = (id, type) => {
     const list = type === 'income' ? categories.income : categories.expense;
     return list.find(c => c.id === id)?.label || id;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-lg"><button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded shadow-sm transition"><ChevronLeft className="w-5 h-5 text-slate-600"/></button><span className="font-bold text-slate-800 w-32 text-center select-none">{fullMonths[viewMonth]} {viewYear}</span><button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded shadow-sm transition"><ChevronRight className="w-5 h-5 text-slate-600"/></button></div>
        <div className="flex gap-2"><button onClick={() => setShowAnnualReport(true)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2"><Printer className="w-4 h-4"/> Yıllık Rapor Al</button><button onClick={() => { setForm({ date: new Date().toISOString().slice(0,10), type: 'expense', category: 'bakim', amount: '', description: '' }); setEditingId(null); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4"/> İşlem Ekle</button></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl"><div className="text-slate-500 font-bold text-xs uppercase mb-1">Devreden Bakiye</div><div className={`text-xl font-mono font-bold ${rolloverBalance >= 0 ? 'text-slate-700' : 'text-red-600'}`}>₺{rolloverBalance.toLocaleString('tr-TR')}</div></div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl"><div className="text-emerald-800 font-bold text-xs uppercase mb-1">Bu Ay Gelir</div><div className="text-xl font-mono font-bold text-emerald-600">+₺{monthIncome.toLocaleString('tr-TR')}</div></div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl"><div className="text-red-800 font-bold text-xs uppercase mb-1">Bu Ay Gider</div><div className="text-xl font-mono font-bold text-red-600">-₺{monthExpense.toLocaleString('tr-TR')}</div></div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl"><div className="text-blue-800 font-bold text-xs uppercase mb-1">Dönem Sonu</div><div className="text-2xl font-mono font-bold text-blue-700">₺{endBalance.toLocaleString('tr-TR')}</div></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b"><tr><th className="p-4 w-32">Tarih</th><th className="p-4 w-32">Tür</th><th className="p-4 w-40">Kategori</th><th className="p-4">Açıklama</th><th className="p-4 w-32 text-right">Tutar</th><th className="p-4 w-24 text-center">İşlem</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {currentMonthTransactions.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-400">Bu ay için işlem bulunamadı.</td></tr> : currentMonthTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type === 'income' ? 'Gelir' : 'Gider'}</span></td>
                  <td className="p-4 text-slate-700">{getCatLabel(t.category, t.type)}</td>
                  <td className="p-4 font-medium text-slate-800">{t.description}</td>
                  <td className={`p-4 text-right font-mono font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}₺{Number(t.amount).toLocaleString('tr-TR')}</td>
                  <td className="p-4 text-center"><div className="flex justify-center gap-1"><button onClick={() => openEdit(t)} className="p-2 text-blue-400 hover:bg-blue-50 rounded"><Edit3 className="w-4 h-4"/></button><button onClick={() => handleDelete(t.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button></div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4 text-slate-800">{editingId ? 'İşlem Düzenle' : 'Yeni İşlem'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1">Tarih</label><input type="date" className="w-full border p-2 rounded" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1">Tür</label><select className="w-full border p-2 rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value, category: e.target.value === 'income' ? 'kira' : 'bakim'})}><option value="income">Gelir</option><option value="expense">Gider</option></select></div>
              </div>
              <div><label className="text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label><select className="w-full border p-2 rounded" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{categories[form.type].map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase mb-1">Açıklama</label><input required type="text" className="w-full border p-2 rounded" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div><label className="text-xs font-bold text-slate-500 uppercase mb-1">Tutar</label><input required type="number" className="w-full border p-2 rounded" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
              <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">İptal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Kaydet</button></div>
            </form>
          </div>
        </div>
      )}
      {showAnnualReport && (
        <div id="report-modal" className="fixed inset-0 bg-white z-[70] overflow-auto">
           <div id="report-content" className="max-w-4xl mx-auto p-12 font-serif text-black">
              <div className="text-center mb-10 border-b-2 border-black pb-4"><h1 className="text-2xl font-bold uppercase mb-2">Vesayet Hesabı Yıllık Dökümü</h1><p className="text-lg">Dosya: <strong>{client.name}</strong></p><p>Dönem: <strong>{viewYear} Mali Yılı</strong></p></div>
              <div className="mb-8"><h3 className="font-bold border-b border-gray-400 mb-2">Hesap Özeti</h3><div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm"><div className="flex justify-between"><span>Dönem Başı Devreden:</span> <span>₺{allTransactions.filter(t => new Date(t.date).getFullYear() < viewYear).reduce((acc,t)=>acc+(t.type==='income'?+t.amount:-t.amount),0).toLocaleString('tr-TR')}</span></div><div className="flex justify-between font-bold"><span>Toplam Gelir:</span> <span>+₺{allTransactions.filter(t => new Date(t.date).getFullYear() === viewYear && t.type === 'income').reduce((acc,t)=>acc+(+t.amount),0).toLocaleString('tr-TR')}</span></div><div className="flex justify-between font-bold"><span>Toplam Gider:</span> <span>-₺{allTransactions.filter(t => new Date(t.date).getFullYear() === viewYear && t.type === 'expense').reduce((acc,t)=>acc+(+t.amount),0).toLocaleString('tr-TR')}</span></div><div className="flex justify-between border-t border-black pt-1 font-bold text-lg"><span>Dönem Sonu Bakiye:</span> <span>₺{allTransactions.filter(t => new Date(t.date).getFullYear() <= viewYear).reduce((acc,t)=>acc+(t.type==='income'?+t.amount:-t.amount),0).toLocaleString('tr-TR')}</span></div></div></div>
              <div className="mb-8"><h3 className="font-bold border-b border-gray-400 mb-2">Aylık Döküm</h3><table className="w-full text-sm border-collapse border border-gray-300"><thead><tr className="bg-gray-100"><th className="border p-1">Ay</th><th className="border p-1 text-right">Gelir</th><th className="border p-1 text-right">Gider</th><th className="border p-1 text-right">Fark</th></tr></thead><tbody>{fullMonths.map((m, i) => { const mIncome = allTransactions.filter(t => new Date(t.date).getFullYear() === viewYear && new Date(t.date).getMonth() === i && t.type === 'income').reduce((acc,t)=>acc+(+t.amount),0); const mExpense = allTransactions.filter(t => new Date(t.date).getFullYear() === viewYear && new Date(t.date).getMonth() === i && t.type === 'expense').reduce((acc,t)=>acc+(+t.amount),0); return (<tr key={i}><td className="border p-1">{m}</td><td className="border p-1 text-right">{mIncome > 0 ? `₺${mIncome.toLocaleString('tr-TR')}` : '-'}</td><td className="border p-1 text-right">{mExpense > 0 ? `₺${mExpense.toLocaleString('tr-TR')}` : '-'}</td><td className="border p-1 text-right font-bold">₺{(mIncome - mExpense).toLocaleString('tr-TR')}</td></tr>) })}</tbody></table></div>
              <div className="mt-12 flex justify-between text-sm"><div><p>Tarih: {new Date().toLocaleDateString('tr-TR')}</p></div><div className="text-center"><p className="mb-8">Vasi / Vekil</p><p>_______________________</p></div></div>
              <div className="fixed top-4 right-4 print:hidden flex gap-2"><button onClick={() => requestAnimationFrame(() => window.print())} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Yazdır</button><button onClick={() => setShowAnnualReport(false)} className="bg-gray-200 px-4 py-2 rounded font-bold">Kapat</button></div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function VesayetYonetimSistemi() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [appLoading, setAppLoading] = useState(true); 
  
  const [activeModule, setActiveModule] = useState('rents'); 
  const [activeClientId, setActiveClientId] = useState(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', msg: '', onConfirm: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAppLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'app_data', 'main_data');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) setClients(docSnap.data().clients || []);
      else setClients([]);
      setLoading(false);
    }, (err) => {
      console.error("Veri okuma hatası:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const saveToCloud = async (newClients) => {
    if (!user) return;
    setClients([...newClients]); 
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'app_data', 'main_data'), { clients: newClients }, { merge: true });
      setSyncStatus('idle');
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
      alert("Kaydetme hatası: Yetkiniz olmayabilir.");
    }
  };

  const handleLogout = () => {
    if(window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      signOut(auth);
    }
  };

  const triggerConfirm = (title, msg, onConfirm) => {
    setConfirmModal({ 
      show: true, 
      title, 
      msg, 
      onConfirm: () => {
        onConfirm();
        setConfirmModal({ show: false, title: '', msg: '', onConfirm: null }); 
      } 
    });
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const newClient = { id: `c-${Date.now()}`, name: newClientName, tenants: [], lawsuits: [], assets: [], ledger: [] };
    saveToCloud([...clients, newClient]);
    setActiveClientId(newClient.id);
    setNewClientName("");
    setShowAddClientModal(false);
  };

  const activeClient = clients.find(c => c.id === activeClientId) || null;

  if (appLoading) return <div className="flex h-screen items-center justify-center text-blue-600"><RefreshCw className="animate-spin mr-2"/> Güvenli Bağlantı...</div>;
  
  if (!user) return <LoginScreen />;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20 shrink-0 print:hidden">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-lg font-bold flex items-center gap-2 text-blue-400"><ShieldCheck className="w-6 h-6" /> Vesayet Yönetim</h1>
          <p className="text-xs text-slate-400 mt-1">{user.email}</p>
        </div>
        <div className="p-4 border-b border-slate-700">
          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Aktif Dosya</label>
          <select className="w-full bg-slate-800 border border-slate-600 text-sm rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" value={activeClientId || ''} onChange={(e) => setActiveClientId(e.target.value)}>
            <option value="" disabled>Dosya Seçiniz...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowAddClientModal(true)} className="w-full mt-2 text-xs bg-blue-700 hover:bg-blue-600 text-white py-1.5 rounded flex items-center justify-center gap-1 transition"><Plus className="w-3 h-3" /> Yeni Dosya Aç</button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <MenuButton active={activeModule === 'dashboard'} onClick={() => setActiveModule('dashboard')} icon={<PieChart className="w-5 h-5"/>} label="Genel Bakış" />
          <MenuButton active={activeModule === 'upcoming'} onClick={() => setActiveModule('upcoming')} icon={<Clock className="w-5 h-5 text-orange-400"/>} label="Yaklaşan İşlemler" />
          <div className="pt-4 pb-1 text-xs font-bold text-slate-500 uppercase">Operasyon</div>
          <MenuButton active={activeModule === 'rents'} onClick={() => setActiveModule('rents')} icon={<Building className="w-5 h-5"/>} label="Kiralar & Mülkler" count={activeClient?.tenants?.length} />
          <MenuButton active={activeModule === 'accounting'} onClick={() => setActiveModule('accounting')} icon={<Wallet className="w-5 h-5"/>} label="Hesap Defteri" count={activeClient?.ledger?.length} />
          <MenuButton active={activeModule === 'assets'} onClick={() => setActiveModule('assets')} icon={<Home className="w-5 h-5"/>} label="Varlıklar & DASK" count={activeClient?.assets?.length} />
          <div className="pt-4 pb-1 text-xs font-bold text-slate-500 uppercase">Hukuk</div>
          <MenuButton active={activeModule === 'lawsuits'} onClick={() => setActiveModule('lawsuits')} icon={<Gavel className="w-5 h-5"/>} label="Dava & İcra" count={activeClient?.lawsuits?.length} />
        </nav>
        <div className="p-4 bg-slate-950 border-t border-slate-800">
           <div className="flex justify-between items-center mb-2 text-xs text-slate-500">
             <span>{syncStatus === 'syncing' ? 'Kaydediliyor...' : 'Senkronize'}</span>
             {syncStatus === 'syncing' ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Cloud className="w-3 h-3 text-green-500"/>}
           </div>
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2 rounded transition"><LogOut className="w-3 h-3"/> Çıkış Yap</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 shadow-sm z-10 shrink-0 print:hidden">
          <h2 className="font-bold text-lg text-slate-700">{activeClient ? activeClient.name : 'Lütfen Dosya Seçiniz'}{activeClient && <span className="ml-2 text-sm font-normal text-slate-400">/ {getModuleName(activeModule)}</span>}</h2>
        </header>
        <main className="flex-1 overflow-y-auto p-6 relative bg-slate-50 print:p-0 print:bg-white print:overflow-visible">
          {!activeClient ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400"><Users className="w-16 h-16 mb-4 opacity-20" /><p>İşlem yapmak için soldan bir müvekkil/kısıtlı dosyası seçin.</p></div>
          ) : (
            <>
              {activeModule === 'dashboard' && <DashboardModule client={activeClient} />}
              {activeModule === 'upcoming' && <UpcomingModule client={activeClient} />}
              {activeModule === 'rents' && <RentModule client={activeClient} triggerConfirm={triggerConfirm} updateClient={(updated) => { const newClients = clients.map(c => c.id === updated.id ? updated : c); saveToCloud(newClients); }} />}
              {activeModule === 'lawsuits' && <LawsuitModule client={activeClient} triggerConfirm={triggerConfirm} updateClient={(updated) => { const newClients = clients.map(c => c.id === updated.id ? updated : c); saveToCloud(newClients); }} />}
              {activeModule === 'assets' && <AssetModule client={activeClient} triggerConfirm={triggerConfirm} updateClient={(updated) => { const newClients = clients.map(c => c.id === updated.id ? updated : c); saveToCloud(newClients); }} />}
              {activeModule === 'accounting' && <AccountingModule client={activeClient} triggerConfirm={triggerConfirm} updateClient={(updated) => { const newClients = clients.map(c => c.id === updated.id ? updated : c); saveToCloud(newClients); }} />}
            </>
          )}
        </main>
      </div>

      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 border-t-4 border-red-500">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-full"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
              <div><h3 className="text-lg font-bold text-gray-800 mb-2">{confirmModal.title}</h3><p className="text-sm text-gray-600 leading-relaxed">{confirmModal.msg}</p></div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setConfirmModal({ ...confirmModal, show: false })} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">İptal</button>
              <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm shadow-md">Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-4">Yeni Dosya Aç</h3>
            <input autoFocus type="text" className="w-full border p-2 rounded mb-4 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Kısıtlı Adı / Dosya No" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddClientModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">İptal</button>
              <button onClick={handleAddClient} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Oluştur</button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`@media print { body * { visibility: hidden; } #report-modal, #report-modal * { visibility: visible; } #report-modal { position: absolute; left: 0; top: 0; width: 100%; height: auto; margin: 0; padding: 0; background: white; z-index: 9999; } #report-content { margin: 0; padding: 20px; width: 100%; } .print\\:hidden { display: none !important; } }`}</style>
    </div>
  );
}
