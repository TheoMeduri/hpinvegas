const eventos = [
  {
    nome: "HP IN VEGAS - FIRST",
    data: "25/06/2025",
    lote: "Lote 1",
    restantes: 30,
    preco: 100.00,
    imagem: "./default.png",
    descricao: "A balada mais esperada do ano chegou! A primeira edição da HP IN VEGAS vai bombar com DJ, pista de dança iluminada, bebidas sem álcool, snacks à vontade e muita vibe boa pra quem tem entre 13 e 18 anos!",
    regras: [
      "Permitida apenas para adolescentes entre 13 e 18 anos",
      "Proibido entrar com bebidas alcoólicas ou objetos cortantes",
      "Área VIP com acesso exclusivo para convidados especiais",
      "Proibido fumar (cigarros ou pods)",
      "Documento com foto obrigatório na entrada"
    ]
  }
];

let eventoSelecionado = null;

function carregarEventos() {
  const container = document.querySelector('.eventos-grid');
  container.innerHTML = '';
  
  eventos.forEach((evento) => {
    const card = document.createElement('div');
    card.className = 'evento';
    card.innerHTML = `
      <img src="${evento.imagem}" alt="${evento.nome}" class="evento-image">
      <div class="evento-content">
        <h3><i class="ri-calendar-event-line"></i> ${evento.nome}</h3>
        
        <div class="evento-meta">
          <span class="evento-date"><i class="ri-calendar-line"></i> ${evento.data}</span>
          <span class="evento-lote"><i class="ri-price-tag-3-line"></i> ${evento.lote}</span>
        </div>
        
        <div class="evento-price">
           R$ ${evento.preco.toFixed(2)}
        </div>
        
        <p class="evento-desc">${evento.descricao}</p>
        
        <div class="evento-rules">
          <h4><i class="ri-alert-line"></i> Regras do Evento</h4>
          <ul>
            ${evento.regras.map(regra => `<li>${regra}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => abrirFormulario(evento));
    container.appendChild(card);
  });
}

function abrirFormulario(evento) {
  eventoSelecionado = evento;

  // Reset da quantidade
  document.getElementById('quantidade').value = 1;

  // Atualiza dados do evento no formulário
  document.getElementById('form-compra').style.display = 'block';
  document.getElementById('titulo-evento').textContent = evento.nome;
  document.getElementById('lote').value = evento.lote;
  document.getElementById('restante').value = evento.restantes;
  atualizarValorTotal();

  // Scroll para o formulário
  document.getElementById('form-compra').scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  const qtyInput = document.getElementById('quantidade');
  const increaseBtn = document.getElementById('increase-qty');
  const decreaseBtn = document.getElementById('decrease-qty');

  increaseBtn.addEventListener('click', () => {
    const valorAtual = parseInt(qtyInput.value) || 1;
    qtyInput.value = valorAtual + 1;
    atualizarValorTotal();
  });

  decreaseBtn.addEventListener('click', () => {
    const valorAtual = parseInt(qtyInput.value) || 1;
    if (valorAtual > 1) {
      qtyInput.value = valorAtual - 1;
      atualizarValorTotal();
    }
  });

  qtyInput.addEventListener('input', atualizarValorTotal);
});


function atualizarValorTotal() {
  const qtd = parseInt(document.getElementById('quantidade').value) || 1;
  const valorTotal = eventoSelecionado ? (qtd * eventoSelecionado.preco) : 0;
  const precoCampo = document.getElementById('preco');

  if (isNaN(qtd)) {
    precoCampo.value = "Quantidade inválida";
  } else if (qtd > eventoSelecionado.restantes) {
    precoCampo.value = "Excede disponível";
  } else {
    precoCampo.value = `R$ ${valorTotal.toFixed(2)}`;
  }
}

// Formatar RG ao digitar
document.getElementById('rg').addEventListener('input', function (e) {
  let numeros = e.target.value.replace(/\D/g, '').slice(0, 9); // só números, máx 9 dígitos
  if (numeros.length > 0) {
    numeros = numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{1})?$/, (_, p1, p2, p3, p4) =>
      `${p1}.${p2}.${p3}${p4 ? '-' + p4 : ''}`
    );
  }
  e.target.value = numeros;
});

