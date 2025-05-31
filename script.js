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

    // Variáveis globais
    let eventoSelecionado = null;
    let loteSelecionado = null;
    let quantidadeIngressos = 1;
    let user = null;
    let currentOrderId = null;

    // Observador de autenticação
    auth.onAuthStateChanged((userData) => {
      user = userData;
      if (user) {
        carregarEventos();
        carregarIngressosUsuario();

      } else {
        showLoginPrompt();
        const eventosContainer = document.querySelector('.eventos-grid');
        eventosContainer.innerHTML = '<div class="no-events">Você precisa fazer o login para ver os eventos.</div>';
      }
    });

// Carrega eventos do Firestore
async function carregarEventos() {
  const eventosContainer = document.querySelector('.eventos-grid');
  if (!eventosContainer) return;

  eventosContainer.innerHTML = '<div class="loading">Carregando eventos...</div>';

  try {
    // Busca todos os eventos
    const eventosSnapshot = await db.collection('eventos').get();

    if (eventosSnapshot.empty) {
      eventosContainer.innerHTML = '<div class="no-events">Nenhum evento disponível no momento.</div>';
      return;
    }

    // Para cada evento, busca seus lotes
    const eventosComLotes = await Promise.all(
      eventosSnapshot.docs.map(async (doc) => {
        try {
          const eventoData = doc.data();
          
          // CONVERSÃO DA DATA (agora tratando como string)
          let dataEvento;
          if (eventoData.data) {
            // Tenta parsear a string da data
            dataEvento = new Date(eventoData.data);
            
            // Se a data for inválida, usa a data atual
            if (isNaN(dataEvento.getTime())) {
              console.warn(`Data inválida para o evento ${doc.id}: ${eventoData.data}`);
              dataEvento = new Date();
            }
          } else {
            // Se não houver data, usa a data atual
            dataEvento = new Date();
          }

          const evento = { 
            id: doc.id, 
            ...eventoData,
            data: dataEvento
          };
          
          // Busca os lotes para este evento
          const lotesSnapshot = await db.collection('lotes')
            .where('eventoId', '==', evento.id)
            .get();
          
          evento.lotes = lotesSnapshot.docs.map(loteDoc => {
            const loteData = loteDoc.data();
            return {
              id: loteDoc.id,
              ...loteData,
              preco: parseFloat(loteData.preco) || 0,
              quantidade: parseInt(loteData.quantidade) || 0
            };
          });

          return evento;
        } catch (error) {
          console.error(`Erro ao processar evento ${doc.id}:`, error);
          return null;
        }
      })
    );

    // Filtra eventuais nulls (de erros no processamento)
    const eventosValidos = eventosComLotes.filter(evento => evento !== null);

    if (eventosValidos.length === 0) {
      eventosContainer.innerHTML = '<div class="no-events">Nenhum evento disponível.</div>';
      return;
    }

    // Ordena eventos por data (mais recente primeiro)
    eventosValidos.sort((a, b) => b.data - a.data);

    eventosContainer.innerHTML = '';
    eventosValidos.forEach(evento => criarCardEvento(evento, eventosContainer));

  } catch (error) {
    console.error("Erro ao carregar eventos:", error);
    eventosContainer.innerHTML = '<div class="error">Erro ao carregar eventos. Tente novamente mais tarde.</div>';
  }
}
    // Cria card de evento
    // Cria card de evento
