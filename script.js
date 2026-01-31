// =========================
// CONFIGURAÇÃO DA API
// =========================

// URL da API - ATUALIZE APÓS DEPLOY NO RENDER
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'  // Desenvolvimento local
  : 'https://sua-url.onrender.com';  // ⚠️ SUBSTITUA pela URL do Render

// =========================
// ELEMENTOS DO DOM
// =========================
const formMalote = document.getElementById('formMalote');
const tabelaAtendimentos = document.getElementById('tabelaAtendimentos');
const btnAdicionarAtendimento = document.getElementById('btnAdicionarAtendimento');
const btnGerarPDF = document.getElementById('btnGerarPDF');
const btnLimpar = document.getElementById('btnLimpar');
const loadingOverlay = document.getElementById('loadingOverlay');

// Elementos de totalizador
const totalDinheiroEl = document.getElementById('totalDinheiro');
const totalCartaoEl = document.getElementById('totalCartao');
const totalGeralEl = document.getElementById('totalGeral');

// =========================
// FORMATAÇÃO DE MOEDA
// =========================

/**
 * Formata valor como moeda brasileira (ex: 1.234,56)
 */
function formatarValorMonetario(valor) {
  // Remove tudo exceto números
  valor = valor.replace(/\D/g, '');
  
  // Converte para número e divide por 100 (para os centavos)
  valor = (parseInt(valor) / 100).toFixed(2);
  
  // Formata com separadores
  valor = valor.replace('.', ',');
  valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  
  return valor;
}

/**
 * Converte valor formatado para número
 */
function converterMoedaParaNumero(valor) {
  if (!valor) return 0;
  
  // Remove pontos de milhares e substitui vírgula por ponto
  const numero = valor.replace(/\./g, '').replace(',', '.');
  return parseFloat(numero) || 0;
}

/**
 * Formata número para moeda brasileira (com R$)
 */
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Aplica máscara de moeda em um input
 */
function aplicarMascaraMoeda(input) {
  input.addEventListener('input', function(e) {
    let valor = e.target.value;
    
    // Formata o valor
    valor = formatarValorMonetario(valor);
    
    // Atualiza o input
    e.target.value = valor;
    
    // Dispara evento para recalcular totais
    calcularTotais();
  });
  
  // Formata ao sair do campo (blur)
  input.addEventListener('blur', function(e) {
    if (!e.target.value || e.target.value === '0,00') {
      e.target.value = '0,00';
    }
  });
  
  // Seleciona todo o texto ao focar
  input.addEventListener('focus', function(e) {
    e.target.select();
  });
}

// =========================
// FUNÇÕES DE CÁLCULO
// =========================

/**
 * Calcula os totais de todos os atendimentos
 */
function calcularTotais() {
  let totalDinheiro = 0;
  let totalCartao = 0;

  const linhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento');
  
  linhas.forEach(linha => {
    const inputValor = linha.querySelector('.atendimento-valor');
    const selectFormaPagamento = linha.querySelector('.atendimento-forma-pagamento');
    
    const valor = converterMoedaParaNumero(inputValor.value);
    const formaPagamento = selectFormaPagamento.value;

    if (formaPagamento === 'DINHEIRO') {
      totalDinheiro += valor;
    } else if (formaPagamento === 'CARTAO') {
      totalCartao += valor;
    }
  });

  const totalGeral = totalDinheiro + totalCartao;

  totalDinheiroEl.textContent = formatarMoeda(totalDinheiro);
  totalCartaoEl.textContent = formatarMoeda(totalCartao);
  totalGeralEl.textContent = formatarMoeda(totalGeral);
}

// =========================
// FUNÇÕES DE MANIPULAÇÃO DA TABELA
// =========================

/**
 * Atualiza a numeração de todas as linhas
 */
