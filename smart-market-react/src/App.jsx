import { useState, useEffect } from 'react';
import './index.css'; 

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');
  
  // ★ ESTADOS PARA O MODAL DE CONFIGURAÇÃO DE PRODUTO ★
  const [produtoConfigurando, setProdutoConfigurando] = useState(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null); // NOVO: Para Ovos/Copos
  const [configPeso, setConfigPeso] = useState(''); // Começa vazio pro cliente digitar o KG
  const [configSabores, setConfigSabores] = useState({}); 
  const [configQtd, setConfigQtd] = useState('1'); 

  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [etapaModal, setEtapaModal] = useState('identificacao'); 

  const [nomeCliente, setNomeCliente] = useState(''); 
  const [telefone, setTelefone] = useState('');
  
  // ★ ESTADOS PARA PAGAMENTO DIVIDIDO ★
  const [modoPagamento, setModoPagamento] = useState('unico'); 
  const [metodoUnico, setMetodoUnico] = useState('Dinheiro');
  const [trocoPara, setTrocoPara] = useState('');
  const [pagamentosMultiplos, setPagamentosMultiplos] = useState([
    { id: Date.now(), metodo: 'Dinheiro', valor: '' }
  ]);

  const [tipoEntrega, setTipoEntrega] = useState('Retirada');
  const [endereco, setEndereco] = useState({ rua: '', numero: '', bairro: '', ref: '' });

  const [erroValidacao, setErroValidacao] = useState('');

  // ===== FUNÇÕES DE IDENTIFICAÇÃO DE SABORES =====
  function obterSaboresDisponiveis(nomeProduto) {
    const nome = (nomeProduto || '').toLowerCase();
    if (nome.includes('tang')) return ['Laranja', 'Uva', 'Morango', 'Limão', 'Maracujá', 'Goiaba', 'Manga'];
    if (nome.includes('pipo') || nome.includes('pippo')) return ['Tradicional', 'Queijo', 'Cebola', 'Churrasco', 'Bacon', 'Pizza'];
    if (nome.includes('biscoito') || nome.includes('bolacha') || nome.includes('treloso')) return ['Chocolate', 'Morango', 'Leite', 'Bem Casado', 'Baunilha'];
    return [];
  }

  // ===== FUNÇÕES DE FORMATAÇÃO E VALIDAÇÃO =====
  function formatarTelefone(valor) {
    if (!valor) return '';
    valor = valor.replace(/\D/g, ''); 
    if (valor.length > 11) valor = valor.substring(0, 11); 
    if (valor.length > 2) valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2'); 
    if (valor.length > 9) valor = valor.replace(/(\d{5})(\d)/, '$1-$2'); 
    else if (valor.length > 8) valor = valor.replace(/(\d{4})(\d)/, '$1-$2'); 
    return valor;
  }

  function formatarNome(texto) {
    if (!texto) return "sem-categoria";
    return texto.toString().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").toLowerCase();
  }

  function tentarOutraExtensao(e, categoria, nome) {
    const catFormatada = formatarNome(categoria);
    const nomeFormatado = formatarNome(nome);
    const currentSrc = e.target.src;

    if (currentSrc.includes('.png')) {
      e.target.src = `/img/${catFormatada}/${nomeFormatado}.jpg`;
    } else if (currentSrc.includes('.jpg')) {
      e.target.src = `/img/${catFormatada}/${nomeFormatado}.jpeg`;
    } else if (currentSrc.includes('.jpeg')) {
      e.target.src = `/img/${catFormatada}/${nomeFormatado}.webp`; 
    } else {
      e.target.src = '/img/logo/logo.jpeg'; 
    }
  }

  function converterParaNumero(valor) {
    if (valor === null || valor === undefined || valor === '') return 0;
    if (typeof valor === 'number') return valor;
    const numeroLimpo = valor.toString().replace(/[^\d.,]/g, '').replace(',', '.');
    return Number(numeroLimpo) || 0;
  }

  function formatarDinheiro(valor) {
    return converterParaNumero(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ===== CARREGAR PRODUTOS =====
  useEffect(() => {
    async function carregarProdutos() {
      try {
        const resposta = await fetch('http://127.0.0.1:3001/produtos');
        const dados = await resposta.json();
        
        const produtosProntos = dados.map(produto => {
          const categoriaFormatada = formatarNome(produto.categoria);
          const nomeFormatado = formatarNome(produto.nome);
          const nomeLower = (produto.nome || '').toLowerCase();
          
          let opcoes = null;
          
          // Opções baseadas nas suas fotos
          if (nomeLower.includes('ovo')) {
            opcoes = [
              { id: 'unidade', label: 'Unidade', preco: 0.70 },
              { id: 'meia', label: 'Meia Bandeija C/15UND', preco: 8.49 },
              { id: 'inteira', label: 'Bandeija C/30UND', preco: 15.99 }
            ];
          } else if (nomeLower.includes('copo')) {
            opcoes = [
              { id: '50ml', label: '50ML', preco: 2.49 }, { id: '150ml', label: '150ML', preco: 3.99 },
              { id: '180ml', label: '180ML', preco: 4.49 }, { id: '200ml', label: '200ML', preco: 5.75 },
              { id: '250ml', label: '250ML', preco: 7.49 }, { id: '300ml', label: '300ML', preco: 8.99 }
            ];
          } else if (nomeLower.includes('prato')) {
            opcoes = [
              { id: '15cm', label: '15CM', preco: 1.49 }, { id: '18cm', label: '18CM', preco: 2.39 }, { id: '21cm', label: '21CM', preco: 2.99 }
            ];
          }

          // ★ NOVO: INJEÇÃO DE PROMOÇÕES ★
          let isPromo = false;
          let precoNormal = converterParaNumero(produto.preco);
          let precoPromo = precoNormal;
          let qtdPromo = 1;
          let mensagemPromo = '';

          if (nomeLower.includes('condensado') || nomeLower.includes('triangulo')) {
            isPromo = true;
            precoPromo = precoNormal - 0.20; // Simula desconto de 20 centavos
            qtdPromo = 6;
            mensagemPromo = `A partir de ${qtdPromo} un → R$ ${formatarDinheiro(precoPromo)} cada`;
          }

          return { 
            ...produto, 
            foto: `/img/${categoriaFormatada}/${nomeFormatado}.png`, 
            preco: precoNormal,
            isPromo: isPromo,
            precoNormal: precoNormal,
            precoPromo: precoPromo,
            qtdPromo: qtdPromo,
            mensagemPromo: mensagemPromo,
            opcoes: opcoes
          };
        });
        setProdutos(produtosProntos);
      } catch (erro) {
        console.error("Servidor offline", erro);
      }
    }
    carregarProdutos();
  }, []);

  // ===== LÓGICA DO CARRINHO E PERSONALIZAÇÃO =====
  function handleAdicionarClick(produto) {
    const nomeProd = (produto.nome || '').toLowerCase();
    const catProd = (produto.categoria || '').toLowerCase();
    const temSaboresPreCadastrados = obterSaboresDisponiveis(nomeProd).length > 0;
    const temOpcoes = produto.opcoes && produto.opcoes.length > 0;

    if (catProd === 'frios' || nomeProd.includes('queijo') || nomeProd.includes('presunto') || temOpcoes || produto.temSabores || temSaboresPreCadastrados) {
      setProdutoConfigurando(produto);
      setConfigPeso(''); 
      setConfigQtd('1'); 
      setConfigSabores({});
      setOpcaoSelecionada(temOpcoes ? produto.opcoes[0] : null);
    } else {
      confirmarAdicaoAoCarrinho(produto, 1, null, produto.preco);
    }
  }

  function confirmarAdicaoAoCarrinho(produto, qtd, detalhes, precoFinalizado) {
    const idUnico = detalhes ? `${produto.id}-${detalhes.info}` : `${produto.id}-padrao`;
    const itemExistente = carrinho.find(item => item.idUnico === idUnico);

    const novoPreco = precoFinalizado !== undefined ? precoFinalizado : produto.preco;

    if (itemExistente) {
      const novaQtd = (produto.categoria || '').toLowerCase() === 'frios' || (produto.nome || '').toLowerCase().includes('queijo') || (produto.nome || '').toLowerCase().includes('presunto')
        ? parseFloat(itemExistente.quantidade) + parseFloat(qtd)
        : itemExistente.quantidade + qtd;

      setCarrinho(carrinho.map(item => item.idUnico === idUnico ? { ...item, quantidade: novaQtd } : item));
    } else {
      setCarrinho([...carrinho, { ...produto, idUnico, quantidade: qtd, precoVenda: novoPreco, infoAdicional: detalhes ? detalhes.info : '' }]);
    }
    setProdutoConfigurando(null); 
  }

  function alterarQuantidadeCart(idUnico, delta) {
    const itemExistente = carrinho.find(item => item.idUnico === idUnico);
    if (!itemExistente) return;
    const novaQuantidade = itemExistente.quantidade + delta;
    if (novaQuantidade <= 0) {
      setCarrinho(carrinho.filter(item => item.idUnico !== idUnico));
    } else {
      setCarrinho(carrinho.map(item => item.idUnico === idUnico ? { ...item, quantidade: novaQuantidade } : item));
    }
  }

  // ★ FUNÇÃO INTELIGENTE DE CÁLCULO (INCLUI PROMOÇÕES) ★
  function calcularPrecoItem(item) {
    const nomeLower = (item.nome || '').toLowerCase();
    
    // 1. Regra para Queijos e Frios (Preço do KG * Peso digitado)
    if ((item.categoria || '').toLowerCase() === 'frios' || nomeLower.includes('queijo') || nomeLower.includes('presunto')) {
      return item.precoVenda * parseFloat(item.quantidade);
    }
    
    // 2. Regra da Promoção Dinâmica
    if (item.isPromo && item.quantidade >= item.qtdPromo) {
      return item.precoPromo * item.quantidade;
    }
    
    // 3. Regra Padrão (Sem promoção ou quantidade insuficiente)
    const precoUnitarioAtual = item.precoNormal || item.precoVenda;
    return precoUnitarioAtual * item.quantidade;
  }

  const subtotal = carrinho.reduce((acc, item) => acc + calcularPrecoItem(item), 0);
  const taxa = tipoEntrega === 'Entrega' ? 5.00 : 0; 
  const total = subtotal + taxa;
  
  // Variáveis para pagamento múltiplo
  const totalPagoMultiplo = pagamentosMultiplos.reduce((acc, p) => acc + converterParaNumero(p.valor), 0);
  const valorRestante = total - totalPagoMultiplo;

  function limparCarrinho() {
    setCarrinho([]);
    fecharModal();
    setCarrinhoAberto(false);
  }

  // ===== VALIDAÇÕES E MODAIS =====
  function abrirModal() {
    setEtapaModal('identificacao'); 
    setErroValidacao(''); 
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setErroValidacao('');
    setModoPagamento('unico');
    setPagamentosMultiplos([{ id: Date.now(), metodo: 'Dinheiro', valor: '' }]);
    setTimeout(() => { setEtapaModal('identificacao'); }, 200);
  }

  function avancarParaPagamento() {
    setErroValidacao(''); 
    const nomeLimpo = nomeCliente.trim();

    const palavrasNome = nomeLimpo.split(' ').filter(p => p.length > 0);
    if (palavrasNome.length < 2) return setErroValidacao('Por favor, informe seu nome e sobrenome.');
    if (/\d/.test(nomeLimpo)) return setErroValidacao('O nome não pode conter números.');
    
    for (let palavra of palavrasNome) {
      if (palavra.length < 2) return setErroValidacao('Seu nome ou sobrenome está muito curto.');
      if (!/[aeiouyáéíóúãõâêîôû]/i.test(palavra)) return setErroValidacao('Por favor, digite um nome real válido.');
    }

    const dddMatch = telefone.match(/^\((\d{2})\)/);
    const ddd = dddMatch ? parseInt(dddMatch[1]) : 0;
    const dddsValidos = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99];

    if (!dddsValidos.includes(ddd)) return setErroValidacao(`O DDD (${ddd}) não existe. Informe um DDD válido, ex: (81).`);
    
    const celularRegex = /^\([1-9]{2}\)\s9\d{4}-\d{4}$/;
    if (!celularRegex.test(telefone)) return setErroValidacao('Informe um celular válido no formato (XX) 9XXXX-XXXX.');

    setEtapaModal('pagamento'); 
  }

  function voltarParaIdentificacao() {
    setEtapaModal('identificacao');
  }

  async function enviarPedido() {
    setErroValidacao('');

    if (modoPagamento === 'dividido' && valorRestante > 0) {
      setErroValidacao(`Ainda falta pagar R$ ${formatarDinheiro(valorRestante)}!`);
      return; 
    }

    let pagamentoStrDB = '';
    let pagamentoStrZap = '';

    if (modoPagamento === 'unico') {
      const troco = converterParaNumero(trocoPara) > total ? converterParaNumero(trocoPara) : 0;
      pagamentoStrDB = metodoUnico === 'Dinheiro' && troco > 0 ? `Dinheiro (Troco para R$ ${formatarDinheiro(troco)})` : metodoUnico;
      
      pagamentoStrZap = `*Pagamento:* ${metodoUnico}\n`;
      if (metodoUnico === 'Dinheiro' && troco > 0) {
        pagamentoStrZap += `*Troco para:* R$ ${formatarDinheiro(troco)}\n*Levar de troco:* R$ ${formatarDinheiro(troco - total)}\n`;
      }
    } else {
      pagamentoStrDB = `Dividido: ${pagamentosMultiplos.map(p => `${p.metodo} (R$ ${formatarDinheiro(p.valor)})`).join(', ')}`;
      
      pagamentoStrZap = `*Pagamento Dividido:*\n`;
      pagamentosMultiplos.forEach(p => {
        pagamentoStrZap += `- ${p.metodo}: R$ ${formatarDinheiro(p.valor)}\n`;
      });
      if (valorRestante < 0) {
        pagamentoStrZap += `*Troco a devolver:* R$ ${formatarDinheiro(Math.abs(valorRestante))}\n`;
      }
    }

    const dadosPedido = {
      nomeCliente, telefone, total,
      itens: JSON.stringify(carrinho), 
      endereco: tipoEntrega === 'Entrega' ? `${endereco.rua}, ${endereco.numero} - ${endereco.bairro} (Ref: ${endereco.ref})` : 'Retirada',
      formaEntrega: tipoEntrega,
      formaPagamento: pagamentoStrDB
    };

    try {
      await fetch('http://127.0.0.1:3001/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosPedido)
      });
    } catch (erro) { console.error("Erro ao salvar no banco:", erro); }

    let texto = `*NOVO PEDIDO - SMART MARKET* 🛒\n\n*Cliente:* ${nomeCliente}\n*Telefone:* ${telefone}\n*Itens:*\n`;
    
    carrinho.forEach(item => {
      const valItemTotal = calcularPrecoItem(item);
      const medida = ((item.categoria || '').toLowerCase() === 'frios' || (item.nome || '').toLowerCase().includes('queijo') || (item.nome || '').toLowerCase().includes('presunto')) ? 'kg' : 'x';
      texto += `- ${item.quantidade}${medida} ${item.nome} ${item.infoAdicional ? `(${item.infoAdicional})` : ''} (R$ ${formatarDinheiro(valItemTotal)})\n`;
      
      if (item.isPromo && item.quantidade >= item.qtdPromo) {
         texto += `  ↳ 🚨 Promoção Aplicada!\n`;
      }
    });
    
    texto += `\n*Subtotal:* R$ ${formatarDinheiro(subtotal)}\n`;
    if (taxa > 0) texto += `*Taxa de Entrega:* R$ ${formatarDinheiro(taxa)}\n`;
    texto += `*TOTAL DA COMPRA:* R$ ${formatarDinheiro(total)}\n\n`;
    
    texto += pagamentoStrZap + '\n';

    texto += `*Modo:* ${tipoEntrega}\n`;
    if (tipoEntrega === 'Entrega') {
      texto += `*Endereço:* ${endereco.rua}, ${endereco.numero} - ${endereco.bairro}\n`;
      if (endereco.ref) texto += `*Ref:* ${endereco.ref}\n`;
    }

    const numeroLoja = "5581900000000"; 
    const linkZap = `https://wa.me/${numeroLoja}?text=${encodeURIComponent(texto)}`;
    
    window.open(linkZap, '_blank');
    limparCarrinho();
  }

  function addLinhaPagamento() {
    setPagamentosMultiplos([...pagamentosMultiplos, { id: Date.now(), metodo: 'Cartão', valor: '' }]);
  }

  function removeLinhaPagamento(id) {
    if (pagamentosMultiplos.length > 1) {
      setPagamentosMultiplos(pagamentosMultiplos.filter(p => p.id !== id));
    }
  }

  function updateLinhaPagamento(id, campo, valor) {
    setPagamentosMultiplos(pagamentosMultiplos.map(p => p.id === id ? { ...p, [campo]: valor } : p));
  }

  const produtosAgrupados = produtos
    .filter(p => {
      const statusAtivo = p.ativo === 1 || p.ativo === true || p.ativo === undefined;
      return statusAtivo && p.nome.toLowerCase().includes(busca.toLowerCase());
    })
    .reduce((grupos, produto) => {
      const cat = produto.isPromo ? '🔥PROMOÇÃO' : (produto.categoria || "Outros");
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(produto);
      return grupos;
    }, {});

  return (
    <div translate="no" className="notranslate">
      <header>
        <div className="brand">
          <a href="#"><img src="/img/logo/logo.jpeg" alt="Logo" className="logo" /></a>
          <div>
            <h1>Smart Market</h1>
            <div className="subtitle">Bomboniere • Embalagens • Mercearia</div>
          </div>
        </div>
      </header>

      <main>
        <section className="produtos-wrap">
          <div className="top-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <div className="search" style={{ flex: 1, position: 'relative' }}>
               <svg width="18" height="18" viewBox="0 0 24 24" style={{ position: 'absolute', left: '10px', top: '12px' }}>
                <path d="M21 21l-4.35-4.35" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><circle cx="11" cy="11" r="6" stroke="#fff" strokeWidth="1.5"/>
              </svg>
              <input type="search" placeholder="Buscar produto..." style={{ width: '100%', paddingLeft: '35px' }} value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <button style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '12px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>📋 Acompanhar Meus Pedidos</button>
            <button style={{ background: '#1a3b5c', color: 'white', padding: '12px', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>Categorias</button>
          </div>

          <div id="produtos">
            {Object.keys(produtosAgrupados).length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', fontWeight: 'bold', color: '#7f8c8d' }}>Nenhum produto encontrado...</p>
            ) : (
              Object.keys(produtosAgrupados).map(categoria => (
                <div key={categoria} style={{ width: '100%', marginBottom: '30px' }}>
                  <h2 style={{ background: '#d1f2e6', borderLeft: '5px solid #1abc9c', padding: '10px 15px', margin: '0 0 15px 0', color: '#1a3b5c', fontSize: '20px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {categoria}
                  </h2>
                  <div className="container">
                    {produtosAgrupados[categoria].map((prod) => (
                      <div key={prod.id} className="card">
                        <div className="thumb"><img src={prod.foto} alt={prod.nome} onError={(e) => tentarOutraExtensao(e, prod.categoria, prod.nome)} /></div>
                        <h3>{prod.nome}</h3>
                        
                        {/* ★ NOVO: RENDERIZAÇÃO DA PROMOÇÃO NO CARD ★ */}
                        <div className="price-row" style={{ display: 'block', marginBottom: '10px' }}>
                          {prod.isPromo ? (
                            <>
                              <div style={{ background: '#ff3b3b', color: 'white', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', marginBottom: '5px' }}>
                                PROMOÇÃO
                              </div>
                              <div style={{ fontSize: '14px' }}>
                                <span style={{ textDecoration: 'line-through', color: '#a0aec0', marginRight: '8px' }}>R$ {formatarDinheiro(prod.precoNormal)}</span>
                                <span style={{ color: '#00b853', fontWeight: 'bold', fontSize: '16px' }}>R$ {formatarDinheiro(prod.precoPromo)}</span>
                              </div>
                              <div style={{ color: '#e67e22', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                                {prod.mensagemPromo}
                              </div>
                            </>
                          ) : (
                             <div className="price">R$ {formatarDinheiro(prod.preco)} <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{((prod.categoria || '').toLowerCase() === 'frios' || (prod.nome || '').toLowerCase().includes('queijo') || (prod.nome || '').toLowerCase().includes('presunto')) ? '/kg' : ''}</span></div>
                          )}
                        </div>

                        <button className="add-btn" onClick={() => handleAdicionarClick(prod)}>Adicionar</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* =========================================
            MODAL DE CONFIGURAÇÃO DE PRODUTO 
        ========================================= */}
        {produtoConfigurando && (
          <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 10000 }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '90%', maxWidth: '380px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
              <div style={{ background: '#0a1930', padding: '20px', textAlign: 'center', position: 'relative' }}>
                <button onClick={() => setProdutoConfigurando(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#a0aec0', fontSize: '24px', cursor: 'pointer' }}>×</button>
                <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>Personalizar Item</h2>
              </div>
              <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                <h3 style={{ marginTop: 0, color: '#1a3b5c', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{produtoConfigurando.nome}</h3>
                
                {/* 1. SE FOR FRIOS / QUEIJO / PRESUNTO */}
                {((produtoConfigurando.categoria || '').toLowerCase() === 'frios' || (produtoConfigurando.nome || '').toLowerCase().includes('queijo') || (produtoConfigurando.nome || '').toLowerCase().includes('presunto')) ? (
                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#333' }}>
                      Peso em KG (ex: 0.250):
                    </label>
                    <input 
                      type="number" step="0.001" placeholder="Ex: 0.500" 
                      value={configPeso} onChange={e => setConfigPeso(e.target.value)} 
                      style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} 
                    />
                  </div>
                ) : (
                  <>
                    {/* 2. SE TIVER OPÇÕES */}
                    {produtoConfigurando.opcoes && (
                      <>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '14px', color: '#333' }}>Escolha uma opção:</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                          {produtoConfigurando.opcoes.map(opcao => {
                            const selecionado = opcaoSelecionada && opcaoSelecionada.id === opcao.id;
                            return (
                              <div 
                                key={opcao.id} 
                                onClick={() => setOpcaoSelecionada(opcao)} 
                                style={{ border: `2px solid ${selecionado ? '#00b853' : '#eee'}`, borderRadius: '8px', padding: '15px', textAlign: 'center', cursor: 'pointer', background: selecionado ? 'rgba(0, 184, 83, 0.05)' : 'white', transition: 'all 0.2s' }}
                              >
                                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{opcao.label}</div>
                                <div style={{ color: '#7f8c8d', fontSize: '13px', marginTop: '5px' }}>R$ {formatarDinheiro(opcao.preco)}</div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* 3. SE TIVER SABORES */}
                    {obterSaboresDisponiveis(produtoConfigurando.nome).length > 0 && (
                      <div style={{ marginBottom: '20px', maxHeight: '180px', overflowY: 'auto' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '14px', color: '#333' }}>Quais sabores deseja? (Informe a quantidade de cada)</label>
                        {obterSaboresDisponiveis(produtoConfigurando.nome).map(sabor => (
                          <div key={sabor} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '5px' }}>
                            <span>{sabor}</span>
                            <input type="number" min="0" placeholder="0" value={configSabores[sabor] || ''} onChange={e => setConfigSabores({...configSabores, [sabor]: e.target.value})} style={{ width: '60px', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4. INPUT DE QUANTIDADE GERAL */}
                    {obterSaboresDisponiveis(produtoConfigurando.nome).length === 0 && (
                      <div style={{ marginBottom: '25px' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>Quantidade:</p>
                        <input type="number" min="1" value={configQtd} onChange={e => setConfigQtd(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }} />
                      </div>
                    )}
                  </>
                )}

                <button 
                  onClick={() => {
                    let info = ''; let tipo = 'padrao'; let valor = configPeso; let quantidadeFinal = parseInt(configQtd) || 1;
                    let precoParaCarrinho = produtoConfigurando.preco;

                    const cat = (produtoConfigurando.categoria || '').toLowerCase();
                    const nome = (produtoConfigurando.nome || '').toLowerCase();
                    const listaSabores = obterSaboresDisponiveis(nome);

                    if (cat === 'frios' || nome.includes('queijo') || nome.includes('presunto')) {
                      const pesoKg = parseFloat(configPeso);
                      if (isNaN(pesoKg) || pesoKg <= 0) return alert("Por favor, digite um peso válido! Ex: 0.250");
                      
                      tipo = 'peso'; 
                      info = `${pesoKg}kg`; 
                      quantidadeFinal = pesoKg; 
                      precoParaCarrinho = produtoConfigurando.preco; 
                    } else if (produtoConfigurando.opcoes && produtoConfigurando.opcoes.length > 0) {
                      tipo = 'opcoes';
                      info = opcaoSelecionada ? opcaoSelecionada.label : '';
                      precoParaCarrinho = opcaoSelecionada ? opcaoSelecionada.preco : produtoConfigurando.preco;
                      quantidadeFinal = parseInt(configQtd) || 1;
                    } else if (listaSabores.length > 0) {
                      tipo = 'sabores';
                      const selecionados = Object.entries(configSabores).filter(([s, q]) => parseInt(q) > 0);
                      if(selecionados.length === 0) return alert("Escolha pelo menos 1 sabor e informe a quantidade!");
                      info = selecionados.map(([s, q]) => `${parseInt(q)}x ${s}`).join(', ');
                      quantidadeFinal = selecionados.reduce((acc, [s, q]) => acc + parseInt(q), 0);
                    }
                    
                    confirmarAdicaoAoCarrinho(produtoConfigurando, quantidadeFinal, { tipo, valor, info }, precoParaCarrinho);
                  }}
                  style={{ width: '100%', padding: '15px', background: '#00b853', color: 'white', border: 'none', borderRadius: '5px', marginTop: '20px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
                >
                  Confirmar e Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Carrinho Lateral */}
        <aside className={`pedido ${carrinhoAberto ? 'aberto' : ''}`}>
          <button className="close-cart-btn" onClick={() => setCarrinhoAberto(false)}>×</button>
          <div id="pedido-box">
            <h2 style={{ color: '#1a3b5c' }}>Seu Pedido</h2>
            <div id="lista" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {carrinho.length === 0 ? (
                <div style={{ color: '#7f8c8d' }}>Nenhum item adicionado.</div>
              ) : (
                carrinho.map((item) => {
                  const precoItemTotal = calcularPrecoItem(item);
                  const aplicouPromo = item.isPromo && item.quantidade >= item.qtdPromo;
                  const valorUnitarioAtual = aplicouPromo ? item.precoPromo : (item.precoNormal || item.precoVenda);
                  const strMedida = ((item.categoria || '').toLowerCase() === 'frios' || (item.nome || '').toLowerCase().includes('queijo') || (item.nome || '').toLowerCase().includes('presunto')) ? 'kg' : 'un';

                  return(
                  <div key={item.idUnico} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #eee', padding: '10px 0', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: '500' }}>
                        {item.nome} 
                        {/* ★ NOVO: INJEÇÃO DO TEXTO DO CARRINHO (IGUAL A SUA FOTO) ★ */}
                        <span style={{ display: 'block', fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
                          {item.infoAdicional ? `${item.infoAdicional} • ` : ''}
                          {item.quantidade} {strMedida} × R$ {formatarDinheiro(valorUnitarioAtual)} = <strong style={{color: '#1a3b5c'}}>R$ {formatarDinheiro(precoItemTotal)}</strong>
                        </span>
                        {aplicouPromo && <span style={{ display: 'block', fontSize: '11px', color: '#2ecc71', fontWeight: 'bold' }}>Promoção Aplicada!</span>}
                      </span>
                      <span style={{ fontWeight: 'bold', color: '#1a3b5c' }}>R$ {formatarDinheiro(precoItemTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {((item.categoria || '').toLowerCase() !== 'frios' && !(item.nome || '').toLowerCase().includes('queijo') && !(item.nome || '').toLowerCase().includes('presunto')) && (
                        <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: '5px', padding: '2px' }}>
                          <button onClick={() => alterarQuantidadeCart(item.idUnico, -1)} style={{ background: 'white', color: '#e74c3c', border: '1px solid #ddd', borderRadius: '3px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                          <span style={{ width: '30px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantidade}</span>
                          <button onClick={() => alterarQuantidadeCart(item.idUnico, 1)} style={{ background: 'white', color: '#2ecc71', border: '1px solid #ddd', borderRadius: '3px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                )})
              )}
            </div>
            
            <div className="line" style={{ height: '1px', background: '#ccc', margin: '15px 0' }}></div>
            
            <div className="summary">
              <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div>Subtotal</div><div>R$ {formatarDinheiro(subtotal)}</div>
              </div>
              <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div>Taxa</div><div>R$ {formatarDinheiro(taxa)}</div>
              </div>
              <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', marginTop: '10px' }}>
                <div><strong>Total</strong></div><div><strong>R$ {formatarDinheiro(total)}</strong></div>
              </div>
            </div>
            
            <div className="btns-final" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              <button onClick={limparCarrinho} style={{ background: '#1a3b5c', color: 'white', padding: '12px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Limpar Carrinho</button>
              <button onClick={abrirModal} disabled={carrinho.length === 0} style={{ background: carrinho.length === 0 ? '#ccc' : '#00b853', color: 'white', border: 'none', padding: '15px', borderRadius: '5px', cursor: carrinho.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                Finalizar Pedido
              </button>
            </div>
          </div>
        </aside>

        {carrinho.length > 0 && !carrinhoAberto && (
          <div className="cart-mobile-btn" onClick={() => setCarrinhoAberto(true)}>
            <span>🛒 Ver Carrinho</span>
            <span>R$ {formatarDinheiro(total)}</span>
          </div>
        )}
      </main>

      {/* =========================================
          MODAL DE IDENTIFICAÇÃO E PAGAMENTO 
      ========================================= */}
      {modalAberto && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
          
          {/* TELA DE IDENTIFICAÇÃO */}
          {etapaModal === 'identificacao' && (
            <div style={{ background: 'white', borderRadius: '12px', width: '90%', maxWidth: '380px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
              <div style={{ background: '#0a1930', padding: '30px 20px', textAlign: 'center', position: 'relative' }}>
                <button onClick={fecharModal} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#a0aec0', fontSize: '24px', cursor: 'pointer' }}>×</button>
                <div style={{ background: 'rgba(255,255,255,0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '22px' }}>Identifique-se</h2>
              </div>
              <div style={{ padding: '25px 20px' }}>
                {erroValidacao && <div style={{ background: '#fadbd8', color: '#c0392b', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #e74c3c' }}>{erroValidacao}</div>}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#333' }}>Seu nome</label>
                  <input type="text" placeholder="Ex: Maria Silva" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', fontSize: '15px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#333' }}>WhatsApp (com DDD)</label>
                  <input type="tel" placeholder="(00) 90000-0000" value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', fontSize: '15px' }} />
                </div>
                <button onClick={avancarParaPagamento} style={{ width: '100%', background: '#00b853', color: 'white', border: 'none', padding: '15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginBottom: '15px', transition: '0.2s' }}>Continuar para o Pedido →</button>
              </div>
            </div>
          )}

          {/* TELA DE PAGAMENTO */}
          {etapaModal === 'pagamento' && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, color: '#1a3b5c' }}>Pagamento e Entrega</h2>
                <button onClick={voltarParaIdentificacao} style={{ background: 'transparent', border: 'none', color: '#004aad', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>← Voltar</button>
              </div>
              
              <div style={{ background: '#f0f7ff', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
                <div><strong>Cliente:</strong> {nomeCliente}</div>
                <div><strong>Contato:</strong> {telefone}</div>
              </div>

              <div style={{ marginBottom: '15px', background: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Total a pagar: R$ {formatarDinheiro(total)}</div>
              </div>

              {erroValidacao && <div style={{ background: '#fadbd8', color: '#c0392b', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #e74c3c' }}>{erroValidacao}</div>}

              {/* OPÇÕES DE MODO DE PAGAMENTO */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', background: '#eee', borderRadius: '6px', padding: '3px' }}>
                  <button onClick={() => setModoPagamento('unico')} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: modoPagamento === 'unico' ? 'white' : 'transparent', color: modoPagamento === 'unico' ? '#1a3b5c' : '#777', boxShadow: modoPagamento === 'unico' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>Pagamento Único</button>
                  <button onClick={() => setModoPagamento('dividido')} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: modoPagamento === 'dividido' ? 'white' : 'transparent', color: modoPagamento === 'dividido' ? '#1a3b5c' : '#777', boxShadow: modoPagamento === 'dividido' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>Dividir em Vários</button>
                </div>
              </div>

              {/* MODO: ÚNICO */}
              {modoPagamento === 'unico' && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><input type="radio" checked={metodoUnico === 'Dinheiro'} onChange={() => setMetodoUnico('Dinheiro')} /> Dinheiro</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><input type="radio" checked={metodoUnico === 'Cartão'} onChange={() => setMetodoUnico('Cartão')} /> Cartão</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><input type="radio" checked={metodoUnico === 'Pix'} onChange={() => setMetodoUnico('Pix')} /> Pix</label>
                  </div>
                  {metodoUnico === 'Dinheiro' && (
                    <div style={{ marginTop: '10px' }}>
                      <input type="number" placeholder="Precisa de troco para quanto?" value={trocoPara} onChange={(e) => setTrocoPara(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #2ecc71', outline: 'none' }} />
                    </div>
                  )}
                </div>
              )}

              {/* MODO: DIVIDIDO */}
              {modoPagamento === 'dividido' && (
                <div style={{ marginBottom: '20px', background: '#f5f7fa', padding: '15px', borderRadius: '8px' }}>
                  {pagamentosMultiplos.map((pag, index) => (
                    <div key={pag.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <select 
                        value={pag.metodo} 
                        onChange={(e) => updateLinhaPagamento(pag.id, 'metodo', e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                      >
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão">Cartão</option>
                        <option value="Pix">Pix</option>
                      </select>
                      <input 
                        type="number" 
                        placeholder="Valor R$" 
                        value={pag.valor} 
                        onChange={(e) => updateLinhaPagamento(pag.id, 'valor', e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                      />
                      {pagamentosMultiplos.length > 1 && (
                        <button onClick={() => removeLinhaPagamento(pag.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', width: '35px', height: '35px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                      )}
                    </div>
                  ))}
                  
                  <button onClick={addLinhaPagamento} style={{ background: 'transparent', color: '#004aad', border: '1px dashed #004aad', width: '100%', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ Adicionar outra forma</button>

                  <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: valorRestante > 0 ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>
                      <span>{valorRestante > 0 ? 'Falta Pagar:' : 'Troco a devolver:'}</span>
                      <span>R$ {formatarDinheiro(Math.abs(valorRestante))}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ENTREGA */}
              <div style={{ marginBottom: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Entrega:</div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                  <label><input type="radio" checked={tipoEntrega === 'Retirada'} onChange={() => setTipoEntrega('Retirada')} /> Retirada no balcão</label>
                  <label><input type="radio" checked={tipoEntrega === 'Entrega'} onChange={() => setTipoEntrega('Entrega')} /> Entrega (R$ 5,00)</label>
                </div>
                {tipoEntrega === 'Entrega' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="text" placeholder="Rua" value={endereco.rua} onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input type="text" placeholder="Número" value={endereco.numero} onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <input type="text" placeholder="Bairro" value={endereco.bairro} onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <input type="text" placeholder="Ponto de referência" value={endereco.ref} onChange={(e) => setEndereco({ ...endereco, ref: e.target.value })} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={fecharModal} style={{ flex: 1, padding: '12px', background: '#ccc', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button onClick={enviarPedido} style={{ flex: 1, padding: '12px', background: '#00b853', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar Pedido</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}