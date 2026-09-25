const STORAGE_KEY = "budgetwise-expense-tracker-v1";

const CATEGORIES = {
  Housing: { icon: "⌂", color: "#8d67ff" },
  Food: { icon: "✦", color: "#ff8d96" },
  Transport: { icon: "↗", color: "#4fd6d0" },
  Shopping: { icon: "▱", color: "#ba75ff" },
  Entertainment: { icon: "◉", color: "#e8ca67" },
  Bills: { icon: "▣", color: "#7b97ff" },
  Health: { icon: "✚", color: "#72dfae" },
  Education: { icon: "◆", color: "#6fa9ff" },
  Salary: { icon: "↗", color: "#72dfae" },
  Other: { icon: "•", color: "#9b9daa" }
};

const DEFAULT_DATA = {
  accounts: [
    { id: "acc_cash", name: "Main Wallet", type: "Cash", balance: 12540.25, note: "Everyday spending" },
    { id: "acc_bank", name: "HDFC Savings", type: "Bank", balance: 74850.10, note: "Primary savings" },
    { id: "acc_card", name: "ICICI Credit", type: "Credit Card", balance: -8340.50, note: "Monthly card" }
  ],
  transactions: [
    { id: "t1", name: "Salary", amount: 72000, type: "income", category: "Salary", account: "acc_bank", date: "2026-08-01", note: "August salary", status: "approved" },
    { id: "t2", name: "Apartment rent", amount: 18000, type: "expense", category: "Housing", account: "acc_bank", date: "2026-08-02", note: "Monthly rent", status: "approved" },
    { id: "t3", name: "BigBasket", amount: 2480, type: "expense", category: "Food", account: "acc_bank", date: "2026-08-04", note: "Weekly groceries", status: "approved" },
    { id: "t4", name: "Uber", amount: 620, type: "expense", category: "Transport", account: "acc_card", date: "2026-08-05", note: "Airport ride", status: "approved" },
    { id: "t5", name: "Netflix", amount: 649, type: "expense", category: "Entertainment", account: "acc_card", date: "2026-08-07", note: "Subscription", status: "approved" },
    { id: "t6", name: "Amazon", amount: 1890, type: "expense", category: "Shopping", account: "acc_card", date: "2026-08-10", note: "Desk accessories", status: "approved" },
    { id: "t7", name: "Electricity", amount: 1450, type: "expense", category: "Bills", account: "acc_bank", date: "2026-08-11", note: "Power bill", status: "approved" },
    { id: "t8", name: "Freelance project", amount: 12000, type: "income", category: "Salary", account: "acc_bank", date: "2026-08-13", note: "Design work", status: "approved" },
    { id: "t9", name: "Zomato", amount: 890, type: "expense", category: "Food", account: "acc_card", date: "2026-08-14", note: "Dinner", status: "approved" },
    { id: "t10", name: "Gym", amount: 1200, type: "expense", category: "Health", account: "acc_cash", date: "2026-08-15", note: "Monthly membership", status: "approved" }
  ],
  budgets: [
    { id: "b1", category: "Food", limit: 8500 },
    { id: "b2", category: "Transport", limit: 4000 },
    { id: "b3", category: "Shopping", limit: 7000 },
    { id: "b4", category: "Entertainment", limit: 3500 },
    { id: "b5", category: "Bills", limit: 7000 },
    { id: "b6", category: "Health", limit: 2500 }
  ],
  recurring: [
    { id: "r1", name: "Netflix", amount: 649, category: "Entertainment", account: "acc_card", next: "2026-09-07", frequency: "Monthly" },
    { id: "r2", name: "Spotify", amount: 119, category: "Entertainment", account: "acc_card", next: "2026-09-09", frequency: "Monthly" },
    { id: "r3", name: "Apartment rent", amount: 18000, category: "Housing", account: "acc_bank", next: "2026-09-02", frequency: "Monthly" },
    { id: "r4", name: "Internet", amount: 899, category: "Bills", account: "acc_bank", next: "2026-09-05", frequency: "Monthly" }
  ],
  goals: [
    { id: "g1", name: "New laptop", target: 95000, saved: 57800, deadline: "2026-12-31", icon: "▣" },
    { id: "g2", name: "Emergency fund", target: 150000, saved: 92000, deadline: "2027-03-31", icon: "◇" },
    { id: "g3", name: "Trip to Bali", target: 60000, saved: 28400, deadline: "2027-01-15", icon: "✦" }
  ],
  settings: { currency: "₹" }
};

let state = loadState();
let currentView = "overview";
let period = getMonthKey(new Date());
let txEditId = null;

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

