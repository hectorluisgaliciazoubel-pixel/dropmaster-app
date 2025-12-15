import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Calendar, 
  BarChart3, 
  Save, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Target, 
  DollarSign, 
  AlertCircle,
  Settings,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Percent,
  Cloud,
  Loader2,
  AlertTriangle,
  LogOut,
  User,
  Lock,
  Mail
} from 'lucide-react';

// --- IMPORTAÇÕES FIREBASE ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy
} from 'firebase/firestore';

// ============================================================================
// ÁREA DE CONFIGURAÇÃO - SUAS CHAVES
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyDk7fSuV847W5YDSw_clwImQBVIbOqKpjw",
  authDomain: "financeiro-dropmaster-cfo.firebaseapp.com",
  projectId: "financeiro-dropmaster-cfo",
  storageBucket: "financeiro-dropmaster-cfo.firebasestorage.app",
  messagingSenderId: "488471816156",
  appId: "1:488471816156:web:5b0ada2e48c583318ed119"
};

// Nome do seu aplicativo no banco de dados
const appId = 'dropmaster-v1';

// ============================================================================

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CONFIGURAÇÕES GLOBAIS ---
const TAXAS_PADRAO = {
  yampi_percent: 1.5,
  imposto_percent: 10.0,
  appmax_fixo: 0,
};

// --- HELPER FUNCTIONS ---
const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

