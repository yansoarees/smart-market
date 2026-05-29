import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const resposta = await fetch('https://smart-market-production-fbe0.up.railway.app/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (dados.sucesso) {
        // Se acertou a senha, guarda o "crachá" (token) no navegador
        localStorage.setItem('token_admin', dados.token);
        navigate('/admin'); // Entra no painel
      } else {
        setErro(dados.mensagem || 'E-mail ou senha incorretos.');
      }
    } catch (err) {
      setErro('Erro ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBox}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 24, height: 24}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
          <h2 style={styles.title}>Acesso Restrito</h2>
          <p style={styles.subtitle}>Insira suas credenciais para gerenciar a loja.</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          {erro && <div style={styles.erroBox}>{erro}</div>}
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-mail Administrativo</label>
            <input 
              type="email" 
              required 
              style={styles.input} 
              placeholder="admin@smart.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input 
              type="password" 
              required 
              style={styles.input} 
              placeholder="••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <button type="submit" style={styles.button} disabled={carregando}>
            {carregando ? 'Autenticando...' : 'Entrar no Painel'}
          </button>
        </form>
        
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Voltar para a Loja
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', fontFamily: "'Inter', sans-serif" },
  card: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px', boxSizing: 'border-box' },
  header: { textAlign: 'center', marginBottom: '32px' },
  logoBox: { background: '#4f46e5', color: 'white', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  title: { margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px', fontWeight: '800' },
  subtitle: { margin: 0, color: '#64748b', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  erroBox: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '14px', textAlign: 'center', fontWeight: '500', border: '1px solid #fecaca' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#334155' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', transition: '0.2s', fontFamily: 'inherit' },
  button: { backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: '0.2s', marginTop: '8px' },
  backButton: { background: 'transparent', border: 'none', color: '#64748b', width: '100%', marginTop: '24px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }
};