function finalizarCompra() {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const idade = parseInt(document.getElementById('idade').value);
  const rg = document.getElementById('rg').value.trim();
  const qtd = parseInt(document.getElementById('quantidade').value);

  

  // Validações
  if (!nome || !email || isNaN(idade) || !rg || isNaN(qtd) || qtd <= 0) {
    alert("Por favor, preencha todos os campos corretamente.");
    return;
  }


  if (qtd > eventoSelecionado.restantes) {
    alert(`Desculpe, apenas ${eventoSelecionado.restantes} ingressos restantes.`);
    return;
  }

  // Simulação de compra
  alert(`Compra realizada com sucesso!\n\n${qtd} ingresso(s) para ${eventoSelecionado.nome}\nTotal: R$ ${(qtd * eventoSelecionado.preco).toFixed(2)}\n\nUm email foi enviado para ${email} com os detalhes.`);
  
  // Reset
  document.querySelector('form').reset();
  document.getElementById('form-compra').style.display = 'none';
  eventoSelecionado = null;
}

carregarEventos()

document.addEventListener('DOMContentLoaded', function() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
        }
      });
      
      // Toggle current item
      item.classList.toggle('active');
    });
  });
});
// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCLfdhCxEatG1o1YhjwB9bcA8ku2s2_siA",
  authDomain: "hpinvegas-2f531.firebaseapp.com",
  projectId: "hpinvegas-2f531",
  storageBucket: "hpinvegas-2f531.appspot.com",
  messagingSenderId: "67519536188",
  appId: "1:67519536188:web:ccf4c12a861b2efd463739"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Observador de estado de autenticação
auth.onAuthStateChanged((user) => {
  if (user) {
    // Usuário está logado
    loadProfileData(user.uid);
  } else {
    // Usuário não está logado
    showLoginPrompt();
  }
});

// Função para mostrar o prompt de login
function showLoginPrompt() {
  const profileSection = document.querySelector('.profile-section');
  profileSection.innerHTML = `
    <div class="login-prompt">
      <i class="fas fa-user-lock"></i>
      <h2>Acesso Restrito</h2>
      <p>Você precisa estar logado para acessar esta página. Faça login ou crie uma conta para continuar.</p>
      <div class="auth-buttons">
        <button class="auth-btn login-btn" id="loginBtn">
          <i class="fas fa-sign-in-alt"></i> Fazer Login
        </button>
        <button class="auth-btn register-btn" id="registerBtn">
           Criar Conta
        </button>
      </div>
    </div>
    <!-- Modal de Login -->
    <div id="loginModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Login</h2>
        <form id="loginForm">
          <div class="form-group">
            <label for="loginEmail">Email</label>
            <input type="email" id="loginEmail" required>
          </div>
          <div class="form-group">
            <label for="loginPassword">Senha</label>
            <input type="password" id="loginPassword" required>
          </div>
          <button type="submit" class="primary-btn">Entrar</button>
        </form>
      </div>
    </div>
    <!-- Modal de Registro -->
    <div id="registerModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Criar Conta</h2>
        <form id="registerForm">
          <div class="form-group">
            <label for="registerName">Nome Completo</label>
            <input type="text" id="registerName" required>
          </div>
          <div class="form-group">
            <label for="registerEmail">Email</label>
            <input type="email" id="registerEmail" required>
          </div>
          <div class="form-group">
            <label for="registerPassword">Senha</label>
            <input type="password" id="registerPassword" required minlength="6">
          </div>
          <div class="form-group">
            <label for="registerConfirmPassword">Confirmar Senha</label>
            <input type="password" id="registerConfirmPassword" required>
          </div>
          <button type="submit" class="primary-btn">Registrar</button>
        </form>
      </div>
    </div>
  `;

  // Adiciona eventos aos botões
  document.getElementById('loginBtn').addEventListener('click', () => {
    document.getElementById('loginModal').style.display = 'block';
  });

  document.getElementById('registerBtn').addEventListener('click', () => {
    document.getElementById('registerModal').style.display = 'block';
  });

  // Fechar modais quando clicar no X
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      e.target.closest('.modal').style.display = 'none';
    });
  });

  // Fechar modais quando clicar fora
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });

  // Formulário de Login
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    loginUser(email, password);
  });

  // Formulário de Registro
  document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
      showNotification('As senhas não coincidem', 'error');
      return;
    }
    
    registerUser(name, email, password);
  });
}

