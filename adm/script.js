// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCLfdhCxEatG1o1YhjwB9bcA8ku2s2_siA",
  authDomain: "hpinvegas-2f531.firebaseapp.com",
  projectId: "hpinvegas-2f531",
  storageBucket: "hpinvegas-2f531.appspot.com",
  messagingSenderId: "67519536188",
  appId: "1:67519536188:web:ccf4c12a861b2efd463739"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// State global
const state = {
  eventos: [],
  lotes: [],
  ingressos: [],
  usuario: null,
  listaAtiva: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupEventListeners();
  setupTabs();
});

// Autenticação
function initAuth() {
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists || !userDoc.data().isAdmin) {
        mostrarNotificacao('Acesso restrito a administradores', 'error');
        setTimeout(() => window.location.href = '../', 500);
        return;
      }

      // Atualiza a UI com os dados do usuário
      updateUserProfileUI(userDoc.data());
      
      carregarDados();
      mostrarNotificacao(`Bem-vindo, ${user.email}`, 'success');
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      mostrarNotificacao('Erro ao verificar permissões', 'error');
      setTimeout(() => window.location.href = '../', 2000);
    }
  });
}

// Função para atualizar o perfil do usuário na UI
function updateUserProfileUI(userData) {
  // Avatar - pega as iniciais do nome
  const avatarElement = document.getElementById('user-avatar');
  if (avatarElement && userData.name) {
    const initials = userData.name.split(' ')
      .map(part => part[0]?.toUpperCase() || '')
      .join('')
      .substring(0, 2);
    avatarElement.textContent = initials || 'AD';
  }

  // Nome de usuário
  const usernameElement = document.getElementById('username');
  if (usernameElement) {
    usernameElement.textContent = userData.name || 'Administrador';
  }

  // Função (role)
  const roleElement = document.getElementById('user-role');
  if (roleElement) {
    roleElement.textContent = userData.isAdmin ? 'Administrador' : 'Usuário';
  }

  // Email (se necessário em outro lugar)
  const emailText = document.getElementById('email');
  if (emailText) {
    emailText.textContent = userData.name || userData.email.split('@')[0];
  }
}

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Verifica se o conteúdo da aba existe
      const tabContent = document.getElementById(tabId);
      if (!tabContent) {
        console.warn(`Conteúdo da aba não encontrado: ${tabId}`);
        return;
      }

      // Remove active de todas as abas
      document.querySelectorAll('.tab-btn, .tab-content').forEach(el => {
        el.classList.remove('active');
      });
      
      // Adiciona active na aba clicada
      btn.classList.add('active');
      tabContent.classList.add('active');
    });
  });
}
// Configuração de listeners
function setupEventListeners() {
  // Eventos
  document.getElementById('criar-evento-btn')?.addEventListener('click', criarEventoELotes);
  document.getElementById('adicionar-lote-btn')?.addEventListener('click', adicionarLoteForm);
  
  // Venda de ingressos
  document.getElementById('evento-ingresso')?.addEventListener('change', carregarLotesParaVenda);
  document.getElementById('ingresso-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    venderIngresso();
  });
  
  // Lista de presença
  document.getElementById('evento-presenca')?.addEventListener('change', carregarListaPresenca);
  document.getElementById('buscar-ingresso-btn')?.addEventListener('click', buscarIngresso);
  document.getElementById('busca-codigo')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') buscarIngresso();
  });
  
  // Modal
  document.querySelector('.modal .close')?.addEventListener('click', fecharModal);
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      fecharModal();
    }
  });
  
  // Imprimir ingresso
  document.getElementById('imprimir-ingresso')?.addEventListener('click', imprimirIngresso);
  
  // Delegar eventos para os botões de ação
  document.getElementById('tabela-presenca')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    
    const codigo = btn.dataset.id;
    const eventoId = btn.dataset.evento;
    
    if (btn.classList.contains('validate')) {
      validarIngresso(codigo, eventoId);
    } else if (btn.classList.contains('delete')) {
      excluirIngresso(codigo, eventoId);
    }
  });
}

