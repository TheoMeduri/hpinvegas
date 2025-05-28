// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCLfdhCxEatG1o1YhjwB9bcA8ku2s2_siA",
  authDomain: "hpinvegas-2f531.firebaseapp.com",
  projectId: "hpinvegas-2f531",
  storageBucket: "hpinvegas-2f531.appspot.com",
  messagingSenderId: "67519536188",
  appId: "1:67519536188:web:ccf4c12a861b2efd463739"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const eventosRef = db.collection("eventos");
const lotesRef = db.collection("lotes");
const presencasRef = db.collection("presencas");

const state = {
  eventos: [],
  lotes: [],
  presencas: {},
  usuario: null
};

// Listeners
function setupEventListeners() {
  document.getElementById('criar-evento-btn')?.addEventListener('click', criarEvento);
  document.getElementById('criar-lote-btn')?.addEventListener('click', criarLote);
  document.getElementById('evento-presenca')?.addEventListener('change', mostrarPresenca);
  document.getElementById('exportar-pdf-btn')?.addEventListener('click', gerarPDF);
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupEventListeners();
});

function initAuth() {
  auth.onAuthStateChanged(user => {
    if (user) {
      state.usuario = user;
      carregarDados();
      mostrarNotificacao(`Bem-vindo, ${user.email}`, 'success');

      const emailText = document.getElementById('email');
      if (emailText) {     
        const email = user.email;
        const rawName = email.split('@')[0]; // Pega tudo antes do @
        const nameParts = rawName.match(/[a-zA-Z]+/g); // Separa palavras compostas

        // Capitaliza cada palavra
        const nameFormatted = nameParts
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
        
        emailText.textContent = nameFormatted;

      }

    } else {
      mostrarNotificacao('Faça login para continuar', 'warning');
    }
  });
}


// Carregar dados gerais
async function carregarDados() {
  try {
    const eventosSnapshot = await eventosRef.get();
    state.eventos = eventosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const lotesSnapshot = await lotesRef.get();
    state.lotes = lotesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const presencasSnapshot = await presencasRef.get();
    state.presencas = {};
    presencasSnapshot.forEach(doc => {
      const data = doc.data();
      if (!state.presencas[data.eventoId]) {
        state.presencas[data.eventoId] = [];
      }
      state.presencas[data.eventoId].push({
        id: doc.id,
        ...data
      });
    });

    atualizarUI();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    mostrarNotificacao('Erro ao carregar dados', 'error');
  }
}

// Criar evento
async function criarEvento() {
  if (!state.usuario) {
    mostrarNotificacao('Faça login para criar eventos', 'error');
    return;
  }

  const nome = document.getElementById('nome-evento').value.trim();
  const data = document.getElementById('data-evento').value;
  const local = document.getElementById('local-evento').value.trim();
  const descricao = document.getElementById('descricao-evento').value.trim();

  const erros = [];
  if (!nome) erros.push('Nome do evento é obrigatório');
  if (!data) erros.push('Data do evento é obrigatória');
  if (new Date(data) < new Date()) erros.push('Data deve ser futura');
  if (!local) erros.push('Local do evento é obrigatório');

  if (erros.length > 0) {
    mostrarNotificacao(erros.join('<br>'), 'error');
    return;
  }

  try {
    const novoEvento = {
      nome, data, local, descricao,
      userId: state.usuario.uid,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await eventosRef.add(novoEvento);
    const doc = await docRef.get();
    state.eventos.push({ id: doc.id, ...doc.data() });

    atualizarUI();
    resetForm('evento-form');
    mostrarNotificacao(`Evento "${nome}" criado com sucesso!`, 'success');
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    mostrarNotificacao('Erro ao criar evento', 'error');
  }
}

// Criar lote
async function criarLote() {
  if (!state.usuario) {
    mostrarNotificacao('Faça login para criar lotes', 'error');
    return;
  }

  const eventoId = document.getElementById('evento-lote').value;
  const nome = document.getElementById('nome-lote').value.trim();
  const preco = parseFloat(document.getElementById('preco-lote').value);
  const qtd = parseInt(document.getElementById('quantidade-lote').value);
  const dataInicio = document.getElementById('data-inicio-lote').value;

  const erros = [];
  if (!eventoId || eventoId === 'Selecione um evento') erros.push('Selecione um evento válido');
  if (!nome) erros.push('Nome do lote é obrigatório');
  if (isNaN(preco) || preco <= 0) erros.push('Preço deve ser positivo');
  if (isNaN(qtd) || qtd <= 0) erros.push('Quantidade deve ser positiva');

  if (erros.length > 0) {
    mostrarNotificacao(erros.join('<br>'), 'error');
    return;
  }

  try {
    const evento = state.eventos.find(e => e.id === eventoId);
    if (!evento) {
      mostrarNotificacao('Evento não encontrado', 'error');
      return;
    }

    const novoLote = {
      eventoId,
      eventoNome: evento.nome,
      nome, preco, quantidade: qtd,
      vendidos: 0,
      dataInicio,
      userId: state.usuario.uid,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await lotesRef.add(novoLote);
    const doc = await docRef.get();
    state.lotes.push({ id: doc.id, ...doc.data() });

    atualizarUI();
    resetForm('lote-form');
    mostrarNotificacao(`Lote "${nome}" criado para "${evento.nome}"`, 'success');
  } catch (error) {
    console.error("Erro ao criar lote:", error);
    mostrarNotificacao('Erro ao criar lote', 'error');
  }
}

// Mostrar presença
function mostrarPresenca() {
  const eventoId = document.getElementById('evento-presenca')?.value;
  const container = document.getElementById('lista-presencas');
  if (!container || !eventoId || !state.presencas[eventoId]) {
    if (container) container.innerHTML = '<p>Nenhuma presença registrada para este evento.</p>';
    return;
  }

  const presencas = state.presencas[eventoId];
  container.innerHTML = presencas.map(p => `<li>${p.nome || 'Visitante'} - ${p.horario || 'Horário não informado'}</li>`).join('');
}

// Atualizar selects
function atualizarSelects() {
  const selectEventoLote = document.getElementById('evento-lote');
  const selectPresenca = document.getElementById('evento-presenca');

  if (!selectEventoLote || !selectPresenca) return;

  selectEventoLote.innerHTML = `<option>Selecione um evento</option>`;
  selectPresenca.innerHTML = `<option>Selecione um evento</option>`;

  state.eventos.forEach(evento => {
    const option = new Option(evento.nome, evento.id);
    const option2 = new Option(evento.nome, evento.id);
    selectEventoLote.add(option);
    selectPresenca.add(option2);
  });
}

// Notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao ${tipo}`;
  notificacao.innerHTML = `
    <i class="ri-${tipo === 'success' ? 'checkbox-circle' : tipo === 'error' ? 'close-circle' : 'information'}-line"></i>
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

// Helpers
function resetForm(id) {
  const form = document.getElementById(id);
  if (form) form.reset();
}

// Atualizar UI
function atualizarUI() {
  atualizarSelects();
  atualizarEstatisticas();
  mostrarPresenca();
  atualizarGraficos();
}

// Placeholders para evitar erro
function atualizarEstatisticas() {
  console.log("Estatísticas atualizadas (placeholder)");
}
function atualizarGraficos() {
  console.log("Gráficos atualizados (placeholder)");
}
function gerarPDF() {
  console.log("PDF gerado (placeholder)");
}
