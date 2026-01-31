// =========================
// CONFIGURAÇÃO DA API (RENDER)
// =========================
const API_URL = "https://malote-tesouraria-backend.onrender.com";

// =========================
// ELEMENTOS DO DOM
// =========================
const formMalote = document.getElementById('formMalote');
const tabelaAtendimentos = document.getElementById('tabelaAtendimentos');
const btnAdicionarAtendimento = document.getElementById('btnAdicionarAtendimento');
const btnGerarPDF = document.getElementById('btnGerarPDF');
const btnLimpar = document.getElementById('btnLimpar');
const loadingOverlay = document.getElementById('loadingOverlay');

const totalDinheiroEl = document.getElementById('totalDinheiro');
const totalCartaoEl = document.getElementById('totalCartao');
const totalGeralEl = document.getElementById('totalGeral');

// =========================
// FORMATAÇÃO DE MOEDA
// =========================
function formatarValorMonetario(valor) {
  valor = valor.replace(/\D/g, '');
  valor = (parseInt(valor) / 100).toFixed(2);
  valor = valor.replace('.', ',');
  valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return valor;
}

function converterMoedaParaNumero(valor) {
  if (!valor) return 0;
  const numero = valor.replace(/\./g, '').replace(',', '.');
  return parseFloat(numero) || 0;
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function aplicarMascaraMoeda(input) {
  input.addEventListener('input', function(e) {
    let valor = e.target.value;
    valor = formatarValorMonetario(valor);
    e.target.value = valor;
    calcularTotais();
  });

  input.addEventListener('blur', function(e) {
    if (!e.target.value || e.target.value === '0,00') {
      e.target.value = '0,00';
    }
  });

  input.addEventListener('focus', function(e) {
    e.target.select();
  });
}

// =========================
// CÁLCULO DE TOTAIS
// =========================
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
// MANIPULAÇÃO DA TABELA
// =========================
function atualizarNumeracaoLinhas() {
  const linhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento');
  linhas.forEach((linha, index) => {
    const numeroLinha = linha.querySelector('.numero-linha');
    if (numeroLinha) {
      numeroLinha.textContent = index + 1;
    }
  });
}

function criarNovaLinhaAtendimento() {
  const novaLinha = document.createElement('tr');
  novaLinha.className = 'linha-atendimento';

  const totalLinhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento').length;
  const proximoNumero = totalLinhas + 1;

  novaLinha.innerHTML = `
    <td class="numero-linha">${proximoNumero}</td>
    <td>
      <input type="number" class="atendimento-num" placeholder="Nº do atendimento" required>
    </td>
    <td>
      <div class="input-moeda">
        <span class="moeda-simbolo">R$</span>
        <input type="text" class="atendimento-valor" placeholder="0,00" required>
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
      <button type="button" class="btn-remover">✕</button>
    </td>
  `;

  const inputValor = novaLinha.querySelector('.atendimento-valor');
  const selectFormaPagamento = novaLinha.querySelector('.atendimento-forma-pagamento');
  const btnRemover = novaLinha.querySelector('.btn-remover');

  aplicarMascaraMoeda(inputValor);
  inputValor.addEventListener('input', calcularTotais);
  selectFormaPagamento.addEventListener('change', calcularTotais);
  btnRemover.addEventListener('click', () => removerLinhaAtendimento(novaLinha));

  return novaLinha;
}

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

function limparFormulario() {
  if (confirm('Tem certeza que deseja limpar todos os dados?')) {
    document.getElementById('remetente_nome').value = '';
    document.getElementById('numero_lacre').value = '';
    document.getElementById('observacao').value = '';

    const linhas = Array.from(tabelaAtendimentos.querySelectorAll('.linha-atendimento'));
    linhas.forEach((linha, index) => {
      if (index > 0) linha.remove();
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
// COLETA DE DADOS PARA O PDF
// =========================
function coletarDadosFormulario() {
  const dados = {};

  dados["REMETENTE"] = document.getElementById("remetente_nome").value;
  dados["N LACRE"] = document.getElementById("numero_lacre").value;
  dados["OBS"] = document.getElementById("observacao").value || "";

  const linhas = tabelaAtendimentos.querySelectorAll(".linha-atendimento");

  linhas.forEach((linha, index) => {
    const numeroLinha = index + 1;

    const atendimento = linha.querySelector(".atendimento-num").value;
    const valor = linha.querySelector(".atendimento-valor").value;
    const forma = linha.querySelector(".atendimento-forma-pagamento").value;

    if (atendimento) {
      dados[`ATENDIMENTORow${numeroLinha}`] = atendimento;
      dados[`VALORRow${numeroLinha}`] = "R$ " + valor;

      const checkboxCartao = numeroLinha * 2 - 1;
      const checkboxDinheiro = numeroLinha * 2;

      if (forma === "CARTAO") {
        dados[`Check Box${checkboxCartao}`] = "On";
        dados[`Check Box${checkboxDinheiro}`] = "Off";
      } 
      else if (forma === "DINHEIRO") {
        dados[`Check Box${checkboxCartao}`] = "Off";
        dados[`Check Box${checkboxDinheiro}`] = "On";
      }
    }
  });

  return dados;
}

// =========================
// VALIDAÇÃO
// =========================
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

// =========================
// GERAR PDF (RENDER)
// =========================
async function gerarPDF() {
  if (!validarFormulario()) return;

  const dados = coletarDadosFormulario();
  loadingOverlay.classList.remove("hidden");

  try {
    const response = await fetch(`${API_URL}/preencher-malote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      throw new Error(`Erro no servidor: ${response.status}`);
    }

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `malote_${dados["N LACRE"]}_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();

    alert("✅ PDF gerado com sucesso!");

  } catch (erro) {
    alert("❌ Erro ao gerar PDF: " + erro.message);
  } finally {
    loadingOverlay.classList.add("hidden");
  }
}

// =========================
// VERIFICA BACKEND
// =========================
async function verificarConexaoBackend() {
  try {
    await fetch(`${API_URL}/preencher-malote`, { method: "OPTIONS" });
    console.log("Backend acessível em:", API_URL);
    return true;
  } catch (error) {
    console.warn("Backend não está acessível em:", API_URL);
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

    aplicarMascaraMoeda(inputValor);
    inputValor.addEventListener('input', calcularTotais);
    selectFormaPagamento.addEventListener('change', calcularTotais);
    btnRemover.addEventListener('click', () => removerLinhaAtendimento(primeiraLinha));
  }

  calcularTotais();
  verificarConexaoBackend();

  console.log('📦 Sistema Malote Tesouraria');
  console.log('🔌 API URL:', API_URL);
});

// =========================
// EVENT LISTENERS
// =========================
btnAdicionarAtendimento.addEventListener('click', () => {
  const totalLinhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento').length;

  if (totalLinhas >= 18) {
    alert('Limite máximo de 18 atendimentos atingido!');
    return;
  }

  const novaLinha = criarNovaLinhaAtendimento();
  tabelaAtendimentos.appendChild(novaLinha);

  const inputNumero = novaLinha.querySelector('.atendimento-num');
  inputNumero.focus();

  atualizarBotaoAdicionar();
});

function atualizarBotaoAdicionar() {
  const totalLinhas = tabelaAtendimentos.querySelectorAll('.linha-atendimento').length;

  if (totalLinhas >= 18) {
    btnAdicionarAtendimento.disabled = true;
    btnAdicionarAtendimento.style.opacity = '0.5';
    btnAdicionarAtendimento.textContent = '⚠️ LIMITE MÁXIMO ATINGIDO (18)! ⚠️';
  } else {
    btnAdicionarAtendimento.disabled = false;
    btnAdicionarAtendimento.style.opacity = '1';
    btnAdicionarAtendimento.textContent = '+ ADICIONAR ATENDIMENTO';
  }
}

btnGerarPDF.addEventListener('click', gerarPDF);
btnLimpar.addEventListener('click', limparFormulario);

formMalote.addEventListener('submit', (e) => {
  e.preventDefault();
  gerarPDF();
});