function criarCardEvento(evento, container) {
  const card = document.createElement('div');
  card.className = 'evento';
  const regras = {
  regra1: "Evento exclusivo para adolescentes de 13 a 17 anos. Documento com foto e código de ingresso será exigido na entrada.",
  regra2: "Não é permitida a entrada e saída do evento após o ingresso ser validado.",
  regra3: "É proibido portar ou consumir bebidas alcoólicas, cigarros, pods ou qualquer substância ilícita. O descumprimento resultará em expulsão imediata do evento, sem direito a reembolso.",
  regra4: "O participante deve respeitar todos os colaboradores, seguranças e demais convidados.",
  regra5: "Qualquer ato de violência, discriminação ou assédio resultará em expulsão imediata do evento.",
  regra6: "Não é permitido levar objetos cortantes, pontiagudos ou considerados perigosos.",
  // regra9: "Chegadas com mais de 2 horas de atraso após o início do evento terão o ingresso invalidado sem reembolso.",
};


  
  // Encontra o preço mais baixo entre os lotes
  const menorPreco = evento.lotes.reduce((min, lote) => 
    lote.preco < min ? lote.preco : min, evento.lotes[0].preco);

  card.innerHTML = `
    <img src="${evento.imagem || './default.png'}" alt="${evento.nome}" class="evento-image">
    <div class="evento-content">
      <h3><i class="ri-calendar-event-line"></i> ${evento.nome}</h3>
      
      <div class="evento-meta">
        <span class="evento-date"><i class="ri-calendar-line"></i> ${formatarData(evento.data)}</span>
        <span class="evento-price">R$ ${menorPreco.toFixed(2)}</span>
      </div>
      
      <p class="evento-desc">${evento.descricao || 'Descrição não disponível'}</p>
      
      <div class="evento-rules">
        <h4><i class="ri-alert-line"></i> Regras do Evento</h4>
        <ul>
          ${Object.keys(regras).length > 0 ? 
            Object.values(regras).map(regra => `<li>${regra}</li>`).join('') : 
            '<li>Nenhuma regra específica</li>'}
        </ul>
      </div>
    </div>
  `;
  
  card.addEventListener('click', () => abrirFormulario(evento));
  container.appendChild(card);
}

    // Formata data para exibição
    function formatarData(dataString) {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(dataString).toLocaleDateString('pt-BR', options);
    }

// Abre formulário de compra
// Abre formulário de compra
async function abrirFormulario(evento) {
  alert('A compra de ingresso pelo site está temporariamente desabilitada!')
  // try {
  //   // Primeiro verifica se há lotes com quantidade > 0
  //   const lotesQuantidadeSnapshot = await db.collection('lotes')
  //     .where('eventoId', '==', evento.id)
  //     .where('quantidade', '>', 0)
  //     .get();

  //   // Filtra por data no código JavaScript (tratando como string)
  //   const agora = new Date();
  //   const lotesDisponiveis = lotesQuantidadeSnapshot.docs
  //     .map(doc => {
  //       const loteData = doc.data();
  //       return {
  //         id: doc.id,
  //         ...loteData,
  //         // Converte a string para Date (assumindo formato DD/MM/YYYY ou similar)
  //         dataFim: converterStringParaData(loteData.dataFim)
  //       };
  //     })
  //     .filter(lote => lote.dataFim >= agora);

  //   if (lotesDisponiveis.length === 0) {
  //     alert('Os ingressos para este evento estão esgotados ou os lotes expiraram');
  //     return;
  //   }

  //   eventoSelecionado = { ...evento, lotes: lotesDisponiveis };
    
  //   // Restante do código permanece igual...
  //   document.getElementById('compra-form').reset();
  //   document.getElementById('form-compra').style.display = 'block';
  //   document.getElementById('titulo-evento').textContent = evento.nome;
    
  //   const loteSelect = document.getElementById('lote');
  //   loteSelect.innerHTML = '<option value="" disabled selected>Selecione um lote</option>';
    
  //   eventoSelecionado.lotes.forEach(lote => {
  //     const option = document.createElement('option');
  //     option.value = lote.id;
  //     option.textContent = `${lote.nome} - R$ ${lote.preco.toFixed(2)} (${lote.quantidade} restantes)`;
  //     option.dataset.lote = JSON.stringify(lote);
  //     loteSelect.appendChild(option);
  //   });
    
  //   atualizarQuantidadeRestante();
  //   document.getElementById('form-compra').scrollIntoView({ behavior: 'smooth' });
    
  // } catch (error) {
  //   console.error("Erro ao abrir formulário:", error);
  //   alert("Ocorreu um erro ao carregar os dados do evento. Por favor, tente novamente.");
  // }
}

