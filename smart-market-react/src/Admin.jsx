import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

export default function Admin() {
  const navigate = useNavigate();
  
  // ★ PROTEÇÃO DE ACESSO ★
  useEffect(() => {
    const token = localStorage.getItem('token_admin');
    if (!token) { navigate('/login'); }
  }, [navigate]);

  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  
  const [formProduto, setFormProduto] = useState({
    nome: '', categoria: '', preco: '', promocao: false, preco_promocao: '', qtd_promocao: '1', imagem: null, estoque: '50', variacoes: []
  });

  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  // ★ CARREGAR DADOS DO SERVIDOR ★
  useEffect(() => {
    async function carregarDados() {
      try {
        const resProdutos = await fetch('https://smart-market-production-fbe0.up.railway.app/produtos');
        const dadosProdutos = await resProdutos.json();
        setProdutos(dadosProdutos);

        const resPedidos = await fetch('https://smart-market-production-fbe0.up.railway.app/pedidos');
        const dadosPedidos = await resPedidos.json();
        setPedidos(dadosPedidos);
      } catch (erro) { console.error("Erro ao puxar dados:", erro); } finally { setLoading(false); }
    }
    carregarDados();
  }, []);

  // ★ MÉTRICAS DO DASHBOARD ★
  const faturamentoTotal = pedidos.filter(p => p.status !== 'Cancelado').reduce((acc, pedido) => acc + Number(pedido.total), 0);
  const produtosEmPromocao = produtos.filter(p => p.promocao === 1 || p.promocao === true).length;
  const ticketMedioPedidos = pedidos.filter(p => p.status !== 'Cancelado').length > 0 ? faturamentoTotal / pedidos.filter(p => p.status !== 'Cancelado').length : 0;

  const categoryCount = produtos.reduce((acc, curr) => {
    const cat = curr.categoria || 'Outros';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] }));
  const CORES_GRAFICO = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

  const calcularFaturamentoReal = () => {
    const dias = [
      { name: 'Seg', valor: 0 }, { name: 'Ter', valor: 0 }, { name: 'Qua', valor: 0 },
      { name: 'Qui', valor: 0 }, { name: 'Sex', valor: 0 }, { name: 'Sáb', valor: 0 }, { name: 'Dom', valor: 0 }
    ];

    pedidos.forEach(pedido => {
      if (pedido.status !== 'Cancelado' && pedido.data_criacao) {
        const dataPedido = new Date(pedido.data_criacao);
        const diaDaSemana = dataPedido.getDay();
        const indexAjustado = diaDaSemana === 0 ? 6 : diaDaSemana - 1; 
        dias[indexAjustado].valor += Number(pedido.total);
      }
    });
    return dias;
  };

  const dadosFaturamentoSemana = calcularFaturamentoReal();

  const clientesAgrupados = pedidos.reduce((acc, p) => {
    if (p.status !== 'Cancelado') {
      if (!acc[p.telefone]) { acc[p.telefone] = { nome: p.nomeCliente, telefone: p.telefone, totalGasto: 0, qtdPedidos: 0 }; }
      acc[p.telefone].totalGasto += Number(p.total);
      acc[p.telefone].qtdPedidos += 1;
    }
    return acc;
  }, {});
  
  const listaClientes = Object.values(clientesAgrupados).sort((a, b) => b.totalGasto - a.totalGasto);

  // ★ FUNÇÕES DE AÇÃO ★

