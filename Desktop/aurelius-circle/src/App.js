import { useState, useEffect } from "react";

const GOLD = "#C9A84C";
const DARK = "#0D0D1A";
const PANEL = "#13132A";
const BORDER = "#2a2a4a";
const MUTED = "#6b6b9a";
const WHITE = "#F0EEE6";

const ASSET_CLASSES = ["Global Equity ETF", "Nigerian Market", "Precious Metals", "Resource ETF", "Other"];
const MEMBERS = ["Member 1", "Member 2", "Member 3", "Member 4", "Member 5"];

const fmt = (n) => `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
const pct = (n) => `${Number(n).toFixed(2)}%`;

const defaultState = {
  lastUpdated: null,
  holdings: [
    { id: 1, name: "Vanguard Total World ETF", class: "Global Equity ETF", units: 12, price: 18500, cost: 210000 },
    { id: 2, name: "Stanbic IBTC ETF 30", class: "Nigerian Market", units: 200, price: 1450, cost: 270000 },
    { id: 3, name: "Gold (Gram)", class: "Precious Metals", units: 5, price: 85000, cost: 400000 },
  ],
  contributions: [
    { id: 1, member: "Member 1", amount: 5000, date: "2026-04-01", note: "April contribution" },
    { id: 2, member: "Member 2", amount: 5000, date: "2026-04-01", note: "April contribution" },
    { id: 3, member: "Member 3", amount: 5000, date: "2026-04-01", note: "April contribution" },
  ],
  transactions: [
    { id: 1, type: "BUY", asset: "Gold (Gram)", amount: 85000, units: 1, date: "2026-05-01", note: "Added 1g gold" },
  ],
};

export default function AureliusTracker() {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(null); // 'holding' | 'contribution' | 'transaction'
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const r = await window.storage.get("aurelius_data");
        if (r) setData(JSON.parse(r.value));
      } catch {}
      setLoaded(true);
      setTimeout(() => setAnimIn(true), 50);
    }
    load();
  }, []);

  async function save(next) {
    setSaving(true);
    const stamped = { ...next, lastUpdated: new Date().toISOString() };
    setData(stamped);
    try { await window.storage.set("aurelius_data", JSON.stringify(stamped)); } catch {}
    setSaving(false);
  }

  // ── Derived numbers ──────────────────────────────────────
  const totalValue = data.holdings.reduce((s, h) => s + h.units * h.price, 0);
  const totalCost = data.holdings.reduce((s, h) => s + h.cost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const totalContrib = data.contributions.reduce((s, c) => s + Number(c.amount), 0);

  const byClass = ASSET_CLASSES.map((cls) => {
    const items = data.holdings.filter((h) => h.class === cls);
    const val = items.reduce((s, h) => s + h.units * h.price, 0);
    return { cls, val, pct: totalValue > 0 ? (val / totalValue) * 100 : 0 };
  }).filter((x) => x.val > 0);

  const byMember = MEMBERS.map((m) => ({
    m,
    total: data.contributions.filter((c) => c.member === m).reduce((s, c) => s + Number(c.amount), 0),
  })).filter((x) => x.total > 0);

  // ── Modals ───────────────────────────────────────────────
  function openModal(type, prefill = {}) {
    setForm(prefill);
    setModal(type);
  }
  function closeModal() { setModal(null); setForm({}); }

  function submitHolding() {
    if (!form.name || !form.price || !form.units) return;
    const next = { ...data };
    if (form.id) {
      next.holdings = next.holdings.map((h) => h.id === form.id ? { ...form, units: +form.units, price: +form.price, cost: +form.cost || h.cost } : h);
    } else {
      next.holdings = [...next.holdings, { ...form, id: Date.now(), units: +form.units, price: +form.price, cost: +form.cost || 0 }];
    }
    save(next); closeModal();
  }

  function deleteHolding(id) {
    save({ ...data, holdings: data.holdings.filter((h) => h.id !== id) });
  }

  function submitContribution() {
    if (!form.member || !form.amount || !form.date) return;
    const next = { ...data, contributions: [...data.contributions, { ...form, id: Date.now(), amount: +form.amount }] };
    save(next); closeModal();
  }

  function submitTransaction() {
    if (!form.asset || !form.amount || !form.date) return;
    const next = { ...data, transactions: [...data.transactions, { ...form, id: Date.now(), amount: +form.amount, units: +form.units || 0 }] };
    save(next); closeModal();
  }

  // ── Styles ───────────────────────────────────────────────
  const S = {
    app: {
      minHeight: "100vh", background: DARK, color: WHITE,
      fontFamily: "'Georgia', 'Times New Roman', serif",
      opacity: animIn ? 1 : 0, transition: "opacity 0.6s ease",
    },
    header: {
      borderBottom: `1px solid ${BORDER}`, padding: "28px 32px 20px",
      display: "flex", justifyContent: "space-between", alignItems: "flex-end",
    },
    logo: { fontSize: 22, fontWeight: 700, color: GOLD, letterSpacing: 2, textTransform: "uppercase" },
    motto: { fontSize: 11, color: MUTED, letterSpacing: 3, marginTop: 4, fontStyle: "italic" },
    saveDot: { width: 8, height: 8, borderRadius: "50%", background: saving ? GOLD : "#2ecc71", transition: "background 0.3s" },
    tabs: { display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}`, padding: "0 32px" },
    tab: (active) => ({
      padding: "14px 20px", fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
      cursor: "pointer", border: "none", background: "none",
      color: active ? GOLD : MUTED, fontFamily: "inherit",
      borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
      transition: "all 0.2s",
    }),
    body: { padding: "32px" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 },
    card: {
      background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "20px 24px",
    },
    statCard: {
      background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "18px 20px",
    },
    statLabel: { fontSize: 10, letterSpacing: 3, color: MUTED, textTransform: "uppercase", marginBottom: 8 },
    statVal: { fontSize: 22, fontWeight: 700, color: WHITE },
    statSub: (pos) => ({ fontSize: 12, color: pos ? "#2ecc71" : "#e74c3c", marginTop: 4 }),
    sectionTitle: { fontSize: 11, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 16, fontWeight: 700 },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { textAlign: "left", padding: "10px 12px", fontSize: 10, letterSpacing: 2, color: MUTED, textTransform: "uppercase", borderBottom: `1px solid ${BORDER}` },
    td: { padding: "12px", borderBottom: `1px solid ${BORDER}20`, verticalAlign: "middle" },
    btn: (variant = "primary") => ({
      padding: variant === "sm" ? "6px 14px" : "10px 22px",
      background: variant === "ghost" ? "transparent" : variant === "danger" ? "#c0392b20" : `${GOLD}20`,
      color: variant === "danger" ? "#e74c3c" : GOLD,
      border: `1px solid ${variant === "danger" ? "#c0392b40" : `${GOLD}40`}`,
      borderRadius: 4, cursor: "pointer", fontSize: 11,
      letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "inherit",
      transition: "all 0.2s",
    }),
    pill: (cls) => {
      const colors = { "Global Equity ETF": "#3498db", "Nigerian Market": "#27ae60", "Precious Metals": GOLD, "Resource ETF": "#9b59b6", "Other": MUTED };
      return { background: `${colors[cls] || MUTED}20`, color: colors[cls] || MUTED, padding: "3px 10px", borderRadius: 12, fontSize: 10, letterSpacing: 1 };
    },
    bar: (w, color = GOLD) => ({
      height: 6, width: `${Math.min(w, 100)}%`, background: color, borderRadius: 3, transition: "width 0.8s ease",
    }),
    barTrack: { height: 6, background: BORDER, borderRadius: 3, marginTop: 6 },
    overlay: {
      position: "fixed", inset: 0, background: "#00000090", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    modalBox: {
      background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: "32px", width: 440, maxHeight: "90vh", overflowY: "auto",
    },
    modalTitle: { fontSize: 14, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 24 },
    label: { fontSize: 10, letterSpacing: 2, color: MUTED, textTransform: "uppercase", marginBottom: 6, display: "block" },
    input: {
      width: "100%", background: DARK, border: `1px solid ${BORDER}`, borderRadius: 4,
      color: WHITE, padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
      outline: "none", boxSizing: "border-box", marginBottom: 16,
    },
    select: {
      width: "100%", background: DARK, border: `1px solid ${BORDER}`, borderRadius: 4,
      color: WHITE, padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
      outline: "none", boxSizing: "border-box", marginBottom: 16,
    },
  };

  // ── Render helpers ───────────────────────────────────────
  function StatCard({ label, value, sub, subPos }) {
    return (
      <div style={S.statCard}>
        <div style={S.statLabel}>{label}</div>
        <div style={S.statVal}>{value}</div>
        {sub && <div style={S.statSub(subPos)}>{sub}</div>}
      </div>
    );
  }

  // ── OVERVIEW TAB ─────────────────────────────────────────
  function Overview() {
    return (
      <div>
        <div style={S.grid4}>
          <StatCard label="Portfolio Value" value={fmt(totalValue)} />
          <StatCard label="Total Invested" value={fmt(totalCost)} />
          <StatCard label="Total Return" value={fmt(totalGain)} sub={`${totalGain >= 0 ? "▲" : "▼"} ${pct(Math.abs(totalGainPct))}`} subPos={totalGain >= 0} />
          <StatCard label="Total Contributions" value={fmt(totalContrib)} />
        </div>

        {/* Last updated notice for members */}
        {data.lastUpdated && (
          <div style={{
            background: `${GOLD}0D`, border: `1px solid ${GOLD}30`, borderRadius: 6,
            padding: "10px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ color: GOLD, fontSize: 14 }}>◎</span>
            <span style={{ fontSize: 11, color: MUTED, letterSpacing: 1 }}>
              Portfolio last updated by coordinator on{" "}
              <span style={{ color: WHITE }}>
                {new Date(data.lastUpdated).toLocaleString("en-NG", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit", hour12: true,
                })}
              </span>
            </span>
          </div>
        )}

        <div style={S.grid2}>
          {/* Allocation */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Asset Allocation</div>
            {byClass.map(({ cls, val, pct: p }) => (
              <div key={cls} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: WHITE }}>{cls}</span>
                  <span style={{ color: MUTED }}>{pct(p)} · {fmt(val)}</span>
                </div>
                <div style={S.barTrack}><div style={S.bar(p)} /></div>
              </div>
            ))}
            {byClass.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No holdings yet.</div>}
          </div>

          {/* Member contributions */}
          <div style={S.card}>
            <div style={S.sectionTitle}>Member Contributions</div>
            {byMember.map(({ m, total }) => (
              <div key={m} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: WHITE }}>{m}</span>
                  <span style={{ color: MUTED }}>{fmt(total)} · {totalContrib > 0 ? pct((total / totalContrib) * 100) : "0%"}</span>
                </div>
                <div style={S.barTrack}>
                  <div style={S.bar(totalContrib > 0 ? (total / totalContrib) * 100 : 0, "#3498db")} />
                </div>
              </div>
            ))}
            {byMember.length === 0 && <div style={{ color: MUTED, fontSize: 13 }}>No contributions yet.</div>}
          </div>
        </div>

        {/* Recent transactions */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Recent Activity</div>
          {data.transactions.length === 0
            ? <div style={{ color: MUTED, fontSize: 13 }}>No transactions logged yet.</div>
            : <table style={S.table}>
              <thead>
                <tr>
                  {["Date", "Type", "Asset", "Units", "Amount", "Note"].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {[...data.transactions].reverse().slice(0, 8).map((t) => (
                  <tr key={t.id}>
                    <td style={S.td}><span style={{ color: MUTED }}>{t.date}</span></td>
                    <td style={S.td}><span style={{ color: t.type === "BUY" ? "#2ecc71" : "#e74c3c", fontSize: 11, letterSpacing: 1 }}>{t.type}</span></td>
                    <td style={S.td}>{t.asset}</td>
                    <td style={S.td}>{t.units || "—"}</td>
                    <td style={S.td}>{fmt(t.amount)}</td>
                    <td style={S.td}><span style={{ color: MUTED }}>{t.note || "—"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      </div>
    );
  }

  // ── HOLDINGS TAB ─────────────────────────────────────────
  function Holdings() {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={S.sectionTitle}>Portfolio Holdings</div>
          <button style={S.btn()} onClick={() => openModal("holding")}>+ Add Holding</button>
        </div>
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>{["Asset", "Class", "Units", "Price", "Market Value", "Cost Basis", "Gain/Loss", ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.holdings.map((h) => {
                const mv = h.units * h.price;
                const gl = mv - h.cost;
                const glPct = h.cost > 0 ? (gl / h.cost) * 100 : 0;
                return (
                  <tr key={h.id}>
                    <td style={S.td}><b>{h.name}</b></td>
                    <td style={S.td}><span style={S.pill(h.class)}>{h.class}</span></td>
                    <td style={S.td}>{h.units}</td>
                    <td style={S.td}>{fmt(h.price)}</td>
                    <td style={S.td}><b>{fmt(mv)}</b></td>
                    <td style={S.td}>{fmt(h.cost)}</td>
                    <td style={S.td}>
                      <span style={{ color: gl >= 0 ? "#2ecc71" : "#e74c3c" }}>
                        {gl >= 0 ? "▲" : "▼"} {fmt(Math.abs(gl))} ({pct(Math.abs(glPct))})
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={S.btn("sm")} onClick={() => openModal("holding", { ...h })}>Edit</button>
                        <button style={S.btn("danger")} onClick={() => deleteHolding(h.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.holdings.length === 0 && <div style={{ color: MUTED, fontSize: 13, padding: 16 }}>No holdings added yet.</div>}
        </div>
      </div>
    );
  }

  // ── CONTRIBUTIONS TAB ────────────────────────────────────
  function Contributions() {
    const grouped = MEMBERS.map((m) => ({
      m,
      records: data.contributions.filter((c) => c.member === m),
      total: data.contributions.filter((c) => c.member === m).reduce((s, c) => s + Number(c.amount), 0),
    }));

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={S.sectionTitle}>Member Contributions</div>
          <button style={S.btn()} onClick={() => openModal("contribution")}>+ Log Contribution</button>
        </div>

        <div style={{ ...S.grid2, marginBottom: 24 }}>
          {grouped.filter(g => g.total > 0).map(({ m, total }) => (
            <div key={m} style={S.statCard}>
              <div style={S.statLabel}>{m}</div>
              <div style={S.statVal}>{fmt(total)}</div>
              <div style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>
                {totalContrib > 0 ? pct((total / totalContrib) * 100) : "0%"} of total pool
              </div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>{["Date", "Member", "Amount", "Note"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {[...data.contributions].reverse().map((c) => (
                <tr key={c.id}>
                  <td style={S.td}><span style={{ color: MUTED }}>{c.date}</span></td>
                  <td style={S.td}>{c.member}</td>
                  <td style={S.td}><b style={{ color: GOLD }}>{fmt(c.amount)}</b></td>
                  <td style={S.td}><span style={{ color: MUTED }}>{c.note || "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.contributions.length === 0 && <div style={{ color: MUTED, fontSize: 13, padding: 16 }}>No contributions logged.</div>}
        </div>
      </div>
    );
  }

  // ── TRANSACTIONS TAB ─────────────────────────────────────
  function Transactions() {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={S.sectionTitle}>Transaction Log</div>
          <button style={S.btn()} onClick={() => openModal("transaction")}>+ Log Transaction</button>
        </div>
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>{["Date", "Type", "Asset", "Units", "Amount", "Note"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {[...data.transactions].reverse().map((t) => (
                <tr key={t.id}>
                  <td style={S.td}><span style={{ color: MUTED }}>{t.date}</span></td>
                  <td style={S.td}>
                    <span style={{ color: t.type === "BUY" ? "#2ecc71" : "#e74c3c", fontSize: 11, letterSpacing: 1, fontWeight: 700 }}>{t.type}</span>
                  </td>
                  <td style={S.td}>{t.asset}</td>
                  <td style={S.td}>{t.units || "—"}</td>
                  <td style={S.td}>{fmt(t.amount)}</td>
                  <td style={S.td}><span style={{ color: MUTED }}>{t.note || "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.transactions.length === 0 && <div style={{ color: MUTED, fontSize: 13, padding: 16 }}>No transactions yet.</div>}
        </div>
      </div>
    );
  }

  // ── MODAL ────────────────────────────────────────────────
  function Modal() {
    if (!modal) return null;
    const isHolding = modal === "holding";
    const isContrib = modal === "contribution";
    const isTxn = modal === "transaction";

    return (
      <div style={S.overlay} onClick={closeModal}>
        <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
          <div style={S.modalTitle}>
            {isHolding ? (form.id ? "Edit Holding" : "Add Holding") : isContrib ? "Log Contribution" : "Log Transaction"}
          </div>

          {isHolding && <>
            <label style={S.label}>Asset Name</label>
            <input style={S.input} value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Vanguard Total World ETF" />
            <label style={S.label}>Asset Class</label>
            <select style={S.select} value={form.class || ""} onChange={e => setForm({ ...form, class: e.target.value })}>
              <option value="">Select class</option>
              {ASSET_CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
            <label style={S.label}>Units Held</label>
            <input style={S.input} type="number" value={form.units || ""} onChange={e => setForm({ ...form, units: e.target.value })} placeholder="0" />
            <label style={S.label}>Current Price (NGN)</label>
            <input style={S.input} type="number" value={form.price || ""} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
            <label style={S.label}>Cost Basis (NGN)</label>
            <input style={S.input} type="number" value={form.cost || ""} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="Total amount paid" />
          </>}

          {isContrib && <>
            <label style={S.label}>Member</label>
            <select style={S.select} value={form.member || ""} onChange={e => setForm({ ...form, member: e.target.value })}>
              <option value="">Select member</option>
              {MEMBERS.map(m => <option key={m}>{m}</option>)}
            </select>
            <label style={S.label}>Amount (NGN)</label>
            <input style={S.input} type="number" value={form.amount || ""} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="5000" />
            <label style={S.label}>Date</label>
            <input style={S.input} type="date" value={form.date || ""} onChange={e => setForm({ ...form, date: e.target.value })} />
            <label style={S.label}>Note (optional)</label>
            <input style={S.input} value={form.note || ""} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="e.g. May contribution" />
          </>}

          {isTxn && <>
            <label style={S.label}>Transaction Type</label>
            <select style={S.select} value={form.type || ""} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="">Select type</option>
              <option>BUY</option><option>SELL</option><option>DIVIDEND</option><option>FEE</option>
            </select>
            <label style={S.label}>Asset</label>
            <input style={S.input} value={form.asset || ""} onChange={e => setForm({ ...form, asset: e.target.value })} placeholder="Asset name" />
            <label style={S.label}>Units</label>
            <input style={S.input} type="number" value={form.units || ""} onChange={e => setForm({ ...form, units: e.target.value })} placeholder="0" />
            <label style={S.label}>Amount (NGN)</label>
            <input style={S.input} type="number" value={form.amount || ""} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" />
            <label style={S.label}>Date</label>
            <input style={S.input} type="date" value={form.date || ""} onChange={e => setForm({ ...form, date: e.target.value })} />
            <label style={S.label}>Note (optional)</label>
            <input style={S.input} value={form.note || ""} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Notes" />
          </>}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button style={S.btn()} onClick={isHolding ? submitHolding : isContrib ? submitContribution : submitTransaction}>
              {form.id ? "Update" : "Save"}
            </button>
            <button style={S.btn("ghost")} onClick={closeModal}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (!loaded) return <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 }}><span style={{ color: MUTED, letterSpacing: 4, fontSize: 12 }}>LOADING...</span></div>;

  const TABS = ["overview", "holdings", "contributions", "transactions"];

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div>
          <div style={S.logo}>The Aurelius Circle</div>
          <div style={S.motto}>Virtus · Patientia · Crescere</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: MUTED, letterSpacing: 2 }}>{saving ? "SAVING..." : "SAVED"}</span>
            <div style={S.saveDot} />
          </div>
          {data.lastUpdated && (
            <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1 }}>
              <span style={{ color: GOLD, letterSpacing: 2, fontSize: 9, textTransform: "uppercase" }}>Last Updated · </span>
              {new Date(data.lastUpdated).toLocaleString("en-NG", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: true
              })}
            </div>
          )}
          {!data.lastUpdated && (
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontStyle: "italic" }}>No updates yet</div>
          )}
        </div>
      </div>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {tab === "overview" && <Overview />}
        {tab === "holdings" && <Holdings />}
        {tab === "contributions" && <Contributions />}
        {tab === "transactions" && <Transactions />}
      </div>

      <Modal />
    </div>
  );
}