// Função para login
function loginUser(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById('loginModal').style.display = 'none';
      showNotification('Login realizado com sucesso!', 'success');
      window.location.reload()
    })
    .catch((error) => {
      let errorMessage = 'Erro ao fazer login.';
      switch(error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido.';
          break;
      }
      showNotification(errorMessage, 'error');
    });
}

// Função para registro
function registerUser(name, email, password) {
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Salva informações adicionais no Firestore
      return db.collection('users').doc(userCredential.user.uid).set({
        name: name,
        email: email,
        completedEvents: 0,
        purchasedTickets: 0,
        events: [],
        tickets: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      document.getElementById('registerModal').style.display = 'none';
      showNotification('Conta criada com sucesso!', 'success');
    })
    .catch((error) => {
      let errorMessage = 'Erro ao registrar.';
      switch(error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email já está em uso.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca (mínimo 6 caracteres).';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido.';
          break;
      }
      showNotification(errorMessage, 'error');
    });
}

// Função para carregar dados do perfil
function loadProfileData(userId) {
  db.collection('users').doc(userId).get()
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        
        // Atualiza a UI com os dados do usuário
        document.querySelector('.profile-header').innerHTML = `
          <div class="profile-avatar">${getInitials(userData.name)}</div>
          <div class="profile-info">
            <h1 class="profile-name">${userData.name}</h1>
            <div class="profile-email">
              <i class="fas fa-envelope"></i>
              <span>${userData.email}</span>
            </div>
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-value">${userData.completedEvents}</span>
                <span class="stat-label">Eventos Concluídos</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${userData.purchasedTickets}</span>
                <span class="stat-label">Tickets Comprados</span>
              </div>
            </div>
          </div>
          <button id="logoutBtn" class="auth-btn logout-btn">
            <i class="fas fa-sign-out-alt"></i> Sair
          </button>
        `;
        
        // Preenche a lista de eventos
        const eventsList = document.querySelector('.event-list');
        eventsList.innerHTML = ''; // Limpa a lista antes de adicionar
        userData.events.forEach(event => {
          eventsList.innerHTML += `
            <div class="event-item">
              <div class="event-icon">
                <i class="fas fa-calendar-check"></i>
              </div>
              <div class="event-details">
                <div class="event-title">${event.title}</div>
                <div class="event-date">${event.date}</div>
              </div>
            </div>
          `;
        });
        
        // Preenche a lista de tickets
        const ticketsList = document.querySelector('.ticket-list');
        ticketsList.innerHTML = ''; // Limpa a lista antes de adicionar
        userData.tickets.forEach(ticket => {
          ticketsList.innerHTML += `
            <div class="ticket-item">
              <div class="ticket-icon">
                <i class="fas fa-ticket-alt"></i>
              </div>
              <div class="ticket-details">
                <div class="ticket-title">${ticket.title}</div>
                <div class="ticket-date">${ticket.date}</div>
              </div>
            </div>
          `;
        });
        
        // Adiciona evento ao botão de logout
        document.getElementById('logoutBtn').addEventListener('click', logoutUser);
      } else {
        showNotification('Dados do usuário não encontrados.', 'error');
      }
    })
    .catch((error) => {
      showNotification('Erro ao carregar perfil: ' + error.message, 'error');
    });
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

// Função auxiliar para mostrar notificações
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `notificacao show ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 
                     type === 'error' ? 'exclamation-circle' : 
                     type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Função auxiliar para obter iniciais do nome
function getInitials(name) {
  return name.split(' ').map(part => part[0]).join('').toUpperCase();
}