const formatDateBR = (dateStr) => {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

// --- COMPONENTES ---

const ChartComponent = ({ data, period }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white p-8 rounded-xl shadow-sm border border-slate-100 mb-6 text-center text-slate-400">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p>Sem dados para exibir neste período.</p>
      </div>
    );
  }

  let maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.profit)));
  let minVal = Math.min(...data.map(d => Math.min(d.profit, 0)));
  
  maxVal = maxVal > 0 ? maxVal * 1.1 : 100;
  if (minVal < 0) minVal = minVal * 1.1;
  else minVal = 0;

  const range = maxVal - minVal || 100;
  const zeroLinePercent = ((0 - minVal) / range) * 100;

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
      <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
        <BarChart3 className="w-4 h-4" /> Evolução Financeira ({period})
      </h4>
      
      <div className="relative h-[200px] w-full border-l border-b border-slate-100">
        <div 
          className="absolute w-full border-b border-slate-300 border-dashed z-0 pointer-events-none" 
          style={{ bottom: `${zeroLinePercent}%` }} 
        />
        
        <div className="absolute inset-0 flex items-end justify-around px-2 gap-2">
          {data.map((item, idx) => {
            const barHeightProfit = (Math.abs(item.profit) / range) * 100;
            const barHeightRev = (item.revenue / range) * 100;
            const isProfitNegative = item.profit < 0;
            const marginPercent = item.revenue > 0 
                ? ((item.profit / item.revenue) * 100).toFixed(1) 
                : '0.0';
            const profitBottom = isProfitNegative 
              ? zeroLinePercent - barHeightProfit 
              : zeroLinePercent;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full relative group">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-800 text-white text-[11px] p-3 rounded-lg z-20 whitespace-nowrap shadow-xl border border-slate-700 min-w-[120px]">
                  <div className="font-bold border-b border-slate-600 pb-2 mb-2 text-center text-indigo-200">{item.label}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-4 text-slate-300">
                        <span>Receita:</span> <span className="font-medium text-white">R$ {item.revenue.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between gap-4 font-bold ${item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span>Lucro:</span> <span className="font-bold">R$ {item.profit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-slate-600 pt-1 mt-1">
                        <span className="text-slate-400">Margem:</span> <span className={`font-bold ${parseFloat(marginPercent) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{marginPercent}%</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-full relative mx-auto max-w-[40px] flex justify-center">
                  <div 
                    className="absolute w-1 bg-blue-100 left-1/2 -translate-x-1/2 rounded-t-sm z-0"
                    style={{ bottom: `${zeroLinePercent}%`, height: `${barHeightRev}%` }}
                  ></div>
                  <div 
                    className={`absolute w-full max-w-[24px] rounded-sm z-10 transition-all hover:opacity-90 cursor-pointer ${isProfitNegative ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ bottom: `${profitBottom}%`, height: `${Math.max(barHeightProfit, 1)}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 absolute -bottom-6 w-full text-center truncate px-1">{item.shortLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Legenda simplificada para mobile */}
      <div className="flex flex-wrap gap-4 justify-center mt-8 text-xs text-slate-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Lucro</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Prejuízo</div>
        <div className="flex items-center gap-1"><div className="w-1 h-3 bg-blue-100 rounded-sm"></div> Receita</div>
      </div>
    </div>
  );
};

// 1. ABA PRECIFICAÇÃO
const PrecificacaoTab = () => {
  const [inputs, setInputs] = useState({
    cotacaoDolar: 5.85,
    precoFornUSD: 10.00,
    freteBRL: 25.00,
    vendaBRL: 149.90,
    cpaTeste: 40.00,
    margemDesejada: 20.00,
    impostoRate: 10.00,
    gatewayRate: 6.5,
  });

  const custoProdutoBRL = inputs.precoFornUSD * inputs.cotacaoDolar;
  const custoTotalUnitario = custoProdutoBRL + inputs.freteBRL;
  const impostos = inputs.vendaBRL * (inputs.impostoRate / 100);
  const taxas = inputs.vendaBRL * (inputs.gatewayRate / 100);
  const margemContribuicao = inputs.vendaBRL - custoTotalUnitario - impostos - taxas;
  const lucroDesejado = inputs.vendaBRL * (inputs.margemDesejada / 100);
  const disponivelParaAds = margemContribuicao - lucroDesejado;
  const roasIdeal = disponivelParaAds > 0 ? inputs.vendaBRL / disponivelParaAds : 0;
  const roasBreakEven = margemContribuicao > 0 ? inputs.vendaBRL / margemContribuicao : 0;
  const lucroAtualComCPATeste = margemContribuicao - inputs.cpaTeste;
  const margemAtual = (lucroAtualComCPATeste / inputs.vendaBRL) * 100;
  const custosFixosTotais = custoTotalUnitario + inputs.cpaTeste;
  const somaPercentuais = (inputs.impostoRate + inputs.gatewayRate + inputs.margemDesejada) / 100;
  const divisor = 1 - somaPercentuais;
  let precoSugerido = divisor > 0 ? custosFixosTotais / divisor : 0;
  let isViavel = divisor > 0;
  const markupSugerido = custoTotalUnitario > 0 ? precoSugerido / custoTotalUnitario : 0;

  // ESTILO FORÇADO PARA TEMA CLARO - AGORA COM !important
  const inputClass = "w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 force-light-input";

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Dados do Produto
            </h3>
            {/* CORREÇÃO: Usar 1 coluna no mobile (grid-cols-1) e 2 no PC (sm:grid-cols-2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Cotação Dólar</label>
                <input type="number" value={inputs.cotacaoDolar} onChange={(e) => setInputs({...inputs, cotacaoDolar: parseFloat(e.target.value) || 0})} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Preço Forn. (USD)</label>
                <input type="number" value={inputs.precoFornUSD} onChange={(e) => setInputs({...inputs, precoFornUSD: parseFloat(e.target.value) || 0})} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Frete (BRL)</label>
                <input type="number" value={inputs.freteBRL} onChange={(e) => setInputs({...inputs, freteBRL: parseFloat(e.target.value) || 0})} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Venda (BRL)</label>
                <input type="number" value={inputs.vendaBRL} onChange={(e) => setInputs({...inputs, vendaBRL: parseFloat(e.target.value) || 0})} className={`${inputClass} border-blue-200 bg-blue-50 text-blue-900 font-bold`} />
              </div>
            </div>
            {/* CORREÇÃO: 1 coluna no mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Impostos (%)</label>
                <div className="relative">
                    <input type="number" value={inputs.impostoRate} onChange={(e) => setInputs({...inputs, impostoRate: parseFloat(e.target.value) || 0})} className={`${inputClass} pl-8`} />
                    <Percent className="w-3 h-3 text-slate-400 absolute left-3 top-4" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Gateway + Taxas (%)</label>
                <div className="relative">
                    <input type="number" value={inputs.gatewayRate} onChange={(e) => setInputs({...inputs, gatewayRate: parseFloat(e.target.value) || 0})} className={`${inputClass} pl-8`} />
                    <Percent className="w-3 h-3 text-slate-400 absolute left-3 top-4" />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-500">CPA Projetado (Teste)</label>
              <input type="number" value={inputs.cpaTeste} onChange={(e) => setInputs({...inputs, cpaTeste: parseFloat(e.target.value) || 0})} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 flex justify-between">
                Margem Líquida Desejada (%) <span className="text-green-600 font-bold">{inputs.margemDesejada}%</span>
              </label>
              <input type="range" min="1" max="50" value={inputs.margemDesejada} onChange={(e) => setInputs({...inputs, margemDesejada: parseFloat(e.target.value) || 0})} className="w-full mt-2 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">ROAS Break Even</div>
                <div className="text-4xl font-bold">{roasBreakEven.toFixed(2)}</div>
                <div className="text-xs text-slate-400 mt-2">CPA Máx: R$ {margemContribuicao.toFixed(2)}</div>
              </div>
              <AlertCircle className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-slate-700 opacity-20" />
            </div>
            <div className={`p-5 rounded-xl shadow-lg text-white relative overflow-hidden ${disponivelParaAds <= 0 ? 'bg-red-500' : 'bg-green-500'}`}>
              <div className="relative z-10">
                <div className="text-xs font-medium text-green-100 uppercase tracking-wider mb-1">ROAS Ideal ({inputs.margemDesejada}%)</div>
                <div className="text-4xl font-bold">{disponivelParaAds <= 0 ? "N/A" : roasIdeal.toFixed(2)}</div>
                <div className="text-xs text-green-100 mt-2">CPA Ideal: R$ {disponivelParaAds.toFixed(2)}</div>
              </div>
              <Target className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white opacity-20" />
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Lucro com CPA Atual</div>
              <div className={`text-3xl font-bold ${lucroAtualComCPATeste >= 0 ? 'text-blue-600' : 'text-red-500'}`}>R$ {lucroAtualComCPATeste.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-2">Margem: {margemAtual.toFixed(1)}%</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-4 items-center">
              <div className="bg-white p-3 rounded-full h-fit shadow-sm text-indigo-600"><Lightbulb className="w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-indigo-900 text-lg">Sugestão de Preço</h4>
                <p className="text-sm text-indigo-700 mt-1 max-w-md">Para manter seu CPA atual e lucrar <strong>{inputs.margemDesejada}%</strong>, você deveria vender por:</p>
              </div>
            </div>
            <div className="text-right w-full sm:w-auto">
              <div className="text-3xl font-bold text-indigo-600">{isViavel ? precoSugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : <span className="text-red-500 text-xl">Impossível</span>}</div>
              {isViavel && <div className="text-xs text-indigo-400 mt-1 font-medium">Markup Sugerido {markupSugerido.toFixed(2)}x</div>}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Raio-X do Custo Unitário</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-600">Custo Mercadoria + Frete</span><span className="font-medium">R$ {custoTotalUnitario.toFixed(2)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-600">Impostos ({inputs.impostoRate}%)</span><span className="font-medium text-red-500">- R$ {impostos.toFixed(2)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-50"><span className="text-slate-600">Taxas Gateway/Checkout (~{inputs.gatewayRate}%)</span><span className="font-medium text-red-500">- R$ {taxas.toFixed(2)}</span></div>
              <div className="flex justify-between py-2 pt-4"><span className="font-bold text-slate-800">Margem de Contribuição</span><span className="font-bold text-slate-800">R$ {margemContribuicao.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. ABA FLUXO DIÁRIO
const FluxoDiarioTab = ({ transactions, addTransaction, deleteTransaction }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendaBruta: '',
    repasseLiquido: '',
    gastoAds: '',
    custoProdutos: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTransactions = [];
    const date = formData.date;

    if (formData.repasseLiquido) {
      newTransactions.push({
        date, description: 'Repasse Líquido AppMax', 
        amount: parseFloat(formData.repasseLiquido), type: 'income', category: 'receita_liquida'
      });
    }
    if (formData.vendaBruta) {
      const valorBruto = parseFloat(formData.vendaBruta);
      newTransactions.push({
        date, description: `Fatura Yampi (${TAXAS_PADRAO.yampi_percent}% do Bruto)`,
        amount: -(valorBruto * (TAXAS_PADRAO.yampi_percent / 100)), type: 'expense', category: 'taxa_yampi'
      });
      newTransactions.push({
        date, description: `Provisão Imposto (${TAXAS_PADRAO.imposto_percent}% do Bruto)`,
        amount: -(valorBruto * (TAXAS_PADRAO.imposto_percent / 100)), type: 'expense', category: 'imposto'
      });
    }
    if (formData.gastoAds) {
      newTransactions.push({
        date, description: 'Tráfego Pago (Ads)',
        amount: -parseFloat(formData.gastoAds), type: 'expense', category: 'marketing'
      });
    }
    if (formData.custoProdutos) {
      newTransactions.push({
        date, description: 'Fornecedor/Frete (Pago)',
        amount: -parseFloat(formData.custoProdutos), type: 'expense', category: 'custo_produto'
      });
    }
    addTransaction(newTransactions);
    setFormData(prev => ({ ...prev, vendaBruta: '', repasseLiquido: '', gastoAds: '', custoProdutos: '' }));
  };

  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date) || (b.createdAt?.toMillis && b.createdAt.toMillis() || 0) - (a.createdAt?.toMillis && a.createdAt.toMillis() || 0)).slice(0, 10);

  // ESTILO FORÇADO E BLINDADO PARA TEMA CLARO
  const inputClass = "w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 placeholder-slate-400 force-light-input";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn pb-20">
      <div className="lg:col-span-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-6">
          <h3 className="font-bold text-slate-700 mb-1 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-600" /> Lançar Dia</h3>
          <p className="text-xs text-slate-500 mb-6">Lance o que realmente aconteceu no financeiro hoje.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-xs font-semibold text-slate-600 block mb-1">Data</label><input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={inputClass} /></div>
            {/* CORREÇÃO: 1 coluna no mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div><label className="text-xs font-semibold text-slate-600 block mb-1">Venda Bruta Yampi (Total)</label><input type="number" step="0.01" placeholder="0.00" value={formData.vendaBruta} onChange={e => setFormData({...formData, vendaBruta: e.target.value})} className={inputClass} /></div>
              <div><label className="text-xs font-semibold text-green-600 block mb-1">Repasse Líquido AppMax</label><input type="number" step="0.01" placeholder="0.00" value={formData.repasseLiquido} onChange={e => setFormData({...formData, repasseLiquido: e.target.value})} className={`${inputClass} border-green-200 bg-green-50 text-green-900 font-bold`} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
               <div><label className="text-xs font-semibold text-red-500 block mb-1">Gasto Ads</label><input type="number" step="0.01" placeholder="0.00" value={formData.gastoAds} onChange={e => setFormData({...formData, gastoAds: e.target.value})} className={`${inputClass} border-red-100 bg-red-50 text-red-900`} /></div>
               <div><label className="text-xs font-semibold text-red-500 block mb-1">Custo Produtos</label><input type="number" step="0.01" placeholder="0.00" value={formData.custoProdutos} onChange={e => setFormData({...formData, custoProdutos: e.target.value})} className={`${inputClass} border-red-100 bg-red-50 text-red-900`} /></div>
            </div>
            <button type="submit" className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"><Save className="w-4 h-4" /> Salvar Fechamento</button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-8">
        <h3 className="font-bold text-slate-700 mb-4">Últimos Lançamentos</h3>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium"><tr><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4 text-right">Valor</th><th className="p-4 w-10"></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-400">Nenhum lançamento ainda.</td></tr>
              ) : (
                recentTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">{formatDateBR(t.date)}</td>
                    <td className="p-4 font-medium text-slate-700">{t.description}</td>
                    <td className={`p-4 text-right font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-4 text-right"><button onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 3. ABA DRE GERENCIAL
const DRETab = ({ transactions, fixedCosts, addFixedCost, removeFixedCost }) => {
  const [periodo, setPeriodo] = useState('mensal'); 
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  const currentWeek = getWeekNumber(new Date());
  const [dateFilter, setDateFilter] = useState(currentMonth);

  useEffect(() => {
    if (periodo === 'diario') setDateFilter(today);
    if (periodo === 'semanal') setDateFilter(currentWeek);
    if (periodo === 'mensal') setDateFilter(currentMonth);
  }, [periodo]);

  const { filteredTransactions, costFactor, periodLabel } = useMemo(() => {
    let filtered = [];
    let factor = 1;
    let label = '';
    if (periodo === 'total') {
      filtered = transactions;
      const uniqueMonths = new Set(transactions.map(t => t.date.slice(0, 7))).size || 1;
      factor = uniqueMonths;
      label = 'Todo o Período';
    } else if (periodo === 'mensal') {
      filtered = transactions.filter(t => t.date.startsWith(dateFilter));
      factor = 1;
      label = `Mês: ${dateFilter}`;
    } else if (periodo === 'diario') {
      filtered = transactions.filter(t => t.date === dateFilter);
      factor = 1 / 30;
      label = `Dia: ${formatDateBR(dateFilter)}`;
    } else if (periodo === 'semanal') {
      if (dateFilter && dateFilter.includes('-W')) {
          filtered = transactions.filter(t => getWeekNumber(new Date(t.date)) === dateFilter);
          label = `Semana: ${dateFilter}`;
      } else { filtered = []; label = 'Carregando...'; }
      factor = 7 / 30; 
    }
    return { filteredTransactions: filtered, costFactor: factor, periodLabel: label };
  }, [transactions, periodo, dateFilter]);

  const totals = filteredTransactions.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
  
  const chartData = useMemo(() => {
    const dailyData = {};
    if(periodo === 'mensal' && dateFilter) {
        const [y, m] = dateFilter.split('-');
        if(y && m) {
          const daysInMonth = new Date(y, m, 0).getDate();
          for(let i=1; i<=daysInMonth; i++) {
              const dayStr = `${y}-${m}-${String(i).padStart(2,'0')}`;
              dailyData[dayStr] = { revenue: 0, expenses: 0, profit: 0, label: `${i}/${m}` };
          }
        }
    }
    if (periodo === 'semanal' && dateFilter && dateFilter.includes('-W')) {
      const [yStr, wStr] = dateFilter.split('-W');
      const year = parseInt(yStr);
      const week = parseInt(wStr);
      const jan4 = new Date(year, 0, 4);
      const daysToMon = jan4.getDay() === 0 ? 6 : jan4.getDay() - 1; 
      const mondayWeek1 = new Date(year, 0, 4 - daysToMon); 
      const mondaySelected = new Date(mondayWeek1.getTime() + (week - 1) * 7 * 86400000);
      for (let i = 0; i < 7; i++) {
        const d = new Date(mondaySelected.getTime() + i * 86400000);
        if(!isNaN(d.getTime())) {
            const dayStr = d.toISOString().split('T')[0];
            const dayNum = d.getDate();
            const monthNum = d.getMonth() + 1;
            const weekDayName = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()];
            dailyData[dayStr] = { revenue: 0, expenses: 0, profit: 0, label: `${weekDayName} ${dayNum}/${monthNum}` };
        }
      }
    }
    if(periodo === 'diario') dailyData[dateFilter] = { revenue: 0, expenses: 0, profit: 0, label: formatDateBR(dateFilter) };

    filteredTransactions.forEach(t => {
      if (!dailyData[t.date]) dailyData[t.date] = { revenue: 0, expenses: 0, profit: 0, label: formatDateBR(t.date).slice(0,5) };
      if (t.type === 'income') dailyData[t.date].revenue += t.amount;
      if (t.type === 'expense') dailyData[t.date].expenses += Math.abs(t.amount); 
    });

    const fixedDaily = fixedCosts.reduce((s, c) => s + c.amount, 0) / 30;
    const result = Object.entries(dailyData).sort((a,b) => a[0].localeCompare(b[0])).map(([date, vals]) => {
         let profit = vals.revenue - vals.expenses;
         if(periodo === 'mensal' || periodo === 'diario' || periodo === 'semanal') profit -= fixedDaily;
         return { date, label: vals.label, shortLabel: vals.label.split(' ')[0], revenue: vals.revenue, profit: profit };
      });
    return result;
  }, [filteredTransactions, periodo, dateFilter, fixedCosts]);

  const totalFixedCosts = fixedCosts.reduce((sum, fc) => sum + fc.amount, 0);
  const appliedFixedCosts = totalFixedCosts * costFactor;
  const receitaLiquida = totals['receita_liquida'] || 0;
  const impostos = totals['imposto'] || 0;
  const taxasYampi = totals['taxa_yampi'] || 0;
  const custoProduto = totals['custo_produto'] || 0;
  const marketing = totals['marketing'] || 0;
  const margemContribuicao = receitaLiquida + impostos + taxasYampi + custoProduto + marketing;
  const resultadoLiquido = margemContribuicao - appliedFixedCosts;

  const inputClass = "input-filter font-bold text-slate-700 bg-white border-0 rounded";

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          {['Diário', 'Semanal', 'Mensal', 'Total'].map(p => (
            <button key={p} onClick={() => setPeriodo(p.toLowerCase())} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${periodo === p.toLowerCase() ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>{p}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0 bg-white border border-slate-200 rounded-lg p-1 w-full md:w-auto">
          <Calendar className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
          {periodo === 'diario' && <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={inputClass} />}
          {periodo === 'semanal' && <input type="week" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={inputClass} />}
          {periodo === 'mensal' && <input type="month" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={inputClass} />}
          {periodo === 'total' && <span className="text-sm font-bold text-slate-500 px-2 whitespace-nowrap">Histórico Completo</span>}
        </div>
      </div>
      <style>{`.input-filter { border: none; background: transparent; padding: 0.5rem; font-size: 0.875rem; color: #475569; outline: none; cursor: pointer; width: 100%; } .input-filter:focus { ring: 0; }`}</style>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ChartComponent data={chartData} period={periodLabel} />
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center"><h3 className="font-bold">DRE Gerencial</h3><span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{periodLabel}</span></div>
            <div className="p-6 space-y-1">
              <div className="flex justify-between items-center py-2 text-green-600 font-bold text-lg border-b border-slate-100 mb-2"><span>(+) Entradas AppMax (Líquido)</span><span>{receitaLiquida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
              <DRELine label="(-) Impostos" value={impostos} />
              <DRELine label="(-) Taxa Yampi" value={taxasYampi} />
              <DRELine label="(-) Custo Produto" value={custoProduto} />
              <DRELine label="(-) Marketing (Ads)" value={marketing} />
              <div className="flex justify-between items-center py-3 mt-2 bg-indigo-50 px-4 -mx-4 border-t border-indigo-100">
                <div className="flex flex-col"><span className="font-bold text-indigo-900">(=) Margem de Contribuição</span><span className="text-xs text-indigo-400">Lucro Operacional</span></div>
                <span className="font-bold text-indigo-900 text-lg">{margemContribuicao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="py-4 space-y-1 border-b border-slate-100">
                 <div className="flex justify-between text-slate-500 font-medium mb-2"><span>(-) Despesas Fixas (Proporcional)</span><span className="text-red-500">- {appliedFixedCosts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                 {fixedCosts.map(fc => (<div key={fc.id} className="flex justify-between text-xs text-slate-400 pl-4"><span>{fc.name}</span><span>- {(fc.amount * costFactor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>))}
              </div>
              <div className={`flex justify-between items-center py-4 px-4 -mx-4 ${resultadoLiquido >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} mt-2 rounded-b-lg`}><span className="font-bold text-xl">(=) Resultado Líquido</span><span className="font-bold text-2xl">{resultadoLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-orange-500" /> Custos Fixos Mensais</h3>
            <p className="text-xs text-slate-400 mb-4">Cadastre aqui o valor MENSAL cheio. O sistema divide automaticamente nas visões diárias e semanais.</p>
            <form onSubmit={(e) => { e.preventDefault(); const name = e.target.name.value; const amount = parseFloat(e.target.amount.value); if(name && amount) { addFixedCost(name, amount); e.target.reset(); } }} className="flex gap-2 mb-6">
              <input name="name" placeholder="Nome" className="flex-1 p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-900" required /><input name="amount" type="number" placeholder="R$" className="w-20 p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-900" required />
              <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"><Plus className="w-4 h-4" /></button>
            </form>
            <div className="space-y-2">{fixedCosts.map(fc => (<div key={fc.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="text-sm text-slate-700 font-medium">{fc.name}</span><div className="flex items-center gap-3"><span className="text-sm font-bold text-slate-600">R$ {fc.amount}</span><button onClick={() => removeFixedCost(fc.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button></div></div>))}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DRELine = ({ label, value }) => (
  <div className="flex justify-between text-sm text-slate-600 py-1"><span>{label}</span><span className={`${value < 0 ? 'text-red-500' : 'text-slate-700'}`}>{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
);

// --- TELA DE LOGIN ---
const LoginScreen = ({ onLogin, onRegister, error }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      onRegister(email, password);
    } else {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 w-full" style={{ colorScheme: 'light' }}>
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl w-fit mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">DropMaster CFO</h1>
          <p className="text-slate-500 text-sm mt-1">Gestão Financeira para E-commerce</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900 placeholder-slate-400 force-light-input"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="password" 
                required 
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900 placeholder-slate-400 force-light-input"
                placeholder="******"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {isRegistering ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
          </span>
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="ml-2 text-indigo-600 font-bold hover:text-indigo-800"
          >
            {isRegistering ? 'Fazer Login' : 'Criar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function DropMasterCFO() {
  const [activeTab, setActiveTab] = useState('precificacao');
  const [transactions, setTransactions] = useState([]);
  const [fixedCosts, setFixedCosts] = useState([]);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- STYLE INJECTION FOR FORCED LIGHT INPUTS AND FULL WIDTH ---
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        color-scheme: light;
      }
      
      html, body, #root {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background-color: #f8fafc; /* Force Slate-50 globally */
      }

      /* Target text-like inputs specifically to avoid messing up ranges/checkboxes */
      input:not([type="range"]), select, textarea {
        background-color: #ffffff !important;
        color: #0f172a !important;
        border-color: #cbd5e1 !important;
        -webkit-text-fill-color: #0f172a !important;
        -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
        box-shadow: 0 0 0px 1000px #ffffff inset !important;
      }
      
      /* Webkit autofill fix to ensure background stays white */
      input:-webkit-autofill,
      input:-webkit-autofill:hover, 
      input:-webkit-autofill:focus, 
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px white inset !important;
        -webkit-text-fill-color: #0f172a !important;
      }

      /* Ensure placeholders are visible */
      ::placeholder {
        color: #94a3b8 !important;
        opacity: 1 !important;
      }

      /* Restore Range Slider Visibility */
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
      }
      
      /* Slider Track */
      input[type="range"]::-webkit-slider-runnable-track {
        background: #e2e8f0; /* slate-200 */
        height: 0.5rem;
        border-radius: 0.5rem;
      }
      input[type="range"]::-moz-range-track {
        background: #e2e8f0;
        height: 0.5rem;
        border-radius: 0.5rem;
      }

      /* Slider Thumb (Handle) */
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        margin-top: -6px; /* center thumb */
        background-color: #22c55e; /* green-500 */
        height: 1.25rem;
        width: 1.25rem;
        border-radius: 50%;
      }
      input[type="range"]::-moz-range-thumb {
        border: none;
        background-color: #22c55e;
        height: 1.25rem;
        width: 1.25rem;
        border-radius: 50%;
      }
      
      /* META VIEWPORT INJECTION */
      @viewport {
        width: device-width;
        zoom: 1;
      }
    `;
    document.head.appendChild(style);
    
    // Inject Meta Viewport tag dynamically if missing
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
        metaViewport = document.createElement('meta');
        metaViewport.name = "viewport";
        document.head.appendChild(metaViewport);
    }
    metaViewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    // Escuta mudanças no estado de autenticação (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // SE DETECTAR USUÁRIO ANÔNIMO (DA VERSÃO ANTERIOR), FAZ LOGOUT PARA FORÇAR LOGIN
      if (currentUser && currentUser.isAnonymous) {
        signOut(auth);
      } else {
        setUser(currentUser);
        setLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubTrans = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), (snapshot) => { setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    const unsubFixed = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'fixedCosts'), (snapshot) => { setFixedCosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    return () => { unsubTrans(); unsubFixed(); };
  }, [user]);

  const handleLogin = async (email, password) => {
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential') {
        setAuthError('Email ou senha incorretos.');
      } else {
        setAuthError('Erro ao entrar. Verifique sua conexão.');
      }
    }
  };

  const handleRegister = async (email, password) => {
    try {
      setAuthError(null);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('Este email já está em uso.');
      } else {
        setAuthError('Erro ao criar conta. Tente novamente.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setTransactions([]);
      setFixedCosts([]);
    } catch (error) {
      console.error("Erro ao sair", error);
    }
  };

  const addTransaction = async (newTransArray) => { 
      if(!user) { alert("Erro: Você precisa estar logado."); return; }
      try {
        for(const trans of newTransArray) { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'transactions'), { ...trans, createdAt: new Date() }); }
        alert("Salvo com sucesso!");
      } catch(e) {
          alert("Erro ao salvar: " + e.message);
      }
  };
  const deleteTransaction = async (id) => { if(!user) return; await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id)); };
  const addFixedCost = async (name, amount) => { if(!user) return; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'fixedCosts'), { name, amount, createdAt: new Date() }); };
  const removeFixedCost = async (id) => { if(!user) return; await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'fixedCosts', id)); };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" style={{ colorScheme: 'light' }}>
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Se não estiver logado, mostra tela de Login
  if (!user) {
    return (
      <div style={{ colorScheme: 'light' }}>
        <LoginScreen onLogin={handleLogin} onRegister={handleRegister} error={authError} />
      </div>
    );
  }

  // Se logado, mostra o App
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800" style={{ colorScheme: 'light' }}>
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between md:h-16 py-2 md:py-0 gap-3 md:gap-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-white" /></div>
                    <span className="text-xl font-bold text-slate-900">DropMaster <span className="text-indigo-600">CFO</span></span>
                </div>
                {/* Ícone de nuvem/user móvel */}
                 <div className="md:hidden flex items-center gap-2">
                    <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Sair">
                      <LogOut className="w-5 h-5" />
                    </button>
                 </div>
            </div>
            
            <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-full md:w-auto min-w-max">
                <button onClick={() => setActiveTab('precificacao')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'precificacao' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}><div className="flex items-center gap-2"><Calculator className="w-4 h-4" /> Precificação</div></button>
                <button onClick={() => setActiveTab('fluxo')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'fluxo' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}><div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Fluxo Diário</div></button>
                <button onClick={() => setActiveTab('dre')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dre' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> DRE Gerencial</div></button>
              </div>
              {/* Info usuário Desktop */}
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="text-right hidden lg:block">
                    <div className="text-xs text-slate-500">Logado como</div>
                    <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{user.email}</div>
                  </div>
                  <button onClick={handleLogout} className="p-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors" title="Sair">
                      <LogOut className="w-4 h-4" />
                  </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {activeTab === 'precificacao' && <PrecificacaoTab />}
        {activeTab === 'fluxo' && <FluxoDiarioTab transactions={transactions} addTransaction={addTransaction} deleteTransaction={deleteTransaction} />}
        {activeTab === 'dre' && <DRETab transactions={transactions} fixedCosts={fixedCosts} addFixedCost={addFixedCost} removeFixedCost={removeFixedCost} />}
      </main>
    </div>
  );
}