async function carregarLotesEvento() {
  try {
    const eventoId = document.getElementById('evento-selecionado').value;
    const container = document.getElementById('lotes-disponiveis'); // Ou o ID correto do seu container
    
    if (!eventoId) {
      container.innerHTML = '<p>Selecione um evento primeiro</p>';
      return;
    }

    // Limpa o container antes de carregar novos lotes
    container.innerHTML = '<p>Carregando lotes...</p>';

    // Busca os lotes no Firestore
    const snapshot = await db.collection('lotes')
      .where('eventoId', '==', eventoId)
      .get();

    if (snapshot.empty) {
      container.innerHTML = '<p>Nenhum lote encontrado para este evento</p>';
      return;
    }

    // Processa os lotes encontrados
    const lotesHTML = snapshot.docs.map(doc => {
      const lote = doc.data();
      return `
        <div class="lote-item">
          <h4>${lote.nome}</h4>
          <p>Preço: R$ ${lote.preco.toFixed(2)}</p>
          <p>Quantidade: ${lote.quantidade}</p>
          <p>Vendidos: ${lote.vendidos}</p>
        </div>
      `;
    }).join('');

    container.innerHTML = lotesHTML;

  } catch (error) {
    console.error("Erro ao carregar lotes:", error);
    const container = document.getElementById('lotes-disponiveis');
    container.innerHTML = '<p class="error">Erro ao carregar lotes</p>';
  }
}