function atualizarNumeracaoLinhas() {
  const linhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento');
  linhas.forEach((linha, index) => {
    const numeroLinha = linha.querySelector('.numero-linha');
    if (numeroLinha) {
      numeroLinha.textContent = index + 1;
    }
  });
}

/**
 * Cria uma nova linha de atendimento na tabela
 */
function criarNovaLinhaAtendimento() {
  const novaLinha = document.createElement('tr');
  novaLinha.className = 'linha-atendimento';
  
  // Calcula o próximo número
  const totalLinhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento').length;
  const proximoNumero = totalLinhas + 1;
  
  novaLinha.innerHTML = `
    <td class="numero-linha">${proximoNumero}</td>
    <td>
      <input 
        type="number" 
        class="atendimento-num" 
        placeholder="Nº do atendimento" 
        required
      >
    </td>
    <td>
      <div class="input-moeda">
        <span class="moeda-simbolo">R$</span>
        <input 
          type="text" 
          class="atendimento-valor" 
          placeholder="0,00" 
          required
        >
      </div>
    </td>
    <td>
      <select class="atendimento-forma-pagamento" required>
        <option value="">Selecione...</option>
        <option value="CARTAO">Cartão</option>
        <option value="DINHEIRO">Espécie</option>
      </select>
    </td>
    <td>
      <button 
        type="button" 
        class="btn-remover" 
        title="Remover atendimento"
        aria-label="Remover atendimento"
      >
        ✕
      </button>
    </td>
  `;

  // Adiciona event listeners aos novos elementos
  const inputValor = novaLinha.querySelector('.atendimento-valor');
  const selectFormaPagamento = novaLinha.querySelector('.atendimento-forma-pagamento');
  const btnRemover = novaLinha.querySelector('.btn-remover');

  // Aplica máscara de moeda
  aplicarMascaraMoeda(inputValor);
  
  inputValor.addEventListener('input', calcularTotais);
  selectFormaPagamento.addEventListener('change', calcularTotais);
  btnRemover.addEventListener('click', () => removerLinhaAtendimento(novaLinha));

  return novaLinha;
}

/**
 * Remove uma linha de atendimento
 */
function removerLinhaAtendimento(linha) {
  const totalLinhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento').length;
  
  if (totalLinhas > 1) {
    if (confirm('Tem certeza que deseja remover este atendimento?')) {
      linha.remove();
      atualizarNumeracaoLinhas();
      calcularTotais();
      atualizarBotaoAdicionar();
    }
  } else {
    alert('Deve haver pelo menos um atendimento na tabela!');
  }
}

/**
 * Limpa todo o formulário
 */
function limparFormulario() {
  if (confirm('Tem certeza que deseja limpar todos os dados?')) {
    document.getElementById('remetente_nome').value = '';
    document.getElementById('numero_lacre').value = '';
    document.getElementById('observacao').value = '';

    const linhas = Array.from(tabelaAtendimentos.querySelectorAll('.linha-atendimento'));
    linhas.forEach((linha, index) => {
      if (index > 0) {
        linha.remove();
      }
    });

    const primeiraLinha = tabelaAtendimentos.querySelector('.linha-atendimento');
    if (primeiraLinha) {
      primeiraLinha.querySelector('.atendimento-num').value = '';
      primeiraLinha.querySelector('.atendimento-valor').value = '0,00';
      primeiraLinha.querySelector('.atendimento-forma-pagamento').value = '';
    }

    atualizarNumeracaoLinhas();
    calcularTotais();
    atualizarBotaoAdicionar();
  }
}

// =========================
// FUNÇÕES DE DADOS
// =========================

/**
 * Coleta todos os dados do formulário
 */
