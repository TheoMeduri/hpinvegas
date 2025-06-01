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
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos DOM
const userInfo = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const occurrenceForm = document.getElementById('occurrence-form');
const occurrencesList = document.getElementById('occurrences-list');
const filterStatus = document.getElementById('filter-status');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');

// Variáveis globais
let currentUser = null;
let isAdmin = false;
const selectedTags = [];
let occurrences = [];

// Inicializa a aplicação
function initApp() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            setupUI(user);
            loadOccurrences();
            checkAdminStatus(user.uid);
        } else {
            window.location.href = 'login.html';
        }
    });
    
    setupEventListeners();
}

// Verifica se o usuário é admin
function checkAdminStatus(userId) {
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                isAdmin = doc.data().isAdmin || false;
                console.log('Status de admin:', isAdmin);
                
                // Mostra elementos admin
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = isAdmin ? 'block' : 'none';
                });
                
                // Força uma nova renderização das ocorrências
                renderOccurrences(occurrences);
            }
        })
        .catch(error => {
            console.error("Erro ao verificar status de admin:", error);
        });
}
// Configura a UI com informações do usuário
function setupUI(user) {
    userName.textContent = user.displayName || user.email;
    userAvatar.textContent = getInitials(user.displayName || user.email);
    
    if (!user.photoURL) {
        const colors = ['#4361ee', '#3f37c9', '#4895ef', '#4cc9f0'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        userAvatar.style.background = `linear-gradient(135deg, ${color}, ${darkenColor(color, 20)})`;
        userAvatar.style.color = 'white';
    }
}

// Configura os event listeners
function setupEventListeners() {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            showNotification('Logout realizado com sucesso', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }).catch((error) => {
            showNotification('Erro ao fazer logout: ' + error.message, 'error');
        });
    });

    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const tagValue = this.getAttribute('data-tag');
            
            if (this.classList.contains('selected')) {
                const index = selectedTags.indexOf(tagValue);
                if (index > -1) selectedTags.splice(index, 1);
                this.classList.remove('selected');
            } else {
                if (selectedTags.length >= 3) {
                    showNotification('Você pode selecionar no máximo 3 tags', 'error');
                    return;
                }
                selectedTags.push(tagValue);
                this.classList.add('selected');
            }
            
            document.getElementById('tags').value = selectedTags.join(',');
        });
    });

    occurrenceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const tags = selectedTags;
        
        if (!title || !description) {
            showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        if (tags.length === 0) {
            showNotification('Selecione pelo menos uma tag', 'error');
            return;
        }
        
        try {
            const newOccurrence = {
                title,
                description,
                tags,
                status: 'pending',
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                resolvedBy: null,
                resolvedByName: null,
                assignedTo: null,
                assignedToName: null
            };
            
            await db.collection('occurrences').add(newOccurrence);
            showNotification('Ocorrência enviada com sucesso!', 'success');
            
            occurrenceForm.reset();
            document.querySelectorAll('.tag.selected').forEach(tag => {
                tag.classList.remove('selected');
            });
            selectedTags.length = 0;
            document.getElementById('tags').value = '';
            
        } catch (error) {
            console.error('Erro ao enviar ocorrência:', error);
            showNotification('Erro ao enviar ocorrência. Tente novamente.', 'error');
        }
    });

    filterStatus.addEventListener('change', () => {
        filterOccurrences();
    });

    occurrencesList.addEventListener('click', function(e) {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn || !isAdmin) return;
        
        const occurrenceCard = e.target.closest('.occurrence');
        const occurrenceId = occurrenceCard.dataset.id;
        const action = actionBtn.dataset.action;
        
        console.log(`Admin action: ${action} on ${occurrenceId}`); // Debug
        
        if (action === 'resolve') {
            updateOccurrenceStatus(occurrenceId, 'resolved');
        } else if (action === 'progress') {
            updateOccurrenceStatus(occurrenceId, 'in-progress');
        } else if (action === 'reopen') {
            updateOccurrenceStatus(occurrenceId, 'pending');
        } else if (action === 'pending') {
            updateOccurrenceStatus(occurrenceId, 'pending');
        }
    });
}

// Atualiza o status de uma ocorrência
function updateOccurrenceStatus(id, newStatus) {
    const updateData = {
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    switch(newStatus) {
        case 'resolved':
            updateData.resolvedBy = currentUser.uid;
            updateData.resolvedByName = currentUser.displayName || currentUser.email;
            updateData.assignedTo = null;
            updateData.assignedToName = null;
            break;
        case 'in-progress':
            updateData.assignedTo = currentUser.uid;
            updateData.assignedToName = currentUser.displayName || currentUser.email;
            updateData.resolvedBy = null;
            updateData.resolvedByName = null;
            break;
        case 'pending':
            updateData.resolvedBy = null;
            updateData.resolvedByName = null;
            updateData.assignedTo = null;
            updateData.assignedToName = null;
            break;
    }
    
    db.collection('occurrences').doc(id).update(updateData)
        .then(() => {
            showNotification(`Status atualizado para: ${getStatusText(newStatus)}`, 'success');
        })
        .catch(error => {
            console.error('Erro ao atualizar status:', error);
            showNotification('Erro ao atualizar status', 'error');
        });
}

function loadOccurrences() {
    db.collection('occurrences')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            occurrences = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                occurrences.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date()
                });
            });
            
            // Verifica se isAdmin já foi definido antes de renderizar
            if (currentUser) {
                renderOccurrences(occurrences);
            }
        }, error => {
            console.error('Erro ao carregar ocorrências:', error);
            showNotification('Erro ao carregar ocorrências', 'error');
        });
}