// Função para adicionar novo lote ao formulário
function adicionarLoteForm() {
  const container = document.getElementById('lotes-container');
  const novoLote = document.createElement('div');
  novoLote.className = 'lote-item';
  novoLote.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label>Nome do Lote</label>
        <input type="text" class="nome-lote" placeholder="Ex: Lote Promocional" required>
      </div>
      <div class="form-group">
        <label>Preço (R$)</label>
        <input type="number" class="preco-lote" min="0" step="0.01" required>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Quantidade</label>
        <input type="number" class="quantidade-lote" min="1" required>
      </div>
      <div class="form-group">
        <label>Data de Início</label>
        <input type="date" class="data-inicio-lote" required>
      </div>
    </div>
    <button type="button" class="remover-lote-btn secondary-btn danger">
      <i class="ri-delete-bin-line"></i> Remover Lote
    </button>
  `;
  
  container.appendChild(novoLote);
  
  // Adiciona listener para o botão de remover
  novoLote.querySelector('.remover-lote-btn').addEventListener('click', () => {
    container.removeChild(novoLote);
  });
}

// Função para criar evento e lotes
async function criarEventoELotes(e) {
  e.preventDefault();
  
  if (!state.usuario) {
    mostrarNotificacao('Faça login para criar eventos', 'error');
    return;
  }

  // Dados do evento
  const nome = document.getElementById('nome-evento').value.trim();
  const data = document.getElementById('data-evento').value;
  const hora = document.getElementById('hora-evento').value;
  const local = document.getElementById('local-evento').value.trim();
  const descricao = document.getElementById('descricao-evento').value.trim();

  // Validação do evento
  const erros = [];
  if (!nome) erros.push('Nome do evento é obrigatório');
  if (!data) erros.push('Data do evento é obrigatória');
  if (new Date(data) < new Date()) erros.push('Data deve ser futura');
  if (!local) erros.push('Local do evento é obrigatório');

  // Coletar dados dos lotes
  const lotes = [];
  document.querySelectorAll('.lote-item').forEach(loteEl => {
    const nomeLote = loteEl.querySelector('.nome-lote').value.trim();
    const precoLote = parseFloat(loteEl.querySelector('.preco-lote').value);
    const qtdLote = parseInt(loteEl.querySelector('.quantidade-lote').value);
    const dataInicioLote = loteEl.querySelector('.data-inicio-lote').value;
    
    if (nomeLote && !isNaN(precoLote) && !isNaN(qtdLote) && dataInicioLote) {
      lotes.push({
        nome: nomeLote,
        preco: precoLote,
        quantidade: qtdLote,
        dataInicio: dataInicioLote,
        vendidos: 0,
        ativo: true
      });
    }
  });

  if (lotes.length === 0) {
    erros.push('Pelo menos um lote válido é necessário');
  }

  if (erros.length > 0) {
    mostrarNotificacao(erros.join('<br>'), 'error');
    return;
  }

  try {
    // Criar evento
    const novoEvento = {
      nome, 
      data: new Date(`${data}T${hora}`),
      local, 
      descricao,
      userId: state.usuario.uid,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    const eventoRef = await db.collection('eventos').add(novoEvento);
    const eventoId = eventoRef.id;

    // Criar lotes
    const batch = db.batch();
    lotes.forEach(lote => {
      const loteRef = db.collection('lotes').doc();
      batch.set(loteRef, {
        ...lote,
        eventoId,
        eventoNome: nome,
        userId: state.usuario.uid,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    // Atualizar UI
    carregarDados();
    document.getElementById('evento-form').reset();
    document.getElementById('lotes-container').innerHTML = '';
    adicionarLoteForm(); // Adiciona um lote vazio novamente
    
    mostrarNotificacao(`Evento "${nome}" criado com ${lotes.length} lote(s)!`, 'success');
  } catch (error) {
    console.error("Erro ao criar evento e lotes:", error);
    mostrarNotificacao('Erro ao criar evento e lotes', 'error');
  }
}

// Função para carregar dados iniciais
async function carregarDados() {
  try {
    // Carrega eventos
    const eventosSnapshot = await db.collection('eventos').get();
    state.eventos = eventosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Verifica se data.data é um Firestore Timestamp antes de converter
        data: data.data && data.data.toDate ? data.data.toDate() : null
      };
    });

    // Carrega lotes
    const lotesSnapshot = await db.collection('lotes').get();
    state.lotes = lotesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Verifica se data.dataInicio é um Firestore Timestamp antes de converter
        dataInicio: data.dataInicio && data.dataInicio.toDate ? new Date(data.dataInicio) : null
      };
    });

    // Atualiza selects e UI
    atualizarSelects();
    atualizarEstatisticas();
    
    // Carrega eventos para venda de ingressos
    carregarEventosParaVenda();
    
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    mostrarNotificacao('Erro ao carregar dados', 'error');
  }
}

function atualizarSelects() {
  const selectEventoPresenca = document.getElementById('evento-presenca');
  const selectEventoLotes = document.getElementById('evento-selecionado');
  
  if (selectEventoPresenca) {
    selectEventoPresenca.innerHTML = '<option value="">Selecione um evento</option>';
    state.eventos.forEach(evento => {
      selectEventoPresenca.add(new Option(evento.nome, evento.id));
    });
  }
  
  if (selectEventoLotes) {
    selectEventoLotes.innerHTML = '<option value="">Selecione um evento</option>';
    state.eventos.forEach(evento => {
      selectEventoLotes.add(new Option(evento.nome, evento.id));
    });
    
    // Adiciona o event listener CORRETAMENTE
    selectEventoLotes.addEventListener('change', () => {
      carregarLotesEvento().catch(error => {
        console.error("Erro ao carregar lotes:", error);
      });
    });
  }
}
// Carregar eventos para venda de ingressos
function carregarEventosParaVenda() {
  const selectEventos = document.getElementById('evento-ingresso');
  selectEventos.innerHTML = '<option value="">Selecione um evento</option>';
  
  state.eventos.forEach(evento => {
    const option = document.createElement('option');
    option.value = evento.id;
    option.textContent = evento.nome;
    selectEventos.appendChild(option);
  });
}

// Carregar lotes para venda
async function carregarLotesParaVenda() {
  const eventoId = document.getElementById('evento-ingresso').value;
  const selectLotes = document.getElementById('lote-ingresso');
  
  if (!eventoId) {
    selectLotes.disabled = true;
    selectLotes.innerHTML = '<option value="">Selecione um evento primeiro</option>';
    return;
  }
  
  try {
    const snapshot = await db.collection('lotes')
      .where('eventoId', '==', eventoId)
      .where('quantidade', '>', 0)
      .get();
    
    selectLotes.innerHTML = '<option value="">Selecione um lote</option>';
    selectLotes.disabled = false;
    
    snapshot.forEach(doc => {
      const lote = doc.data();
      if (lote.quantidade > lote.vendidos) {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = `${lote.nome} - R$ ${lote.preco.toFixed(2)} (${lote.quantidade - lote.vendidos} disponíveis)`;
        selectLotes.appendChild(option);
      }
    });
    
  } catch (error) {
    console.error("Erro ao carregar lotes:", error);
    mostrarNotificacao('Erro ao carregar lotes para venda', 'error');
  }
}

// Função para vender ingresso
async function venderIngresso() {
  if (!state.usuario) {
    mostrarNotificacao('Faça login para vender ingressos', 'error');
    return;
  }

  // Obter dados do formulário
  const eventoId = document.getElementById('evento-ingresso').value;
  const loteId = document.getElementById('lote-ingresso').value;
  const nome = document.getElementById('nome-ingresso').value.trim();
  const email = document.getElementById('email-ingresso').value.trim();
  const telefone = document.getElementById('telefone-ingresso').value.trim();
  const rg = document.getElementById('rg-ingresso').value.trim();
  const idade = document.getElementById('idade-ingresso').value;

  // Validação
  if (!eventoId || !loteId || !nome || !email || !rg || !idade) {
    mostrarNotificacao('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  try {
    // Verificar se o lote ainda tem ingressos disponíveis
    const loteRef = db.collection('lotes').doc(loteId);
    const loteDoc = await loteRef.get();
    
    if (!loteDoc.exists) {
      mostrarNotificacao('Lote não encontrado', 'error');
      return;
    }
    
    const lote = loteDoc.data();
    if (lote.quantidade <= lote.vendidos) {
      mostrarNotificacao('Ingressos esgotados para este lote', 'error');
      return;
    }

    // Gerar código do ingresso
    const codigoIngresso = `HP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Criar ingresso na subcoleção
    await db.collection('eventos').doc(eventoId)
      .collection('Ingressos').doc(codigoIngresso).set({
        codigo: codigoIngresso,
        loteId: loteId,
        loteNome: lote.nome,
        preco: lote.preco,
        nome: nome,
        email: email,
        telefone: telefone,
        rg: rg,
        idade: parseInt(idade),
        status: 'pendente',
        validado: false,
        resgatado: false,
        metodoPagamento: 'pix',
        dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
        createUserId: state.usuario.uid
      });

    // Atualizar contador de vendidos no lote
    await loteRef.update({
      vendidos: firebase.firestore.FieldValue.increment(1)
    });

    // Mostrar ingresso gerado
    mostrarIngressoGerado(codigoIngresso, nome, lote.nome, lote.preco, eventoId);
    mostrarNotificacao('Ingresso gerado com sucesso!', 'success');
    
    // Atualizar dados
    carregarDados();

  } catch (error) {
    console.error("Erro ao vender ingresso:", error);
    mostrarNotificacao('Erro ao vender ingresso: ' + error.message, 'error');
  }
}
// Mostrar ingresso gerado
function mostrarIngressoGerado(codigo, nome, loteNome, preco, eventoId) {
  const evento = state.eventos.find(e => e.id === eventoId);
  const eventoNome = evento ? evento.nome : 'Evento não encontrado';
  
  document.getElementById('codigo-ingresso').textContent = codigo;
  document.getElementById('ingresso-evento').textContent = eventoNome;
  document.getElementById('ingresso-participante').textContent = nome;
  document.getElementById('ingresso-lote').textContent = loteNome;
  document.getElementById('ingresso-preco').textContent = `R$ ${preco.toFixed(2)}`;
  
  // Removemos completamente a parte do QR Code
  const qrContainer = document.getElementById('qr-code-ingresso');
  if (qrContainer) {
    qrContainer.style.display = 'none'; // Ou qrContainer.remove() se quiser remover completamente
  }
  
  document.getElementById('ingresso-gerado').style.display = 'block';
  document.getElementById('ingresso-form').reset();
}