function coletarDadosFormulario() {
  const remetente = document.getElementById('remetente_nome').value;
  const numeroLacre = document.getElementById('numero_lacre').value;
  const observacao = document.getElementById('observacao').value;

  const atendimentos = [];
  const linhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento');

  linhas.forEach((linha, index) => {
    const numeroAtendimento = linha.querySelector('.atendimento-num').value;
    const valorFormatado = linha.querySelector('.atendimento-valor').value;
    const formaPagamento = linha.querySelector('.atendimento-forma-pagamento').value;

    // Só adiciona se tiver número de atendimento
    if (numeroAtendimento && formaPagamento) {
      atendimentos.push({
        numero: parseInt(numeroAtendimento),
        valor: converterMoedaParaNumero(valorFormatado),
        formaPagamento: formaPagamento
      });
    }
  });

  // Calcula totais
  const totalDinheiro = atendimentos
    .filter(a => a.formaPagamento === 'DINHEIRO')
    .reduce((sum, a) => sum + a.valor, 0);

  const totalCartao = atendimentos
    .filter(a => a.formaPagamento === 'CARTAO')
    .reduce((sum, a) => sum + a.valor, 0);

  const totalGeral = totalDinheiro + totalCartao;

  return {
    remetente,
    numeroLacre,
    observacao,
    atendimentos,
    totais: {
      dinheiro: totalDinheiro,
      cartao: totalCartao,
      geral: totalGeral
    },
    dataHora: new Date().toLocaleString('pt-BR')
  };
}

/**
 * Valida se o formulário está preenchido corretamente
 */
function validarFormulario() {
  const remetente = document.getElementById('remetente_nome').value.trim();
  const numeroLacre = document.getElementById('numero_lacre').value.trim();

  if (!remetente) {
    alert('Por favor, preencha o nome do remetente!');
    return false;
  }

  if (!numeroLacre) {
    alert('Por favor, preencha o número do lacre!');
    return false;
  }

  const linhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento');
  let atendimentoValido = false;

  linhas.forEach(linha => {
    const numeroAtendimento = linha.querySelector('.atendimento-num').value;
    const valor = linha.querySelector('.atendimento-valor').value;
    const formaPagamento = linha.querySelector('.atendimento-forma-pagamento').value;

    if (numeroAtendimento && valor && formaPagamento) {
      atendimentoValido = true;
    }
  });

  if (!atendimentoValido) {
    alert('Por favor, preencha pelo menos um atendimento completo!');
    return false;
  }

  return true;
}

/**
 * Gera o PDF (integrado com backend Python)
 */
