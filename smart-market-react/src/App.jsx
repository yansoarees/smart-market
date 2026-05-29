import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './index.css'; 
import Login from './Login';
import Admin from './Admin';

function Loja() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  
  const [carrinho, setCarrinho] = useState(() => {
    try {
      const carrinhoSalvo = localStorage.getItem('smartMarketCart');
      return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
    } catch (error) {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  const [produtoConfigurando, setProdutoConfigurando] = useState(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null); 
  const [configPeso, setConfigPeso] = useState(''); 
  const [configSabores, setConfigSabores] = useState({}); 
  const [configQtd, setConfigQtd] = useState('1'); 

  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [etapaModal, setEtapaModal] = useState('identificacao'); 
  
  const [menuCategoriasAberto, setMenuCategoriasAberto] = useState(false);

  const [nomeCliente, setNomeCliente] = useState(''); 
  const [telefone, setTelefone] = useState('');
  
  const [modoPagamento, setModoPagamento] = useState('unico'); 
  const [metodoUnico, setMetodoUnico] = useState('Dinheiro');
  const [trocoPara, setTrocoPara] = useState('');
  const [pagamentosMultiplos, setPagamentosMultiplos] = useState([
    { id: Date.now(), metodo: 'Dinheiro', valor: '' }
  ]);

  const [tipoEntrega, setTipoEntrega] = useState('Retirada');
  const [endereco, setEndereco] = useState({ rua: '', numero: '', bairro: '', ref: '' });

  const [erroValidacao, setErroValidacao] = useState('');

  useEffect(() => {
    localStorage.setItem('smartMarketCart', JSON.stringify(carrinho));
  }, [carrinho]);

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

  function getQtdNoCarrinho(idProduto) {
    return carrinho.filter(item => item.id === idProduto).reduce((acc, item) => acc + parseFloat(item.quantidade), 0);
  }

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const resposta = await fetch('https://smart-market-production-fbe0.up.railway.app/produtos');
        const dados = await resposta.json();
        
        const produtosProntos = dados.map(produto => {
          const categoriaFormatada = formatarNome(produto.categoria);
          const nomeFormatado = formatarNome(produto.nome);
          const nomeLower = (produto.nome || '').toLowerCase();
          
          let opcoes = null;
          
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

          let precoNormal = converterParaNumero(produto.preco);
          let isPromo = produto.promocao === 1 || produto.promocao === true;
          let precoPromo = isPromo ? converterParaNumero(produto.preco_promocao) : precoNormal;
          let qtdPromo = isPromo && produto.qtd_promocao ? parseInt(produto.qtd_promocao) : 1;

          let mensagemPromo = isPromo && qtdPromo > 1 ? `A partir de ${qtdPromo} un → R$ ${formatarDinheiro(precoPromo)} cada` : '';

          const linkDaFoto = produto.imagem 
            ? `https://smart-market-production-fbe0.up.railway.app${produto.imagem}` 
            : `/img/${categoriaFormatada}/${nomeFormatado}.png`;

          let variacoesLidas = [];
          if (produto.variacoes && produto.variacoes !== '[]' && produto.variacoes !== 'null') {
            try { variacoesLidas = JSON.parse(produto.variacoes); } catch(e) {}
          }

          return { 
            ...produto, 
            foto: linkDaFoto, 
            preco: precoNormal,
            isPromo: isPromo,
            precoNormal: precoNormal,
            precoPromo: precoPromo,
            qtdPromo: qtdPromo,
            mensagemPromo: mensagemPromo,
            opcoes: opcoes,
            estoque: parseInt(produto.estoque) || 0,
            variacoes: variacoesLidas
          };
        });
        setProdutos(produtosProntos);
      } catch (erro) {
        console.error("Servidor offline", erro);
      } finally {
        setLoading(false);
      }
    }
    carregarProdutos();
  }, []);

  function handleAdicionarClick(produto) {
    if (produto.estoque <= 0) return;

    const qtdAtual = getQtdNoCarrinho(produto.id);

    const nomeProd = (produto.nome || '').toLowerCase();
    const catProd = (produto.categoria || '').toLowerCase();
    const temOpcoes = produto.opcoes && produto.opcoes.length > 0;
    const temVariacoesDB = produto.variacoes && produto.variacoes.length > 0;

    if (catProd === 'frios' || nomeProd.includes('queijo') || nomeProd.includes('presunto') || temOpcoes || temVariacoesDB) {
      setProdutoConfigurando(produto);
      setConfigPeso(''); 
      setConfigQtd('1'); 
      setConfigSabores({});
      setOpcaoSelecionada(temOpcoes ? produto.opcoes[0] : null);
    } else {
      if (qtdAtual + 1 > produto.estoque) {
        alert(`Oops! Temos apenas ${produto.estoque} unidades de ${produto.nome} no estoque.`);
        return;
      }
      confirmarAdicaoAoCarrinho(produto, 1, null, produto.isPromo ? produto.precoPromo : produto.precoNormal);
    }
  }

  function confirmarAdicaoAoCarrinho(produto, qtd, detalhes, precoFinalizado) {
    const idUnico = detalhes ? `${produto.id}-${detalhes.info}` : `${produto.id}-padrao`;
    const itemExistente = carrinho.find(item => item.idUnico === idUnico);

    const novoPreco = precoFinalizado !== undefined ? precoFinalizado : (produto.isPromo ? produto.precoPromo : produto.precoNormal);

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

  // ★ NOVA TRAVA BLINDADA NO BOTÃO [+] DA SACOLA ★
  function alterarQuantidadeCart(idUnico, delta) {
    const itemExistente = carrinho.find(item => item.idUnico === idUnico);
    if (!itemExistente) return;

    if (delta > 0) {
      if (itemExistente.estoqueSaborLimit !== undefined) {
        if (itemExistente.quantidade + delta > itemExistente.estoqueSaborLimit) {
          alert(`Limite atingido! Temos apenas ${itemExistente.estoqueSaborLimit} do sabor ${itemExistente.infoAdicional}.`);
          return;
        }
      } else {
        const qtdTotalDesseProduto = getQtdNoCarrinho(itemExistente.id);
        if (qtdTotalDesseProduto + delta > itemExistente.estoque) {
          alert(`Limite de estoque atingido! Temos apenas ${itemExistente.estoque} disponíveis.`);
          return;
        }
      }
    }

    const novaQuantidade = itemExistente.quantidade + delta;
    if (novaQuantidade <= 0) {
      setCarrinho(carrinho.filter(item => item.idUnico !== idUnico));
    } else {
      setCarrinho(carrinho.map(item => item.idUnico === idUnico ? { ...item, quantidade: novaQuantidade } : item));
    }
  }

  function calcularPrecoItem(item) {
    const nomeLower = (item.nome || '').toLowerCase();
    
    if ((item.categoria || '').toLowerCase() === 'frios' || nomeLower.includes('queijo') || nomeLower.includes('presunto') || item.infoAdicional) {
      const precoUnicoCustom = item.precoNormal || item.preco; 
      return precoUnicoCustom * parseFloat(item.quantidade);
    }
    
    if (item.isPromo && item.quantidade >= item.qtdPromo) {
      return item.precoPromo * item.quantidade;
    }
    
    return item.precoNormal * item.quantidade;
  }

  const subtotal = carrinho.reduce((acc, item) => acc + calcularPrecoItem(item), 0);
  const taxa = tipoEntrega === 'Entrega' ? 5.00 : 0; 
  const total = subtotal + taxa;
  
  const totalPagoMultiplo = pagamentosMultiplos.reduce((acc, p) => acc + converterParaNumero(p.valor), 0);
  const valorRestante = total - totalPagoMultiplo;

  function limparCarrinho() {
    setCarrinho([]);
    fecharModal();
    setCarrinhoAberto(false);
  }

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
      await fetch('https://smart-market-production-fbe0.up.railway.app/pedidos', {
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
      const catBanco = (produto.categoria || "Outros").trim();
      const catLower = catBanco.toLowerCase();
      
      const isAbaPromocao = produto.isPromo || catLower === 'promoção' || catLower === 'promocao';
      const cat = isAbaPromocao ? '🔥 Promoções do Dia' : catBanco;
      
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(produto);
      return grupos;
    }, {});

  const categoriasOrdenadas = Object.keys(produtosAgrupados).sort((a, b) => {
    if (a === '🔥 Promoções do Dia') return -1;
    if (b === '🔥 Promoções do Dia') return 1;
    return a.localeCompare(b);
  });

  return (
    <div translate="no" className="notranslate">
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .skeleton-box {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          background-color: #e2e8f0;
        }
        .menu-categoria-item:hover {
          background-color: #f8fafc;
          color: #4f46e5;
        }
        .card.esgotado {
          opacity: 0.6;
          filter: grayscale(0.7);
        }
        .badge-esgotado {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-10deg);
          background: #e74c3c;
          color: white;
          font-size: 14px;
          font-weight: 900;
          padding: 6px 16px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 2px;
          z-index: 10;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .add-btn:disabled {
          background: #cbd5e1;
          color: #64748b;
          cursor: not-allowed;
          border: none;
        }
      `}</style>

      <header>
        <div className="brand" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
          <img src="/img/logo/logo.jpeg" alt="Logo" className="logo" />
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
            
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setMenuCategoriasAberto(!menuCategoriasAberto)}
                style={{ 
                  background: '#1a3b5c', color: 'white', padding: '12px 16px', border: 'none', 
                  borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', 
                  alignItems: 'center', gap: '8px', transition: '0.2s' 
                }}
              >
                Categorias
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ transform: menuCategoriasAberto ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuCategoriasAberto && (
                <div style={{ 
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'white', 
                  border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                  zIndex: 50, minWidth: '220px', padding: '8px 0', maxHeight: '300px', overflowY: 'auto' 
                }}>
                  {categoriasOrdenadas.map(cat => (
                    <div 
                      key={`menu-${cat}`}
                      className="menu-categoria-item"
                      onClick={() => {
                        setMenuCategoriasAberto(false);
                        const elemento = document.getElementById(`secao-${formatarNome(cat)}`);
                        if (elemento) {
                          elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontWeight: '500', color: '#334155', fontSize: '14px', transition: 'background 0.2s' }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div id="produtos">
            {loading ? (
              <div style={{ width: '100%', marginBottom: '30px' }}>
                <div className="skeleton-box" style={{ height: '40px', width: '250px', borderRadius: '5px', marginBottom: '15px' }}></div>
                <div className="container">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div key={n} className="card" style={{ padding: '15px' }}>
                      <div className="skeleton-box" style={{ width: '100%', height: '140px', borderRadius: '8px', marginBottom: '15px' }}></div>
                      <div className="skeleton-box" style={{ height: '20px', width: '80%', borderRadius: '4px', margin: '0 auto 10px auto' }}></div>
                      <div className="skeleton-box" style={{ height: '18px', width: '40%', borderRadius: '4px', margin: '0 auto 15px auto' }}></div>
                      <div className="skeleton-box" style={{ height: '35px', width: '100%', borderRadius: '5px' }}></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : Object.keys(produtosAgrupados).length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', fontWeight: 'bold', color: '#7f8c8d' }}>Nenhum produto encontrado...</p>
            ) : (
              categoriasOrdenadas.map(categoria => (
                <div key={categoria} id={`secao-${formatarNome(categoria)}`} style={{ width: '100%', marginBottom: '30px', scrollMarginTop: '100px' }}>
                  <h2 style={{ 
                    background: categoria === '🔥 Promoções do Dia' ? '#fce8e6' : '#d1f2e6', 
                    borderLeft: `5px solid ${categoria === '🔥 Promoções do Dia' ? '#e74c3c' : '#1abc9c'}`, 
                    padding: '10px 15px', 
                    margin: '0 0 15px 0', 
                    color: categoria === '🔥 Promoções do Dia' ? '#c0392b' : '#1a3b5c', 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    textTransform: 'capitalize' 
                  }}>
                    {categoria}
                  </h2>
                  <div className="container">
                    {produtosAgrupados[categoria].map((prod) => {
                      const esgotado = prod.estoque <= 0;
                      
                      return (
                      <div key={prod.id} className={`card ${esgotado ? 'esgotado' : ''}`} style={{ position: 'relative' }}>
                        {prod.isPromo && !esgotado && (
                          <div style={{ position: 'absolute', top: '-10px', left: '-10px', background: '#ff3b3b', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', zIndex: 5, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                            PROMO
                          </div>
                        )}
                        
                        {esgotado && <div className="badge-esgotado">ESGOTADO</div>}

                        <div className="thumb"><img src={prod.foto} alt={prod.nome} onError={(e) => tentarOutraExtensao(e, prod.categoria, prod.nome)} /></div>
                        <h3>{prod.nome}</h3>
                        
                        <div className="price-row" style={{ display: 'block', marginBottom: '10px' }}>
                          {prod.isPromo ? (
                            <>
                              <div style={{ fontSize: '14px' }}>
                                <span style={{ textDecoration: 'line-through', color: '#a0aec0', marginRight: '8px' }}>R$ {formatarDinheiro(prod.precoNormal)}</span>
                                <span style={{ color: '#00b853', fontWeight: 'bold', fontSize: '16px' }}>R$ {formatarDinheiro(prod.precoPromo)}</span>
                              </div>
                              {prod.mensagemPromo && (
                                <div style={{ color: '#e67e22', fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>
                                  {prod.mensagemPromo}
                                </div>
                              )}
                            </>
                          ) : (
                              <div className="price">R$ {formatarDinheiro(prod.preco)} <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{((prod.categoria || '').toLowerCase() === 'frios' || (prod.nome || '').toLowerCase().includes('queijo') || (prod.nome || '').toLowerCase().includes('presunto')) ? '/kg' : ''}</span></div>
                          )}
                        </div>

                        <button 
                          className="add-btn" 
                          onClick={() => handleAdicionarClick(prod)}
                          disabled={esgotado}
                        >
                          {esgotado ? 'Indisponível' : 'Adicionar'}
                        </button>
                      </div>
                    )})}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {produtoConfigurando && (
          <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 10000 }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '90%', maxWidth: '380px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
              <div style={{ background: '#0a1930', padding: '20px', textAlign: 'center', position: 'relative' }}>
                <button onClick={() => setProdutoConfigurando(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#a0aec0', fontSize: '24px', cursor: 'pointer' }}>×</button>
                <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>Personalizar Item</h2>
              </div>
              <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                <h3 style={{ marginTop: 0, color: '#1a3b5c', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{produtoConfigurando.nome}</h3>
                
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

                    {produtoConfigurando.variacoes && produtoConfigurando.variacoes.length > 0 && (
                      <div style={{ marginBottom: '20px', maxHeight: '180px', overflowY: 'auto' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', fontSize: '14px', color: '#333' }}>Quais sabores deseja?</label>
                        {produtoConfigurando.variacoes.map(varDB => {
                          const estoqueSabor = parseInt(varDB.estoque) || 0;
                          const esgotadoSabor = estoqueSabor <= 0;
                          
                          return (
                          <div key={varDB.nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '8px', background: esgotadoSabor ? '#ffebee' : '#f5f5f5', borderRadius: '5px', opacity: esgotadoSabor ? 0.6 : 1 }}>
                            <span style={{ fontWeight: '500', color: esgotadoSabor ? '#c0392b' : '#333' }}>
                              {varDB.nome} <span style={{fontSize:'12px', fontWeight:'normal'}}>({estoqueSabor} disp.)</span>
                            </span>
                            <input 
                              type="number" min="0" max={estoqueSabor} disabled={esgotadoSabor} placeholder="0" 
                              value={configSabores[varDB.nome] || ''} 
                              onChange={e => {
                                let val = parseInt(e.target.value) || 0;
                                if (val > estoqueSabor) val = estoqueSabor;
                                setConfigSabores({...configSabores, [varDB.nome]: val === 0 ? '' : val})
                              }} 
                              style={{ width: '60px', padding: '5px', border: '1px solid #ccc', borderRadius: '3px', background: esgotadoSabor ? '#eee' : 'white' }} 
                            />
                          </div>
                        )})}
                      </div>
                    )}

                    {!(produtoConfigurando.variacoes && produtoConfigurando.variacoes.length > 0) && (
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
                    let precoParaCarrinho = produtoConfigurando.isPromo ? produtoConfigurando.precoPromo : produtoConfigurando.precoNormal;

                    const cat = (produtoConfigurando.categoria || '').toLowerCase();
                    const nome = (produtoConfigurando.nome || '').toLowerCase();

                    if (cat === 'frios' || nome.includes('queijo') || nome.includes('presunto')) {
                      const pesoKg = parseFloat(configPeso);
                      if (isNaN(pesoKg) || pesoKg <= 0) return alert("Por favor, digite um peso válido! Ex: 0.250");
                      tipo = 'peso'; info = `${pesoKg}kg`; quantidadeFinal = pesoKg; 
                      
                      const qtdAtual = getQtdNoCarrinho(produtoConfigurando.id);
                      if (qtdAtual + quantidadeFinal > produtoConfigurando.estoque) {
                        alert(`Oops! Temos apenas ${produtoConfigurando.estoque} unidades no estoque. Você já tem ${qtdAtual} no carrinho.`);
                        return;
                      }
                      confirmarAdicaoAoCarrinho(produtoConfigurando, quantidadeFinal, { tipo, valor, info }, precoParaCarrinho);

                    } else if (produtoConfigurando.opcoes && produtoConfigurando.opcoes.length > 0) {
                      tipo = 'opcoes';
                      info = opcaoSelecionada ? opcaoSelecionada.label : '';
                      precoParaCarrinho = opcaoSelecionada ? opcaoSelecionada.preco : produtoConfigurando.preco;
                      quantidadeFinal = parseInt(configQtd) || 1;
                      
                      const qtdAtual = getQtdNoCarrinho(produtoConfigurando.id);
                      if (qtdAtual + quantidadeFinal > produtoConfigurando.estoque) {
                        alert(`Oops! Temos apenas ${produtoConfigurando.estoque} unidades no estoque. Você já tem ${qtdAtual} no carrinho.`);
                        return;
                      }
                      confirmarAdicaoAoCarrinho(produtoConfigurando, quantidadeFinal, { tipo, valor, info }, precoParaCarrinho);

                    } else if (produtoConfigurando.variacoes && produtoConfigurando.variacoes.length > 0) {
                      
                      // ★ A MÁGICA ACONTECE AQUI: Separa os sabores na sacola! ★
                      tipo = 'sabores';
                      const selecionados = Object.entries(configSabores).filter(([s, q]) => parseInt(q) > 0);
                      if(selecionados.length === 0) return alert("Escolha pelo menos 1 sabor e informe a quantidade!");
                      
                      let novoCarrinho = [...carrinho];

                      for (let [saborNome, qtdStr] of selecionados) {
                        const qtdSabor = parseInt(qtdStr);
                        const varDB = produtoConfigurando.variacoes.find(v => v.nome === saborNome);
                        const maxSabor = varDB ? parseInt(varDB.estoque) : 0;

                        const idUnicoSabor = `${produtoConfigurando.id}-sabor-${saborNome}`;
                        const itemExistenteIndex = novoCarrinho.findIndex(c => c.idUnico === idUnicoSabor);
                        const qtdAtualSabor = itemExistenteIndex >= 0 ? novoCarrinho[itemExistenteIndex].quantidade : 0;

                        if (qtdAtualSabor + qtdSabor > maxSabor) {
                          alert(`Você só pode adicionar mais ${maxSabor - qtdAtualSabor} do sabor ${saborNome}. Temos ${maxSabor} disponíveis.`);
                          return; 
                        }

                        if (itemExistenteIndex >= 0) {
                          novoCarrinho[itemExistenteIndex].quantidade += qtdSabor;
                        } else {
                          novoCarrinho.push({
                            ...produtoConfigurando,
                            idUnico: idUnicoSabor,
                            quantidade: qtdSabor,
                            precoVenda: precoParaCarrinho,
                            infoAdicional: saborNome,
                            estoqueSaborLimit: maxSabor // Guarda o limite exclusivo deste sabor!
                          });
                        }
                      }
                      setCarrinho(novoCarrinho);
                      setProdutoConfigurando(null);
                      
                    } else {
                      const qtdAtual = getQtdNoCarrinho(produtoConfigurando.id);
                      if (qtdAtual + quantidadeFinal > produtoConfigurando.estoque) {
                        alert(`Oops! Temos apenas ${produtoConfigurando.estoque} unidades no estoque. Você já tem ${qtdAtual} no carrinho.`);
                        return;
                      }
                      confirmarAdicaoAoCarrinho(produtoConfigurando, quantidadeFinal, { tipo, valor, info }, precoParaCarrinho);
                    }
                  }}
                  style={{ width: '100%', padding: '15px', background: '#00b853', color: 'white', border: 'none', borderRadius: '5px', marginTop: '20px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
                >
                  Confirmar e Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

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

      {modalAberto && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
          
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

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', background: '#eee', borderRadius: '6px', padding: '3px' }}>
                  <button onClick={() => setModoPagamento('unico')} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: modoPagamento === 'unico' ? 'white' : 'transparent', color: modoPagamento === 'unico' ? '#1a3b5c' : '#777', boxShadow: modoPagamento === 'unico' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>Pagamento Único</button>
                  <button onClick={() => setModoPagamento('dividido')} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: modoPagamento === 'dividido' ? 'white' : 'transparent', color: modoPagamento === 'dividido' ? '#1a3b5c' : '#777', boxShadow: modoPagamento === 'dividido' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>Dividir em Vários</button>
                </div>
              </div>

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Loja />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}