// Função auxiliar para converter string em Date
function converterStringParaData(dataString) {
  if (!dataString) return new Date(); // Retorna data atual se não houver data
  
  // Tenta converter de formato ISO (YYYY-MM-DD)
  if (dataString.includes('-')) {
    const data = new Date(dataString);
    if (!isNaN(data.getTime())) return data;
  }
  
  // Tenta converter de formato brasileiro (DD/MM/YYYY)
  if (dataString.includes('/')) {
    const [dia, mes, ano] = dataString.split('/');
    return new Date(ano, mes - 1, dia);
  }
  
  // Se não reconhecer o formato, retorna data atual
  console.warn(`Formato de data não reconhecido: ${dataString}`);
  return new Date();
}
    // Atualiza quantidade restante e valor total
    function atualizarQuantidadeRestante() {
      const loteSelect = document.getElementById('lote');
      const selectedOption = loteSelect.options[loteSelect.selectedIndex];
      
      if (selectedOption && selectedOption.value) {
        loteSelecionado = JSON.parse(selectedOption.dataset.lote);
        document.getElementById('restante').value = loteSelecionado.quantidade;
        atualizarValorTotal();
      }
    }

    // Atualiza valor total da compra
    function atualizarValorTotal() {
      const qtd = parseInt(document.getElementById('quantidade').value) || 1;
      quantidadeIngressos = qtd;
      
      if (loteSelecionado) {
        const valorTotal = qtd * loteSelecionado.preco;
        document.getElementById('preco').value = `R$ ${valorTotal.toFixed(2)}`;
        
        // Verifica se a quantidade excede o disponível
        if (qtd > loteSelecionado.quantidade) {
          document.getElementById('preco').value = "Quantidade indisponível";
          document.getElementById('avancar-btn').disabled = true;
        } else {
          document.getElementById('avancar-btn').disabled = false;
        }
      }
    }

    // Avança para a seção de preenchimento dos ingressos
    document.getElementById('avancar-btn').addEventListener('click', () => {
      const nome = document.getElementById('comprador-nome').value.trim();
      const email = document.getElementById('comprador-email').value.trim();
      const telefone = document.getElementById('comprador-telefone').value.trim();
      
      if (!nome || !email || !loteSelecionado || !quantidadeIngressos) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
      }
      
      if (quantidadeIngressos > loteSelecionado.quantidade) {
        alert(`Desculpe, apenas ${loteSelecionado.quantidade} ingressos restantes no lote selecionado.`);
        return;
      }
      
      // Cria os formulários para cada ingresso
      const ticketForms = document.getElementById('ticket-forms');
      ticketForms.innerHTML = '';
      
      for (let i = 1; i <= quantidadeIngressos; i++) {
        const ticketForm = document.createElement('div');
        ticketForm.className = 'ticket-form';
        ticketForm.innerHTML = `
          <h3 class="ticket-form-title"><i class="ri-ticket-2-line"></i> Ingresso ${i}</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="nome-${i}" class="form-label">Nome Completo</label>
              <input type="text" id="nome-${i}" class="form-input" required placeholder="Nome do participante">
            </div>
            
            <div class="form-group">
              <label for="idade-${i}" class="form-label">Idade</label>
              <select id="idade-${i}" class="form-select" required>
                <option value="" disabled selected>Selecione a idade</option>
                <option value="13">13 anos</option>
                <option value="14">14 anos</option>
                <option value="15">15 anos</option>
                <option value="16">16 anos</option>
                <option value="17">17 anos</option>
                <option value="18">18 anos</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="rg-${i}" class="form-label">RG</label>
              <input type="text" id="rg-${i}" class="form-input" required placeholder="00.000.000-0">
            </div>
          </div>
        `;
        ticketForms.appendChild(ticketForm);
      }
      
      // Mostra a seção de ingressos
      document.getElementById('form-compra').style.display = 'none';
      document.getElementById('ticket-section').style.display = 'block';
      document.getElementById('ticket-section').scrollIntoView({ behavior: 'smooth' });
    });

    // Volta para a seção de compra
    document.getElementById('voltar-btn').addEventListener('click', () => {
      document.getElementById('ticket-section').style.display = 'none';
      document.getElementById('form-compra').style.display = 'block';
      document.getElementById('form-compra').scrollIntoView({ behavior: 'smooth' });
    });

    // Prossegue para o pagamento
    document.getElementById('prosseguir-pagamento-btn').addEventListener('click', async () => {
      // Valida todos os campos dos ingressos
      let todosCamposPreenchidos = true;
      const participantes = [];
      
      for (let i = 1; i <= quantidadeIngressos; i++) {
        const nome = document.getElementById(`nome-${i}`).value.trim();
        const idade = document.getElementById(`idade-${i}`).value;
        const rg = document.getElementById(`rg-${i}`).value.trim();
        
        if (!nome || !idade || !rg) {
          todosCamposPreenchidos = false;
          break;
        }
        
        participantes.push({
          nome,
          idade: parseInt(idade),
          rg
        });
      }
      
      if (!todosCamposPreenchidos) {
        alert("Por favor, preencha todos os campos dos participantes corretamente.");
        return;
      }

  const compradorNome = document.getElementById('comprador-nome').value.trim();
  const compradorEmail = document.getElementById('comprador-email').value.trim();
  const compradorTelefone = document.getElementById('comprador-telefone').value.trim();
  
  // Validação dos dados do comprador
  if (!compradorNome || !compradorEmail || !loteSelecionado || !quantidadeIngressos) {
    alert("Por favor, preencha todos os campos corretamente.");
    return;
  }

  for (let i = 1; i <= quantidadeIngressos; i++) {
    const nome = document.getElementById(`nome-${i}`).value.trim();
    const idade = document.getElementById(`idade-${i}`).value;
    const rg = document.getElementById(`rg-${i}`).value.trim();
    
    if (!nome || !idade || !rg) {
      alert(`Por favor, preencha todos os dados do participante ${i}`);
      return;
    }
    
    participantes.push({ nome, idade: parseInt(idade), rg });
  }

  try {
    // Cria a transação para garantir consistência
    await db.runTransaction(async (transaction) => {
      // Verifica se ainda há ingressos disponíveis
      const loteRef = db.collection('lotes').doc(loteSelecionado.id);
      const loteDoc = await transaction.get(loteRef);
      
      if (!loteDoc.exists) {
        throw "Lote não encontrado";
      }
      
      const loteAtual = loteDoc.data();
      if (loteAtual.quantidade < quantidadeIngressos) {
        throw "Quantidade solicitada não disponível";
      }
      
      // Atualiza o lote
      transaction.update(loteRef, {
        quantidade: loteAtual.quantidade - quantidadeIngressos
      });
      
      // Cria a ordem de compra
      const ordemRef = db.collection('ordens').doc();
      transaction.set(ordreRef, {
        id: ordemRef.id,
        eventoId: eventoSelecionado.id,
        eventoNome: eventoSelecionado.nome,
        eventoData: eventoSelecionado.data,
        eventoImagem: eventoSelecionado.imagem || './default.png',
        loteId: loteSelecionado.id,
        loteNome: loteSelecionado.nome,
        precoUnitario: loteSelecionado.preco,
        quantidade: quantidadeIngressos,
        valorTotal: quantidadeIngressos * loteSelecionado.preco,
        comprador: {
          nome: compradorNome,
          email: compradorEmail,
          telefone: compradorTelefone,
          userId: user ? user.uid : null
        },
        participantes,
        status: 'pendente',
        metodoPagamento: 'pix',
        dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
        dataPagamento: null
      });
      
      currentOrderId = ordemRef.id;
    });
    
    // Se chegou aqui, a compra foi registrada com sucesso
    document.getElementById('ticket-section').style.display = 'none';
    document.getElementById('payment-section').style.display = 'block';
    document.getElementById('payment-total').textContent = 
      `Total: R$ ${(quantidadeIngressos * loteSelecionado.preco).toFixed(2)}`;
    
    // Gera QR Code de pagamento
    gerarQRCodePagamento(quantidadeIngressos * loteSelecionado.preco);
    
  } catch (error) {
    console.error("Erro ao finalizar compra:", error);
    alert(`Ocorreu um erro ao processar sua compra: ${error}. Por favor, tente novamente.`);
  }

    });

    // Gera QR Code de pagamento (simulado)
    function gerarQRCodePagamento(valorTotal) {
      const qrCodeContainer = document.getElementById('qr-code');
      const pixCode = `00020126580014BR.GOV.BCB.PIX0136${generateRandomString(36)}5204000053039865406${valorTotal.toFixed(2)}5802BR5913HP IN VEGAS6008SAO PAULO62070503***6304${generateRandomString(4).toUpperCase()}`;
      
      // Limpa o QR Code anterior
      qrCodeContainer.innerHTML = '';
      
      // Gera novo QR Code
      QRCode.toCanvas(qrCodeContainer, pixCode, { width: 200 }, (error) => {
        if (error) console.error("Erro ao gerar QR Code:", error);
      });
      
      // Exibe o código PIX
      document.getElementById('pix-code').value = pixCode;
      
      // Simula verificação de pagamento (em produção, usar webhook)
      setTimeout(() => {
        verificarPagamento();
      }, 15000); // Verifica após 15 segundos (simulação)
    }

    // Função auxiliar para gerar string aleatória
    function generateRandomString(length) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    // Verifica se o pagamento foi confirmado (simulado)
    async function verificarPagamento() {
      if (!currentOrderId) return;
      
      try {
        // Atualiza o status no Firestore
        await db.collection('ordens').doc(currentOrderId).update({
          status: 'pago',
          dataPagamento: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualiza a UI
        document.getElementById('qr-code-container').style.display = 'none';
        document.getElementById('payment-confirm').style.display = 'block';
        
        // Recarrega os ingressos do usuário
        if (user) {
          carregarIngressosUsuario();
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      }
    }

    // Carrega os ingressos do usuário
    async function carregarIngressosUsuario() {
      if (!user) return;
      
      try {
        const snapshot = await db.collection('ordens')
          .where('comprador.userId', '==', user.uid)
          .orderBy('dataCriacao', 'desc')
          .get();
        
        const activeTicketsContainer = document.getElementById('active-tickets');
        const pastTicketsContainer = document.getElementById('past-tickets');
        
        activeTicketsContainer.innerHTML = '';
        pastTicketsContainer.innerHTML = '';
        
        if (snapshot.empty) {
          activeTicketsContainer.innerHTML = '<div class="no-tickets">Visualize seus ingressos em <a href="/redeem">Ingressos Resgatados</a></div>';
          pastTicketsContainer.innerHTML = '<div class="no-tickets">Visualize seus ingressos em <a href="/redeem">Ingressos Resgatados</a></div>';
          return;
        }
        
        const hoje = new Date();
        
        snapshot.forEach(doc => {
          const ordem = { id: doc.id, ...doc.data() };
          const eventoDate = new Date(ordem.eventoData);
          const isPastEvent = eventoDate < hoje;
          
          ordem.participantes.forEach((participante, index) => {
            const ticketId = `${ordem.id}-${index}`;
            const ticketCard = criarCardIngresso(ordem, participante, ticketId, isPastEvent);
            
            if (isPastEvent) {
              pastTicketsContainer.appendChild(ticketCard);
            } else {
              activeTicketsContainer.appendChild(ticketCard);
            }
          });
        });
      } catch (error) {
        console.error("Erro ao carregar ingressos:", error);
      }
    }

    // Cria card de ingresso
    function criarCardIngresso(ordem, participante, ticketId, isPastEvent) {
      const ticketCard = document.createElement('div');
      ticketCard.className = 'ticket-card';
      
      const eventoDate = new Date(ordem.eventoData);
      const options = { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      const dataFormatada = eventoDate.toLocaleDateString('pt-BR', options);
      
      ticketCard.innerHTML = `
        <div class="ticket-header">
          <div class="ticket-title">${ordem.eventoNome}</div>
          <div class="ticket-id">#${ticketId.substring(0, 8)}</div>
        </div>
        
        <div class="ticket-details">
          <div class="ticket-detail">
            <span class="ticket-label">Data</span>
            <span class="ticket-value">${dataFormatada}</span>
          </div>
          
          <div class="ticket-detail">
            <span class="ticket-label">Participante</span>
            <span class="ticket-value">${participante.nome}</span>
          </div>
          
          <div class="ticket-detail">
            <span class="ticket-label">Idade</span>
            <span class="ticket-value">${participante.idade} anos</span>
          </div>
          
          <div class="ticket-detail">
                        <span class="ticket-label">RG</span>
            <span class="ticket-value">${participante.rg}</span>
          </div>
        </div>
        
        <div class="ticket-qr">
          <canvas id="qr-${ticketId}"></canvas>
        </div>
        
        <div class="ticket-footer">
          <div class="ticket-price">R$ ${ordem.precoUnitario.toFixed(2)}</div>
          <div class="ticket-status ${ordem.status === 'pago' ? 'paid' : 'pending'}">
            ${ordem.status === 'pago' ? 'Pago' : 'Pendente'}
          </div>
        </div>
      `;
      
      // Gera QR Code do ingresso
      setTimeout(() => {
        QRCode.toCanvas(document.getElementById(`qr-${ticketId}`), ticketId, { 
          width: 120,
          margin: 1,
          color: {
            dark: '#4361ee',
            light: '#ffffff00'
          }
        });
      }, 100);
      
      return ticketCard;
    }

    // Alternar entre abas de ingressos
    document.querySelectorAll('.event-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove classe active de todas as abas
        document.querySelectorAll('.event-tab').forEach(t => t.classList.remove('active'));
        // Adiciona classe active apenas na aba clicada
        tab.classList.add('active');
        
        // Esconde todos os conteúdos
        document.querySelectorAll('.event-tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        // Mostra apenas o conteúdo correspondente
        const tabId = tab.dataset.tab;
        document.getElementById(`${tabId}-content`).classList.add('active');
      });
    });

    // Copiar código PIX
    document.getElementById('copy-pix-btn').addEventListener('click', () => {
      const pixCode = document.getElementById('pix-code');
      pixCode.select();
      document.execCommand('copy');
      
      // Feedback visual
      const btn = document.getElementById('copy-pix-btn');
      btn.innerHTML = '<i class="ri-check-line"></i> Copiado!';
      setTimeout(() => {
        btn.innerHTML = '<i class="ri-file-copy-line"></i> Copiar Código';
      }, 2000);
    });

    // Botão para ver ingressos após pagamento
    document.getElementById('ver-ingressos-btn').addEventListener('click', () => {
      document.getElementById('payment-section').style.display = 'none';
      document.getElementById('meus-ingressos').scrollIntoView({ behavior: 'smooth' });
    });

    // Botão para voltar aos tickets
    document.getElementById('voltar-tickets-btn').addEventListener('click', () => {
      document.getElementById('payment-section').style.display = 'none';
      document.getElementById('ticket-section').style.display = 'block';
      document.getElementById('ticket-section').scrollIntoView({ behavior: 'smooth' });
    });

    // Mostrar prompt de login
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
      `;
      
      // Adiciona eventos aos botões
      document.getElementById('loginBtn').addEventListener('click', () => {
        // Implemente a lógica de login aqui
        auth.signInWithEmailAndPassword('exemplo@email.com', 'senha123')
          .catch(error => {
            console.error("Erro no login:", error);
            alert("Erro ao fazer login. Por favor, tente novamente.");
          });
      });
      
      document.getElementById('registerBtn').addEventListener('click', () => {
        // Implemente a lógica de registro aqui
        auth.createUserWithEmailAndPassword('exemplo@email.com', 'senha123')
          .then(userCredential => {
            return db.collection('users').doc(userCredential.user.uid).set({
              nome: 'Novo Usuário',
              email: 'exemplo@email.com',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          })
          .catch(error => {
            console.error("Erro no registro:", error);
            alert("Erro ao criar conta. Por favor, tente novamente.");
          });
      });
    }

    // Inicialização
    document.addEventListener('DOMContentLoaded', () => {
      // Eventos de quantidade
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
      
      // Evento de seleção de lote
      document.getElementById('lote').addEventListener('change', atualizarQuantidadeRestante);
      
      // Formatar RG ao digitar
      document.getElementById('rg-1')?.addEventListener('input', function(e) {
        formatarRG(e.target);
      });
    });

    // Função para formatar RG
    function formatarRG(input) {
      let value = input.value.replace(/\D/g, '');
      if (value.length > 2) {
        value = value.replace(/^(\d{2})/, '$1.');
      }
      if (value.length > 6) {
        value = value.replace(/^(\d{2})\.(\d{3})/, '$1.$2.');
      }
      if (value.length > 10) {
        value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d{1})/, '$1.$2.$3-$4');
      }
      input.value = value;
    }

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
           Fazer Login
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