async function gerarPDF() {
  if (!validarFormulario()) {
    return;
  }

  const dados = coletarDadosFormulario();
  
  // Mostra loading
  loadingOverlay.classList.remove('hidden');

  try {
    // Faz requisição ao backend Python
    const response = await fetch(`${API_URL}/api/gerar-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    // Recebe o PDF como blob
    const blob = await response.blob();
    
    // Cria URL para download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocolo_malote_${dados.numeroLacre}_${new Date().getTime()}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Limpa
    window.URL.revokeObjectURL(url);
    a.remove();
    
    // Feedback de sucesso
    alert('✓ PDF gerado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    
    let mensagemErro = 'Erro ao gerar PDF.\n\n';
    
    if (error.message.includes('Failed to fetch')) {
      mensagemErro += '❌ Não foi possível conectar ao servidor.\n\n';
      mensagemErro += 'Verifique:\n';
      mensagemErro += '1. Se o backend está rodando\n';
      mensagemErro += '2. Se a URL da API está correta no script.js\n';
      mensagemErro += `3. URL configurada: ${API_URL}`;
    } else {
      mensagemErro += error.message;
    }
    
    alert(mensagemErro);
  } finally {
    // Esconde loading
    loadingOverlay.classList.add('hidden');
  }
}

/**
 * Verifica se o backend está disponível
 */
async function verificarConexaoBackend() {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Backend conectado:', data.message);
      console.log('  URL:', API_URL);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('⚠ Backend não está acessível em', API_URL);
    console.warn('  Verifique se o servidor está rodando');
    console.warn('  Ou atualize a URL da API no início do script.js');
    return false;
  }
}

// =========================
// INICIALIZAÇÃO
// =========================

document.addEventListener('DOMContentLoaded', () => {
  const primeiraLinha = tabelaAtendimentos.querySelector('.linha-atendimento');
  
  if (primeiraLinha) {
    const inputValor = primeiraLinha.querySelector('.atendimento-valor');
    const selectFormaPagamento = primeiraLinha.querySelector('.atendimento-forma-pagamento');
    const btnRemover = primeiraLinha.querySelector('.btn-remover');

    // Aplica máscara de moeda
    aplicarMascaraMoeda(inputValor);
    
    inputValor.addEventListener('input', calcularTotais);
    selectFormaPagamento.addEventListener('change', calcularTotais);
    btnRemover.addEventListener('click', () => removerLinhaAtendimento(primeiraLinha));
  }

  // Calcula totais iniciais
  calcularTotais();
  
  // Verifica conexão com backend
  verificarConexaoBackend();
  
  // Log da configuração
  console.log('📦 Sistema Malote Tesouraria');
  console.log('🔌 API URL:', API_URL);
  console.log('🌍 Ambiente:', window.location.hostname === 'localhost' ? 'Desenvolvimento' : 'Produção');
});

// =========================
// EVENT LISTENERS
// =========================

// Botão adicionar atendimento
btnAdicionarAtendimento.addEventListener('click', () => {
  const totalLinhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento').length;
  
  // Verifica se já atingiu o limite de 18 linhas
  if (totalLinhas >= 18) {
    alert('Limite máximo de 18 atendimentos atingido!');
    return;
  }
  
  const novaLinha = criarNovaLinhaAtendimento();
  tabelaAtendimentos.appendChild(novaLinha);
  
  // Foca no input de número do atendimento da nova linha
  const inputNumero = novaLinha.querySelector('.atendimento-num');
  inputNumero.focus();
  
  // Atualiza botão
  atualizarBotaoAdicionar();
});

/**
 * Atualiza o estado do botão adicionar
 */
function atualizarBotaoAdicionar() {
  const totalLinhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento').length;
  
  if (totalLinhas >= 18) {
    btnAdicionarAtendimento.disabled = true;
    btnAdicionarAtendimento.style.opacity = '0.5';
    btnAdicionarAtendimento.style.cursor = 'not-allowed';
    btnAdicionarAtendimento.textContent = '⚠️ LIMITE MÁXIMO ATINGIDO (18)! ⚠️';
  } else {
    btnAdicionarAtendimento.disabled = false;
    btnAdicionarAtendimento.style.opacity = '1';
    btnAdicionarAtendimento.style.cursor = 'pointer';
    btnAdicionarAtendimento.textContent = '+ ADICIONAR ATENDIMENTO';
  }
}

// Botão gerar PDF
btnGerarPDF.addEventListener('click', gerarPDF);

// Botão limpar tudo
btnLimpar.addEventListener('click', limparFormulario);

// Previne envio do formulário ao pressionar Enter
formMalote.addEventListener('submit', (e) => {
  e.preventDefault();
  gerarPDF();
});

// =========================
// ATALHOS DE TECLADO
// =========================

document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter = Gerar PDF
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    gerarPDF();
  }
  
  // Ctrl/Cmd + N = Novo atendimento
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    btnAdicionarAtendimento.click();
  }
});

// =========================
// UTILITÁRIOS PARA DEBUG
// =========================

// Torna disponível no console para testes
window.maloteDebug = {
  coletarDados: coletarDadosFormulario,
  calcularTotais: calcularTotais,
  limpar: limparFormulario,
  verificarBackend: verificarConexaoBackend,
  apiUrl: API_URL
};

console.log('✅ Script do Malote Tesouraria carregado com sucesso!');
console.log('💡 Use window.maloteDebug para acessar funções de debug no console');
console.log('🔌 API configurada em:', API_URL);