// Imprimir ingresso
function imprimirIngresso() {
  const printContent = document.querySelector('.ingresso-card').outerHTML;
  const originalContent = document.body.innerHTML;
  
  document.body.innerHTML = `
    <style>
      body { padding: 20px; background: white; }
      @media print {
        body { padding: 0; }
        .ingresso-card { border: none; box-shadow: none; }
      }
    </style>
    ${printContent}
    <button onclick="window.location.reload()" style="margin-top: 20px;">Voltar</button>
  `;
  
  window.print();
  document.body.innerHTML = originalContent;
}



// Buscar ingresso na lista de presença
async function buscarIngresso() {
  const codigo = document.getElementById('busca-codigo').value.trim();
  const eventoId = document.getElementById('evento-presenca').value;
  
  if (!codigo || !eventoId) {
    mostrarNotificacao('Informe o código e selecione um evento', 'warning');
    return;
  }

  try {
    const ingressoDoc = await db.collection('eventos').doc(eventoId)
      .collection('Ingressos').doc(codigo).get();
    
    if (!ingressoDoc.exists) {
      document.getElementById('tabela-presenca-body').innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            <i class="ri-error-warning-line"></i>
            <p>Ingresso não encontrado</p>
          </td>
        </tr>
      `;
      return;
    }
    
    const ingresso = ingressoDoc.data();
    
    const row = `
      <tr>
        <td>${ingresso.nome}</td>
        <td>${ingresso.email}</td>
        <td>${ingresso.loteNome}</td>
        <td>
          <span class="status-badge ${ingresso.validado ? 'validado' : 'pendente'}">
            ${ingresso.validado ? 'Validado' : 'Pendente'}
          </span>
        </td>
        <td class="actions">
          <button class="action-btn validate" data-id="${codigo}" data-evento="${eventoId}" title="Validar">
            <i class="ri-checkbox-circle-line"></i>
          </button>
          <button class="action-btn delete" data-id="${codigo}" data-evento="${eventoId}" title="Excluir">
            <i class="ri-delete-bin-line"></i>
          </button>
        </td>
      </tr>
    `;
    
    document.getElementById('tabela-presenca-body').innerHTML = row;
    
  } catch (error) {
    console.error("Erro ao buscar ingresso:", error);
    mostrarNotificacao('Erro ao buscar ingresso', 'error');
  }
}

// Validar ingresso
async function validarIngresso(codigo, eventoId) {
  try {
    await db.collection('eventos').doc(eventoId)
      .collection('Ingressos').doc(codigo)
      .update({ validado: true });
    
    mostrarNotificacao('Ingresso validado com sucesso!', 'success');
    buscarIngresso(); // Recarrega o mesmo ingresso
    
  } catch (error) {
    console.error("Erro ao validar ingresso:", error);
    mostrarNotificacao('Erro ao validar ingresso', 'error');
  }
}

// Excluir ingresso
async function excluirIngresso(codigo, eventoId) {
  if (!confirm('Tem certeza que deseja excluir este ingresso?')) return;
  
  try {
    // Primeiro obtemos o ingresso para atualizar o contador no lote
    const ingressoDoc = await db.collection('eventos').doc(eventoId)
      .collection('Ingressos').doc(codigo).get();
    
    if (!ingressoDoc.exists) {
      mostrarNotificacao('Ingresso não encontrado', 'error');
      return;
    }
    
    const ingresso = ingressoDoc.data();
    
    // Batch para operação atômica
    const batch = db.batch();
    
    // Excluir ingresso
    batch.delete(
      db.collection('eventos').doc(eventoId)
        .collection('Ingressos').doc(codigo)
    );
    
    // Atualizar contador no lote
    batch.update(
      db.collection('lotes').doc(ingresso.loteId),
      { vendidos: firebase.firestore.FieldValue.increment(-1) }
    );
    
    await batch.commit();
    
    mostrarNotificacao('Ingresso excluído com sucesso!', 'success');
    document.getElementById('tabela-presenca-body').innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <i class="ri-check-line"></i>
          <p>Ingresso excluído</p>
        </td>
      </tr>
    `;
    
    // Atualizar dados
    carregarDados();
    
  } catch (error) {
    console.error("Erro ao excluir ingresso:", error);
    mostrarNotificacao('Erro ao excluir ingresso', 'error');
  }
}

// Carregar lista de presença
async function carregarListaPresenca() {
  const eventoId = document.getElementById('evento-presenca').value;
  if (!eventoId) return;

  try {
    const snapshot = await db.collection('eventos').doc(eventoId)
      .collection('Ingressos').get();

    const ingressos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    state.ingressos = ingressos;
    atualizarTabelaPresenca(ingressos);
  } catch (error) {
    console.error("Erro ao carregar presenças:", error);
    mostrarNotificacao('Erro ao carregar lista de presença', 'error');
  }
}

// Atualizar tabela de presença
function atualizarTabelaPresenca(ingressos) {
  const tbody = document.getElementById('tabela-presenca-body');
  
  if (ingressos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <i class="ri-user-search-line"></i>
          <p>Nenhum ingresso vendido para este evento</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = ingressos.map(ingresso => `
    <tr>
      <td>${ingresso.nome}</td>
      <td>${ingresso.email}</td>
      <td>${ingresso.loteNome}</td>
      <td>
        <span class="status-badge ${ingresso.validado ? 'validado' : 'pendente'}">
          ${ingresso.validado ? 'Validado' : 'Pendente'}
        </span>
      </td>
      <td class="actions">
        <button class="action-btn validate" data-id="${ingresso.id}" data-evento="${ingresso.eventoId}" title="Validar">
          <i class="ri-checkbox-circle-line"></i>
        </button>
        <button class="action-btn delete" data-id="${ingresso.id}" data-evento="${ingresso.eventoId}" title="Excluir">
          <i class="ri-delete-bin-line"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Atualizar estatísticas
function atualizarEstatisticas() {
  document.getElementById('total-eventos').textContent = state.eventos.length;
  
  const lotesAtivos = state.lotes.filter(l => l.quantidade > l.vendidos);
  document.getElementById('total-lotes').textContent = lotesAtivos.length;
  
  const totalVendas = state.lotes.reduce((sum, lote) => sum + (lote.preco * lote.vendidos), 0);
  document.getElementById('total-vendas').textContent = totalVendas.toFixed(2);
  
  // Contar ingressos vendidos
  const totalIngressos = state.lotes.reduce((sum, lote) => sum + lote.vendidos, 0);
  document.getElementById('total-presencas').textContent = totalIngressos;
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao ${tipo}`;
  notificacao.innerHTML = `
    <i class="ri-${tipo === 'success' ? 'checkbox-circle' : 
                 tipo === 'error' ? 'close-circle' : 
                 tipo === 'warning' ? 'alert' : 'information'}-line"></i>
    <span>${mensagem}</span>
  `;
  document.body.appendChild(notificacao);

  setTimeout(() => {
    notificacao.classList.add('show');
  }, 10);

  setTimeout(() => {
    notificacao.classList.remove('show');
    setTimeout(() => {
      notificacao.remove();
    }, 300);
  }, 5000);
}

// Fechar modal
function fecharModal() {
  document.getElementById('renomear-lista-modal').style.display = 'none';
}

// Função para logout
function logoutUser() {
  auth.signOut()
    .then(() => {
      showNotification('Logout realizado com sucesso.', 'success');
    })
    .catch((error) => {
      showNotification('Erro ao fazer logout: ' + error.message, 'error');
    });
}