function handleAbrirDetalhesPedido(pedido) {
    let itensLidos = [];
    try {
      itensLidos = typeof pedido.itens === 'string' ? JSON.parse(pedido.itens) : pedido.itens;
    } catch (e) {
      console.error("Erro ao ler itens do pedido", e);
    }
    
    // Salva o pedido clicado no state, já com os itens decodificados
    setPedidoSelecionado({ ...pedido, itensLista: itensLidos });
  }

  function handleAbrirNovo() {
    setProdutoEditando(null);
    setFormProduto({ nome: '', categoria: '', preco: '', promocao: false, preco_promocao: '', qtd_promocao: '1', imagem: null, estoque: '50', variacoes: [] });
    setModalAberto(true);
  }

  function handleAbrirEdicao(produto) {
    setProdutoEditando(produto.id);
    let variacoesLidas = [];
    if (produto.variacoes && produto.variacoes !== '[]' && produto.variacoes !== 'null') {
      try { variacoesLidas = JSON.parse(produto.variacoes); } catch(e) { console.error("Erro lendo variacoes", e); }
    }

    setFormProduto({
      nome: produto.nome, 
      categoria: produto.categoria, 
      preco: produto.preco,
      promocao: produto.promocao === 1 || produto.promocao === true,
      preco_promocao: produto.preco_promocao || '', 
      qtd_promocao: produto.qtd_promocao || '1',
      estoque: produto.estoque !== undefined && produto.estoque !== null ? produto.estoque : '0',
      variacoes: variacoesLidas,
      imagem: null
    });
    setModalAberto(true);
  }

  // ★ FUNÇÃO: EXPORTAR EXCEL ★
  async function handleBaixarRelatorio() {
    try {
      const btn = document.getElementById('btn-excel');
      const textoOriginal = btn.innerHTML;
      btn.innerHTML = "⏳ Gerando...";
      
      const resposta = await fetch('https://smart-market-production-fbe0.up.railway.app/relatorio/estoque');
      if (!resposta.ok) throw new Error('Erro ao baixar');
      
      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Estoque_SmartMarket_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      btn.innerHTML = textoOriginal;
    } catch (error) {
      alert('Erro ao gerar relatório de estoque.');
      console.error(error);
    }
  }

  async function handleSalvarProduto(e) {
    e.preventDefault(); 
    const btnSalvar = document.querySelector('.btn-salvar');
    const textoOriginal = btnSalvar ? btnSalvar.textContent : "Salvar Produto";
    if (btnSalvar) btnSalvar.textContent = "Enviando...";

    try {
      let url = 'https://smart-market-production-fbe0.up.railway.app/produtos';
      let metodo = 'POST';
      if (produtoEditando) { url = `https://smart-market-production-fbe0.up.railway.app/produtos/${produtoEditando}`; metodo = 'PUT'; }

      let estoqueCalculado = formProduto.estoque;
      if (formProduto.variacoes && formProduto.variacoes.length > 0) {
        estoqueCalculado = formProduto.variacoes.reduce((acc, v) => acc + (parseInt(v.estoque) || 0), 0);
      }

      const formData = new FormData();
      formData.append('nome', formProduto.nome);
      formData.append('categoria', formProduto.categoria);
      formData.append('preco', formProduto.preco);
      formData.append('promocao', formProduto.promocao);
      formData.append('estoque', estoqueCalculado);
      formData.append('variacoes', JSON.stringify(formProduto.variacoes)); 
      
      if (formProduto.promocao) {
        formData.append('preco_promocao', formProduto.preco_promocao);
        formData.append('qtd_promocao', formProduto.qtd_promocao);
      }
      if (formProduto.imagem) { formData.append('imagem', formProduto.imagem); }

      const resposta = await fetch(url, { method: metodo, body: formData });

      if (resposta.ok) {
        const novaResposta = await fetch('https://smart-market-production-fbe0.up.railway.app/produtos');
        const novosDados = await novaResposta.json();
        setProdutos(novosDados);
        setModalAberto(false);
        setProdutoEditando(null);
        setFormProduto({ nome: '', categoria: '', preco: '', promocao: false, preco_promocao: '', qtd_promocao: '1', imagem: null, estoque: '50', variacoes: [] });
      } else { alert("Ops! O servidor negou o salvamento."); }
    } catch (erro) { console.error("Erro na requisição:", erro); alert("Erro de conexão."); } 
    finally { if (btnSalvar) btnSalvar.textContent = textoOriginal; }
  }

  async function handleDeletarProduto(id) {
    const confirmacao = window.confirm("Tem certeza que deseja excluir este produto?");
    if (confirmacao) {
      try {
        const resposta = await fetch(`https://smart-market-production-fbe0.up.railway.app/produtos/${id}`, { method: 'DELETE' });
        if (resposta.ok) setProdutos(produtosAtuais => produtosAtuais.filter(prod => prod.id !== id));
      } catch (erro) { console.error("Erro:", erro); alert("Erro de conexão."); }
    }
  }

  async function handleAtualizarStatusPedido(pedido, novoStatus) {
    try {
      const resposta = await fetch(`https://smart-market-production-fbe0.up.railway.app/pedidos/${pedido.id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: novoStatus })
      });
      if (resposta.ok) {
        setPedidos(pedidosAtuais => pedidosAtuais.map(p => p.id === pedido.id ? { ...p, status: novoStatus } : p));
        if (novoStatus === 'Em Preparo' || novoStatus === 'Saiu para Entrega' || novoStatus === 'Pronto para Retirada') {
          const foneLimpo = pedido.telefone.replace(/\D/g, ''); let texto = '';
          if (novoStatus === 'Em Preparo') texto = `Olá *${pedido.nomeCliente}*! 🛒\nPassando para avisar que seu pedido #${pedido.id} já está *Em Preparo*!`;
          else if (novoStatus === 'Saiu para Entrega') texto = `Boas notícias, *${pedido.nomeCliente}*! 🛵💨\nSeu pedido #${pedido.id} acabou de *Sair para Entrega*!`;
          else if (novoStatus === 'Pronto para Retirada') texto = `Olá *${pedido.nomeCliente}*! 🛍️\nSeu pedido #${pedido.id} está *Pronto para Retirada*!`;
          window.open(`https://wa.me/55${foneLimpo}?text=${encodeURIComponent(texto)}`, '_blank');
        }
      }
    } catch (erro) { console.error("Erro:", erro); alert("Erro de conexão."); }
  }

  function formatarNome(texto) {
    if (!texto) return "sem-categoria";
    return texto.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").toLowerCase();
  }

  function tentarOutraExtensao(e, categoria, nome) {
    const catFormatada = formatarNome(categoria); const nomeFormatado = formatarNome(nome);
    const currentSrc = e.target.src;
    if (currentSrc.includes('.png')) { e.target.src = `/img/${catFormatada}/${nomeFormatado}.jpg`; } 
    else if (currentSrc.includes('.jpg')) { e.target.src = `/img/${catFormatada}/${nomeFormatado}.jpeg`; } 
    else if (currentSrc.includes('.jpeg')) { e.target.src = `/img/${catFormatada}/${nomeFormatado}.webp`; } 
    else { e.target.src = '/img/logo/logo.jpeg'; }
  }

  const IconDashboard = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 20, height: 20}}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
  const IconBox = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 20, height: 20}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>;
  const IconClipboard = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 20, height: 20}}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>;
  const IconUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 20, height: 20}}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
  const IconEdit = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 16, height: 16}}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
  const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 16, height: 16}}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
  const IconEye = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 16, height: 16}}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const IconPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 18, height: 18}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
  const IconTrendingUp = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 16, height: 16}}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
  const IconImage = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 18, height: 18}}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;

  return (
    <div className="admin-layout" translate="no">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { margin: 0; background-color: #f8fafc; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        .admin-layout { display: flex; height: 100vh; overflow: hidden; color: #1e293b; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .sidebar { width: 280px; background-color: #0f172a; color: #94a3b8; display: flex; flex-direction: column; z-index: 100; box-shadow: 4px 0 15px rgba(0,0,0,0.05); transition: all 0.3s ease; }
        .sidebar-header { padding: 30px 24px; border-bottom: 1px solid #1e293b; }
        .sidebar-header h2 { color: #f8fafc; margin: 0; font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 12px; }
        .sidebar-header h2 span { background: #4f46e5; padding: 8px; border-radius: 8px; display: flex; color: white; }
        .sidebar-menu { padding: 24px 0; flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .menu-item { padding: 14px 24px; cursor: pointer; display: flex; align-items: center; gap: 14px; font-weight: 500; font-size: 15px; transition: all 0.2s; border-left: 3px solid transparent; }
        .menu-item:hover { color: #f8fafc; background-color: #1e293b; }
        .menu-item.ativo { color: #ffffff; background-color: #1e293b; border-left-color: #4f46e5; }
        .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background-color: #f8fafc; }
        .topbar { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 5; }
        .user-info { display: flex; align-items: center; gap: 12px; font-weight: 600; color: #0f172a; font-size: 15px; }
        .avatar { width: 36px; height: 36px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
        .btn-sair { background: white; color: #475569; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s; }
        .btn-sair:hover { background: #f1f5f9; color: #0f172a; }
        .content-area { padding: 32px; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .page-title { font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 24px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 32px; }
        .metric-card { background: white; padding: 24px; border-radius: 16px; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .metric-header h3 { margin: 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; }
        .icon-box { padding: 10px; border-radius: 12px; display: flex; }
        .metric-value { margin: 0; font-size: 30px; font-weight: 800; color: #0f172a; }
        .metric-trend { margin: 8px 0 0 0; font-size: 13px; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .metric-trend.neutral { color: #64748b; }
        .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 32px; }
        .chart-container { background: white; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; }
        .chart-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 24px; display: flex; justify-content: space-between; }
        .table-container { background: white; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
        .table-header-actions { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
        .table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .search-input { width: 320px; padding: 10px 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; }
        .btn-novo { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; gap: 8px; align-items: center; }
        table { width: 100%; border-collapse: collapse; text-align: left; min-width: 600px; }
        th { background-color: #f8fafc; padding: 14px 24px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; vertical-align: middle; }
        .td-title { font-weight: 600; color: #0f172a; display: flex; align-items: center; gap: 12px;}
        .td-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
        .preco-normal { font-weight: 600; color: #0f172a; }
        .preco-antigo { text-decoration: line-through; color: #94a3b8; font-size: 12px; margin-right: 8px; }
        .preco-novo { color: #dc2626; font-weight: 700; }
        .promo-qtd { font-size: 11px; color: #d97706; font-weight: 600; margin-top: 2px; }
        .badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
        .badge.ativo { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .badge.promo { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .badge.vip { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .actions-flex { display: flex; gap: 8px; }
        .btn-icon { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; cursor: pointer; color: #64748b; display: flex; }
        .btn-icon.view { padding: 6px 12px; gap: 6px; font-size: 13px; font-weight: 600; color: #4f46e5; background: #e0e7ff; border: none; }
        .select-status { padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; border: 1px solid transparent; cursor: pointer; }
        .status-Pendente { background: #fef9c3; color: #b45309; }
        .status-Preparo { background: #e0f2fe; color: #3730a3; }
        .status-Entrega { background: #fae8ff; color: #86198f; }
        .status-Retirada { background: #ffedd5; color: #ea580c; }
        .status-Concluido { background: #dcfce7; color: #166534; }
        .status-Cancelado { background: #fee2e2; color: #991b1b; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .modal-box { background: white; width: 90%; max-width: 500px; border-radius: 16px; max-height: 90vh; display: flex; flex-direction: column; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
        .modal-header h3 { margin: 0; font-size: 18px; }
        .btn-fechar { background: none; border: none; font-size: 20px; cursor: pointer; }
        .modal-body { padding: 24px; overflow-y: auto; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; }
        .form-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; }
        .promo-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; }
        .promo-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #cbd5e1; }
        .modal-footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }
        .btn-cancelar { padding: 10px 16px; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; }
        .btn-salvar { padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .lista-itens { list-style: none; padding: 0; margin: 0; }
        .lista-itens li { padding: 12px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; }
        .resumo-pedido { background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .file-upload-wrapper { position: relative; width: 100%; height: 100px; border: 2px dashed #cbd5e1; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; cursor: pointer; transition: all 0.2s; }
        .file-upload-wrapper:hover { border-color: #4f46e5; background: #e0e7ff; }
        .file-upload-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        .file-upload-text { font-size: 13px; color: #64748b; font-weight: 500; margin-top: 8px; }
        .img-preview { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #e2e8f0; background: white; }
        @media (max-width: 768px) {
          .admin-layout { flex-direction: column; }
          .sidebar { width: 100%; height: auto; flex-direction: row; position: fixed; bottom: 0; left: 0; box-shadow: 0 -4px 10px rgba(0,0,0,0.1); border-top: 1px solid #1e293b; }
          .sidebar-header { display: none; }
          .sidebar-menu { flex-direction: row; padding: 0; width: 100%; justify-content: space-around; }
          .menu-item { flex-direction: column; gap: 6px; padding: 12px 4px; font-size: 11px; border-left: none; border-bottom: 3px solid transparent; flex: 1; justify-content: center; text-align: center;}
          .menu-item.ativo { border-left: none; border-bottom-color: #4f46e5; }
          .main-content { padding-bottom: 70px; }
          .topbar { padding: 12px 16px; }
          .content-area { padding: 16px; }
          .charts-row { grid-template-columns: 1fr; }
          .metrics-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .metric-value { font-size: 24px; }
          .table-header-actions { flex-direction: column; gap: 16px; align-items: stretch; padding: 16px;}
          .search-input { width: 100%; }
          .btn-novo { justify-content: center; }
          .promo-fields { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* MENU LATERAL */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2><span><IconBox /></span> Smart Admin</h2>
        </div>
        <div className="sidebar-menu">
          <div className={`menu-item ${abaAtiva === 'dashboard' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('dashboard')}><IconDashboard /> Visão Geral</div>
          <div className={`menu-item ${abaAtiva === 'produtos' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('produtos')}><IconBox /> Estoque</div>
          <div className={`menu-item ${abaAtiva === 'pedidos' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('pedidos')}><IconClipboard /> Pedidos</div>
          <div className={`menu-item ${abaAtiva === 'clientes' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('clientes')}><IconUsers /> Clientes</div>
        </div>
      </div>

      <div className="main-content">
        <div className="topbar">
          <div className="user-info"><div className="avatar">A</div><span>Administrador</span></div>
          <button className="btn-sair" onClick={() => { localStorage.removeItem('token_admin'); navigate('/login'); }}>Sair do Painel</button>
        </div>

        <div className="content-area">
          <h1 className="page-title">
            {abaAtiva === 'produtos' ? 'Estoque e Produtos' : abaAtiva === 'dashboard' ? 'Visão Geral do Negócio' : abaAtiva === 'clientes' ? 'Carteira de Clientes' : 'Gestão de Pedidos'}
          </h1>

          {/* DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <>
              {loading ? ( <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Carregando métricas...</div> ) : (
                <>
                  <div className="metrics-grid">
                    <div className="metric-card"><div className="metric-header"><h3>Faturamento Líquido</h3><div className="icon-box" style={{ background: '#dcfce7', color: '#059669' }}><IconClipboard /></div></div><p className="metric-value">R$ {faturamentoTotal.toFixed(2).replace('.', ',')}</p><p className="metric-trend"><IconTrendingUp /> Em tempo real</p></div>
                    <div className="metric-card"><div className="metric-header"><h3>Total de Pedidos</h3><div className="icon-box" style={{ background: '#e0e7ff', color: '#4f46e5' }}><IconBox /></div></div><p className="metric-value">{pedidos.length}</p><p className="metric-trend neutral">{pedidos.filter(p => p.status === 'Pendente').length} aguardando análise</p></div>
                    <div className="metric-card"><div className="metric-header"><h3>Estoque Ativo</h3><div className="icon-box" style={{ background: '#fef3c7', color: '#d97706' }}><IconDashboard /></div></div><p className="metric-value">{produtos.length}</p><p className="metric-trend neutral">{produtosEmPromocao} em promoção</p></div>
                    <div className="metric-card"><div className="metric-header"><h3>Ticket Médio</h3><div className="icon-box" style={{ background: '#fae8ff', color: '#c026d3' }}><IconClipboard /></div></div><p className="metric-value">R$ {ticketMedioPedidos.toFixed(2).replace('.', ',')}</p><p className="metric-trend neutral">Por pedido fechado</p></div>
                  </div>
                  <div className="charts-row">
                    <div className="chart-container">
                      <h3 className="chart-title">Faturamento Semanal (Últimos 7 dias)</h3>
                      <div style={{ width: '100%', height: 250, minHeight: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dadosFaturamentoSemana} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="valor" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="chart-container">
                      <h3 className="chart-title">Estoque por Categoria</h3>
                      <div style={{ width: '100%', height: 250, minHeight: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                              {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />))}
                            </Pie>
                            <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* GESTÃO DE PRODUTOS */}
          {abaAtiva === 'produtos' && (
            <div className="table-container">
              <div className="table-header-actions">
                <input type="search" placeholder="Pesquisar produto..." className="search-input" />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button id="btn-excel" onClick={handleBaixarRelatorio} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>📊 Exportar Excel</button>
                  <button className="btn-novo" onClick={handleAbrirNovo}><IconPlus /> Novo Produto</button>
                </div>
              </div>
              
              {loading ? ( <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Sincronizando banco...</div> ) : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Produto</th><th>Estoque Detalhado</th><th>Preço Base</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                    <tbody>
                      {produtos.map(prod => {
                        const emPromocao = prod.promocao === 1 || prod.promocao === true;
                        const catFormatada = formatarNome(prod.categoria); const nomeFormatado = formatarNome(prod.nome);
                        const urlDaImagem = prod.imagem ? `https://smart-market-production-fbe0.up.railway.app${prod.imagem}` : `/img/${catFormatada}/${nomeFormatado}.png`;
                        return (
                          <tr key={prod.id}>
                            <td>
                              <div className="td-title">
                                <img src={urlDaImagem} alt={prod.nome} className="img-preview" onError={(e) => tentarOutraExtensao(e, prod.categoria, prod.nome)} />
                                <div><div>{prod.nome}</div><div className="td-subtitle">{prod.categoria}</div></div>
                              </div>
                            </td>
                            <td>
                                <span className={`badge ${prod.estoque <= 0 ? 'promo' : 'ativo'}`}>
                                  {prod.estoque !== undefined && prod.estoque !== null ? prod.estoque : 'N/A'} un/kg
                                </span>
                                {(() => {
                                  if (prod.variacoes && prod.variacoes !== '[]' && prod.variacoes !== 'null') {
                                    try {
                                      const vars = JSON.parse(prod.variacoes);
                                      if (vars.length > 0) {
                                        return (
                                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: '600', maxWidth: '250px' }}>
                                            {vars.map(v => `${v.nome}: ${v.estoque}`).join(' | ')}
                                          </div>
                                        );
                                      }
                                    } catch(e) {}
                                  }
                                  return null;
                                })()}
                            </td>
                            <td>
                              {emPromocao && prod.preco_promocao ? (
                                <><span className="preco-antigo">R$ {Number(prod.preco).toFixed(2).replace('.', ',')}</span><span className="preco-novo">R$ {Number(prod.preco_promocao).toFixed(2).replace('.', ',')}</span>{prod.qtd_promocao > 1 && (<div className="promo-qtd">A partir de {prod.qtd_promocao} un</div>)}</>
                              ) : (<span className="preco-normal">R$ {Number(prod.preco).toFixed(2).replace('.', ',')}</span>)}
                            </td>
                            <td><span className={`badge ${emPromocao ? 'promo' : 'ativo'}`}><span style={{ width: 6, height: 6, borderRadius: '50%', background: emPromocao ? '#dc2626' : '#166534' }}></span>{emPromocao ? 'Promo' : 'Ativo'}</span></td>
                            <td>
                              <div className="actions-flex" style={{ justifyContent: 'flex-end' }}>
                                <button className="btn-icon" title="Editar" onClick={() => handleAbrirEdicao(prod)}><IconEdit /></button>
                                <button className="btn-icon delete" title="Excluir" onClick={() => handleDeletarProduto(prod.id)}><IconTrash /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABAS DE PEDIDOS E CLIENTES (MANTIDAS) */}
          {abaAtiva === 'pedidos' && (
             <div className="table-container">
               <div className="table-header-actions"><h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>Acompanhamento</h3></div>
                {loading ? ( <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Carregando pedidos...</div> ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Pedido</th><th>Cliente</th><th>Modalidade</th><th>Total</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                      <tbody>
                        {pedidos.map(pedido => {
                          let classeStatus = "status-Pendente";
                          if (pedido.status === "Em Preparo") classeStatus = "status-Preparo"; if (pedido.status === "Saiu para Entrega") classeStatus = "status-Entrega";
                          if (pedido.status === "Pronto para Retirada") classeStatus = "status-Retirada"; if (pedido.status === "Concluído") classeStatus = "status-Concluido";
                          if (pedido.status === "Cancelado") classeStatus = "status-Cancelado";
                          return (
                            <tr key={pedido.id}>
                              <td className="td-title" style={{ color: '#4f46e5' }}>#{pedido.id}</td>
                              <td><div className="td-title">{pedido.nomeCliente}</div><div className="td-subtitle">{pedido.telefone}</div></td>
                              <td className="td-subtitle">{pedido.formaEntrega}</td><td className="preco-normal">R$ {Number(pedido.total).toFixed(2).replace('.', ',')}</td>
                              <td>
                                <select className={`select-status ${classeStatus}`} value={pedido.status} onChange={(e) => handleAtualizarStatusPedido(pedido, e.target.value)}>
                                  <option value="Pendente">Pendente</option><option value="Em Preparo">Em Preparo</option><option value="Saiu para Entrega">Saiu para Entrega</option>
                                  <option value="Pronto para Retirada">Pronto para Retirada</option><option value="Concluído">Concluído</option><option value="Cancelado">Cancelado</option>
                                </select>
                              </td>
                              <td><div className="actions-flex" style={{ justifyContent: 'flex-end' }}><button className="btn-icon view" onClick={() => handleAbrirDetalhesPedido(pedido)}><IconEye /> Ver</button></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          )}

          {abaAtiva === 'clientes' && (
             <div className="table-container">
               <div className="table-header-actions"><h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: 700 }}>Ranking de Clientes (CRM)</h3></div>
                {loading ? ( <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Analisando base...</div> ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Cliente</th><th>Telefone</th><th>Pedidos</th><th>Total Gasto</th></tr></thead>
                      <tbody>
                        {listaClientes.map((cliente, index) => (
                          <tr key={cliente.telefone}>
                            <td><div className="td-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{cliente.nome} {index < 3 && <span className="badge vip">⭐ VIP</span>}</div></td>
                            <td className="td-subtitle">{cliente.telefone}</td><td><span className="badge ativo">{cliente.qtdPedidos}</span></td>
                            <td className="preco-novo">R$ {cliente.totalGasto.toFixed(2).replace('.', ',')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* MODAL: NOVO/EDITAR PRODUTO COM SABORES */}
        {modalAberto && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header"><h3>{produtoEditando ? 'Configurar Produto' : 'Novo Produto'}</h3><button className="btn-fechar" onClick={() => { setModalAberto(false); setProdutoEditando(null); }}><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
              <div className="modal-body">
                <form id="form-produto" onSubmit={handleSalvarProduto}>
                  <div className="form-group">
                    <label>Foto do Produto</label>
                    <div className="file-upload-wrapper">
                      <input type="file" accept="image/*" className="file-upload-input" onChange={(e) => setFormProduto({...formProduto, imagem: e.target.files[0]})} />
                      <div style={{ color: '#4f46e5', marginBottom: '4px' }}><IconImage /></div>
                      <div className="file-upload-text">{formProduto.imagem ? formProduto.imagem.name : 'Selecione uma imagem (JPG, PNG)'}</div>
                    </div>
                  </div>

                  <div className="form-group"><label>Nome</label><input type="text" className="form-input" required value={formProduto.nome} onChange={(e) => setFormProduto({...formProduto, nome: e.target.value})} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group"><label>Categoria</label><select className="form-input" required value={formProduto.categoria} onChange={(e) => setFormProduto({...formProduto, categoria: e.target.value})}><option value="">Selecione...</option><option value="Mercearia">Mercearia</option><option value="Bomboniere">Bomboniere</option><option value="Frios">Frios</option><option value="Hortifruti">Hortifruti</option><option value="Bebidas">Bebidas</option><option value="Embalagens">Embalagens</option></select></div>
                    <div className="form-group"><label>Preço Base (R$)</label><input type="number" step="0.01" className="form-input" required value={formProduto.preco} onChange={(e) => setFormProduto({...formProduto, preco: e.target.value})} /></div>
                  </div>
                  
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label style={{ color: '#059669' }}>Estoque Total (Un/Kg)</label>
                    <input type="number" step="0.001" className="form-input" required value={formProduto.estoque} disabled={formProduto.variacoes && formProduto.variacoes.length > 0} onChange={(e) => setFormProduto({...formProduto, estoque: e.target.value})} style={{ borderColor: '#a7f3d0', background: (formProduto.variacoes && formProduto.variacoes.length > 0) ? '#f1f5f9' : 'white' }} />
                  </div>

                  {/* SEÇÃO DE SABORES / VARIAÇÕES */}
                  <div className="promo-box" style={{ marginTop: '16px', background: '#f8fafc' }}>
                    <label style={{ fontWeight: 'bold', color: '#1a3b5c', display: 'block', marginBottom: '8px' }}>Sabores / Variações</label>
                    
                    {formProduto.variacoes && formProduto.variacoes.map((v, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input type="text" placeholder="Nome (Ex: Uva)" value={v.nome} onChange={(e) => {
                          const novasVar = [...formProduto.variacoes]; novasVar[index].nome = e.target.value;
                          setFormProduto({...formProduto, variacoes: novasVar});
                        }} className="form-input" style={{ flex: 2, padding: '8px' }} />
                        <input type="number" placeholder="Qtd" value={v.estoque} onChange={(e) => {
                          const novasVar = [...formProduto.variacoes]; novasVar[index].estoque = e.target.value;
                          setFormProduto({...formProduto, variacoes: novasVar});
                        }} className="form-input" style={{ flex: 1, padding: '8px' }} />
                        <button type="button" onClick={() => {
                          const novasVar = formProduto.variacoes.filter((_, i) => i !== index);
                          setFormProduto({...formProduto, variacoes: novasVar});
                        }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0 12px', cursor: 'pointer' }}>X</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => {
                      setFormProduto({...formProduto, variacoes: [...(formProduto.variacoes || []), { nome: '', estoque: '0' }]});
                    }} style={{ background: 'white', color: '#4f46e5', border: '1px dashed #4f46e5', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', width: '100%' }}>+ Adicionar Sabor</button>
                  </div>

                  <div className="promo-box">
                    <div className="promo-toggle"><input type="checkbox" id="checkbox-promo" checked={formProduto.promocao} onChange={(e) => setFormProduto({...formProduto, promocao: e.target.checked})} /><label htmlFor="checkbox-promo">Ativar promoção</label></div>
                    {formProduto.promocao && (
                      <div className="promo-fields">
                        <div className="form-group" style={{ marginBottom: 0 }}><label style={{ color: '#4f46e5' }}>Preço Promocional</label><input type="number" step="0.01" className="form-input" style={{ borderColor: '#c7d2fe' }} required value={formProduto.preco_promocao} onChange={(e) => setFormProduto({...formProduto, preco_promocao: e.target.value})} /></div>
                        <div className="form-group" style={{ marginBottom: 0 }}><label style={{ color: '#4f46e5' }}>A partir de (Un)</label><input type="number" min="1" className="form-input" style={{ borderColor: '#c7d2fe' }} required value={formProduto.qtd_promocao} onChange={(e) => setFormProduto({...formProduto, qtd_promocao: e.target.value})} /></div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
              <div className="modal-footer"><button type="button" className="btn-cancelar" onClick={() => { setModalAberto(false); setProdutoEditando(null); }}>Cancelar</button><button type="submit" form="form-produto" className="btn-salvar">Salvar Produto</button></div>
            </div>
          </div>
        )}

        {/* DETALHES DO PEDIDO */}
        {pedidoSelecionado && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header"><h3>Pedido #{pedidoSelecionado.id}</h3><button className="btn-fechar" onClick={() => setPedidoSelecionado(null)}><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
              <div className="modal-body">
                <div className="resumo-pedido">
                  <div><strong>Cliente:</strong> {pedidoSelecionado.nomeCliente}</div>
                  <div><strong>WhatsApp:</strong> {pedidoSelecionado.telefone}</div>
                  <div><strong>Modo:</strong> {pedidoSelecionado.formaEntrega}</div>
                  <div><strong>Pagamento:</strong> {pedidoSelecionado.formaPagamento}</div>
                </div>
                <h4 style={{ margin: '16px 0 8px 0', fontSize: '15px' }}>Itens:</h4>
                <ul className="lista-itens">
                  {pedidoSelecionado.itensLista && pedidoSelecionado.itensLista.map((item, index) => (
                    <li key={index}>
                      <div>{item.nome} {item.infoAdicional && `(${item.infoAdicional})`} <span style={{display:'block', fontSize:'12px', color:'#64748b'}}>{item.quantidade} x R$ {Number(item.precoVenda).toFixed(2).replace('.', ',')}</span></div>
                      <strong>R$ {Number(item.precoVenda * item.quantidade).toFixed(2).replace('.', ',')}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontSize: '18px', fontWeight: '800' }}>Total: R$ {Number(pedidoSelecionado.total).toFixed(2).replace('.', ',')}</div><button type="button" className="btn-salvar" onClick={() => setPedidoSelecionado(null)}>Fechar</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}