function loadState(){
  try{
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved) return JSON.parse(saved);
  }catch(e){}
  return structuredClone(DEFAULT_DATA);
}
function persist(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function resetDemo(){
  state = structuredClone(DEFAULT_DATA);
  persist();
  period = getMonthKey(new Date());
  render();
  toast("Demo data restored","Everything is back to the starter dashboard.");
}
function money(n){
  const value = Number(n)||0;
  return `${state.settings.currency}${Math.abs(value).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}
function signedMoney(n,type){
  return `${type==="expense"?"−":"+"}${money(n)}`;
}
function dateLabel(d, opts={month:"short",day:"numeric",year:"numeric"}){
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN",opts);
}
function getMonthKey(date){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`; }
function monthLabel(key){
  const [y,m] = key.split("-").map(Number);
  return new Date(y,m-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"});
}
function txInPeriod(t, p=period){ return t.date.startsWith(p); }
function monthTransactions(p=period){ return state.transactions.filter(t=>txInPeriod(t,p)); }
function totalIncome(p=period){ return monthTransactions(p).filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0); }
function totalExpense(p=period){ return monthTransactions(p).filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0); }
function balance(){
  return state.accounts.reduce((sum,a)=>sum + Number(a.balance),0);
}
function accountName(id){ return state.accounts.find(a=>a.id===id)?.name || "Unknown"; }
function iconFor(cat){ return CATEGORIES[cat] || CATEGORIES.Other; }
function escapeHtml(v){
  return String(v).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function uid(prefix="id"){ return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`; }

function updateAccountBalancesFromLedger(){
  const opening = DEFAULT_DATA.accounts.reduce((m,a)=>(m[a.id]=a.balance, m), {});
  state.accounts.forEach(a=>a.balance = opening[a.id] ?? a.balance);
  for(const t of state.transactions){
    const acc = state.accounts.find(a=>a.id===t.account);
    if(!acc) continue;
    acc.balance += t.type==="income" ? Number(t.amount) : -Number(t.amount);
  }
  // For demo accuracy after reload, avoid reapplying opening balances if user has mutated balances.
  // Persisting explicit balances is sufficient for this frontend app.
}

function populatePeriodSelect(){
  const select = $("#periodSelect");
  const months = [];
  const now = new Date();
  for(let i=0;i<12;i++){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push(getMonthKey(d));
  }
  if(!months.includes(period)) months.unshift(period);
  select.innerHTML = months.map(m=>`<option value="${m}">${escapeHtml(monthLabel(m))}</option>`).join("");
  select.value = period;
}
function populateTransactionForm(){
  $("#txCategory").innerHTML = Object.keys(CATEGORIES).map(c=>`<option value="${c}">${c}</option>`).join("");
  $("#txAccount").innerHTML = state.accounts.map(a=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join("");
  $("#txDate").value = new Date().toISOString().slice(0,10);
}

function openTransactionModal(editId=null){
  txEditId = editId;
  const form = $("#transactionForm");
  form.reset();
  populateTransactionForm();
  $("#transactionModalTitle").textContent = editId ? "Edit transaction" : "Add transaction";
  if(editId){
    const t = state.transactions.find(x=>x.id===editId);
    if(!t) return;
    $$('input[name="kind"]',form).forEach(r=>r.checked = r.value===t.type);
    $("#txAmount").value = t.amount;
    $("#txName").value = t.name;
    $("#txCategory").value = t.category;
    $("#txAccount").value = t.account;
    $("#txDate").value = t.date;
    $("#txNote").value = t.note || "";
  }else{
    $("#txCategory").value = "Food";
    $("#txAccount").value = state.accounts[0]?.id || "";
    $("#txDate").value = new Date().toISOString().slice(0,10);
  }
  $("#transactionModal").classList.remove("hidden");
  setTimeout(()=>$("#txAmount").focus(),40);
}
function closeModal(id){ $(`#${id}`).classList.add("hidden"); }

function ledgerDelta(t){
  return t.type==="income" ? Number(t.amount) : -Number(t.amount);
}
function adjustAccount(accountId, delta){
  const acc = state.accounts.find(a=>a.id===accountId);
  if(acc) acc.balance += Number(delta);
}
function addTransaction(data){
  const amount = Number(data.amount);
  const tx = {
    id: txEditId || uid("t"),
    name: data.name.trim(),
    amount,
    type: data.type,
    category: data.category,
    account: data.account,
    date: data.date,
    note: data.note?.trim() || "",
    status: "approved"
  };
  const oldIndex = txEditId ? state.transactions.findIndex(t=>t.id===txEditId) : -1;
  if(oldIndex>=0){
    const oldTx = state.transactions[oldIndex];
    // Reverse the old ledger entry, then apply the edited one.
    adjustAccount(oldTx.account, -ledgerDelta(oldTx));
    adjustAccount(tx.account, ledgerDelta(tx));
    state.transactions[oldIndex] = tx;
    toast("Transaction updated", `${tx.name} was updated successfully.`);
  }else{
    state.transactions.unshift(tx);
    adjustAccount(tx.account, ledgerDelta(tx));
    toast("Transaction added", `${tx.name} ${data.type==="expense"?"was logged as an expense.":"was added as income."}`);
  }
  persist();
  closeModal("transactionModal");
  txEditId=null;
  render();
}

function deleteTransaction(id){
  const t=state.transactions.find(x=>x.id===id);
  if(!t) return;
  if(!confirm(`Delete "${t.name}"?`)) return;
  adjustAccount(t.account, -ledgerDelta(t));
  state.transactions = state.transactions.filter(x=>x.id!==id);
  persist(); render();
  toast("Transaction deleted","The record was removed.");
}

function exportCSV(){
  const rows = [["Name","Type","Category","Amount","Account","Date","Status","Note"],
    ...state.transactions.map(t=>[t.name,t.type,t.category,t.amount,accountName(t.account),t.date,t.status,t.note||""])];
  const csv = rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  downloadBlob(csv,"pulse-transactions.csv","text/csv;charset=utf-8");
  toast("CSV exported","Your transaction history is ready.");
}
function exportJSON(){
  downloadBlob(JSON.stringify(state,null,2),"pulse-backup.json","application/json");
  toast("Backup exported","All dashboard data was saved as JSON.");
}
function downloadBlob(content,name,type){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=name;a.click();URL.revokeObjectURL(a.href);
}

function toast(title, message){
  const wrap=$("#toastStack");
  const el=document.createElement("div");
  el.className="toast";
  el.innerHTML=`<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
  wrap.appendChild(el);
  setTimeout(()=>{el.style.opacity="0";el.style.transform="translateY(5px)";setTimeout(()=>el.remove(),220)},3300);
}

function sparkline(values,color="#8d67ff"){
  if(values.length<2) return "";
  const min=Math.min(...values),max=Math.max(...values),range=(max-min)||1;
  const pts=values.map((v,i)=>{
    const x=(i/(values.length-1))*100;
    const y=28-((v-min)/range)*23;
    return `${x},${y}`;
  }).join(" ");
  return `<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function monthlySeries(){
  const [y,m] = period.split("-").map(Number);
  const daysInMonth = new Date(y,m,0).getDate();
  const list = [];
  let cumulativeIncome = 0;
  let cumulativeExpense = 0;
  for(let day=1; day<=daysInMonth; day++){
    const date = `${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const daily = state.transactions.filter(t=>t.date===date);
    const inc = daily.filter(t=>t.type==="income").reduce((sum,t)=>sum+Number(t.amount),0);
    const exp = daily.filter(t=>t.type==="expense").reduce((sum,t)=>sum+Number(t.amount),0);
    cumulativeIncome += inc;
    cumulativeExpense += exp;
    list.push({
      key:date,label:String(day),
      inc:cumulativeIncome,exp:cumulativeExpense,
      net:cumulativeIncome-cumulativeExpense
    });
  }
  return list;
}

function compactAmount(v){
  const n = Number(v)||0;
  if(n>=100000) return `${state.settings.currency}${(n/100000).toFixed(1)}L`;
  if(n>=1000) return `${state.settings.currency}${(n/1000).toFixed(0)}k`;
  return `${state.settings.currency}${n.toFixed(0)}`;
}
function lineChart(series){
  const w=900,h=300,pad={l:56,r:16,t:14,b:34};
  const max=Math.max(...series.map(d=>Math.max(d.inc,d.exp)),1);
  const usableW=w-pad.l-pad.r, usableH=h-pad.t-pad.b;
  const x=i=>pad.l+(i/Math.max(series.length-1,1))*usableW;
  const y=v=>pad.t+usableH-(v/max)*usableH;
  const incPts=series.map((d,i)=>`${x(i)},${y(d.inc)}`).join(" ");
  const expPts=series.map((d,i)=>`${x(i)},${y(d.exp)}`).join(" ");
  const netPts=series.map((d,i)=>`${x(i)},${y(Math.max(d.net,0))}`).join(" ");
  const area=`${x(0)},${h-pad.b} ${incPts} ${x(series.length-1)},${h-pad.b}`;
  const grid=[];
  for(let g=0;g<=4;g++){
    const val=max*(g/4), yy=y(val);
    grid.push(`<line x1="${pad.l}" x2="${w-pad.r}" y1="${yy}" y2="${yy}" stroke="rgba(255,255,255,.055)" stroke-width="1"/>`);
    grid.push(`<text x="${pad.l-10}" y="${yy+3}" fill="#666975" font-size="9" text-anchor="end">${compactAmount(val)}</text>`);
  }
  const step = series.length > 20 ? 3 : 1;
  const labels=series.map((d,i)=>i%step===0?`<text x="${x(i)}" y="${h-10}" fill="#6b6e79" font-size="9" text-anchor="middle">${d.label}</text>`:"").join("");
  const incDots=series.map((d,i)=>`<circle data-chart-index="${i}" class="chart-dot income-dot" cx="${x(i)}" cy="${y(d.inc)}" r="${i%step===0?3:1.8}" fill="#8d67ff" stroke="#17181f" stroke-width="2"/>`).join("");
  const expDots=series.map((d,i)=>`<circle data-chart-index="${i}" class="chart-dot expense-dot" cx="${x(i)}" cy="${y(d.exp)}" r="${i%step===0?2.6:1.6}" fill="#ff7684" stroke="#17181f" stroke-width="1.5"/>`).join("");
  const netDots=series.map((d,i)=>`<circle data-chart-index="${i}" class="chart-dot net-dot" cx="${x(i)}" cy="${y(Math.max(d.net,0))}" r="${i%step===0?2.4:1.5}" fill="#4fd6d0" stroke="#17181f" stroke-width="1.5"/>`).join("");
  return `<svg class="line-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#8d67ff" stop-opacity=".20"/>
        <stop offset="1" stop-color="#8d67ff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid.join("")}
    <polygon points="${area}" fill="url(#incomeFill)"/>
    <polyline points="${incPts}" fill="none" stroke="#8d67ff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${expPts}" fill="none" stroke="#ff7684" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${netPts}" fill="none" stroke="#4fd6d0" stroke-width="1.6" stroke-dasharray="4 4" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
    ${incDots}${expDots}${netDots}${labels}
  </svg>`;
}

function categoryTotals(p=period){
  const map={};
  monthTransactions(p).filter(t=>t.type==="expense").forEach(t=>map[t.category]=(map[t.category]||0)+Number(t.amount));
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}
function donutSVG(data,total){
  if(!data.length) return `<div class="empty"><strong>No expenses yet</strong><span>Add a transaction to see your breakdown.</span></div>`;
  const colors=data.map(([cat])=>iconFor(cat).color);
  let angle=0;
  const radius=54,cx=70,cy=70,circ=2*Math.PI*radius;
  let circles="";
  data.forEach(([cat,val],i)=>{
    const portion=val/total;
    const dash=portion*circ;
    circles += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${colors[i]}" stroke-width="16" stroke-linecap="butt" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-angle}" />`;
    angle += dash;
  });
  return `<svg class="donut" viewBox="0 0 140 140">${circles}</svg>`;
}

function pageOverview(){
  const inc=totalIncome(), exp=totalExpense(), net=inc-exp;
  const series=monthlySeries();
  const cats=categoryTotals();
  const catTotal=cats.reduce((s,[,v])=>s+v,0);
  const recent=[...monthTransactions()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const upcoming=[...state.recurring].sort((a,b)=>a.next.localeCompare(b.next)).slice(0,4);
  const goals=state.goals.slice(0,3);
  const budgets=state.budgets.slice(0,4);

  const avg = series.length ? series.reduce((s,x)=>s+x.exp,0)/series.length : 0;
  const savingsRate = inc ? (net/inc)*100 : 0;

  return `<div class="view-enter page-stack">
    <section class="kpi-grid">
      ${kpi("Total balance",money(balance()),"Across all accounts",balance()>=0?"positive":"negative",sparkline(series.map((x,i)=>balance()+(i-5)*950),"#72dfae"))}
      ${kpi("Income this month",money(inc),`${net>=0?"▲":"▼"} ${Math.abs(savingsRate).toFixed(1)}% net rate`,inc>=0?"positive":"negative",sparkline(series.map(x=>x.inc),"#8d67ff"))}
      ${kpi("Expenses this month",money(exp),`${avg?money(avg):"₹0"} avg. 6mo`,exp<avg?"positive":"negative",sparkline(series.map(x=>x.exp),"#ff7684"))}
      ${kpi("Available to save",money(Math.max(net,0)),net>=0?"You are under budget":"Review spending",net>=0?"positive":"negative",sparkline(series.map(x=>Math.max(0,x.inc-x.exp)),"#4fd6d0"))}
    </section>

    <section class="overview-grid">
      <article class="panel chart-panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">Income & expense trend</div>
            <div class="panel-sub">Detailed daily cash-flow view · ${escapeHtml(monthLabel(period))}</div>
          </div>
          <div class="chart-head-actions">
            <span class="chart-pill">${money(net)} net</span>
            <button class="panel-link" data-view-link="reports">View report →</button>
          </div>
        </div>
        <div class="chart-wrap" id="trendChart">${lineChart(series)}<div class="chart-tooltip" id="chartTooltip"></div><div class="chart-crosshair" id="chartCrosshair"></div></div>
        <div class="chart-legend">
          <span><b class="legend-line income-line"></b> Income</span>
          <span><b class="legend-line expense-line"></b> Expense</span>
          <span><b class="legend-line net-line"></b> Net</span>
        </div>
      </article>

      <article class="panel donut-panel">
        <div class="panel-head"><div><div class="panel-title">All expenses</div><div class="panel-sub">${escapeHtml(monthLabel(period))}</div></div><button class="panel-link" data-view-link="expenses">Details →</button></div>
        <div class="donut-wrap">${donutSVG(cats.slice(0,6),catTotal)}${cats.length?`<div class="donut-center"><span class="big">${money(catTotal)}</span><span class="small">spent this month</span></div>`:""}</div>
        <div class="legend">${cats.slice(0,5).map(([cat,val])=>`<div class="legend-row"><span class="legend-dot" style="background:${iconFor(cat).color}"></span><span class="legend-name">${escapeHtml(cat)}</span><span class="legend-val">${money(val)}</span></div>`).join("") || '<div class="empty" style="padding:6px">No category data</div>'}</div>
      </article>
    </section>

    <section class="lower-grid">
      <article class="panel table-panel">
        <div class="panel-head"><div><div class="panel-title">Recent transactions</div><div class="panel-sub">Latest activity in ${escapeHtml(monthLabel(period))}</div></div><button class="panel-link" data-view-link="transactions">See all →</button></div>
        ${recent.length?`<table class="table"><thead><tr><th>Transaction</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>
          ${recent.map(txRow).join("")}</tbody></table>`:`<div class="empty"><strong>No transactions</strong><span>Start by adding your first transaction.</span></div>`}
      </article>

      <article class="panel content-panel">
        <div class="panel-head"><div><div class="panel-title">Upcoming payments</div><div class="panel-sub">Never miss recurring bills</div></div><button class="panel-link" data-view-link="recurring">Manage →</button></div>
        <div class="mini-list">${upcoming.map(r=>`<div class="mini-row"><div class="mini-icon">${iconFor(r.category).icon}</div><main><strong>${escapeHtml(r.name)}</strong><span>${escapeHtml(r.frequency)} · ${dateLabel(r.next,{month:"short",day:"numeric"})}</span></main><b>${money(r.amount)}</b></div>`).join("")}</div>
      </article>

      <article class="panel content-panel">
        <div class="panel-head"><div><div class="panel-title">Budget pulse</div><div class="panel-sub">Where you stand today</div></div><button class="panel-link" data-view-link="budgets">All →</button></div>
        ${budgets.map(b=>{
          const spent=categoryTotals().find(([c])=>c===b.category)?.[1]||0;
          const pct=Math.min(100,(spent/b.limit)*100);
          return `<div class="progress-item"><div class="progress-head"><b>${escapeHtml(b.category)}</b><span>${money(spent)} / ${money(b.limit)}</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div>`
        }).join("")}
      </article>

      <article class="panel content-panel">
        <div class="panel-head"><div><div class="panel-title">Saving goals</div><div class="panel-sub">Small steps, big targets</div></div><button class="panel-link" data-view-link="goals">Show more →</button></div>
        ${goals.map(g=>goalMini(g)).join("")}
      </article>
    </section>
  </div>`;
}

function kpi(label,value,sub,cls,spark){
  return `<article class="kpi-card"><div class="kpi-head"><span>${escapeHtml(label)}</span><span>•••</span></div><div class="kpi-value">${value}</div><div class="kpi-change ${cls}">${escapeHtml(sub)}</div><div class="spark">${spark}</div></article>`;
}
function txRow(t){
  const c=iconFor(t.category);
  return `<tr><td><div class="tx-name"><div class="tx-icon" style="background:${c.color}18;color:${c.color}">${c.icon}</div><div><strong>${escapeHtml(t.name)}</strong><span>${escapeHtml(t.category)} · ${escapeHtml(accountName(t.account))}</span></div></div></td><td class="${t.type==="expense"?"amount-exp":"amount-inc"}">${signedMoney(t.amount,t.type)}</td><td>${dateLabel(t.date,{month:"short",day:"numeric"})}</td><td><span class="status ${t.status==="approved"?"approved":"declined"}">${escapeHtml(t.status)}</span></td></tr>`;
}
function goalMini(g){
  const p=Math.min(100,(g.saved/g.target)*100);
  return `<div class="goal-card"><div class="goal-top"><strong>${escapeHtml(g.icon)} ${escapeHtml(g.name)}</strong><span>${p.toFixed(0)}%</span></div><div class="goal-amount">${money(g.saved)} <span style="color:var(--muted);font-weight:500">of ${money(g.target)}</span></div><div class="goal-track"><div style="width:${p}%"></div></div><div class="goal-footer"><span>${money(Math.max(g.target-g.saved,0))} left</span><span>by ${dateLabel(g.deadline,{month:"short",day:"numeric"})}</span></div></div>`;
}

function pageTransactions(){
  return `<div class="view-enter page-stack"><section class="panel content-panel">
    <div class="panel-head"><div><div class="panel-title">Transaction history</div><div class="panel-sub">Search, filter, edit and remove anything you have logged.</div></div><button class="primary-btn" data-add-tx>+ Add transaction</button></div>
    <div class="toolbar">
      <div class="search"><input id="txSearch" placeholder="Search transactions..." /></div>
      <select class="filter" id="txType"><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option></select>
      <select class="filter" id="txCat"><option value="all">All categories</option>${Object.keys(CATEGORIES).map(c=>`<option>${c}</option>`).join("")}</select>
      <select class="filter" id="txSort"><option value="new">Newest first</option><option value="old">Oldest first</option><option value="high">Highest amount</option><option value="low">Lowest amount</option></select>
    </div>
    <div id="transactionsTable"></div>
  </section></div>`;
}
function renderTransactionTable(){
  const root=$("#transactionsTable"); if(!root) return;
  const q=($("#txSearch")?.value||"").toLowerCase().trim(), type=$("#txType")?.value||"all", cat=$("#txCat")?.value||"all", sort=$("#txSort")?.value||"new";
  let list=state.transactions.filter(t=>txInPeriod(t,period));
  if(q) list=list.filter(t=>[t.name,t.note,t.category,accountName(t.account)].some(v=>String(v).toLowerCase().includes(q)));
  if(type!=="all") list=list.filter(t=>t.type===type);
  if(cat!=="all") list=list.filter(t=>t.category===cat);
  list.sort((a,b)=> sort==="high"?b.amount-a.amount:sort==="low"?a.amount-b.amount:sort==="old"?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
  root.innerHTML=list.length?`<div class="table-wrap"><table class="table large-table"><thead><tr><th>Transaction</th><th>Amount</th><th>Category</th><th>Account</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>
  ${list.map(t=>{const c=iconFor(t.category);return `<tr><td><div class="tx-name"><div class="tx-icon" style="background:${c.color}18;color:${c.color}">${c.icon}</div><div><strong>${escapeHtml(t.name)}</strong><span>${escapeHtml(t.note||"No note")}</span></div></div></td><td class="${t.type==="expense"?"amount-exp":"amount-inc"}">${signedMoney(t.amount,t.type)}</td><td>${escapeHtml(t.category)}</td><td>${escapeHtml(accountName(t.account))}</td><td>${dateLabel(t.date)}</td><td><span class="status approved">${escapeHtml(t.status)}</span></td><td><div class="row-actions"><button class="tiny-btn" data-edit="${t.id}" title="Edit">✎</button><button class="tiny-btn" data-delete="${t.id}" title="Delete">×</button></div></td></tr>`}).join("")}</tbody></table></div>`:
  `<div class="empty"><strong>No matching transactions</strong><span>Try another filter or add a new transaction.</span></div>`;
}

function pageExpenses(){
  const cats=categoryTotals();
  const total=cats.reduce((s,[,v])=>s+v,0);
  const largest=cats[0]?.[0]||"—";
  const avg=monthTransactions().filter(t=>t.type==="expense").length?total/monthTransactions().filter(t=>t.type==="expense").length:0;
  return `<div class="view-enter page-stack">
    <section class="expense-cards">
      <article class="panel insight"><p class="eyebrow">THIS MONTH</p><h3>${money(total)}</h3><p>Total outgoing money after filtering to the selected period.</p></article>
      <article class="panel insight"><p class="eyebrow">TOP CATEGORY</p><h3>${escapeHtml(largest)}</h3><p>${cats[0]?`${money(cats[0][1])} is your largest spend category this month.`:"Add an expense to see your top category."}</p></article>
      <article class="panel insight"><p class="eyebrow">AVERAGE TRANSACTION</p><h3>${money(avg)}</h3><p>Average value of an expense logged in the current period.</p></article>
    </section>
    <section class="page-grid">
      <article class="panel content-panel"><div class="panel-head"><div><div class="panel-title">Category breakdown</div><div class="panel-sub">Ranked by spend for ${escapeHtml(monthLabel(period))}</div></div></div>${expenseBreakdown(cats,total)}</article>
      <article class="panel content-panel"><div class="panel-head"><div><div class="panel-title">Spending tips</div><div class="panel-sub">Quick signals based on your data</div></div></div>
        <div class="mini-list">
          ${insightRow("⚡", "High-spend alert", cats[0]?`${cats[0][0]} is taking ${(cats[0][1]/Math.max(total,1)*100).toFixed(0)}% of spending.`:"Nothing to flag yet.")}
          ${insightRow("◌", "Budget coverage", `${state.budgets.length} categories have an active budget.`)}
          ${insightRow("↗", "Savings rate", `${((totalIncome()-total)/Math.max(totalIncome(),1)*100).toFixed(1)}% of income remains after expenses.`)}
        </div>
      </article>
    </section>
  </div>`;
}
function expenseBreakdown(cats,total){
  if(!cats.length) return `<div class="empty"><strong>No expenses for this period</strong><span>Add transactions to unlock insights.</span></div>`;
  return cats.map(([cat,val],i)=>`<div class="progress-item"><div class="progress-head"><b>${escapeHtml(cat)}</b><span>${money(val)} · ${((val/total)*100).toFixed(1)}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${(val/total)*100}%;background:linear-gradient(90deg,${iconFor(cat).color},#8d67ff)"></div></div></div>`).join("");
}
function insightRow(icon,title,desc){return `<div class="mini-row"><div class="mini-icon">${icon}</div><main><strong>${escapeHtml(title)}</strong><span>${escapeHtml(desc)}</span></main></div>`}

function pageBudgets(){
  const cats=categoryTotals();
  return `<div class="view-enter page-stack"><section class="panel content-panel"><div class="panel-head"><div><div class="panel-title">Monthly budgets</div><div class="panel-sub">Set spending limits and keep each category on track.</div></div><button class="primary-btn" data-add-budget>+ New budget</button></div>
    <div class="budget-grid">${state.budgets.map(b=>{
      const spent=cats.find(([c])=>c===b.category)?.[1]||0;const p=(spent/b.limit)*100;const over=spent>b.limit;
      return `<article class="panel budget-card"><div class="budget-top"><div class="budget-title"><div class="tx-icon" style="background:${iconFor(b.category).color}18;color:${iconFor(b.category).color}">${iconFor(b.category).icon}</div><div><strong>${escapeHtml(b.category)}</strong><span>Monthly limit</span></div></div><div class="budget-numbers"><strong>${money(spent)}</strong><span>of ${money(b.limit)}</span></div></div><div class="budget-bar"><div style="width:${Math.min(100,p)}%;background:${over?'linear-gradient(90deg,#ff7684,#ff9da5)':'linear-gradient(90deg,#8d67ff,#ba75ff)'}"></div></div><div class="budget-foot"><span class="${over?'over':''}">${over?`${money(spent-b.limit)} over`:`${money(b.limit-spent)} remaining`}</span><span>${p.toFixed(0)}%</span></div></article>`
    }).join("")}</div></section></div>`;
}

function pageAccounts(){
  return `<div class="view-enter page-stack"><section class="panel content-panel"><div class="panel-head"><div><div class="panel-title">Accounts</div><div class="panel-sub">Track multiple wallets, banks and cards in one view.</div></div><button class="primary-btn" data-add-account>+ Add account</button></div><div class="account-grid">
    ${state.accounts.map((a,i)=>`<article class="panel account-card"><div class="account-head"><span class="account-kind">${escapeHtml(a.type)}</span><button class="tiny-btn" data-delete-account="${a.id}">×</button></div><div class="account-name">${escapeHtml(a.name)}</div><div class="account-balance">${money(a.balance)}</div><div class="account-meta"><span>${escapeHtml(a.note||"")}</span><span>${i===0?"Primary":"Connected"}</span></div><div class="account-accent"></div></article>`).join("")}
    <article class="panel account-card add-card" data-add-account><div style="text-align:center"><div style="font-size:24px">＋</div><div style="font-size:10px;font-weight:800;margin-top:6px">Add another account</div></div></article>
  </div></section></div>`;
}

function pageRecurring(){
  return `<div class="view-enter page-stack"><section class="panel content-panel"><div class="panel-head"><div><div class="panel-title">Recurring payments</div><div class="panel-sub">Automate your awareness with future-payment reminders.</div></div><button class="primary-btn" data-add-recurring>+ Add recurring</button></div><div class="recurring-list">
    ${state.recurring.map(r=>`<div class="recurring-row"><div class="tx-icon" style="background:${iconFor(r.category).color}18;color:${iconFor(r.category).color}">${iconFor(r.category).icon}</div><div><strong>${escapeHtml(r.name)}</strong><span>${escapeHtml(r.frequency)} · ${escapeHtml(categoryName(r.category))} · ${escapeHtml(accountName(r.account))}</span></div><div class="next-date"><strong>${dateLabel(r.next,{month:"short",day:"numeric",year:"numeric"})}</strong><span>next payment</span></div><button class="action-mini" data-paid-recurring="${r.id}">Mark paid</button><button class="action-mini" data-delete-recurring="${r.id}">Delete</button></div>`).join("") || `<div class="empty"><strong>No recurring payments</strong><span>Add rent, subscriptions or bills to stay ahead.</span></div>`}
  </div></section></div>`;
}
function categoryName(c){return c}

function pageGoals(){
  return `<div class="view-enter page-stack"><section class="panel content-panel"><div class="panel-head"><div><div class="panel-title">Saving goals</div><div class="panel-sub">Give every rupee a destination.</div></div><button class="primary-btn" data-add-goal>+ New goal</button></div><div class="goal-grid">
    ${state.goals.map(g=>{const p=Math.min(100,g.saved/g.target*100);return `<article class="panel goal-large"><div class="goal-top"><strong class="big-goal">${escapeHtml(g.icon)} ${escapeHtml(g.name)}</strong><button class="tiny-btn" data-delete-goal="${g.id}">×</button></div><div class="goal-amount">${money(g.saved)} <span style="color:var(--muted);font-weight:500">/ ${money(g.target)}</span></div><div class="goal-percent">${p.toFixed(0)}%</div><div class="goal-description">Target: ${dateLabel(g.deadline,{month:"short",day:"numeric",year:"numeric"})} · ${money(Math.max(g.target-g.saved,0))} left to reach it.</div><div class="goal-track" style="margin-top:15px"><div style="width:${p}%"></div></div></article>`}).join("")}</div></section></div>`;
}

function pageReports(){
  const series=monthlySeries(), sixExpense=series.reduce((s,x)=>s+x.exp,0),sixIncome=series.reduce((s,x)=>s+x.inc,0);
  const max=Math.max(...series.map(x=>x.exp),1);
  return `<div class="view-enter page-stack"><section class="report-grid">
    <article class="panel content-panel"><p class="eyebrow">6 MONTHS</p><div class="report-number">${money(sixExpense)}</div><p style="color:var(--muted);font-size:9px;margin:0">Total expenses across the last six months. Income over the same window: <b style="color:#72dfae">${money(sixIncome)}</b>.</p><div class="stat-pills" style="margin-top:14px"><span class="pill">Avg / month: ${money(sixExpense/6)}</span><span class="pill">Savings rate: ${((sixIncome-sixExpense)/Math.max(sixIncome,1)*100).toFixed(1)}%</span><span class="pill">Transactions: ${state.transactions.length}</span></div></article>
    <article class="panel content-panel"><p class="eyebrow">EXPORTS</p><div class="report-number">Data ready.</div><p style="color:var(--muted);font-size:9px;margin:0 0 13px">Use CSV for spreadsheets or JSON for a full backup.</p><div style="display:flex;gap:8px"><button class="primary-btn" data-export-csv>Export CSV</button><button class="ghost-btn" data-export-json>Backup JSON</button></div></article>
  </section>
  <section class="panel content-panel"><div class="panel-head"><div><div class="panel-title">Monthly expense profile</div><div class="panel-sub">Higher bars represent greater spending.</div></div></div><div class="report-bars">
    ${series.map(s=>`<div class="bar-col"><span class="bar-value">${money(s.exp)}</span><div class="bar" style="height:${Math.max(8,s.exp/max*165)}px"></div><span class="bar-label">${s.label}</span></div>`).join("")}
  </div></section></div>`;
}

function pageTitle(view){
  return ({overview:"Overview",transactions:"Transactions",expenses:"All expenses",budgets:"Budgets",accounts:"Accounts",recurring:"Upcoming payments",goals:"Saving goals",reports:"Reports"})[view]||"Overview";
}

function render(){
  populatePeriodSelect();
  const views={overview:pageOverview,transactions:pageTransactions,expenses:pageExpenses,budgets:pageBudgets,accounts:pageAccounts,recurring:pageRecurring,goals:pageGoals,reports:pageReports};
  $("#pageTitle").textContent=pageTitle(currentView);
  $$(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView));
  $("#viewRoot").innerHTML=(views[currentView]||pageOverview)();
  populateTransactionForm();
  attachViewHandlers();
  if(currentView==="transactions") renderTransactionTable();
}

function attachViewHandlers(){
  $$("[data-view-link]").forEach(b=>b.addEventListener("click",()=>{currentView=b.dataset.viewLink;render()}));
  $$("[data-add-tx]").forEach(b=>b.addEventListener("click",()=>openTransactionModal()));
  $$("[data-edit]").forEach(b=>b.addEventListener("click",()=>openTransactionModal(b.dataset.edit)));
  $$("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteTransaction(b.dataset.delete)));
  $$("[data-add-budget]").forEach(b=>b.addEventListener("click",openBudgetModal));
  $$("[data-add-account]").forEach(b=>b.addEventListener("click",openAccountModal));
  $$("[data-delete-account]").forEach(b=>b.addEventListener("click",()=>deleteAccount(b.dataset.deleteAccount)));
  $$("[data-add-recurring]").forEach(b=>b.addEventListener("click",openRecurringModal));
  $$("[data-paid-recurring]").forEach(b=>b.addEventListener("click",()=>markRecurringPaid(b.dataset.paidRecurring)));
  $$("[data-delete-recurring]").forEach(b=>b.addEventListener("click",()=>deleteRecurring(b.dataset.deleteRecurring)));
  $$("[data-add-goal]").forEach(b=>b.addEventListener("click",openGoalModal));
  $$("[data-delete-goal]").forEach(b=>b.addEventListener("click",()=>deleteGoal(b.dataset.deleteGoal)));
  $$("[data-export-csv]").forEach(b=>b.addEventListener("click",exportCSV));
  $$("[data-export-json]").forEach(b=>b.addEventListener("click",exportJSON));

  ["#txSearch","#txType","#txCat","#txSort"].forEach(sel=>$(sel)?.addEventListener("input",renderTransactionTable));
  setupTrendTooltip();
}

function setupTrendTooltip(){
  const wrap=$(".chart-wrap"), svg=$(".line-chart"), tooltip=$("#chartTooltip"), cross=$("#chartCrosshair");
  if(!wrap||!svg||!tooltip) return;
  const series=monthlySeries();
  $$(".chart-dot",svg).forEach(dot=>{
    dot.addEventListener("mouseenter",()=>{
      const i=Number(dot.dataset.chartIndex), d=series[i];
      tooltip.innerHTML=`<span>${escapeHtml(dateLabel(d.key,{month:"short",day:"numeric"}))}</span>
        <strong>${money(d.inc)}</strong>
        <span>Income · ${money(d.exp)} expenses</span>
        <span style="color:#4fd6d0">Net · ${money(d.net)}</span>`;
      const pct = i/Math.max(series.length-1,1)*100;
      tooltip.style.left=`${pct}%`;
      tooltip.style.top=`${Math.max(12,Math.min(82,(Number(dot.getAttribute("cy"))/300)*100))}%`;
      tooltip.style.opacity="1";
      if(cross){cross.style.left=`${pct}%`;cross.style.opacity="1";}
    });
    dot.addEventListener("mouseleave",()=>{
      tooltip.style.opacity="0";
      if(cross) cross.style.opacity="0";
    });
  });
  wrap.addEventListener("mouseleave",()=>{
    tooltip.style.opacity="0";
    if(cross) cross.style.opacity="0";
  });
}

function openBudgetModal(){
  const catOptions=Object.keys(CATEGORIES).filter(c=>c!=="Salary").map(c=>`<option>${c}</option>`).join("");
  showGeneric(`<div class="modal-head"><div><p class="eyebrow">BUDGET</p><h2>New monthly budget</h2></div><button class="icon-btn close-modal" data-close="genericModal">×</button></div>
  <form id="budgetForm"><label><span>Category</span><select name="category">${catOptions}</select></label><label style="margin-top:12px;display:block"><span>Monthly limit</span><input name="limit" type="number" min="1" step="50" placeholder="5000" required></label><div class="modal-actions"><button type="button" class="ghost-btn close-modal" data-close="genericModal">Cancel</button><button class="primary-btn">Create budget</button></div></form>`);
  $("#budgetForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);const category=f.get("category"),limit=Number(f.get("limit"));state.budgets.push({id:uid("b"),category,limit});persist();closeModal("genericModal");render();toast("Budget created",`${category} is now capped at ${money(limit)}.`)});
}

function openAccountModal(){
  showGeneric(`<div class="modal-head"><div><p class="eyebrow">ACCOUNT</p><h2>Add account</h2></div><button class="icon-btn close-modal" data-close="genericModal">×</button></div>
  <form id="accountForm"><label><span>Account name</span><input name="name" placeholder="e.g. SBI Savings" required></label><div class="form-grid" style="margin-top:12px"><label><span>Type</span><select name="type"><option>Bank</option><option>Cash</option><option>Credit Card</option><option>Wallet</option></select></label><label><span>Opening balance</span><input name="balance" type="number" step="0.01" required value="0"></label></div><label><span>Note</span><input name="note" placeholder="Optional"></label><div class="modal-actions"><button type="button" class="ghost-btn close-modal" data-close="genericModal">Cancel</button><button class="primary-btn">Add account</button></div></form>`);
  $("#accountForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.accounts.push({id:uid("acc"),name:f.get("name"),type:f.get("type"),balance:Number(f.get("balance")),note:f.get("note")||""});persist();closeModal("genericModal");render();toast("Account added","Your new account is ready to use.")});
}

function deleteAccount(id){
  if(state.accounts.length<=1){toast("Can't delete","Keep at least one account available.");return}
  if(state.transactions.some(t=>t.account===id)){toast("Account in use","Remove or move its transactions first.");return}
  const a=state.accounts.find(x=>x.id===id);if(!a)return;
  if(!confirm(`Delete ${a.name}?`))return;
  state.accounts=state.accounts.filter(x=>x.id!==id);persist();render();toast("Account deleted","The account was removed.");
}

function openRecurringModal(){
  showGeneric(`<div class="modal-head"><div><p class="eyebrow">REMINDER</p><h2>Add recurring payment</h2></div><button class="icon-btn close-modal" data-close="genericModal">×</button></div>
  <form id="recurringForm"><div class="form-grid"><label><span>Name</span><input name="name" placeholder="e.g. YouTube Premium" required></label><label><span>Amount</span><input name="amount" type="number" min="0.01" step="0.01" required></label><label><span>Category</span><select name="category">${Object.keys(CATEGORIES).filter(c=>c!=="Salary").map(c=>`<option>${c}</option>`).join("")}</select></label><label><span>Frequency</span><select name="frequency"><option>Monthly</option><option>Weekly</option><option>Yearly</option></select></label><label><span>Account</span><select name="account">${state.accounts.map(a=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join("")}</select></label><label><span>Next payment</span><input name="next" type="date" required></label></div><div class="modal-actions"><button type="button" class="ghost-btn close-modal" data-close="genericModal">Cancel</button><button class="primary-btn">Add reminder</button></div></form>`);
  $("#recurringForm [name=next]").value = new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  $("#recurringForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.recurring.push({id:uid("r"),name:f.get("name"),amount:Number(f.get("amount")),category:f.get("category"),account:f.get("account"),next:f.get("next"),frequency:f.get("frequency")});persist();closeModal("genericModal");render();toast("Reminder added","We'll keep the payment visible in your dashboard.")});
}

function markRecurringPaid(id){
  const r=state.recurring.find(x=>x.id===id);if(!r)return;
  const recurringTx = {id:uid("t"),name:r.name,amount:r.amount,type:"expense",category:r.category,account:r.account,date:new Date().toISOString().slice(0,10),note:"Recurring payment",status:"approved"};
  state.transactions.unshift(recurringTx);
  adjustAccount(recurringTx.account, ledgerDelta(recurringTx));
  const d=new Date(`${r.next}T00:00:00`);
  if(r.frequency==="Monthly") d.setMonth(d.getMonth()+1);
  else if(r.frequency==="Weekly") d.setDate(d.getDate()+7);
  else d.setFullYear(d.getFullYear()+1);
  r.next=d.toISOString().slice(0,10);
  persist();render();toast("Payment recorded",`${r.name} was added to your transactions.`);
}
function deleteRecurring(id){
  if(!confirm("Delete this recurring payment?"))return;
  state.recurring=state.recurring.filter(r=>r.id!==id);persist();render();toast("Reminder deleted","The recurring item is no longer tracked.");
}

function openGoalModal(){
  showGeneric(`<div class="modal-head"><div><p class="eyebrow">SAVING GOAL</p><h2>Create a goal</h2></div><button class="icon-btn close-modal" data-close="genericModal">×</button></div>
  <form id="goalForm"><div class="form-grid"><label><span>Goal name</span><input name="name" placeholder="e.g. New camera" required></label><label><span>Icon</span><input name="icon" value="◇" maxlength="2"></label><label><span>Target amount</span><input name="target" type="number" min="1" step="100" required></label><label><span>Already saved</span><input name="saved" type="number" min="0" step="100" value="0"></label><label><span>Deadline</span><input name="deadline" type="date" required></label></div><div class="modal-actions"><button type="button" class="ghost-btn close-modal" data-close="genericModal">Cancel</button><button class="primary-btn">Create goal</button></div></form>`);
  $("#goalForm [name=deadline]").value = `${new Date().getFullYear()+1}-12-31`;
  $("#goalForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.goals.push({id:uid("g"),name:f.get("name"),icon:f.get("icon"),target:Number(f.get("target")),saved:Number(f.get("saved")),deadline:f.get("deadline")});persist();closeModal("genericModal");render();toast("Goal created","Your next milestone has been added.")});
}
function deleteGoal(id){
  if(!confirm("Delete this saving goal?"))return;
  state.goals=state.goals.filter(g=>g.id!==id);persist();render();toast("Goal deleted","The goal was removed.");
}

function showGeneric(inner){
  $("#genericModalContent").innerHTML=inner;
  $("#genericModal").classList.remove("hidden");
  $$("#genericModal .close-modal").forEach(b=>b.addEventListener("click",()=>closeModal("genericModal")));
}
function openProfileModal(){ $("#profileModal").classList.remove("hidden"); }

function actionMenu(){
  $("#notificationBtn").addEventListener("click",()=>{
    showGeneric(`<div class="modal-head"><div><p class="eyebrow">NOTIFICATIONS</p><h2>You're on track ✨</h2></div><button class="icon-btn close-modal" data-close="genericModal">×</button></div>
    <div class="mini-list">
      ${state.recurring.slice(0,3).map(r=>insightRow("◷",`${r.name} due ${dateLabel(r.next,{month:"short",day:"numeric"})}`,`${money(r.amount)} · ${r.frequency}`)).join("")}
      ${state.budgets.filter(b=>(categoryTotals().find(([c])=>c===b.category)?.[1]||0)>b.limit).map(b=>insightRow("!",`${b.category} is over budget`,`You've exceeded the ${money(b.limit)} limit.`)).join("") || insightRow("✓","No budget overruns","Nice work — your active budgets are within range.")}
    </div>`);
  });
}

function wireGlobal(){
  $$(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>{currentView=b.dataset.view;render();closeSidebar()}));
  $("#addTopBtn").addEventListener("click",()=>openTransactionModal());
  $(".avatar-top").addEventListener("click",openProfileModal);
  $("#sidebarProfile").addEventListener("click",openProfileModal);
  $("#periodSelect").addEventListener("change",e=>{period=e.target.value;render()});
  $("#transactionForm").addEventListener("submit",e=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    addTransaction({amount:fd.get("amount"),name:fd.get("name"),category:fd.get("category"),account:fd.get("account"),date:fd.get("date"),note:fd.get("note"),type:fd.get("kind")});
  });
  $$(".close-modal").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
  $("#transactionModal").addEventListener("click",e=>{if(e.target.id==="transactionModal")closeModal("transactionModal")});
  $("#genericModal").addEventListener("click",e=>{if(e.target.id==="genericModal")closeModal("genericModal")});
  $("#profileModal").addEventListener("click",e=>{if(e.target.id==="profileModal")closeModal("profileModal")});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal("transactionModal");closeModal("genericModal");closeModal("profileModal")}});
  $("#mobileMenu").addEventListener("click",openSidebar);
  $("#mobileClose").addEventListener("click",closeSidebar);
  $("#mobileOverlay").addEventListener("click",closeSidebar);
  $$("[data-action=export]").forEach(b=>b.addEventListener("click",exportCSV));
  $$("[data-action=reset]").forEach(b=>b.addEventListener("click",resetDemo));
  actionMenu();
}
function openSidebar(){ $("#sidebar").classList.add("open");$("#mobileOverlay").classList.add("show"); }
function closeSidebar(){ $("#sidebar").classList.remove("open");$("#mobileOverlay").classList.remove("show"); }

render();
wireGlobal();