// Renderiza as ocorrências na lista
function renderOccurrences(occurrencesToRender) {
    occurrencesList.innerHTML = '';
    
    if (occurrencesToRender.length === 0) {
        occurrencesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma ocorrência encontrada</p>
            </div>
        `;
        return;
    }

    occurrencesToRender.forEach(occurrence => {
        const occurrenceEl = document.createElement('div');
        occurrenceEl.className = 'occurrence';
        occurrenceEl.dataset.id = occurrence.id;
        
        const dateStr = occurrence.createdAt.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let statusClass, statusText;
        switch (occurrence.status) {
            case 'in-progress':
                statusClass = 'status-in-progress';
                statusText = 'Em Andamento';
                break;
            case 'resolved':
                statusClass = 'status-resolved';
                statusText = 'Resolvido';
                break;
            default:
                statusClass = 'status-pending';
                statusText = 'Pendente';
        }
        
        occurrenceEl.innerHTML = `
            <div class="occurrence-header">
                <div class="occurrence-title">${escapeHtml(occurrence.title)}</div>
                <div class="occurrence-date">${dateStr}</div>
            </div>
            <div class="occurrence-content">
                ${escapeHtml(occurrence.description)}
            </div>
            <div class="occurrence-footer">
                <div class="occurrence-tags">
                    ${occurrence.tags.map(tag => `
                        <div class="tag tag-${tag}">
                            ${getTagIcon(tag)} ${getTagName(tag)}
                        </div>
                    `).join('')}
                </div>
                <div class="occurrence-status ${statusClass}">${statusText}</div>
            </div>
            <div class="occurrence-author">
                <div class="author-avatar">${getInitials(occurrence.authorName)}</div>
                <span>${escapeHtml(occurrence.authorName)}</span>
            </div>
            ${isAdmin ? getAdminActions(occurrence.status) : ''}
        `;
        
        occurrencesList.appendChild(occurrenceEl);
    });
}

// Retorna os botões de ação para admin
function getAdminActions(currentStatus) {
    let actions = '<div class="admin-actions">';
    
    if (currentStatus !== 'resolved') {
        actions += `
            <button class="btn btn-success" data-action="resolve">
                <i class="fas fa-check"></i> Resolver
            </button>
        `;
    } else {
        actions += `
            <button class="btn btn-info" data-action="reopen">
                <i class="fas fa-undo"></i> Reabrir
            </button>
        `;
    }
    
    if (currentStatus === 'pending') {
        actions += `
            <button class="btn btn-warning" data-action="progress">
                <i class="fas fa-user-edit"></i> Atribuir
            </button>
        `;
    } else if (currentStatus === 'in-progress') {
        actions += `
            <button class="btn btn-secondary" data-action="pending">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    }
    
    actions += '</div>';
    return actions;
}

// Filtra ocorrências por status
function filterOccurrences() {
    const status = filterStatus.value;
    
    if (status === 'all') {
        renderOccurrences(occurrences);
        return;
    }
    
    const filtered = occurrences.filter(occ => 
        occ.status === status.replace('-', '')
    );
    renderOccurrences(filtered);
}

// Funções auxiliares
function showNotification(message, type) {
    notification.className = `notification ${type}`;
    notification.querySelector('i').className = 
        type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    notificationMessage.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function getTagIcon(tag) {
    const icons = {
        'problema': 'fa-exclamation-triangle',
        'urgencia': 'fa-bolt',
        'estoques': 'fa-boxes',
        'sistema': 'fa-server',
        'entrada': 'fa-door-open',
        'banheiros': 'fa-toilet',
        'punicao': 'fa-gavel',
        'seguranca': 'fa-shield-alt'
    };
    return `<i class="fas ${icons[tag] || 'fa-tag'}"></i>`;
}

function getTagName(tag) {
    const names = {
        'problema': 'Problema',
        'urgencia': 'Urgência',
        'estoques': 'Estoques',
        'sistema': 'Sistema',
        'entrada': 'Entrada',
        'banheiros': 'Banheiros',
        'punicao': 'Punição',
        'seguranca': 'Segurança'
    };
    return names[tag] || tag;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'in-progress': 'Em Andamento',
        'resolved': 'Resolvido'
    };
    return statusMap[status] || status;
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return `#${(
        0x1000000 +
        (R < 0 ? 0 : R) * 0x10000 +
        (G < 0 ? 0 : G) * 0x100 +
        (B < 0 ? 0 : B)
    ).toString(16).slice(1)}`;
}

// Inicializa o app quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initApp);