import { useState, useEffect, useCallback, useMemo } from "react";

// ╔════════════════════════════════════════════════════════════════╗
// ║  CONFIGURATION — EDIT THESE PLACEHOLDERS                      ║
// ╚════════════════════════════════════════════════════════════════╝

// GCash payment details
var GCASH_NUMBER = "09XX XXX XXXX";
var GCASH_NAME = "YOUR NAME HERE";

// Price
var PRICE = "111.00";
var PRICE_DISPLAY = "\u20b1111";

// Email where form submissions are sent (used in mailto fallback)
var CONTACT_EMAIL = "your@email.com";

// Access codes — add new codes here as you sell them
// Users enter one of these to unlock the app
var VALID_CODES = [
  "LEDGER-001",
  "LEDGER-002",
  "LEDGER-003",
  "LEDGER-004",
  "LEDGER-005",
  "LEDGER-DEMO",
];

// ═══════════════════════════════════════════════════════════════════

var CATEGORIES = [
  { id: "food", label: "Food", icon: "restaurant" },
  { id: "transport", label: "Transportation", icon: "directions_bus" },
  { id: "clothes", label: "Clothes", icon: "checkroom" },
  { id: "nonessential", label: "Non-essential", icon: "local_activity" },
  { id: "school", label: "School", icon: "school" },
  { id: "rent", label: "Rent", icon: "home" },
  { id: "electricity", label: "Electricity", icon: "bolt" },
  { id: "water", label: "Water", icon: "water_drop" },
  { id: "internet", label: "Internet", icon: "wifi" },
  { id: "subscriptions", label: "Subscriptions", icon: "subscriptions" },
  { id: "other", label: "Others", icon: "more_horiz" },
];

var VIEWS = ["log", "weekly", "monthly", "recurring", "reports"];

var CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "\u20ac", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "\u00a3", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "\u00a5", name: "Japanese Yen", locale: "ja-JP" },
  { code: "PHP", symbol: "\u20b1", name: "Philippine Peso", locale: "en-PH" },
  { code: "KRW", symbol: "\u20a9", name: "Korean Won", locale: "ko-KR" },
  { code: "CNY", symbol: "\u00a5", name: "Chinese Yuan", locale: "zh-CN" },
  { code: "INR", symbol: "\u20b9", name: "Indian Rupee", locale: "en-IN" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", locale: "es-MX" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "THB", symbol: "\u0e3f", name: "Thai Baht", locale: "th-TH" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", locale: "id-ID" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", locale: "de-CH" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", locale: "sv-SE" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", locale: "en-NZ" },
  { code: "AED", symbol: "\u062f.\u0625", name: "UAE Dirham", locale: "ar-AE" },
  { code: "NGN", symbol: "\u20a6", name: "Nigerian Naira", locale: "en-NG" },
];

function generateId() { return "LX-" + String(Math.floor(1000 + Math.random() * 9000)); }

function formatCurrency(n, cc) {
  if (!cc) cc = "USD";
  var cur = CURRENCIES.find(function(c) { return c.code === cc; }) || CURRENCIES[0];
  var d = (cur.code === "JPY" || cur.code === "KRW") ? 0 : 2;
  return new Intl.NumberFormat(cur.locale, { style: "currency", currency: cur.code, minimumFractionDigits: d }).format(n);
}

function getMonthKey(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function getWeekKey(d) { var day = d.getDay(); var diff = d.getDate() - day + (day === 0 ? -6 : 1); var mon = new Date(d); mon.setDate(diff); return mon.toISOString().slice(0, 10); }

var SK = "ledger-data";
function loadData() { try { var r = localStorage.getItem(SK); if (r) return JSON.parse(r); } catch (e) { } return null; }
function saveData(d) { try { localStorage.setItem(SK, JSON.stringify(d)); } catch (e) { } }

function Icon({ name, className = "" }) {
  return <span className={"material-symbols-outlined " + className} style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>{name}</span>;
}

var fH = { fontFamily: "Space Grotesk, sans-serif" };
var fL = { fontFamily: "Space Grotesk, sans-serif" };

// ╔════════════════════════════════════════════════════════════════╗
// ║  LANDING PAGE                                                  ║
// ╚════════════════════════════════════════════════════════════════╝

function LandingPage({ onUnlock }) {
  var [code, setCode] = useState("");
  var [codeError, setCodeError] = useState("");
  var [showCodeInput, setShowCodeInput] = useState(false);
  var [formName, setFormName] = useState("");
  var [formEmail, setFormEmail] = useState("");
  var [formRef, setFormRef] = useState("");
  var [formSent, setFormSent] = useState(false);
  var [scrolled, setScrolled] = useState(false);

  useEffect(function() {
    var handler = function() { setScrolled(window.scrollY > 50); };
    window.addEventListener("scroll", handler);
    return function() { window.removeEventListener("scroll", handler); };
  }, []);

  var tryCode = function() {
    var clean = code.trim().toUpperCase();
    if (VALID_CODES.indexOf(clean) !== -1) {
      localStorage.setItem("ledger-unlock", clean);
      onUnlock();
    } else {
      setCodeError("Invalid code. Please check and try again.");
    }
  };

  var submitForm = function() {
    if (!formName || !formRef) return;
    var subject = "LEDGER Order - " + formRef;
    var body = "Name: " + formName + "\nEmail: " + formEmail + "\nGCash Ref: " + formRef + "\nAmount: PHP " + PRICE;
    window.open("mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body));
    setFormSent(true);
  };

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Nav */}
      <header className={"fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 transition-all " + (scrolled ? "bg-white border-b-2 border-black" : "bg-transparent")}>
        <div className="text-2xl font-bold tracking-tighter uppercase" style={fH}>LEDGER</div>
        <div className="flex gap-3">
          <button onClick={function() { setShowCodeInput(true); }} className="border border-black px-4 py-1 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors" style={fL}>Enter Code</button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-12 max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/50 mb-4" style={fL}>Simple Labs PH</p>
        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]" style={fH}>DUDE,<br />WHERE'S MY<br />MONEY?</h1>
        <p className="text-lg md:text-xl text-black/60 mt-6 max-w-xl" style={{ fontFamily: "Inter" }}>A brutalist expense tracker for freelancers who want to know exactly where every peso goes. No fluff. No subscriptions. Just clarity.</p>
        <div className="flex flex-wrap gap-4 mt-8">
          <a href="#pricing" className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-neutral-800 active:scale-[0.98] transition-all" style={fH}>Get it for {PRICE_DISPLAY}</a>
          <a href="#features" className="border-2 border-black px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all" style={fH}>See Features</a>
        </div>
      </section>

      {/* Preview */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto mb-20">
        <div className="border-2 border-black p-8 bg-neutral-50">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {CATEGORIES.slice(0, 5).map(function(cat) { return (
              <div key={cat.id} className="aspect-square border border-black flex flex-col items-center justify-center gap-2 bg-white">
                <Icon name={cat.icon} className="text-2xl" />
                <span className="text-[9px] uppercase font-bold" style={fL}>{cat.label}</span>
              </div>
            ); })}
          </div>
          <div className="flex justify-between items-end border-b border-black pb-2 mb-3">
            <span className="text-xs uppercase" style={fL}>Monthly Total</span>
            <span className="font-bold text-lg" style={fH}>{"\u20b1"}12,450.00</span>
          </div>
          <div className="flex justify-between items-end border-b border-black pb-2 mb-3">
            <span className="text-xs uppercase" style={fL}>Budget Remaining</span>
            <span className="font-bold text-lg" style={fH}>{"\u20b1"}7,550.00</span>
          </div>
          <div className="flex justify-between items-end border-b border-black pb-2">
            <span className="text-xs uppercase" style={fL}>Transactions</span>
            <span className="font-bold text-lg" style={fH}>24 tx</span>
          </div>
          <div className="mt-4 bg-black/5 px-4 py-2 text-center"><p className="text-[10px] uppercase tracking-widest text-black/40" style={fL}>Live preview &mdash; Unlock to use</p></div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 md:px-12 max-w-5xl mx-auto mb-20">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-12" style={fH}>WHAT YOU GET</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: "bolt", title: "Fast Entry", desc: "Tap a category, enter amount, done. Log expenses in under 3 seconds." },
            { icon: "calendar_month", title: "Monthly & Weekly Views", desc: "See breakdowns by week or month with auto-calculated summaries." },
            { icon: "repeat", title: "Recurring Expenses", desc: "Set up rent, subscriptions, utilities. Get reminded each month." },
            { icon: "currency_exchange", title: "20 Currencies", desc: "PHP, USD, EUR, JPY, and 16 more. Switch anytime." },
            { icon: "download", title: "CSV Export", desc: "Download your data anytime. Your data, your control." },
            { icon: "wifi_off", title: "Works Offline", desc: "Install on your phone. Use without internet after first load." },
            { icon: "analytics", title: "Reports & Insights", desc: "Category breakdowns, top expenses, key metrics at a glance." },
            { icon: "edit", title: "Customizable", desc: "Rename your dashboard, set your budget, make it yours." },
          ].map(function(f) { return (
            <div key={f.title} className="border-2 border-black p-6 flex gap-4 hover:bg-neutral-50 transition-colors">
              <div className="w-12 h-12 border border-black flex items-center justify-center shrink-0"><Icon name={f.icon} className="text-2xl" /></div>
              <div>
                <h3 className="font-bold uppercase text-sm mb-1" style={fL}>{f.title}</h3>
                <p className="text-xs text-black/60">{f.desc}</p>
              </div>
            </div>
          ); })}
        </div>
      </section>

      {/* Pricing + Payment */}
      <section id="pricing" className="px-6 md:px-12 max-w-5xl mx-auto mb-20">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-12" style={fH}>GET LEDGER</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Price Card */}
          <div className="border-2 border-black">
            <div className="bg-black text-white p-8">
              <p className="text-[10px] uppercase tracking-widest text-white/50" style={fL}>One-time payment</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-6xl font-black" style={fH}>{PRICE_DISPLAY}</span>
                <span className="text-sm text-white/50 uppercase" style={fL}>PHP</span>
              </div>
              <p className="text-xs text-white/60 mt-2">Pay once. Use forever. No subscriptions.</p>
            </div>
            <div className="p-8 space-y-4">
              <h3 className="font-bold uppercase text-sm mb-4" style={fL}>How to pay:</h3>
              <div className="border border-black p-4">
                <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={fL}>GCash</p>
                <p className="text-lg font-bold" style={fH}>{GCASH_NUMBER}</p>
                <p className="text-xs text-black/60">{GCASH_NAME}</p>
              </div>
              <div className="border border-dashed border-black/30 p-4 flex items-center justify-center min-h-[120px]">
                <p className="text-[10px] uppercase tracking-widest text-black/30 text-center" style={fL}>GCash QR Code<br />Upload your QR image to<br />public/gcash-qr.png</p>
              </div>
              <p className="text-[10px] text-black/40" style={fL}>Send exactly PHP {PRICE} via GCash. Save the reference number.</p>
            </div>
          </div>

          {/* Order Form */}
          <div className="border-2 border-black">
            <div className="bg-black text-white px-8 py-4">
              <h3 className="font-bold uppercase tracking-tighter" style={fH}>Claim Your Access</h3>
            </div>
            {formSent ? (
              <div className="p-8 text-center">
                <Icon name="check_circle" className="text-5xl mb-4" />
                <h3 className="text-xl font-bold uppercase mb-2" style={fH}>Order Submitted!</h3>
                <p className="text-sm text-black/60 mb-4">We'll verify your payment and send your access code within a few hours. Check your email!</p>
                <p className="text-[10px] text-black/40" style={fL}>Already have a code?</p>
                <button onClick={function() { setShowCodeInput(true); }} className="mt-2 border border-black px-4 py-2 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors" style={fL}>Enter Code</button>
              </div>
            ) : (
              <div className="p-8 space-y-4">
                <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Your Name *</label>
                  <input type="text" value={formName} onChange={function(e) { setFormName(e.target.value); }} placeholder="Juan Dela Cruz" className="w-full border border-black p-3 text-sm focus:outline-none focus:ring-0" /></div>
                <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Email</label>
                  <input type="email" value={formEmail} onChange={function(e) { setFormEmail(e.target.value); }} placeholder="juan@email.com" className="w-full border border-black p-3 text-sm focus:outline-none focus:ring-0" /></div>
                <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>GCash Reference Number *</label>
                  <input type="text" value={formRef} onChange={function(e) { setFormRef(e.target.value); }} placeholder="e.g. 1234 5678 9012" className="w-full border-2 border-black p-3 text-sm font-bold focus:outline-none focus:ring-0" style={fH} /></div>
                <button onClick={submitForm} className={"w-full py-4 font-bold uppercase tracking-widest text-sm active:scale-[0.98] transition-all " + (formName && formRef ? "bg-black text-white hover:bg-neutral-800" : "bg-neutral-200 text-neutral-400 cursor-not-allowed")} style={fH}>Submit Order</button>
                <p className="text-[10px] text-black/40 text-center" style={fL}>You'll receive your access code via email after payment verification.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-black px-6 md:px-12 py-8 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div><span className="text-sm font-bold uppercase tracking-tighter" style={fH}>LEDGER</span><span className="text-xs text-black/40 ml-2" style={fL}>by Simple Labs PH</span></div>
        <button onClick={function() { setShowCodeInput(true); }} className="text-xs uppercase tracking-widest text-black/40 hover:text-black transition-colors" style={fL}>Already have a code? Enter here</button>
      </footer>

      {/* Code Entry Modal */}
      {showCodeInput && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={function() { setShowCodeInput(false); setCodeError(""); }}>
          <div className="bg-white border-2 border-black w-full max-w-sm" onClick={function(e) { e.stopPropagation(); }}>
            <div className="bg-black text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold uppercase tracking-tighter" style={fH}>Enter Access Code</h3>
              <button onClick={function() { setShowCodeInput(false); setCodeError(""); }}><Icon name="close" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" value={code} onChange={function(e) { setCode(e.target.value); setCodeError(""); }}
                onKeyDown={function(e) { if (e.key === "Enter") tryCode(); }}
                placeholder="LEDGER-XXX" className="w-full border-2 border-black p-4 text-xl font-bold uppercase text-center tracking-widest focus:outline-none" style={fH} autoFocus />
              {codeError && <p className="text-xs text-red-600 text-center font-bold uppercase" style={fL}>{codeError}</p>}
              <button onClick={tryCode} className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-neutral-800 active:scale-[0.98] transition-all" style={fH}>Unlock LEDGER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════╗
// ║  EXPENSE TRACKER MODALS                                       ║
// ╚════════════════════════════════════════════════════════════════╝

function AddModal({ category, onClose, onAdd, currencySymbol }) {
  var [amt, setAmt] = useState(""); var [desc, setDesc] = useState(""); var [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  var submit = function() { var v = parseFloat(amt); if (!v || v <= 0) return; onAdd({ id: generateId(), category: category.id, categoryLabel: category.label, description: desc || category.label + " expense", amount: v, date: date, timestamp: Date.now() }); onClose(); };
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border-2 border-black w-full max-w-md" onClick={function(e) { e.stopPropagation(); }}>
        <div className="bg-black text-white px-6 py-4 flex justify-between items-center"><h3 className="font-bold uppercase tracking-tighter text-lg" style={fH}><Icon name={category.icon} className="mr-2 text-xl align-middle" />{category.label}</h3><button onClick={onClose} className="hover:opacity-60"><Icon name="close" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Amount ({currencySymbol})</label><input type="number" step="0.01" min="0" value={amt} onChange={function(e) { setAmt(e.target.value); }} placeholder="0.00" className="w-full border-2 border-black p-3 text-2xl font-bold focus:outline-none focus:ring-0" style={fH} autoFocus /></div>
          <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Description</label><input type="text" value={desc} onChange={function(e) { setDesc(e.target.value); }} placeholder="Type detailed item info..." className="w-full border border-black p-3 text-sm focus:outline-none focus:ring-0" /></div>
          <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Date</label><input type="date" value={date} onChange={function(e) { setDate(e.target.value); }} className="w-full border border-black p-3 text-sm focus:outline-none focus:ring-0" style={fH} /></div>
          <button onClick={submit} className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-neutral-800 active:scale-[0.98] transition-all" style={fH}>Log Expense</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ expense, onClose, onSave, onDelete }) {
  var [amt, setAmt] = useState(String(expense.amount)); var [desc, setDesc] = useState(expense.description); var [date, setDate] = useState(expense.date);
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border-2 border-black w-full max-w-md" onClick={function(e) { e.stopPropagation(); }}>
        <div className="bg-black text-white px-6 py-4 flex justify-between items-center"><h3 className="font-bold uppercase tracking-tighter text-lg" style={fH}>Edit #{expense.id}</h3><button onClick={onClose} className="hover:opacity-60"><Icon name="close" /></button></div>
        <div className="p-6 space-y-4">
          <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Amount</label><input type="number" step="0.01" value={amt} onChange={function(e) { setAmt(e.target.value); }} className="w-full border-2 border-black p-3 text-2xl font-bold focus:outline-none" style={fH} /></div>
          <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Description</label><input type="text" value={desc} onChange={function(e) { setDesc(e.target.value); }} className="w-full border border-black p-3 text-sm focus:outline-none" /></div>
          <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Date</label><input type="date" value={date} onChange={function(e) { setDate(e.target.value); }} className="w-full border border-black p-3 text-sm focus:outline-none" style={fH} /></div>
          <div className="flex gap-3"><button onClick={function() { onSave({ ...expense, amount: parseFloat(amt), description: desc, date: date }); onClose(); }} className="flex-1 bg-black text-white py-3 font-bold uppercase tracking-widest text-sm hover:bg-neutral-800 active:scale-[0.98] transition-all" style={fH}>Save</button><button onClick={function() { onDelete(expense.id); onClose(); }} className="px-6 border-2 border-black text-black py-3 font-bold uppercase tracking-widest text-sm hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-[0.98] transition-all" style={fH}>Delete</button></div>
        </div>
      </div>
    </div>
  );
}

function BudgetModal({ budget, onClose, onSave }) {
  var [val, setVal] = useState(String(budget));
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border-2 border-black w-full max-w-sm" onClick={function(e) { e.stopPropagation(); }}>
        <div className="bg-black text-white px-6 py-4 flex justify-between items-center"><h3 className="font-bold uppercase tracking-tighter" style={fH}>Set Budget</h3><button onClick={onClose}><Icon name="close" /></button></div>
        <div className="p-6 space-y-4"><input type="number" step="0.01" value={val} onChange={function(e) { setVal(e.target.value); }} className="w-full border-2 border-black p-3 text-2xl font-bold focus:outline-none" style={fH} autoFocus /><button onClick={function() { onSave(parseFloat(val) || 0); onClose(); }} className="w-full bg-black text-white py-3 font-bold uppercase tracking-widest text-sm" style={fH}>Update Budget</button></div>
      </div>
    </div>
  );
}

function CurrencyPicker({ currency, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border-2 border-black w-full max-w-sm max-h-[80vh] flex flex-col" onClick={function(e) { e.stopPropagation(); }}>
        <div className="bg-black text-white px-6 py-4 flex justify-between items-center shrink-0"><h3 className="font-bold uppercase tracking-tighter" style={fH}>Currency</h3><button onClick={onClose}><Icon name="close" /></button></div>
        <div className="overflow-y-auto flex-1">{CURRENCIES.map(function(c) { return (<button key={c.code} onClick={function() { onSelect(c.code); onClose(); }} className={"w-full flex items-center justify-between px-6 py-4 border-b border-black/10 hover:bg-neutral-100 transition-colors text-left " + (currency === c.code ? "bg-black text-white hover:bg-neutral-800" : "")}><div className="flex items-center gap-3"><span className="text-lg font-bold w-8" style={fH}>{c.symbol}</span><div><span className="text-sm font-bold uppercase" style={fL}>{c.code}</span><span className={"text-xs ml-2 " + (currency === c.code ? "text-white/60" : "text-black/60")}>{c.name}</span></div></div>{currency === c.code && <Icon name="check" className="text-lg" />}</button>); })}</div>
      </div>
    </div>
  );
}

function AddRecurringModal({ onClose, onAdd, currencySymbol }) {
  var [cat, setCat] = useState(null); var [amt, setAmt] = useState(""); var [desc, setDesc] = useState(""); var [dayOfMonth, setDay] = useState("1");
  var submit = function() { var v = parseFloat(amt); if (!v || v <= 0 || !cat) return; onAdd({ id: "RC-" + String(Math.floor(1000 + Math.random() * 9000)), category: cat.id, categoryLabel: cat.label, icon: cat.icon, description: desc || cat.label + " (recurring)", amount: v, dayOfMonth: parseInt(dayOfMonth) || 1, active: true }); onClose(); };
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border-2 border-black w-full max-w-md max-h-[90vh] flex flex-col" onClick={function(e) { e.stopPropagation(); }}>
        <div className="bg-black text-white px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold uppercase tracking-tighter text-lg" style={fH}><Icon name="repeat" className="mr-2 text-xl align-middle" />New Recurring</h3>
          <button onClick={onClose} className="hover:opacity-60"><Icon name="close" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-2" style={fH}>Category</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {CATEGORIES.map(function(c) { return (
                <button key={c.id} onClick={function() { setCat(c); }} className={"border border-black flex flex-col items-center justify-center gap-1 p-2 transition-colors " + (cat && cat.id === c.id ? "bg-black text-white" : "hover:bg-neutral-100")}>
                  <Icon name={c.icon} className="text-lg" /><span className="text-[7px] uppercase font-bold leading-tight text-center" style={fL}>{c.label}</span>
                </button>
              ); })}
            </div>
          </div>
          <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Amount ({currencySymbol})</label>
            <input type="number" step="0.01" min="0" value={amt} onChange={function(e) { setAmt(e.target.value); }} placeholder="0.00" className="w-full border-2 border-black p-3 text-xl font-bold focus:outline-none focus:ring-0" style={fH} /></div>
          <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Description</label>
            <input type="text" value={desc} onChange={function(e) { setDesc(e.target.value); }} placeholder="e.g. Netflix, Rent, etc." className="w-full border border-black p-3 text-sm focus:outline-none focus:ring-0" /></div>
          <div><label className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={fH}>Day of Month (1-28)</label>
            <input type="number" min="1" max="28" value={dayOfMonth} onChange={function(e) { setDay(e.target.value); }} className="w-full border border-black p-3 text-sm focus:outline-none focus:ring-0" style={fH} /></div>
          <button onClick={submit} className={"w-full py-4 font-bold uppercase tracking-widest text-sm active:scale-[0.98] transition-all " + (cat ? "bg-black text-white hover:bg-neutral-800" : "bg-neutral-200 text-neutral-400 cursor-not-allowed")} style={fH}>Add Recurring</button>
        </div>
      </div>
    </div>
  );
}

function PendingBanner({ pending, fmt, onConfirm, onSkip, onDismiss }) {
  if (pending.length === 0) return null;
  var total = pending.reduce(function(s, p) { return s + p.amount; }, 0);
  return (
    <div className="border-2 border-black bg-white mb-8">
      <div className="bg-black text-white px-6 py-3 flex justify-between items-center"><h3 className="font-bold uppercase tracking-tighter text-sm" style={fH}><Icon name="notifications" className="mr-2 text-lg align-middle" />Recurring Expenses Due</h3><button onClick={onDismiss} className="hover:opacity-60"><Icon name="close" className="text-lg" /></button></div>
      <div className="p-4">
        <p className="text-xs uppercase text-black/60 mb-3" style={fL}>{pending.length} expense{pending.length > 1 ? "s" : ""} due this month &mdash; Total: {fmt(total)}</p>
        {pending.map(function(p) { return (<div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-black/10 gap-2"><div className="flex items-center gap-3"><Icon name={p.icon} className="text-xl" /><div><p className="text-sm font-bold uppercase" style={fL}>{p.description}</p><p className="text-[10px] text-black/50" style={fL}>Day {p.dayOfMonth} &bull; {p.categoryLabel}</p></div></div><div className="flex items-center gap-2 ml-auto"><span className="text-sm font-bold mr-2" style={fH}>{fmt(p.amount)}</span><button onClick={function() { onConfirm(p); }} className="border border-black px-3 py-1 text-[10px] uppercase font-bold hover:bg-black hover:text-white transition-colors" style={fL}>Log</button><button onClick={function() { onSkip(p); }} className="border border-black/30 px-3 py-1 text-[10px] uppercase font-bold text-black/40 hover:bg-neutral-100 transition-colors" style={fL}>Skip</button></div></div>); })}
        <div className="flex gap-3 mt-4"><button onClick={function() { pending.forEach(function(p) { onConfirm(p); }); }} className="flex-1 bg-black text-white py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-800 active:scale-[0.98] transition-all" style={fH}>Log All ({fmt(total)})</button><button onClick={onDismiss} className="px-6 border border-black py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-100 transition-all" style={fH}>Dismiss</button></div>
      </div>
    </div>
  );
}

// ╔════════════════════════════════════════════════════════════════╗
// ║  MAIN APP                                                     ║
// ╚════════════════════════════════════════════════════════════════╝

export default function LedgerApp() {
  var [unlocked, setUnlocked] = useState(false);
  var [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(function() {
    var saved = localStorage.getItem("ledger-unlock");
    if (saved && VALID_CODES.indexOf(saved.toUpperCase()) !== -1) { setUnlocked(true); }
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) { return (<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-2xl font-bold uppercase tracking-tighter animate-pulse" style={fH}>LEDGER</div></div>); }
  if (!unlocked) { return <LandingPage onUnlock={function() { setUnlocked(true); }} />; }

  return <TrackerApp />;
}

function TrackerApp() {
  var [expenses, setExpenses] = useState([]);
  var [budget, setBudget] = useState(2200);
  var [view, setView] = useState("log");
  var [selectedCategory, setSelectedCategory] = useState(null);
  var [editingExpense, setEditingExpense] = useState(null);
  var [showBudgetModal, setShowBudgetModal] = useState(false);
  var [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  var [showAddRecurring, setShowAddRecurring] = useState(false);
  var [loaded, setLoaded] = useState(false);
  var [userName, setUserName] = useState("You");
  var [currency, setCurrency] = useState("PHP");
  var [recurring, setRecurring] = useState([]);
  var [loggedRecurring, setLoggedRecurring] = useState({});
  var [pendingDismissed, setPendingDismissed] = useState(false);
  var [headerTitle, setHeaderTitle] = useState("DUDE, WHERE'S MY MONEY?");
  var [editingTitle, setEditingTitle] = useState(false);
  var [tempTitle, setTempTitle] = useState("");
  var [selectedMonth, setSelectedMonth] = useState(function() { var n = new Date(); return n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0"); });

  var fmt = useCallback(function(n) { return formatCurrency(n, currency); }, [currency]);
  var currencySymbol = useMemo(function() { var c = CURRENCIES.find(function(c) { return c.code === currency; }); return c ? c.symbol : "$"; }, [currency]);

  useEffect(function() {
    var data = loadData();
    if (data) {
      setExpenses(data.expenses || []); setBudget(data.budget != null ? data.budget : 2200);
      if (data.userName) setUserName(data.userName); if (data.currency) setCurrency(data.currency);
      if (data.selectedMonth) setSelectedMonth(data.selectedMonth);
      if (data.recurring) setRecurring(data.recurring);
      if (data.loggedRecurring) setLoggedRecurring(data.loggedRecurring);
      if (data.headerTitle) setHeaderTitle(data.headerTitle);
    }
    setLoaded(true);
  }, []);

  useEffect(function() {
    if (!loaded) return;
    saveData({ expenses: expenses, budget: budget, userName: userName, currency: currency, selectedMonth: selectedMonth, recurring: recurring, loggedRecurring: loggedRecurring, headerTitle: headerTitle });
  }, [expenses, budget, userName, currency, selectedMonth, recurring, loggedRecurring, headerTitle, loaded]);

  var addExpense = useCallback(function(exp) { setExpenses(function(prev) { return [exp].concat(prev); }); }, []);
  var updateExpense = useCallback(function(exp) { setExpenses(function(prev) { return prev.map(function(e) { return e.id === exp.id ? exp : e; }); }); }, []);
  var deleteExpense = useCallback(function(id) { setExpenses(function(prev) { return prev.filter(function(e) { return e.id !== id; }); }); }, []);
  var addRecurringItem = useCallback(function(r) { setRecurring(function(prev) { return prev.concat([r]); }); }, []);
  var deleteRecurringItem = useCallback(function(id) { setRecurring(function(prev) { return prev.filter(function(r) { return r.id !== id; }); }); }, []);
  var toggleRecurringItem = useCallback(function(id) { setRecurring(function(prev) { return prev.map(function(r) { return r.id === id ? { ...r, active: !r.active } : r; }); }); }, []);

  var now = new Date();
  var currentWeekKey = getWeekKey(now);
  var currentMK = getMonthKey(now);

  var pendingRecurring = useMemo(function() { return recurring.filter(function(r) { if (!r.active) return false; return !loggedRecurring[currentMK + "-" + r.id]; }); }, [recurring, loggedRecurring, currentMK]);

  var confirmRecurring = function(r) { var parts = currentMK.split("-"); var expDate = parts[0] + "-" + parts[1] + "-" + String(Math.min(r.dayOfMonth, 28)).padStart(2, "0"); addExpense({ id: generateId(), category: r.category, categoryLabel: r.categoryLabel, description: r.description + " (recurring)", amount: r.amount, date: expDate, timestamp: Date.now() }); setLoggedRecurring(function(prev) { var next = { ...prev }; next[currentMK + "-" + r.id] = now.toISOString().slice(0, 10); return next; }); };
  var skipRecurring = function(r) { setLoggedRecurring(function(prev) { var next = { ...prev }; next[currentMK + "-" + r.id] = "skipped"; return next; }); };

  var shiftMonth = function(dir) { var p = selectedMonth.split("-"); var y = parseInt(p[0]); var m = parseInt(p[1]); var d = new Date(y, m - 1 + dir, 1); setSelectedMonth(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")); };
  var isCurrentMonth = selectedMonth === currentMK;

  var monthExpenses = useMemo(function() { return expenses.filter(function(e) { return getMonthKey(new Date(e.date)) === selectedMonth; }); }, [expenses, selectedMonth]);
  var weekExpenses = useMemo(function() { return expenses.filter(function(e) { return getWeekKey(new Date(e.date)) === currentWeekKey; }); }, [expenses, currentWeekKey]);
  var monthTotal = useMemo(function() { return monthExpenses.reduce(function(s, e) { return s + e.amount; }, 0); }, [monthExpenses]);
  var weekTotal = useMemo(function() { return weekExpenses.reduce(function(s, e) { return s + e.amount; }, 0); }, [weekExpenses]);
  var isOverBudget = monthTotal > budget;
  var weekDays = useMemo(function() { var map = {}; weekExpenses.forEach(function(e) { map[e.date] = (map[e.date] || 0) + e.amount; }); var mon = new Date(currentWeekKey); return Array.from({ length: 7 }, function(_, i) { var d = new Date(mon); d.setDate(mon.getDate() + i); return map[d.toISOString().slice(0, 10)] || 0; }); }, [weekExpenses, currentWeekKey]);
  var weekAvg = weekExpenses.length > 0 ? weekTotal / 7 : 0;
  var weekHighest = weekExpenses.length > 0 ? Math.max.apply(null, weekExpenses.map(function(e) { return e.amount; })) : 0;
  var weekMax = Math.max.apply(null, weekDays.concat([1]));
  var categoryBreakdown = useMemo(function() { var map = {}; monthExpenses.forEach(function(e) { map[e.category] = (map[e.category] || 0) + e.amount; }); return Object.entries(map).map(function(en) { return { category: en[0], amount: en[1], pct: monthTotal > 0 ? Math.round((en[1] / monthTotal) * 100) : 0 }; }).sort(function(a, b) { return b.amount - a.amount; }); }, [monthExpenses, monthTotal]);
  var budgetPct = budget > 0 ? Math.min(Math.round((monthTotal / budget) * 100), 100) : 0;
  var exportCSV = function() { var rows = [["REF_ID", "DATE", "CATEGORY", "DESCRIPTION", "AMOUNT", "CURRENCY"]]; var list = view === "weekly" ? weekExpenses : view === "monthly" ? monthExpenses : expenses; list.forEach(function(e) { rows.push(["#" + e.id, e.date, e.categoryLabel, '"' + e.description + '"', e.amount.toFixed(2), currency]); }); var csv = rows.map(function(r) { return r.join(","); }).join("\n"); var blob = new Blob([csv], { type: "text/csv" }); var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = url; a.download = "ledger-" + view + "-" + now.toISOString().slice(0, 10) + ".csv"; a.click(); URL.revokeObjectURL(url); };
  var monthName = useMemo(function() { var p = selectedMonth.split("-"); return new Date(parseInt(p[0]), parseInt(p[1]) - 1).toLocaleString("default", { month: "long", year: "numeric" }); }, [selectedMonth]);
  var initials = userName.split(" ").map(function(w) { return w[0]; }).join("").toUpperCase().slice(0, 2) || "U";
  var recurringTotal = useMemo(function() { return recurring.filter(function(r) { return r.active; }).reduce(function(s, r) { return s + r.amount; }, 0); }, [recurring]);

  if (!loaded) { return (<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-2xl font-bold uppercase tracking-tighter animate-pulse" style={fH}>LEDGER</div></div>); }

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "Inter, sans-serif" }}>
      {selectedCategory && <AddModal category={selectedCategory} onClose={function() { setSelectedCategory(null); }} onAdd={addExpense} currencySymbol={currencySymbol} />}
      {editingExpense && <EditModal expense={editingExpense} onClose={function() { setEditingExpense(null); }} onSave={updateExpense} onDelete={deleteExpense} />}
      {showBudgetModal && <BudgetModal budget={budget} onClose={function() { setShowBudgetModal(false); }} onSave={setBudget} />}
      {showCurrencyPicker && <CurrencyPicker currency={currency} onClose={function() { setShowCurrencyPicker(false); }} onSelect={setCurrency} />}
      {showAddRecurring && <AddRecurringModal onClose={function() { setShowAddRecurring(false); }} onAdd={addRecurringItem} currencySymbol={currencySymbol} />}

      <header className="fixed top-0 w-full border-b-2 border-black bg-white z-50 flex justify-between items-center px-6 h-16">
        <div className="text-2xl font-bold tracking-tighter uppercase" style={fH}>LEDGER</div>
        <div className="flex gap-3 items-center">
          <button onClick={function() { setShowCurrencyPicker(true); }} className="flex items-center gap-1 border border-black px-3 py-1 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors" style={fL}><Icon name="currency_exchange" className="text-base" /> {currency}</button>
          <div className="hidden md:flex gap-6 items-center"><nav className="flex gap-1">{VIEWS.map(function(v) { return (<button key={v} onClick={function() { setView(v); }} className={"px-4 py-2 text-sm font-bold uppercase tracking-tighter transition-colors " + (view === v ? "bg-black text-white" : "text-black/60 hover:bg-black hover:text-white")} style={fH}>{v}</button>); })}</nav></div>
        </div>
      </header>

      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 border-r-2 border-black flex-col bg-white pt-24 z-40">
        <div className="px-6 mb-12"><div className="text-xl font-black tracking-tighter uppercase" style={fH}>LEDGER</div><div className="text-[10px] uppercase tracking-widest text-black/50" style={fL}>Expense Tracking</div></div>
        <nav className="flex flex-col">
          {[{ v: "log", icon: "list_alt", label: "Log" }, { v: "weekly", icon: "calendar_view_week", label: "Weekly" }, { v: "monthly", icon: "calendar_month", label: "Monthly" }, { v: "recurring", icon: "repeat", label: "Recurring" }, { v: "reports", icon: "analytics", label: "Reports" }].map(function(item) { return (
            <button key={item.v} onClick={function() { setView(item.v); }} className={"flex items-center px-6 py-4 border-b border-black text-sm font-bold uppercase transition-all text-left " + (view === item.v ? "bg-black text-white" : "text-black hover:bg-neutral-100")} style={fL}>
              <Icon name={item.icon} className="mr-3" /> {item.label}
              {item.v === "recurring" && pendingRecurring.length > 0 && <span className="ml-auto bg-black text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold">{pendingRecurring.length}</span>}
            </button>
          ); })}
        </nav>
        <div className="mt-auto">
          <button onClick={function() { setShowCurrencyPicker(true); }} className="w-full flex items-center px-6 py-4 border-t border-black text-black hover:bg-neutral-100 transition-all text-left" style={fL}><Icon name="currency_exchange" className="mr-3" /><span className="text-sm font-bold uppercase">{currency}</span><span className="text-xs text-black/50 ml-2">{currencySymbol}</span></button>
          <div className="p-6 border-t border-black flex items-center gap-3"><div className="w-8 h-8 border border-black flex items-center justify-center text-xs font-bold" style={fH}>{initials}</div><div className="text-xs uppercase tracking-tighter" style={fL}>{userName}</div></div>
        </div>
      </aside>

      <main className="md:ml-64 pt-24 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        {view === "log" && !pendingDismissed && <PendingBanner pending={pendingRecurring} fmt={fmt} onConfirm={confirmRecurring} onSkip={skipRecurring} onDismiss={function() { setPendingDismissed(true); }} />}

        {view === "log" && (
          <>
            <section className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                {editingTitle ? (
                  <div className="flex items-center gap-2"><input type="text" value={tempTitle} onChange={function(e) { setTempTitle(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") { setHeaderTitle(tempTitle || "OVERVIEW"); setEditingTitle(false); } if (e.key === "Escape") { setEditingTitle(false); } }} className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none border-2 border-black p-2 focus:outline-none w-full" style={fH} autoFocus /><button onClick={function() { setHeaderTitle(tempTitle || "OVERVIEW"); setEditingTitle(false); }} className="border-2 border-black w-10 h-10 flex items-center justify-center hover:bg-black hover:text-white transition-colors shrink-0"><Icon name="check" className="text-lg" /></button><button onClick={function() { setEditingTitle(false); }} className="border border-black/30 w-10 h-10 flex items-center justify-center hover:bg-neutral-100 transition-colors shrink-0"><Icon name="close" className="text-lg" /></button></div>
                ) : (
                  <div className="flex items-start gap-2 group cursor-pointer" onClick={function() { setTempTitle(headerTitle); setEditingTitle(true); }}><h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none" style={fH}>{headerTitle}</h1><button className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 border border-black w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white shrink-0"><Icon name="edit" className="text-base" /></button></div>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={function() { shiftMonth(-1); }} className="border border-black w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-colors active:scale-95"><Icon name="chevron_left" className="text-lg" /></button>
                  <p className="text-sm uppercase tracking-[0.2em]" style={fL}>{monthName}</p>
                  <button onClick={function() { shiftMonth(1); }} className="border border-black w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-colors active:scale-95"><Icon name="chevron_right" className="text-lg" /></button>
                  {!isCurrentMonth && (<button onClick={function() { setSelectedMonth(getMonthKey(new Date())); }} className="text-[10px] uppercase tracking-widest border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors ml-2" style={fL}>Today</button>)}
                </div>
              </div>
              <button onClick={function() { setShowBudgetModal(true); }} className="border-2 border-black p-6 w-full md:w-auto min-w-[300px] flex flex-col bg-white relative hover:bg-neutral-50 transition-colors text-left cursor-pointer">
                <span className="absolute top-2 left-2 text-[10px] uppercase" style={fL}>Status</span>
                <div className="mt-4"><p className="text-xs uppercase text-black/60" style={fL}>Monthly Budget</p><div className="flex items-baseline gap-2"><span className="text-3xl font-bold" style={fH}>{fmt(monthTotal)}</span><span className="text-xs text-black/40" style={fL}>/ {fmt(budget)}</span></div></div>
                {isOverBudget ? (<div className="mt-4 bg-black text-white px-3 py-2 text-center animate-pulse"><p className="text-sm font-black tracking-widest uppercase" style={fH}>OVER LIMIT</p></div>) : (<div className="mt-4 bg-neutral-100 px-3 py-2 text-center"><p className="text-sm font-bold tracking-widest uppercase" style={fH}>{budgetPct}% USED</p></div>)}
              </button>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
              <div className="md:col-span-8 border-2 border-black p-8"><h2 className="font-bold text-xl uppercase mb-6 tracking-tighter" style={fH}>FAST_ENTRY</h2><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">{CATEGORIES.map(function(cat) { return (<button key={cat.id} onClick={function() { setSelectedCategory(cat); }} className="aspect-square border border-black flex flex-col items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors active:scale-95"><Icon name={cat.icon} className="text-2xl md:text-3xl" /><span className="text-[8px] md:text-[10px] uppercase font-bold leading-tight text-center" style={fL}>{cat.label}</span></button>); })}</div></div>
              <div className="md:col-span-4 border-2 border-black p-8 flex flex-col"><h2 className="font-bold text-xl uppercase mb-6 tracking-tighter" style={fH}>WEEKLY</h2><div className="space-y-4 flex-grow"><div className="flex justify-between items-end border-b border-black pb-2"><span className="text-xs uppercase" style={fL}>Avg/Day</span><span className="font-bold" style={fH}>{fmt(weekAvg)}</span></div><div className="flex justify-between items-end border-b border-black pb-2"><span className="text-xs uppercase" style={fL}>Highest</span><span className="font-bold" style={fH}>{fmt(weekHighest)}</span></div><div className="flex justify-between items-end border-b border-black pb-2"><span className="text-xs uppercase" style={fL}>Volume</span><span className="font-bold" style={fH}>{weekExpenses.length} tx</span></div></div><div className="mt-8 h-12 w-full flex items-end gap-1">{weekDays.map(function(val, i) { return (<div key={i} className="bg-black w-full transition-all duration-500" style={{ height: (weekMax > 0 ? Math.max((val / weekMax) * 100, 4) : 4) + "%" }} />); })}</div></div>
            </div>

            <section className="mb-12">
              <div className="flex justify-between items-center mb-6"><h2 className="font-bold text-xl uppercase tracking-tighter" style={fH}>DAILY_LOG</h2><button onClick={exportCSV} className="text-[10px] uppercase tracking-widest border border-black px-4 py-1 hover:bg-black hover:text-white transition-colors" style={fL}>Export .CSV</button></div>
              {expenses.length === 0 ? (<div className="border-2 border-dashed border-black/30 p-12 text-center"><p className="text-black/40 uppercase text-sm" style={fL}>No expenses logged yet.</p></div>) : (
                <div className="overflow-x-auto"><table className="w-full border-collapse border-2 border-black"><thead><tr className="bg-black text-white text-xs uppercase tracking-widest" style={fL}><th className="border border-black p-4 text-left">REF_ID</th><th className="border border-black p-4 text-left">DATE</th><th className="border border-black p-4 text-left">CATEGORY</th><th className="border border-black p-4 text-left hidden sm:table-cell">DESCRIPTION</th><th className="border border-black p-4 text-right">AMOUNT</th></tr></thead><tbody className="text-sm">{expenses.map(function(e, i) { return (<tr key={e.id + e.timestamp} onClick={function() { setEditingExpense(e); }} className={"cursor-pointer hover:bg-neutral-100 transition-colors " + (i % 2 === 1 ? "bg-neutral-50" : "")}><td className="border border-black p-4 text-[10px]" style={fL}>#{e.id}</td><td className="border border-black p-4 text-[10px]" style={fL}>{e.date}</td><td className="border border-black p-4 uppercase font-bold text-xs" style={fL}>{e.categoryLabel}</td><td className="border border-black p-4 hidden sm:table-cell">{e.description}</td><td className="border border-black p-4 text-right font-bold" style={fH}>{fmt(e.amount)}</td></tr>); })}</tbody></table></div>
              )}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border-2 border-black p-8"><h2 className="font-bold text-xl uppercase mb-6 tracking-tighter" style={fH}>MONTHLY</h2><div className="flex items-center gap-8"><div className="w-32 h-32 border-2 border-black flex items-center justify-center relative shrink-0"><span className="text-xl font-bold" style={fH}>{budgetPct}%</span></div><div className="space-y-2">{categoryBreakdown.slice(0, 5).map(function(item) { return <p key={item.category} className="text-xs uppercase" style={fL}><span className="font-bold">{item.category}:</span> {item.pct}%</p>; })}{categoryBreakdown.length === 0 && <p className="text-xs uppercase text-black/40" style={fL}>No data yet</p>}</div></div></div>
              <div className="border-2 border-black p-8 relative overflow-hidden flex flex-col justify-center"><div className="relative z-10"><h3 className="text-4xl font-black uppercase leading-tight" style={fH}>{isOverBudget ? <span>BUDGET<br />EXCEEDED</span> : <span>SYSTEM<br />OPTIMIZED</span>}</h3><p className="text-xs uppercase tracking-widest mt-4" style={fL}>{isOverBudget ? "Over by " + fmt(monthTotal - budget) : expenses.length === 0 ? "Begin logging expenses." : fmt(budget - monthTotal) + " remaining this month."}</p></div><div className="absolute top-0 right-0 w-32 h-full opacity-10 flex flex-col gap-1 translate-x-12 rotate-12">{[0, 1, 2, 3, 4, 5, 6].map(function(i) { return <div key={i} className="h-2 bg-black w-full" />; })}</div></div>
            </section>
          </>
        )}

        {view === "weekly" && (<><h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-2" style={fH}>WEEKLY</h1><p className="text-sm uppercase tracking-[0.2em] mb-8 md:mb-12" style={fL}>Week of {new Date(currentWeekKey).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p><div className="grid grid-cols-3 gap-3 md:gap-8 mb-8 md:mb-12"><div className="border-2 border-black p-4 md:p-8"><p className="text-[10px] md:text-xs uppercase text-black/60 mb-1" style={fL}>Total Spent</p><p className="text-xl md:text-4xl font-bold" style={fH}>{fmt(weekTotal)}</p></div><div className="border-2 border-black p-4 md:p-8"><p className="text-[10px] md:text-xs uppercase text-black/60 mb-1" style={fL}>Daily Avg</p><p className="text-xl md:text-4xl font-bold" style={fH}>{fmt(weekAvg)}</p></div><div className="border-2 border-black p-4 md:p-8"><p className="text-[10px] md:text-xs uppercase text-black/60 mb-1" style={fL}>Transactions</p><p className="text-xl md:text-4xl font-bold" style={fH}>{weekExpenses.length}</p></div></div><div className="border-2 border-black p-4 md:p-8 mb-8 md:mb-12"><h2 className="font-bold text-sm md:text-lg uppercase mb-4 md:mb-6 tracking-tighter" style={fH}>DAILY BREAKDOWN</h2><div className="h-32 md:h-48 flex items-end gap-1 md:gap-3">{["M", "T", "W", "T", "F", "S", "S"].map(function(day, i) { var fullDay = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]; return (<div key={fullDay} className="flex-1 flex flex-col items-center gap-1"><div className="w-full bg-black transition-all duration-500" style={{ height: (weekMax > 0 ? Math.max((weekDays[i] / weekMax) * 100, 2) : 2) + "%" }} /><span className="text-[8px] md:text-[10px] uppercase font-bold" style={fL}><span className="hidden sm:inline">{fullDay}</span><span className="sm:hidden">{day}</span></span><span className="text-[7px] md:text-[10px] text-black/50 truncate w-full text-center" style={fL}>{weekDays[i] > 0 ? fmt(weekDays[i]) : "\u2014"}</span></div>); })}</div></div><div className="flex justify-between items-center mb-6"><h2 className="font-bold text-sm md:text-lg uppercase tracking-tighter" style={fH}>TRANSACTIONS</h2><button onClick={exportCSV} className="text-[10px] uppercase tracking-widest border border-black px-4 py-1 hover:bg-black hover:text-white transition-colors" style={fL}>Export .CSV</button></div>{weekExpenses.length === 0 ? (<div className="border-2 border-dashed border-black/30 p-12 text-center"><p className="text-black/40 uppercase text-sm" style={fL}>No expenses this week.</p></div>) : (<div className="overflow-x-auto"><table className="w-full border-collapse border-2 border-black"><thead><tr className="bg-black text-white text-xs uppercase tracking-widest" style={fL}><th className="border border-black p-4 text-left">REF_ID</th><th className="border border-black p-4 text-left">DATE</th><th className="border border-black p-4 text-left">CATEGORY</th><th className="border border-black p-4 text-right">AMOUNT</th></tr></thead><tbody className="text-sm">{weekExpenses.map(function(e) { return (<tr key={e.id + e.timestamp} onClick={function() { setEditingExpense(e); }} className="cursor-pointer hover:bg-neutral-100 transition-colors"><td className="border border-black p-4 text-[10px]" style={fL}>#{e.id}</td><td className="border border-black p-4 text-[10px]" style={fL}>{e.date}</td><td className="border border-black p-4 uppercase font-bold text-xs" style={fL}>{e.categoryLabel}</td><td className="border border-black p-4 text-right font-bold" style={fH}>{fmt(e.amount)}</td></tr>); })}</tbody></table></div>)}</>)}

        {view === "monthly" && (<><h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-2" style={fH}>MONTHLY</h1><div className="flex items-center gap-3 mb-12"><button onClick={function() { shiftMonth(-1); }} className="border border-black w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-colors active:scale-95"><Icon name="chevron_left" className="text-lg" /></button><p className="text-sm uppercase tracking-[0.2em]" style={fL}>{monthName}</p><button onClick={function() { shiftMonth(1); }} className="border border-black w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-colors active:scale-95"><Icon name="chevron_right" className="text-lg" /></button>{!isCurrentMonth && (<button onClick={function() { setSelectedMonth(getMonthKey(new Date())); }} className="text-[10px] uppercase tracking-widest border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors ml-2" style={fL}>Today</button>)}</div><div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"><div className="border-2 border-black p-8"><p className="text-xs uppercase text-black/60 mb-1" style={fL}>Total Spent</p><p className="text-4xl font-bold" style={fH}>{fmt(monthTotal)}</p></div><div className="border-2 border-black p-8"><p className="text-xs uppercase text-black/60 mb-1" style={fL}>Budget</p><p className="text-4xl font-bold" style={fH}>{fmt(budget)}</p></div><div className={"border-2 border-black p-8 " + (isOverBudget ? "bg-black text-white" : "")}><p className={"text-xs uppercase mb-1 " + (isOverBudget ? "text-white/60" : "text-black/60")} style={fL}>Remaining</p><p className="text-4xl font-bold" style={fH}>{fmt(budget - monthTotal)}</p></div></div><div className="border-2 border-black p-8 mb-12"><h2 className="font-bold text-lg uppercase mb-6 tracking-tighter" style={fH}>CATEGORY BREAKDOWN</h2>{categoryBreakdown.length === 0 ? (<p className="text-black/40 uppercase text-sm" style={fL}>No data yet.</p>) : (<div className="space-y-4">{categoryBreakdown.map(function(item) { return (<div key={item.category}><div className="flex justify-between mb-1"><span className="text-xs uppercase font-bold" style={fL}>{item.category}</span><span className="text-xs" style={fL}>{fmt(item.amount)} ({item.pct}%)</span></div><div className="w-full h-6 border border-black"><div className="h-full bg-black transition-all duration-700" style={{ width: item.pct + "%" }} /></div></div>); })}</div>)}</div><div className="flex justify-between items-center mb-6"><h2 className="font-bold text-lg uppercase tracking-tighter" style={fH}>ALL TRANSACTIONS</h2><button onClick={exportCSV} className="text-[10px] uppercase tracking-widest border border-black px-4 py-1 hover:bg-black hover:text-white transition-colors" style={fL}>Export .CSV</button></div>{monthExpenses.length === 0 ? (<div className="border-2 border-dashed border-black/30 p-12 text-center"><p className="text-black/40 uppercase text-sm" style={fL}>No expenses this month.</p></div>) : (<div className="overflow-x-auto"><table className="w-full border-collapse border-2 border-black"><thead><tr className="bg-black text-white text-xs uppercase tracking-widest" style={fL}><th className="border border-black p-4 text-left">REF_ID</th><th className="border border-black p-4 text-left">DATE</th><th className="border border-black p-4 text-left">CATEGORY</th><th className="border border-black p-4 text-left hidden sm:table-cell">DESCRIPTION</th><th className="border border-black p-4 text-right">AMOUNT</th></tr></thead><tbody className="text-sm">{monthExpenses.map(function(e, i) { return (<tr key={e.id + e.timestamp} onClick={function() { setEditingExpense(e); }} className={"cursor-pointer hover:bg-neutral-100 transition-colors " + (i % 2 === 1 ? "bg-neutral-50" : "")}><td className="border border-black p-4 text-[10px]" style={fL}>#{e.id}</td><td className="border border-black p-4 text-[10px]" style={fL}>{e.date}</td><td className="border border-black p-4 uppercase font-bold text-xs" style={fL}>{e.categoryLabel}</td><td className="border border-black p-4 hidden sm:table-cell">{e.description}</td><td className="border border-black p-4 text-right font-bold" style={fH}>{fmt(e.amount)}</td></tr>); })}</tbody></table></div>)}</>)}

        {view === "recurring" && (<><div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12"><div><h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-none" style={fH}>RECURRING</h1><p className="text-sm uppercase tracking-[0.2em] mt-2" style={fL}>Monthly auto-expenses</p></div><button onClick={function() { setShowAddRecurring(true); }} className="border-2 border-black px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors active:scale-95" style={fH}><Icon name="add" className="mr-1 align-middle text-lg" /> Add</button></div>{pendingRecurring.length > 0 && <PendingBanner pending={pendingRecurring} fmt={fmt} onConfirm={confirmRecurring} onSkip={skipRecurring} onDismiss={function() { }} />}<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 mb-12"><div className="border-2 border-black p-6 md:p-8"><p className="text-xs uppercase text-black/60 mb-1" style={fL}>Active Recurring</p><p className="text-3xl md:text-4xl font-bold" style={fH}>{recurring.filter(function(r) { return r.active; }).length}</p></div><div className="border-2 border-black p-6 md:p-8"><p className="text-xs uppercase text-black/60 mb-1" style={fL}>Monthly Total</p><p className="text-3xl md:text-4xl font-bold" style={fH}>{fmt(recurringTotal)}</p></div><div className="border-2 border-black p-6 md:p-8"><p className="text-xs uppercase text-black/60 mb-1" style={fL}>% of Budget</p><p className="text-3xl md:text-4xl font-bold" style={fH}>{budget > 0 ? Math.round((recurringTotal / budget) * 100) : 0}%</p></div></div>{recurring.length === 0 ? (<div className="border-2 border-dashed border-black/30 p-12 text-center"><p className="text-black/40 uppercase text-sm" style={fL}>No recurring expenses set up yet.</p></div>) : (<div className="space-y-4">{recurring.map(function(r) { var logged = loggedRecurring[currentMK + "-" + r.id]; return (<div key={r.id} className={"border-2 border-black p-4 md:p-6 " + (r.active ? "" : "opacity-40")}><div className="flex items-start gap-3 mb-3"><div className="w-10 h-10 border border-black flex items-center justify-center shrink-0"><Icon name={r.icon} className="text-xl" /></div><div className="flex-1 min-w-0"><p className="font-bold uppercase text-xs md:text-sm truncate" style={fL}>{r.description}</p><p className="text-[10px] text-black/50" style={fL}>{r.categoryLabel} &bull; Day {r.dayOfMonth} monthly</p>{logged && logged !== "skipped" && <p className="text-[10px] text-black/40 mt-1" style={fL}>&check; Logged this month</p>}{logged === "skipped" && <p className="text-[10px] text-black/40 mt-1" style={fL}>Skipped this month</p>}</div></div><div className="flex items-center justify-between"><span className="text-lg md:text-xl font-bold" style={fH}>{fmt(r.amount)}</span><div className="flex items-center gap-2"><button onClick={function() { toggleRecurringItem(r.id); }} className="border border-black w-8 h-8 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><Icon name={r.active ? "pause" : "play_arrow"} className="text-lg" /></button><button onClick={function() { deleteRecurringItem(r.id); }} className="border border-black w-8 h-8 flex items-center justify-center hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"><Icon name="delete" className="text-lg" /></button></div></div></div>); })}</div>)}</>)}

        {view === "reports" && (<><h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-2" style={fH}>REPORTS</h1><p className="text-sm uppercase tracking-[0.2em] mb-12" style={fL}>Analytics & Insights</p><div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"><div className="border-2 border-black p-8"><h2 className="font-bold text-lg uppercase mb-6 tracking-tighter" style={fH}>SPENDING BY CATEGORY</h2>{categoryBreakdown.length === 0 ? (<p className="text-black/40 uppercase text-sm" style={fL}>No data.</p>) : (<div className="space-y-3">{categoryBreakdown.map(function(item) { return (<div key={item.category} className="flex items-center gap-4"><div className="w-20 text-right"><span className="text-xs font-bold uppercase" style={fL}>{item.category}</span></div><div className="flex-1 h-4 border border-black"><div className="h-full bg-black transition-all" style={{ width: item.pct + "%" }} /></div><span className="text-xs w-16 text-right" style={fL}>{fmt(item.amount)}</span></div>); })}</div>)}</div><div className="border-2 border-black p-8"><h2 className="font-bold text-lg uppercase mb-6 tracking-tighter" style={fH}>KEY METRICS</h2><div className="space-y-4"><div className="flex justify-between items-end border-b border-black pb-3"><span className="text-xs uppercase" style={fL}>Total Expenses (All Time)</span><span className="text-xl font-bold" style={fH}>{fmt(expenses.reduce(function(s, e) { return s + e.amount; }, 0))}</span></div><div className="flex justify-between items-end border-b border-black pb-3"><span className="text-xs uppercase" style={fL}>Total Transactions</span><span className="text-xl font-bold" style={fH}>{expenses.length}</span></div><div className="flex justify-between items-end border-b border-black pb-3"><span className="text-xs uppercase" style={fL}>Avg per Transaction</span><span className="text-xl font-bold" style={fH}>{expenses.length > 0 ? fmt(expenses.reduce(function(s, e) { return s + e.amount; }, 0) / expenses.length) : "\u2014"}</span></div><div className="flex justify-between items-end border-b border-black pb-3"><span className="text-xs uppercase" style={fL}>Largest Expense</span><span className="text-xl font-bold" style={fH}>{expenses.length > 0 ? fmt(Math.max.apply(null, expenses.map(function(e) { return e.amount; }))) : "\u2014"}</span></div><div className="flex justify-between items-end border-b border-black pb-3"><span className="text-xs uppercase" style={fL}>Recurring Monthly</span><span className="text-xl font-bold" style={fH}>{fmt(recurringTotal)}</span></div><div className="flex justify-between items-end pb-3"><span className="text-xs uppercase" style={fL}>Categories Used</span><span className="text-xl font-bold" style={fH}>{new Set(expenses.map(function(e) { return e.category; })).size}</span></div></div></div></div><div className="border-2 border-black p-8"><h2 className="font-bold text-lg uppercase mb-6 tracking-tighter" style={fH}>TOP EXPENSES</h2>{expenses.length === 0 ? (<p className="text-black/40 uppercase text-sm" style={fL}>No data.</p>) : (<div className="space-y-3">{expenses.slice().sort(function(a, b) { return b.amount - a.amount; }).slice(0, 10).map(function(e, i) { return (<div key={e.id + e.timestamp} className="flex items-center gap-4 border-b border-black/20 pb-3"><span className="text-2xl font-black w-10" style={fH}>{String(i + 1).padStart(2, "0")}</span><div className="flex-1"><p className="text-xs uppercase font-bold" style={fL}>{e.categoryLabel}</p><p className="text-xs text-black/60">{e.description}</p></div><span className="text-lg font-bold" style={fH}>{fmt(e.amount)}</span></div>); })}</div>)}</div><div className="mt-8 flex justify-center"><button onClick={exportCSV} className="border-2 border-black px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors" style={fH}><Icon name="download" className="mr-2 align-middle" /> Export All Data .CSV</button></div></>)}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t-2 border-black h-16 flex items-center justify-around z-50 safe-bottom">
        {[{ v: "log", icon: "list_alt", label: "Log" }, { v: "weekly", icon: "calendar_view_week", label: "Weekly" }, { v: "monthly", icon: "calendar_month", label: "Monthly" }, { v: "recurring", icon: "repeat", label: "Recurring" }, { v: "reports", icon: "analytics", label: "Reports" }].map(function(item) { return (
          <button key={item.v} onClick={function() { setView(item.v); }} className={"flex flex-col items-center gap-1 relative " + (view === item.v ? "text-black" : "text-black/40")}>
            <Icon name={item.icon} /><span className="text-[9px] font-bold uppercase" style={fL}>{item.label}</span>
            {item.v === "recurring" && pendingRecurring.length > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] w-4 h-4 flex items-center justify-center font-bold">{pendingRecurring.length}</span>}
          </button>
        ); })}
      </nav>
    </div>
  );
}
