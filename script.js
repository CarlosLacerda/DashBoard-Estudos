// SISTEMA DE AUTENTICAÇÃO
let usuarioAtual = null;

// Verificar login ao carregar página
window.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
});

function verificarLogin() {
    usuarioAtual = localStorage.getItem('usuarioLogado');

    if (!usuarioAtual) {
        mostrarTelaLogin();
    } else {
        esconderTelaLogin();
        document.getElementById('userNameText').textContent = usuarioAtual;
        carregarDados();
        atualizarEstatisticas();
        carregarTemaPreferido();
        carregarPersonalizacoes();
    }
}

function mostrarTelaLogin() {
    document.getElementById('loginOverlay').classList.remove('hidden');
}

function esconderTelaLogin() {
    document.getElementById('loginOverlay').classList.add('hidden');
}

function fazerLogin(event) {
    event.preventDefault();

    const nome = document.getElementById('nomeUsuario').value.trim();

    if (nome) {
        usuarioAtual = nome;
        localStorage.setItem('usuarioLogado', nome);

        document.getElementById('userNameText').textContent = nome;
        esconderTelaLogin();

        carregarDados();
        atualizarEstatisticas();
        carregarTemaPreferido();
        carregarPersonalizacoes();

        mostrarNotificacao(`🎉 Bem-vindo, ${nome}!`);
    }
}

function fazerLogout() {
    // Mostrar modal ao invés do confirm()
    document.getElementById('modalConfirmacao').classList.remove('hidden');
}

function fecharModal() {
    document.getElementById('modalConfirmacao').classList.add('hidden');
}

function confirmarLogout() {
    // Fechar modal
    fecharModal();

    // Fazer logout
    localStorage.removeItem('usuarioLogado');
    usuarioAtual = null;
    cursos = [];
    notas = [];
    trilhaAtiva = null;
    notaSelecionada = null;

    // Limpar interface
    document.getElementById('totalCursos').textContent = '0';
    document.getElementById('cursosAndamento').textContent = '0';
    document.getElementById('cursosConcluidos').textContent = '0';

    // Resetar para tela inicial
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('inicio').classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.nav-btn:first-child').classList.add('active');

    // Limpar listas
    document.getElementById('listaCursos').innerHTML = '';
    if (document.getElementById('listaNotas')) {
        document.getElementById('listaNotas').innerHTML = '';
    }

    mostrarTelaLogin();
    document.getElementById('formLogin').reset();

    mostrarNotificacao('👋 Até logo!');
}

// ARMAZENAMENTO DE DADOS
let cursos = [];


// FUNÇÕES DE NAVEGAÇÃO
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');

    if (sectionId === 'inicio') {
        atualizarEstatisticas();
    }

    if (sectionId === 'cursos') {
        renderizarCursos();
    }

    if (sectionId === 'trilhas') {
        renderizarTrilhas();
    }
}

// ADICIONAR CURSO
function adicionarCurso(event) {
    event.preventDefault();

    const nomeCurso = document.getElementById('nomeCurso').value.trim();
    const categoriaSelect = document.getElementById('categoria').value;

    // Pegar categoria custom se for "Outros"
    let categoria = categoriaSelect;
    if (categoriaSelect === 'Outros') {
        const categoriaCustom = document.getElementById('categoriaCustom').value.trim();
        if (!categoriaCustom) {
            mostrarNotificacao('❌ Digite o nome da categoria personalizada!');
            document.getElementById('categoriaCustom').focus();
            return;
        }
        categoria = categoriaCustom;
    }

    // Verificar se já existe curso com esse nome
    const cursoExiste = cursos.some(c => c.nome.toLowerCase() === nomeCurso.toLowerCase());
    if (cursoExiste) {
        mostrarNotificacao('⚠️ Já existe um curso com este nome!');
        document.getElementById('nomeCurso').focus();
        return;
    }

    const curso = {
        id: Date.now(),
        nome: nomeCurso,
        categoria: categoria,
        status: document.getElementById('status').value,
        progresso: parseInt(document.getElementById('progresso').value) || 0,
        anotacoes: document.getElementById('anotacoes').value,
        videoaulas: [...videoaulasTemp],
        dataInicio: new Date().toLocaleDateString('pt-BR'),
        dataUltimaAtualizacao: new Date().toLocaleDateString('pt-BR')
    };

    cursos.push(curso);
    salvarDados();

    document.getElementById('formCurso').reset();
    document.getElementById('categoriaCustom').style.display = 'none';
    videoaulasTemp = [];
    renderizarVideoaulasTemp();

    mostrarNotificacao('✅ Curso adicionado com sucesso!');
    atualizarEstatisticas();

    // Ir para "Meus Cursos"
    showSection('cursos');
}

// SALVAR NO LOCALSTORAGE
function salvarDados() {
    if (!usuarioAtual) return;

    const chave = `cursos_${usuarioAtual}`;
    localStorage.setItem(chave, JSON.stringify(cursos));
}

// CARREGAR DO LOCALSTORAGE
function carregarDados() {
    if (!usuarioAtual) return;

    const chave = `cursos_${usuarioAtual}`;
    const dados = localStorage.getItem(chave);

    if (dados) {
        cursos = JSON.parse(dados);
    } else {
        cursos = [];
    }

    atualizarEstatisticas();
}

// ATUALIZAR ESTATÍSTICAS
function atualizarEstatisticas() {
    const total = cursos.length;
    const emAndamento = cursos.filter(c => c.status === 'em-andamento').length;
    const concluidos = cursos.filter(c => c.status === 'concluido').length;

    // Calcular progresso médio
    const progressoMedio = total > 0
        ? Math.round(cursos.reduce((acc, c) => acc + c.progresso, 0) / total)
        : 0;

    document.getElementById('totalCursos').textContent = total;
    document.getElementById('cursosAndamento').textContent = emAndamento;
    document.getElementById('cursosConcluidos').textContent = concluidos;
    document.getElementById('progressoMedio').textContent = progressoMedio + '%';

    // Mostrar/ocultar mensagem de boas-vindas
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (total === 0) {
        welcomeMsg.classList.add('show');
    } else {
        welcomeMsg.classList.remove('show');
    }

    // Atualizar gráficos
    atualizarGraficos();
}

// RENDERIZAR CURSOS
function renderizarCursos() {
    const container = document.getElementById('listaCursos');

    if (cursos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📚 Nenhum curso cadastrado</h3>
                <p>Comece adicionando seu primeiro curso!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `<div class="cursos-grid">${cursos.map(curso => `
        <div class="curso-card">
            <div class="curso-header">
                <h3>${curso.nome}</h3>
                <span class="curso-categoria">${curso.categoria}</span>
            </div>
            
            <span class="curso-status status-${curso.status}">${formatarStatus(curso.status)}</span>
            
            <div class="progress-container">
                <div class="progress-label">
                    <span>Progresso</span>
                    <span><strong>${curso.progresso}%</strong></span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${curso.progresso}%"></div>
                </div>
            </div>
            
            ${curso.anotacoes ? `<div class="curso-anotacoes">📝 ${curso.anotacoes}</div>` : ''}
            
            ${curso.videoaulas && curso.videoaulas.length > 0 ? `
                <div class="curso-videos">
                    <div class="curso-videos-header">
                        <h4>🎥 Videoaulas</h4>
                        <span class="badge-videos">${curso.videoaulas.length}</span>
                    </div>
                    <div class="video-list-curso">
                        ${curso.videoaulas.slice(0, 2).map((video, idx) => `
                            <div class="video-item-curso" onclick="abrirVideoModal('${video.id}', '${curso.nome}')">
                                <img src="${video.thumbnail}" alt="Thumb">
                                <span>Videoaula ${idx + 1}</span>
                            </div>
                        `).join('')}
                        ${curso.videoaulas.length > 2 ? `
                            <div class="video-item-curso" onclick="mostrarNotificacao('📺 Mostrando ${curso.videoaulas.length} videoaulas')">
                                <span style="color: #3b82f6; font-weight: 600;">+ Ver todas (${curso.videoaulas.length})</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="curso-data">
                📅 Iniciado em: ${curso.dataInicio}
            </div>
            
            <div class="curso-acoes">
                <button class="btn-acao btn-editar" onclick="editarCurso(${curso.id})">✏️ Editar</button>
                <button class="btn-acao btn-deletar" onclick="deletarCurso(${curso.id})">🗑️ Deletar</button>
            </div>
        </div>
    `).join('')}</div>`;
}

// FORMATAR STATUS
function formatarStatus(status) {
    const statusMap = {
        'em-andamento': '🔄 Em Andamento',
        'concluido': '✅ Concluído',
        'pausado': '⏸️ Pausado',
        'nao-iniciado': '⭕ Não Iniciado'
    };
    return statusMap[status] || status;
}

// DELETAR CURSO
function deletarCurso(id) {
    if (confirm('Tem certeza que deseja deletar este curso?')) {
        cursos = cursos.filter(c => c.id !== id);
        salvarDados();
        renderizarCursos();
        atualizarEstatisticas();
        mostrarNotificacao('🗑️ Curso deletado com sucesso!');
    }
}

// EDITAR CURSO
function editarCurso(id) {
    const curso = cursos.find(c => c.id === id);
    if (!curso) return;

    document.getElementById('nomeCurso').value = curso.nome;
    
    // Verificar se é categoria padrão ou personalizada
    const categoriasFixas = ['Programação', 'Design', 'Marketing', 'Idiomas', 'Negócios', 'Dados'];
    
    if (categoriasFixas.includes(curso.categoria)) {
        document.getElementById('categoria').value = curso.categoria;
        document.getElementById('categoriaCustom').style.display = 'none';
    } else {
        document.getElementById('categoria').value = 'Outros';
        document.getElementById('categoriaCustom').style.display = 'block';
        document.getElementById('categoriaCustom').value = curso.categoria;
    }
    
    document.getElementById('status').value = curso.status;
    document.getElementById('progresso').value = curso.progresso;
    document.getElementById('anotacoes').value = curso.anotacoes;
    
    // Carregar videoaulas
    videoaulasTemp = curso.videoaulas ? [...curso.videoaulas] : [];
    renderizarVideoaulasTemp();

    cursos = cursos.filter(c => c.id !== id);
    salvarDados();

    showSection('adicionar');
    mostrarNotificacao('✏️ Editando curso...');
}

// Atualizar progresso do curso e refletir na trilha
function atualizarProgressoCurso(id, novoStatus) {
    const curso = cursos.find(c => c.id === id);
    if (curso) {
        curso.status = novoStatus;
        curso.dataUltimaAtualizacao = new Date().toLocaleDateString('pt-BR');
        salvarDados();

        // Se tem trilha ativa, atualizar
        if (trilhaAtiva) {
            renderizarTrilhas();
        }
    }
}

// NOTIFICAÇÃO
function mostrarNotificacao(mensagem) {
    const notif = document.getElementById('notification');
    notif.textContent = mensagem;
    notif.classList.add('show');

    setTimeout(() => {
        notif.classList.remove('show');
    }, 3000);
}

// APLICAR FILTROS
function aplicarFiltros() {
    const categoriaFiltro = document.getElementById('filtrCategoria').value;
    const statusFiltro = document.getElementById('filtroStatus').value;
    const buscaFiltro = document.getElementById('filtroBusca').value.toLowerCase();

    let cursosFiltrados = cursos;

    if (categoriaFiltro !== 'todas') {
        cursosFiltrados = cursosFiltrados.filter(c => c.categoria === categoriaFiltro);
    }

    if (statusFiltro !== 'todos') {
        cursosFiltrados = cursosFiltrados.filter(c => c.status === statusFiltro);
    }

    if (buscaFiltro) {
        cursosFiltrados = cursosFiltrados.filter(c =>
            c.nome.toLowerCase().includes(buscaFiltro) ||
            c.anotacoes.toLowerCase().includes(buscaFiltro)
        );
    }

    renderizarCursosFiltrados(cursosFiltrados);
}

// RENDERIZAR CURSOS FILTRADOS
function renderizarCursosFiltrados(cursosFiltrados) {
    const container = document.getElementById('listaCursos');

    if (cursosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>🔍 Nenhum curso encontrado</h3>
                <p>Tente ajustar os filtros</p>
            </div>
        `;
        return;
    }

    const resultado = cursosFiltrados.length === cursos.length
        ? `Mostrando todos os <strong>${cursos.length}</strong> cursos`
        : `Encontrados <strong>${cursosFiltrados.length}</strong> de ${cursos.length} cursos`;

    container.innerHTML = `
        <div class="resultado-filtro">${resultado}</div>
        <div class="cursos-grid">${cursosFiltrados.map(curso => `
            <div class="curso-card">
                <div class="curso-header">
                    <h3>${curso.nome}</h3>
                    <span class="curso-categoria">${curso.categoria}</span>
                </div>
                
                <span class="curso-status status-${curso.status}">${formatarStatus(curso.status)}</span>
                
                <div class="progress-container">
                    <div class="progress-label">
                        <span>Progresso</span>
                        <span><strong>${curso.progresso}%</strong></span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${curso.progresso}%"></div>
                    </div>
                </div>
                
                ${curso.anotacoes ? `<div class="curso-anotacoes">📝 ${curso.anotacoes}</div>` : ''}
                
                ${curso.videoaulas && curso.videoaulas.length > 0 ? `
                    <div class="curso-videos">
                        <div class="curso-videos-header">
                            <h4>🎥 Videoaulas</h4>
                            <span class="badge-videos">${curso.videoaulas.length}</span>
                        </div>
                        <div class="video-list-curso">
                            ${curso.videoaulas.slice(0, 2).map((video, idx) => `
                                <div class="video-item-curso" onclick="abrirVideoModal('${video.id}', '${curso.nome}')">
                                    <img src="${video.thumbnail}" alt="Thumb">
                                    <span>Videoaula ${idx + 1}</span>
                                </div>
                            `).join('')}
                            ${curso.videoaulas.length > 2 ? `
                                <div class="video-item-curso">
                                    <span style="color: #3b82f6; font-weight: 600;">+ Ver todas (${curso.videoaulas.length})</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <div class="curso-data">
                    📅 Iniciado em: ${curso.dataInicio}
                </div>
                
                <div class="curso-acoes">
                    <button class="btn-acao btn-editar" onclick="editarCurso(${curso.id})">✏️ Editar</button>
                    <button class="btn-acao btn-deletar" onclick="deletarCurso(${curso.id})">🗑️ Deletar</button>
                </div>
            </div>
        `).join('')}</div>
    `;
}

// LIMPAR FILTROS
function limparFiltros() {
    document.getElementById('filtrCategoria').value = 'todas';
    document.getElementById('filtroStatus').value = 'todos';
    document.getElementById('filtroBusca').value = '';
    renderizarCursos();
}

// BANCO DE DADOS DE TRILHAS
const trilhasDisponiveis = {
    'Programação': [
        {
            nome: 'Trilha Front-end Completa',
            nivel: 'iniciante',
            cor: '#3b82f6',
            descricao: 'Domine o desenvolvimento web moderno do zero ao avançado',
            cursos: [
                'HTML & CSS Fundamentos',
                'JavaScript Essencial',
                'JavaScript Avançado',
                'React.js Completo',
                'Next.js & SSR'
            ]
        },
        {
            nome: 'Trilha Back-end Node.js',
            nivel: 'intermediario',
            cor: '#10b981',
            descricao: 'Construa APIs robustas e escaláveis',
            cursos: [
                'Node.js Fundamentos',
                'Express.js & APIs REST',
                'Banco de Dados SQL',
                'MongoDB & NoSQL',
                'Microserviços & Docker'
            ]
        }
    ],
    'Design': [
        {
            nome: 'Trilha UI/UX Designer',
            nivel: 'iniciante',
            cor: '#f59e0b',
            descricao: 'Crie interfaces incríveis e experiências memoráveis',
            cursos: [
                'Fundamentos de Design',
                'Figma Completo',
                'UI Design Avançado',
                'UX Research',
                'Design System'
            ]
        }
    ],
    'Marketing': [
        {
            nome: 'Trilha Marketing Digital',
            nivel: 'iniciante',
            cor: '#ec4899',
            descricao: 'Domine as estratégias de marketing online',
            cursos: [
                'Marketing Digital Fundamentos',
                'SEO & SEM',
                'Google Ads',
                'Facebook & Instagram Ads',
                'Analytics & Métricas'
            ]
        }
    ],
    'Dados': [
        {
            nome: 'Trilha Ciência de Dados',
            nivel: 'intermediario',
            cor: '#8b5cf6',
            descricao: 'Torne-se um cientista de dados completo',
            cursos: [
                'Python para Dados',
                'Estatística & Probabilidade',
                'Pandas & NumPy',
                'Machine Learning',
                'Deep Learning'
            ]
        }
    ]
};

// RENDERIZAR TRILHAS
function renderizarTrilhas() {
    renderizarRecomendacoes();
    renderizarTrilhasCompletas();
}

// RECOMENDAÇÕES PERSONALIZADAS
function renderizarRecomendacoes() {
    const container = document.getElementById('recomendacoesPessoais');

    if (cursos.length === 0) {
        container.innerHTML = `
            <div class="empty-trilhas">
                <p>📚 Adicione alguns cursos para receber recomendações personalizadas!</p>
            </div>
        `;
        return;
    }

    const categorias = {};
    cursos.forEach(curso => {
        categorias[curso.categoria] = (categorias[curso.categoria] || 0) + 1;
    });

    const recomendacoes = [];

    for (let categoria in categorias) {
        const sugestoes = gerarSugestoesPorCategoria(categoria);
        recomendacoes.push(...sugestoes);
    }

    if (recomendacoes.length === 0) {
        container.innerHTML = '<p style="color:#6b7280;">Nenhuma recomendação disponível no momento.</p>';
        return;
    }

    container.innerHTML = `
        <div class="recomendacoes-grid">
            ${recomendacoes.slice(0, 6).map(rec => `
                <div class="recomendacao-card">
                    <h4>${rec.nome}</h4>
                    <p>${rec.descricao}</p>
                    <span class="recomendacao-tag">${rec.categoria}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// GERAR SUGESTÕES POR CATEGORIA
function gerarSugestoesPorCategoria(categoria) {
    const sugestoesPorCategoria = {
        'Programação': [
            { nome: 'TypeScript Avançado', descricao: 'Leve seu JavaScript para o próximo nível', categoria: 'Programação' },
            { nome: 'GraphQL APIs', descricao: 'Alternativa moderna ao REST', categoria: 'Programação' },
            { nome: 'Vue.js 3', descricao: 'Framework progressivo e intuitivo', categoria: 'Programação' }
        ],
        'Design': [
            { nome: 'Prototipagem Avançada', descricao: 'Crie protótipos interativos', categoria: 'Design' },
            { nome: 'Motion Design', descricao: 'Animações e microinterações', categoria: 'Design' },
            { nome: 'Design Thinking', descricao: 'Metodologia de inovação', categoria: 'Design' }
        ],
        'Marketing': [
            { nome: 'Growth Hacking', descricao: 'Estratégias de crescimento acelerado', categoria: 'Marketing' },
            { nome: 'Email Marketing', descricao: 'Automações e conversões', categoria: 'Marketing' },
            { nome: 'Copywriting', descricao: 'Escreva textos que vendem', categoria: 'Marketing' }
        ],
        'Dados': [
            { nome: 'Big Data', descricao: 'Processe grandes volumes de dados', categoria: 'Dados' },
            { nome: 'Data Visualization', descricao: 'Conte histórias com dados', categoria: 'Dados' },
            { nome: 'SQL Avançado', descricao: 'Queries complexas e otimização', categoria: 'Dados' }
        ]
    };

    return sugestoesPorCategoria[categoria] || [];
}

// RENDERIZAR TRILHAS COMPLETAS
// RENDERIZAR TRILHAS COMPLETAS
function renderizarTrilhasCompletas() {
    const container = document.getElementById('trilhasCompletas');

    // Carregar trilha ativa
    carregarTrilhaAtiva();

    // Mostrar trilha ativa no topo
    if (trilhaAtiva) {
        const progressoTrilha = calcularProgressoTrilha(trilhaAtiva);
        const cursosCompletos = trilhaAtiva.cursos.filter(nomeCurso => {
            return cursos.some(c =>
                c.nome.toLowerCase().includes(nomeCurso.toLowerCase().split(' ')[0]) &&
                c.status === 'concluido'
            );
        }).length;

        container.innerHTML = `
            <div class="trilha-ativa-box">
                <div class="trilha-ativa-header">
                    <div>
                        <h3>🎯 Sua Trilha Ativa</h3>
                        <h2 style="color: ${trilhaAtiva.cor}; margin: 10px 0;">${trilhaAtiva.nome}</h2>
                        <p style="color: #6b7280;">Iniciada em: ${trilhaAtiva.dataInicio}</p>
                    </div>
                    <button class="btn-abandonar" onclick="abandonarTrilha()">🚪 Abandonar</button>
                </div>
                
                <div class="progress-trilha">
                    <div class="progress-info">
                        <span>Progresso Geral</span>
                        <span><strong>${progressoTrilha}%</strong> (${cursosCompletos}/${trilhaAtiva.cursos.length} cursos)</span>
                    </div>
                    <div class="progress-bar" style="height: 20px;">
                        <div class="progress-fill" style="width: ${progressoTrilha}%; background: ${trilhaAtiva.cor};"></div>
                    </div>
                </div>
                
                ${renderizarCursosTrilha(trilhaAtiva)}
                
                ${progressoTrilha === 100 ? `
                    <div class="trilha-concluida">
                        <h3>🎉 Parabéns! Você completou esta trilha!</h3>
                        <button class="btn-iniciar-trilha" onclick="confirmarAbandonar()">✅ Finalizar Trilha</button>
                    </div>
                ` : ''}
            </div>
            
            <h3 style="margin: 40px 0 20px 0; color: #333;">📚 Outras Trilhas Disponíveis</h3>
        `;
    }

    // Pegar categorias dos cursos do usuário
    const categoriasUsuario = [...new Set(cursos.map(c => c.categoria))];

    let trilhasParaMostrar = [];

    // Se tem cursos, mostrar trilhas relacionadas
    if (categoriasUsuario.length > 0) {
        categoriasUsuario.forEach(cat => {
            if (trilhasDisponiveis[cat]) {
                trilhasParaMostrar.push(...trilhasDisponiveis[cat].map(t => ({ ...t, categoria: cat })));
            }
        });
    }

    // Se não tem cursos ou não achou trilhas, mostrar todas
    if (trilhasParaMostrar.length === 0) {
        trilhasParaMostrar = Object.entries(trilhasDisponiveis).flatMap(([cat, trilhas]) =>
            trilhas.map(t => ({ ...t, categoria: cat }))
        );
    }

    // Filtrar trilha ativa
    trilhasParaMostrar = trilhasParaMostrar.filter(t =>
        !trilhaAtiva || t.nome !== trilhaAtiva.nome
    );

    container.innerHTML += trilhasParaMostrar.map(trilha => {
        const cursosFeitos = trilha.cursos.map(nomeCurso => {
            const cursoUsuario = cursos.find(c =>
                c.nome.toLowerCase().includes(nomeCurso.toLowerCase().split(' ')[0])
            );
            return {
                nome: nomeCurso,
                status: cursoUsuario ?
                    (cursoUsuario.status === 'concluido' ? 'feito' : 'fazendo') :
                    'pendente'
            };
        });

        return `
            <div class="trilha-card" style="border-left-color: ${trilha.cor}">
                <div class="trilha-header">
                    <h4 style="color: ${trilha.cor}">${trilha.nome}</h4>
                    <span class="trilha-nivel nivel-${trilha.nivel}">
                        ${trilha.nivel === 'iniciante' ? '🟢 Iniciante' :
                trilha.nivel === 'intermediario' ? '🟡 Intermediário' :
                    '🔴 Avançado'}
                    </span>
                </div>
                
                <p class="trilha-descricao">${trilha.descricao}</p>
                
                <div class="trilha-cursos">
                    ${cursosFeitos.map((curso, index) => `
                        <div class="trilha-curso-item ${curso.status === 'feito' ? 'concluido' : ''}">
                            <div class="trilha-curso-numero">${index + 1}</div>
                            <span class="trilha-curso-nome">${curso.nome}</span>
                            <span class="trilha-curso-status status-${curso.status}">
                                ${curso.status === 'feito' ? '✓ Feito' :
                            curso.status === 'fazendo' ? '⟳ Fazendo' :
                                '○ Pendente'}
                            </span>
                        </div>
                    `).join('')}
                </div>
                
                <button class="btn-iniciar-trilha" onclick="iniciarTrilha('${trilha.nome}', '${trilha.categoria}')">
                    🎯 Seguir esta Trilha
                </button>
            </div>
        `;
    }).join('');
}

// Renderizar cursos da trilha ativa
// Renderizar cursos da trilha ativa
function renderizarCursosTrilha(trilha) {
    const cursosFeitos = trilha.cursos.map(nomeCurso => {
        const cursoUsuario = cursos.find(c =>
            c.nome.toLowerCase().includes(nomeCurso.toLowerCase().split(' ')[0])
        );

        // Determinar status correto
        let status = 'pendente';
        if (cursoUsuario) {
            if (cursoUsuario.status === 'concluido') {
                status = 'feito';
            } else if (cursoUsuario.status === 'em-andamento') {
                status = 'fazendo';
            } else {
                status = 'adicionado'; // não-iniciado ou pausado
            }
        }

        return {
            nome: nomeCurso,
            status: status,
            curso: cursoUsuario
        };
    });

    return `
        <div class="trilha-cursos-ativa">
            ${cursosFeitos.map((item, index) => `
                <div class="curso-trilha-item ${item.status}">
                    <div class="curso-trilha-numero">${index + 1}</div>
                    <div class="curso-trilha-info">
                        <h4>${item.nome}</h4>
                        <span class="curso-trilha-status status-${item.status}">
                            ${item.status === 'feito' ? '✅ Concluído' :
            item.status === 'fazendo' ? '🔄 Em Andamento' :
                item.status === 'adicionado' ? '📌 Adicionado' :
                    '⭕ Não Iniciado'}
                        </span>
                    </div>
                    ${item.status === 'pendente' ? `
                        <button class="btn-add-curso" onclick="adicionarCursoDaTrilha('${item.nome}', '${trilha.categoria}')">
                            ➕ Adicionar
                        </button>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

// SISTEMA DE TRILHAS GUIADAS
let trilhaAtiva = null;

// Carregar trilha ativa
function carregarTrilhaAtiva() {
    if (!usuarioAtual) return;

    const chave = `trilha_ativa_${usuarioAtual}`;
    const dados = localStorage.getItem(chave);

    if (dados) {
        trilhaAtiva = JSON.parse(dados);
    }
}

// Salvar trilha ativa
function salvarTrilhaAtiva() {
    if (!usuarioAtual) return;

    const chave = `trilha_ativa_${usuarioAtual}`;

    if (trilhaAtiva) {
        localStorage.setItem(chave, JSON.stringify(trilhaAtiva));
    } else {
        localStorage.removeItem(chave);
    }
}

// Iniciar trilha
function iniciarTrilha(nomeTrilha, categoria) {
    // Buscar trilha completa
    const trilha = trilhasDisponiveis[categoria]?.find(t => t.nome === nomeTrilha);

    if (!trilha) {
        mostrarNotificacao('❌ Trilha não encontrada!');
        return;
    }

    // Verificar se já tem trilha ativa
    if (trilhaAtiva) {
        if (!confirm(`Você já está seguindo "${trilhaAtiva.nome}". Deseja trocar de trilha?`)) {
            return;
        }
    }

    // Ativar trilha
    trilhaAtiva = {
        nome: trilha.nome,
        categoria: categoria,
        nivel: trilha.nivel,
        cor: trilha.cor,
        descricao: trilha.descricao,
        cursos: trilha.cursos,
        dataInicio: new Date().toLocaleDateString('pt-BR')
    };

    salvarTrilhaAtiva();
    renderizarTrilhas();

    mostrarNotificacao(`🎯 Trilha "${trilha.nome}" iniciada!`);

    // Perguntar se quer adicionar primeiro curso
    setTimeout(() => {
        const primeiroCurso = trilha.cursos[0];
        const jaTemCurso = cursos.some(c =>
            c.nome.toLowerCase().includes(primeiroCurso.toLowerCase().split(' ')[0])
        );

        if (!jaTemCurso) {
            if (confirm(`Deseja adicionar o primeiro curso da trilha: "${primeiroCurso}"?`)) {
                adicionarCursoDaTrilha(primeiroCurso, categoria);
            }
        }
    }, 1000);
}

// Adicionar curso da trilha automaticamente
// Adicionar curso da trilha automaticamente
function adicionarCursoDaTrilha(nomeCurso, categoria) {
    const curso = {
        id: Date.now(),
        nome: nomeCurso,
        categoria: categoria,
        status: 'nao-iniciado',
        progresso: 0,
        anotacoes: `Parte da trilha: ${trilhaAtiva.nome}`,
        dataInicio: new Date().toLocaleDateString('pt-BR'),
        dataUltimaAtualizacao: new Date().toLocaleDateString('pt-BR')
    };

    cursos.push(curso);
    salvarDados();
    atualizarEstatisticas();

    // ATUALIZAR A TRILHA EM TEMPO REAL
    renderizarTrilhas();

    mostrarNotificacao(`📚 Curso "${nomeCurso}" adicionado!`);
}

// Abandonar trilha
function abandonarTrilha() {
    if (!trilhaAtiva) return;

    const modal = `
        <div class="modal-overlay" id="modalAbandonarTrilha" style="display:flex;">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>⚠️ Abandonar Trilha</h3>
                </div>
                <div class="modal-body">
                    <p>Deseja realmente abandonar a trilha "${trilhaAtiva.nome}"?</p>
                    <p class="modal-info">Seus cursos já adicionados não serão removidos.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal btn-cancelar" onclick="fecharModalAbandonar()">Cancelar</button>
                    <button class="btn-modal btn-confirmar" onclick="confirmarAbandonar()">Sim, Abandonar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);

}

function fecharModalAbandonar() {
    const modal = document.getElementById('modalAbandonarTrilha');
    if (modal) modal.remove();
}

function confirmarAbandonar() {
    trilhaAtiva = null;
    salvarTrilhaAtiva();
    fecharModalAbandonar();
    renderizarTrilhas();
    mostrarNotificacao('🚪 Trilha abandonada!');
}

// Calcular progresso da trilha
function calcularProgressoTrilha(trilha) {
    let cursosCompletos = 0;

    trilha.cursos.forEach(nomeCurso => {
        const cursoUsuario = cursos.find(c =>
            c.nome.toLowerCase().includes(nomeCurso.toLowerCase().split(' ')[0]) &&
            c.status === 'concluido'
        );
        if (cursoUsuario) cursosCompletos++;
    });

    return Math.round((cursosCompletos / trilha.cursos.length) * 100);
}

// DARK MODE
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);

    // Salvar preferência
    if (usuarioAtual) {
        localStorage.setItem(`theme_${usuarioAtual}`, newTheme);
    }

    // Atualizar botão
    atualizarBotaoTheme(newTheme);

    // Notificação
    const mensagem = newTheme === 'dark' ? '🌙 Modo escuro ativado' : '☀️ Modo claro ativado';
    mostrarNotificacao(mensagem);
}

function atualizarBotaoTheme(theme) {
    const btn = document.getElementById('btnTheme');
    if (!btn) return;

    const icon = btn.querySelector('.theme-icon');
    const text = btn.querySelector('.theme-text');

    if (theme === 'dark') {
        icon.textContent = '☀️';
        text.textContent = 'Modo Claro';
    } else {
        icon.textContent = '🌙';
        text.textContent = 'Modo Escuro';
    }
}

function carregarTemaPreferido() {
    if (!usuarioAtual) return;

    const themeSalvo = localStorage.getItem(`theme_${usuarioAtual}`);

    if (themeSalvo) {
        document.documentElement.setAttribute('data-theme', themeSalvo);
        atualizarBotaoTheme(themeSalvo);
    }
}

// GRÁFICOS
let graficoCategoriasChart = null;
let graficoStatusChart = null;
let graficoProgressoChart = null;

function atualizarGraficos() {
    if (cursos.length === 0) {
        destruirGraficos();
        return;
    }

    criarGraficoCategorias();
    criarGraficoStatus();
    criarGraficoProgresso();
}

function destruirGraficos() {
    if (graficoCategoriasChart) {
        graficoCategoriasChart.destroy();
        graficoCategoriasChart = null;
    }
    if (graficoStatusChart) {
        graficoStatusChart.destroy();
        graficoStatusChart = null;
    }
    if (graficoProgressoChart) {
        graficoProgressoChart.destroy();
        graficoProgressoChart = null;
    }
}

// GRÁFICO DE CATEGORIAS (Pizza)
function criarGraficoCategorias() {
    const ctx = document.getElementById('graficoCategorias');
    if (!ctx) return;

    // Contar cursos por categoria
    const categorias = {};
    cursos.forEach(curso => {
        categorias[curso.categoria] = (categorias[curso.categoria] || 0) + 1;
    });

    const labels = Object.keys(categorias);
    const data = Object.values(categorias);

    const cores = [
        '#3b82f6', '#10b981', '#f59e0b', '#ec4899',
        '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
    ];

    if (graficoCategoriasChart) {
        graficoCategoriasChart.destroy();
    }

    graficoCategoriasChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: cores,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        },
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-primary').trim()
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// GRÁFICO DE STATUS (Pizza)
function criarGraficoStatus() {
    const ctx = document.getElementById('graficoStatus');
    if (!ctx) return;

    const statusCount = {
        'Não Iniciado': cursos.filter(c => c.status === 'nao-iniciado').length,
        'Em Andamento': cursos.filter(c => c.status === 'em-andamento').length,
        'Pausado': cursos.filter(c => c.status === 'pausado').length,
        'Concluído': cursos.filter(c => c.status === 'concluido').length
    };

    // Filtrar apenas status com cursos
    const labels = [];
    const data = [];
    const cores = [];

    const coresStatus = {
        'Não Iniciado': '#94a3b8',
        'Em Andamento': '#3b82f6',
        'Pausado': '#f59e0b',
        'Concluído': '#10b981'
    };

    Object.entries(statusCount).forEach(([status, count]) => {
        if (count > 0) {
            labels.push(status);
            data.push(count);
            cores.push(coresStatus[status]);
        }
    });

    if (graficoStatusChart) {
        graficoStatusChart.destroy();
    }

    graficoStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: cores,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        },
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-primary').trim()
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// GRÁFICO DE PROGRESSO (Barras Horizontais)
function criarGraficoProgresso() {
    const ctx = document.getElementById('graficoProgresso');
    if (!ctx) return;

    // Pegar top 10 cursos ou todos se forem menos
    const cursosOrdenados = [...cursos]
        .sort((a, b) => b.progresso - a.progresso)
        .slice(0, 10);

    const labels = cursosOrdenados.map(c =>
        c.nome.length > 25 ? c.nome.substring(0, 25) + '...' : c.nome
    );
    const data = cursosOrdenados.map(c => c.progresso);

    // Cores baseadas no progresso
    const cores = data.map(progresso => {
        if (progresso === 100) return '#10b981';
        if (progresso >= 70) return '#3b82f6';
        if (progresso >= 40) return '#f59e0b';
        return '#ef4444';
    });

    if (graficoProgressoChart) {
        graficoProgressoChart.destroy();
    }

    graficoProgressoChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Progresso (%)',
                data: data,
                backgroundColor: cores,
                borderRadius: 6,
                barThickness: 30
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Progresso: ${context.parsed.x}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        },
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--border-color').trim()
                    }
                },
                y: {
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-primary').trim(),
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Atualizar gráficos ao trocar tema
const originalToggleTheme = toggleTheme;
toggleTheme = function () {
    originalToggleTheme();
    setTimeout(() => {
        atualizarGraficos();
    }, 100);
};

// EXPORTAR/IMPORTAR DADOS

// Exportar dados para JSON
function exportarDados() {
    if (cursos.length === 0) {
        mostrarNotificacao('❌ Nenhum curso para exportar!');
        return;
    }

    const dados = {
        usuario: usuarioAtual,
        cursos: cursos,
        trilhaAtiva: trilhaAtiva,
        dataExportacao: new Date().toISOString(),
        versao: '1.0'
    };

    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-cursos-${usuarioAtual}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarNotificacao('✅ Backup baixado com sucesso!');
}

function exportarPDF() {
    if (!cursos || cursos.length === 0) {
        mostrarNotificacao('Nenhum curso para exportar!');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin + 10;

        // === CABEÇALHO FIXO EM TODAS AS PÁGINAS ===
        const addHeader = () => {
            // Fundo azul escuro
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, 35, 'F');

            // Logo/Título
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.text('Lacerdash', pageWidth / 2, 20, { align: 'center' });

            // Subtítulo
            doc.setFontSize(10);
            doc.setTextColor(148, 201, 255);
            const subtitle = `${usuarioAtual} • ${new Date().toLocaleDateString('pt-BR')} • ${cursos.length} curso${cursos.length > 1 ? 's' : ''}`;
            doc.text(subtitle, pageWidth / 2, 28, { align: 'center' });
        };

        // === RODAPÉ ===
        const addFooter = (pageNum, totalPages) => {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('Gerado por xAI Study Dashboard', margin, pageHeight - 8);
            doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
        };

        // === QUEBRA DE PÁGINA ===
        const checkPage = (height) => {
            if (y + height > pageHeight - 25) {
                doc.addPage();
                y = margin + 10;
                addHeader();
            }
        };

        // === INÍCIO DO PDF ===
        addHeader();

        // === ESTATÍSTICAS GERAIS (CARDS) ===
        const stats = [
            { label: 'Em Andamento', value: cursos.filter(c => c.status === 'em-andamento').length, color: [59, 130, 246] },
            { label: 'Concluídos', value: cursos.filter(c => c.status === 'concluido').length, color: [16, 185, 129] },
            { label: 'Pausados', value: cursos.filter(c => c.status === 'pausado').length, color: [251, 146, 60] },
            { label: 'Não Iniciados', value: cursos.filter(c => c.status === 'nao-iniciado').length, color: [239, 68, 68] },
            { label: 'Progresso Médio', value: `${Math.round(cursos.reduce((a, c) => a + c.progresso, 0) / cursos.length)}%`, color: [99, 102, 241] }
        ];

        checkPage(35);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('Estatísticas Gerais', margin, y);
        y += 8;

        const cardWidth = (pageWidth - margin * 2 - 16) / 5;
        let x = margin;

        stats.forEach(stat => {
            doc.setFillColor(...stat.color);
            doc.roundedRect(x, y, cardWidth, 22, 2, 2, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text(stat.label, x + cardWidth / 2, y + 8, { align: 'center' });

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(stat.value.toString(), x + cardWidth / 2, y + 16, { align: 'center' });

            x += cardWidth + 4;
        });
        y += 32;

        // === PROGRESSO MÉDIO (BARRA) ===
        const progressoMedio = Math.round(cursos.reduce((a, c) => a + c.progresso, 0) / cursos.length);
        checkPage(20);
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text('Progresso Médio Geral', margin, y);
        y += 7;

        doc.setFillColor(226, 232, 240);
        doc.rect(margin, y, 140, 10, 'F');
        doc.setFillColor(59, 130, 246);
        doc.rect(margin, y, (140 * progressoMedio) / 100, 10, 'F');

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.text(`${progressoMedio}%`, margin + 145, y + 7);
        y += 20;

        // === CATEGORIAS (LISTA ESTILIZADA) ===
        const categorias = {};
        cursos.forEach(c => {
            categorias[c.categoria] = (categorias[c.categoria] || 0) + 1;
        });

        checkPage(15 + Object.keys(categorias).length * 6);
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('Cursos por Categoria', margin, y);
        y += 8;

        doc.setFontSize(10);
        Object.entries(categorias).forEach(([cat, qtd]) => {
            const percent = Math.round((qtd / cursos.length) * 100);
            doc.setTextColor(71, 85, 105);
            doc.text(`• ${cat}`, margin, y);
            doc.setTextColor(59, 130, 246);
            doc.text(`${qtd} curso${qtd > 1 ? 's' : ''} (${percent}%)`, margin + 50, y);
            y += 6;
        });
        y += 10;

        // === LISTA DE CURSOS (TABELA) ===
        checkPage(40);
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('Lista Detalhada de Cursos', margin, y);
        y += 10;

        const headers = ['#', 'Curso', 'Categoria', 'Status', 'Progresso', 'Início', 'Notas'];
        const colWidths = [10, 45, 23, 23, 30, 30, 35];
        let startY = y;

        // Cabeçalho da tabela
        doc.setFillColor(241, 245, 249);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        let xHeader = margin;
        headers.forEach((h, i) => {
            doc.rect(xHeader, y, colWidths[i], 8, 'F');
            doc.text(h, xHeader + 2, y + 5.5);
            xHeader += colWidths[i];
        });
        y += 8;

        // Linhas
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        cursos.forEach((curso, i) => {
            checkPage(12 + (curso.anotacoes ? 8 : 0));

            // Cor alternada
            if (i % 2 === 1) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
            }

            let x = margin;
            const statusClean = formatarStatus(curso.status).replace(/[🔄✅⏸️⭕]/g, '').trim();

            // Dados
            doc.setTextColor(71, 85, 105);
            doc.text((i + 1).toString(), x + 2, y + 6); x += colWidths[0];

            doc.setTextColor(30, 41, 59);
            const nomeLines = doc.splitTextToSize(curso.nome, colWidths[1] - 4);
            doc.text(nomeLines, x + 2, y + 6);
            x += colWidths[1];

            doc.setTextColor(71, 85, 105);
            doc.text(curso.categoria, x + 2, y + 6); x += colWidths[2];
            doc.text(statusClean, x + 2, y + 6); x += colWidths[3];

            // === PROGRESSO (CORRIGIDO - SEM SOBREPOSIÇÃO) ===
            doc.setFillColor(226, 232, 240);
            doc.rect(x + 2, y + 3, 15, 4, 'F'); // fundo da barra
            doc.setFillColor(59, 130, 246);
            doc.rect(x + 2, y + 3, (15 * curso.progresso) / 100, 4, 'F'); // barra preenchida

            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(`${curso.progresso}%`, x + 20, y + 6); // 20 ao invés de 18
            doc.setFontSize(8.5); // volta ao normal
            x += colWidths[4]; // avança para a próxima coluna

            // === INÍCIO ===
            doc.setTextColor(71, 85, 105);
            doc.text(curso.dataInicio, x + 2, y + 6);
            x += colWidths[5];

            // === ANOTAÇÕES ===
            if (curso.anotacoes) {
                const notas = doc.splitTextToSize(curso.anotacoes, colWidths[6] - 4);
                doc.text(notas, x + 2, y + 6);
            }
            y += 10;
        });

        // === RODAPÉS EM TODAS AS PÁGINAS ===
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addFooter(i, totalPages);
        }

        // === SALVAR ===
        const filename = `relatorio-estudos-${usuarioAtual}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        mostrarNotificacao('Relatório gerado com sucesso!');

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        mostrarNotificacao('Erro ao gerar PDF. Verifique o console.');
    }
}

// Importar dados de JSON
function importarDados(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.name.endsWith('.json')) {
        mostrarNotificacao('❌ Arquivo inválido! Use apenas .json');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const dados = JSON.parse(e.target.result);

            // Validar estrutura
            if (!dados.cursos || !Array.isArray(dados.cursos)) {
                throw new Error('Formato de arquivo inválido');
            }

            // Confirmar importação
            const confirmar = confirm(
                `Importar ${dados.cursos.length} curso(s)?\n\n` +
                `Os dados atuais serão substituídos!`
            );

            if (!confirmar) {
                document.getElementById('fileImport').value = '';
                return;
            }

            // Importar dados
            cursos = dados.cursos;

            if (dados.trilhaAtiva) {
                trilhaAtiva = dados.trilhaAtiva;
                salvarTrilhaAtiva();
            }

            salvarDados();
            atualizarEstatisticas();
            atualizarEstatisticasDados();

            mostrarNotificacao(`✅ ${dados.cursos.length} curso(s) importado(s)!`);

            // Limpar input
            document.getElementById('fileImport').value = '';

        } catch (error) {
            console.error('Erro ao importar:', error);
            mostrarNotificacao('❌ Erro ao importar arquivo!');
            document.getElementById('fileImport').value = '';
        }
    };

    reader.onerror = function () {
        mostrarNotificacao('❌ Erro ao ler arquivo!');
        document.getElementById('fileImport').value = '';
    };

    reader.readAsText(file);
}

// Confirmar limpeza de dados
function confirmarLimparDados() {
    const modal = `
        <div class="modal-overlay" id="modalLimparDados" style="display:flex;">
            <div class="modal-container">
                <div class="modal-header" style="background: #ef4444;">
                    <h3>⚠️ Confirmar Limpeza</h3>
                </div>
                <div class="modal-body">
                    <p><strong>ATENÇÃO:</strong> Esta ação é irreversível!</p>
                    <p>Todos os seus ${cursos.length} curso(s) serão permanentemente removidos.</p>
                    <p class="modal-info">Recomendamos fazer um backup antes de continuar.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal btn-cancelar" onclick="fecharModalLimpar()">Cancelar</button>
                    <button class="btn-modal btn-confirmar" onclick="limparTodosDados()">Sim, Limpar Tudo</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

function fecharModalLimpar() {
    const modal = document.getElementById('modalLimparDados');
    if (modal) modal.remove();
}

function limparTodosDados() {
    // Limpar cursos
    cursos = [];
    salvarDados();

    // Limpar trilha
    trilhaAtiva = null;
    salvarTrilhaAtiva();

    // Limpar tema
    if (usuarioAtual) {
        localStorage.removeItem(`theme_${usuarioAtual}`);
    }

    fecharModalLimpar();
    atualizarEstatisticas();
    atualizarEstatisticasDados();

    mostrarNotificacao('🗑️ Todos os dados foram removidos!');
}

// Atualizar estatísticas da página de dados
function atualizarEstatisticasDados() {
    document.getElementById('statTotalCursos').textContent = cursos.length;

    // Calcular tamanho dos dados
    const dadosString = JSON.stringify({ cursos, trilhaAtiva });
    const tamanhoKB = (new Blob([dadosString]).size / 1024).toFixed(2);
    document.getElementById('statTamanhoDados').textContent = tamanhoKB + ' KB';

    // Última atualização
    if (cursos.length > 0) {
        const ultimaData = cursos.reduce((latest, curso) => {
            const data = new Date(curso.dataUltimaAtualizacao.split('/').reverse().join('-'));
            return data > latest ? data : latest;
        }, new Date(0));

        document.getElementById('statUltimaAtualizacao').textContent =
            ultimaData.toLocaleDateString('pt-BR');
    } else {
        document.getElementById('statUltimaAtualizacao').textContent = '-';
    }
}

// Atualizar estatísticas ao entrar na aba
const originalShowSection = showSection;
showSection = function (sectionId) {
    originalShowSection.call(this, sectionId);

    if (sectionId === 'dados') {
        atualizarEstatisticasDados();
    }
};

// POMODORO TIMER
let timerInterval = null;
let tempoRestante = 25 * 60; // segundos
let modoAtual = 'pomodoro';
let timerAtivo = false;
let sessoesHoje = 0;
let tempoTotalHoje = 0;
let historicoHoje = [];

// Configurações padrão
let configPomodoro = {
    pomodoro: 25,
    pausaCurta: 5,
    pausaLonga: 15,
    autoIniciarPausas: false,
    notificacoesSom: true
};

// Carregar configurações ao entrar na aba
function carregarPomodoro() {
    if (!usuarioAtual) return;

    // Carregar configurações
    const configSalva = localStorage.getItem(`pomodoro_config_${usuarioAtual}`);
    if (configSalva) {
        configPomodoro = JSON.parse(configSalva);
        document.getElementById('duracaoPomodoro').value = configPomodoro.pomodoro;
        document.getElementById('duracaoPausaCurta').value = configPomodoro.pausaCurta;
        document.getElementById('duracaoPausaLonga').value = configPomodoro.pausaLonga;
        document.getElementById('autoIniciarPausas').checked = configPomodoro.autoIniciarPausas;
        document.getElementById('notificacoesSom').checked = configPomodoro.notificacoesSom;
    }

    // Carregar dados do dia
    const dadosHoje = localStorage.getItem(`pomodoro_hoje_${usuarioAtual}_${new Date().toDateString()}`);
    if (dadosHoje) {
        const dados = JSON.parse(dadosHoje);
        sessoesHoje = dados.sessoes || 0;
        tempoTotalHoje = dados.tempo || 0;
        historicoHoje = dados.historico || [];
    }

    atualizarDisplayPomodoro();
    renderizarHistorico();
}

function salvarConfiguracoes() {
    configPomodoro = {
        pomodoro: parseInt(document.getElementById('duracaoPomodoro').value),
        pausaCurta: parseInt(document.getElementById('duracaoPausaCurta').value),
        pausaLonga: parseInt(document.getElementById('duracaoPausaLonga').value),
        autoIniciarPausas: document.getElementById('autoIniciarPausas').checked,
        notificacoesSom: document.getElementById('notificacoesSom').checked
    };

    localStorage.setItem(`pomodoro_config_${usuarioAtual}`, JSON.stringify(configPomodoro));

    // Resetar timer se não estiver ativo
    if (!timerAtivo) {
        resetarTimer();
    }
}

function selecionarModo(modo) {
    if (timerAtivo) return;

    modoAtual = modo;

    // Atualizar botões
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${modo}"]`).classList.add('active');

    // Definir tempo
    if (modo === 'pomodoro') {
        tempoRestante = configPomodoro.pomodoro * 60;
    } else if (modo === 'pausa-curta') {
        tempoRestante = configPomodoro.pausaCurta * 60;
    } else {
        tempoRestante = configPomodoro.pausaLonga * 60;
    }

    atualizarDisplayPomodoro();
}

function iniciarTimer() {
    timerAtivo = true;
    document.getElementById('btnStart').style.display = 'none';
    document.getElementById('btnPause').style.display = 'inline-block';

    timerInterval = setInterval(() => {
        tempoRestante--;

        if (tempoRestante <= 0) {
            finalizarSessao();
        }

        atualizarDisplayPomodoro();
    }, 1000);
}

function pausarTimer() {
    timerAtivo = false;
    clearInterval(timerInterval);
    document.getElementById('btnStart').style.display = 'inline-block';
    document.getElementById('btnPause').style.display = 'none';
}

function resetarTimer() {
    pausarTimer();

    if (modoAtual === 'pomodoro') {
        tempoRestante = configPomodoro.pomodoro * 60;
    } else if (modoAtual === 'pausa-curta') {
        tempoRestante = configPomodoro.pausaCurta * 60;
    } else {
        tempoRestante = configPomodoro.pausaLonga * 60;
    }

    atualizarDisplayPomodoro();
}

function finalizarSessao() {
    pausarTimer();

    // Adicionar ao histórico
    const duracao = modoAtual === 'pomodoro' ? configPomodoro.pomodoro :
        modoAtual === 'pausa-curta' ? configPomodoro.pausaCurta :
            configPomodoro.pausaLonga;

    historicoHoje.push({
        tipo: modoAtual,
        duracao: duracao,
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    // Atualizar contadores
    if (modoAtual === 'pomodoro') {
        sessoesHoje++;
        tempoTotalHoje += duracao;
    }

    // Salvar dados
    salvarDadosPomodoro();

    // Notificação
    if (configPomodoro.notificacoesSom) {
        // Som de notificação (beep simples)
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const gainNode = audio.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audio.destination);
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
    }

    const mensagens = {
        'pomodoro': '🎉 Pomodoro concluído! Hora de uma pausa!',
        'pausa-curta': '✅ Pausa concluída! Vamos voltar ao foco!',
        'pausa-longa': '✅ Pausa longa concluída! Pronto para mais?'
    };

    mostrarNotificacao(mensagens[modoAtual]);

    // Auto-iniciar próximo modo
    if (configPomodoro.autoIniciarPausas) {
        setTimeout(() => {
            if (modoAtual === 'pomodoro') {
                selecionarModo(sessoesHoje % 4 === 0 ? 'pausa-longa' : 'pausa-curta');
            } else {
                selecionarModo('pomodoro');
            }
            iniciarTimer();
        }, 2000);
    } else {
        // Sugerir próximo modo
        if (modoAtual === 'pomodoro') {
            selecionarModo(sessoesHoje % 4 === 0 ? 'pausa-longa' : 'pausa-curta');
        } else {
            selecionarModo('pomodoro');
        }
    }

    renderizarHistorico();
}

function atualizarDisplayPomodoro() {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;

    document.getElementById('timerDisplay').textContent =
        `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

    document.getElementById('sessoesCompletas').textContent = sessoesHoje;

    const horas = Math.floor(tempoTotalHoje / 60);
    const mins = tempoTotalHoje % 60;
    document.getElementById('tempoTotalHoje').textContent = `${horas}h ${mins}min`;

    // Atualizar título da página
    if (timerAtivo) {
        document.title = `${minutos}:${segundos.toString().padStart(2, '0')} - Pomodoro`;
    } else {
        document.title = 'Lacerdash';
    }
}

function salvarDadosPomodoro() {
    const dados = {
        sessoes: sessoesHoje,
        tempo: tempoTotalHoje,
        historico: historicoHoje
    };

    localStorage.setItem(
        `pomodoro_hoje_${usuarioAtual}_${new Date().toDateString()}`,
        JSON.stringify(dados)
    );
}

function renderizarHistorico() {
    const container = document.getElementById('historicoLista');

    if (historicoHoje.length === 0) {
        container.innerHTML = '<div class="historico-vazio">Nenhuma sessão hoje ainda</div>';
        return;
    }

    container.innerHTML = historicoHoje.slice().reverse().map(item => {
        const emoji = item.tipo === 'pomodoro' ? '🍅' : item.tipo === 'pausa-curta' ? '☕' : '🌴';
        const nome = item.tipo === 'pomodoro' ? 'Pomodoro' :
            item.tipo === 'pausa-curta' ? 'Pausa Curta' : 'Pausa Longa';

        return `
            <div class="historico-item">
                <span class="historico-tipo">${emoji} ${nome}</span>
                <span class="historico-duracao">${item.duracao} min</span>
                <span class="historico-hora">${item.hora}</span>
            </div>
        `;
    }).join('');
}

// Atualizar showSection para carregar pomodoro
const originalShowSection2 = showSection;
showSection = function (sectionId) {
    originalShowSection2.call(this, sectionId);

    if (sectionId === 'pomodoro') {
        carregarPomodoro();
    }
};

// SISTEMA DE NOTAS
let notas = [];
let notaSelecionada = null;
let modoEdicao = 'escrita'; // 'escrita' ou 'preview'

// Carregar notas
function carregarNotas() {
    if (!usuarioAtual) return;

    const chave = `notas_${usuarioAtual}`;
    const dados = localStorage.getItem(chave);

    if (dados) {
        notas = JSON.parse(dados);
    } else {
        notas = [];
    }

    renderizarListaNotas();
}

// Salvar notas
function salvarNotas() {
    if (!usuarioAtual) return;

    const chave = `notas_${usuarioAtual}`;
    localStorage.setItem(chave, JSON.stringify(notas));
}

// Criar nova nota
function criarNovaNota() {
    const novaNota = {
        id: Date.now(),
        titulo: 'Nova Nota',
        conteudo: '# Nova Nota\n\nComece a escrever aqui...',
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };

    notas.unshift(novaNota);
    salvarNotas();
    renderizarListaNotas();
    selecionarNota(novaNota.id);

    mostrarNotificacao('📝 Nova nota criada!');
}

// Selecionar nota
function selecionarNota(id) {
    notaSelecionada = notas.find(n => n.id === id);

    if (!notaSelecionada) return;

    // Atualizar lista
    document.querySelectorAll('.nota-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-nota-id="${id}"]`)?.classList.add('active');

    // Renderizar editor
    renderizarEditor();
}

// Renderizar lista de notas
function renderizarListaNotas() {
    const container = document.getElementById('listaNotas');

    if (notas.length === 0) {
        container.innerHTML = '<div class="notas-vazio">📝 Nenhuma nota ainda</div>';
        return;
    }

    container.innerHTML = notas.map(nota => {
        const data = new Date(nota.dataAtualizacao).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });

        // Preview (primeiros caracteres sem markdown)
        const preview = nota.conteudo
            .replace(/[#*`>\-\[\]]/g, '')
            .substring(0, 100);

        return `
            <div class="nota-item ${notaSelecionada?.id === nota.id ? 'active' : ''}" 
                 data-nota-id="${nota.id}"
                 onclick="selecionarNota(${nota.id})">
                <div class="nota-item-header">
                    <div class="nota-item-titulo">${nota.titulo || 'Sem título'}</div>
                    <div class="nota-item-data">${data}</div>
                </div>
                <div class="nota-item-preview">${preview}</div>
            </div>
        `;
    }).join('');
}

// Renderizar editor
function renderizarEditor() {
    const container = document.getElementById('editorNota');

    if (!notaSelecionada) {
        container.innerHTML = `
            <div class="editor-vazio">
                <div class="editor-vazio-icon">📝</div>
                <h3>Nenhuma nota selecionada</h3>
                <p>Crie uma nova nota ou selecione uma existente</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="editor-header">
            <div class="editor-tabs">
                <button class="editor-tab ${modoEdicao === 'escrita' ? 'active' : ''}" 
                        onclick="trocarModoEdicao('escrita')">
                    ✏️ Escrever
                </button>
                <button class="editor-tab ${modoEdicao === 'preview' ? 'active' : ''}" 
                        onclick="trocarModoEdicao('preview')">
                    👁️ Visualizar
                </button>
            </div>
            <div class="editor-acoes">
                <button class="btn-editor btn-salvar" onclick="salvarNotaAtual()">
                    💾 Salvar
                </button>
                <button class="btn-editor btn-deletar-nota" onclick="deletarNotaAtual()">
                    🗑️ Deletar
                </button>
            </div>
        </div>
        
        <input type="text" 
               class="editor-titulo" 
               value="${notaSelecionada.titulo}"
               placeholder="Título da nota..."
               oninput="atualizarTituloNota(this.value)"
               autocomplete="off">
        
        <div class="editor-conteudo">
            ${modoEdicao === 'escrita' ? `
                <textarea class="editor-textarea" 
                          oninput="atualizarConteudoNota(this.value)"
                          placeholder="Escreva sua nota aqui... (suporta Markdown)">${notaSelecionada.conteudo}</textarea>
                
                <div class="markdown-help">
                    <h4>💡 Dicas de Markdown:</h4>
                    <code># Título</code> • 
                    <code>**negrito**</code> • 
                    <code>*itálico*</code> • 
                    <code>\`código\`</code> • 
                    <code>- lista</code> • 
                    <code>[link](url)</code>
                </div>
            ` : `
                <div class="editor-preview">${marked.parse(notaSelecionada.conteudo)}</div>
            `}
        </div>
    `;
}

// Trocar modo de edição
function trocarModoEdicao(modo) {
    modoEdicao = modo;
    renderizarEditor();
}

// Atualizar título da nota
function atualizarTituloNota(novoTitulo) {
    if (!notaSelecionada) return;

    notaSelecionada.titulo = novoTitulo;
    notaSelecionada.dataAtualizacao = new Date().toISOString();
}

// Atualizar conteúdo da nota
function atualizarConteudoNota(novoConteudo) {
    if (!notaSelecionada) return;

    notaSelecionada.conteudo = novoConteudo;
    notaSelecionada.dataAtualizacao = new Date().toISOString();
}

// Salvar nota atual
function salvarNotaAtual() {
    if (!notaSelecionada) return;

    salvarNotas();
    renderizarListaNotas();
    mostrarNotificacao('✅ Nota salva!');
}

// Deletar nota atual
function deletarNotaAtual() {
    if (!notaSelecionada) return;

    if (!confirm(`Deletar a nota "${notaSelecionada.titulo}"?`)) return;

    notas = notas.filter(n => n.id !== notaSelecionada.id);
    salvarNotas();

    notaSelecionada = null;
    renderizarListaNotas();
    renderizarEditor();

    mostrarNotificacao('🗑️ Nota deletada!');
}

// Buscar notas
function buscarNotas() {
    const termo = document.getElementById('buscaNotas').value.toLowerCase();

    if (!termo) {
        renderizarListaNotas();
        return;
    }

    const notasFiltradas = notas.filter(nota =>
        nota.titulo.toLowerCase().includes(termo) ||
        nota.conteudo.toLowerCase().includes(termo)
    );

    const container = document.getElementById('listaNotas');

    if (notasFiltradas.length === 0) {
        container.innerHTML = '<div class="notas-vazio">🔍 Nenhuma nota encontrada</div>';
        return;
    }

    container.innerHTML = notasFiltradas.map(nota => {
        const data = new Date(nota.dataAtualizacao).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });

        const preview = nota.conteudo
            .replace(/[#*`>\-\[\]]/g, '')
            .substring(0, 100);

        return `
            <div class="nota-item ${notaSelecionada?.id === nota.id ? 'active' : ''}" 
                 data-nota-id="${nota.id}"
                 onclick="selecionarNota(${nota.id})">
                <div class="nota-item-header">
                    <div class="nota-item-titulo">${nota.titulo || 'Sem título'}</div>
                    <div class="nota-item-data">${data}</div>
                </div>
                <div class="nota-item-preview">${preview}</div>
            </div>
        `;
    }).join('');
}

// Carregar notas ao entrar na aba
const originalShowSection3 = showSection;
showSection = function (sectionId) {
    originalShowSection3.call(this, sectionId);

    if (sectionId === 'notas') {
        carregarNotas();
    }
};

// SISTEMA DE GAMIFICAÇÃO
let dadosGame = {
    xp: 0,
    nivel: 1,
    pontosTotais: 0,
    conquistasDesbloqueadas: [],
    ultimoAcesso: null,
    streakDias: 0,
    desafiosCompletos: []
};

// Conquistas disponíveis
const conquistas = [
    { id: 'primeiro_curso', nome: 'Primeiro Passo', desc: 'Adicione seu primeiro curso', icon: '🎯', xp: 50 },
    { id: 'cinco_cursos', nome: 'Colecionador', desc: 'Adicione 5 cursos', icon: '📚', xp: 100 },
    { id: 'dez_cursos', nome: 'Biblioteca', desc: 'Adicione 10 cursos', icon: '📖', xp: 200 },
    { id: 'primeiro_completo', nome: 'Conquistador', desc: 'Complete seu primeiro curso', icon: '✅', xp: 100 },
    { id: 'cinco_completos', nome: 'Dedicado', desc: 'Complete 5 cursos', icon: '🏆', xp: 250 },
    { id: 'dez_completos', nome: 'Mestre', desc: 'Complete 10 cursos', icon: '👑', xp: 500 },
    { id: 'primeira_nota', nome: 'Escritor', desc: 'Crie sua primeira nota', icon: '📝', xp: 50 },
    { id: 'cinco_notas', nome: 'Organizador', desc: 'Crie 5 notas', icon: '📑', xp: 100 },
    { id: 'primeira_trilha', nome: 'Explorador', desc: 'Inicie sua primeira trilha', icon: '🗺️', xp: 75 },
    { id: 'pomodoro_5', nome: 'Focado', desc: 'Complete 5 pomodoros', icon: '🍅', xp: 150 },
    { id: 'pomodoro_25', nome: 'Ultra Focado', desc: 'Complete 25 pomodoros', icon: '🔥', xp: 300 },
    { id: 'streak_7', nome: 'Semana Perfeita', desc: '7 dias seguidos estudando', icon: '⭐', xp: 200 },
    { id: 'streak_30', nome: 'Mês Dedicado', desc: '30 dias seguidos estudando', icon: '💎', xp: 1000 },
    { id: 'progresso_100', nome: 'Perfeccionista', desc: 'Deixe um curso em 100%', icon: '💯', xp: 150 }
];

// Desafios semanais
const desafiosSemanais = [
    { id: 'completar_2_cursos', nome: 'Finalizador', desc: 'Complete 2 cursos esta semana', meta: 2, xp: 300 },
    { id: 'adicionar_5_cursos', nome: 'Ambicioso', desc: 'Adicione 5 novos cursos', meta: 5, xp: 150 },
    { id: 'pomodoro_10', nome: 'Maratonista', desc: 'Complete 10 sessões de Pomodoro', meta: 10, xp: 250 },
    { id: 'criar_3_notas', nome: 'Documentador', desc: 'Crie 3 notas de estudo', meta: 3, xp: 100 }
];

// Carregar dados de gamificação
function carregarDadosGame() {
    if (!usuarioAtual) return;

    const chave = `gamificacao_${usuarioAtual}`;
    const dados = localStorage.getItem(chave);

    if (dados) {
        dadosGame = JSON.parse(dados);
    }

    // Verificar streak
    verificarStreak();

    // Verificar conquistas
    verificarConquistas();

    // Renderizar gamificação
    renderizarGamificacao();
}

// Salvar dados de gamificação
function salvarDadosGame() {
    if (!usuarioAtual) return;

    const chave = `gamificacao_${usuarioAtual}`;
    localStorage.setItem(chave, JSON.stringify(dadosGame));
}

// Verificar streak (dias consecutivos)
function verificarStreak() {
    const hoje = new Date().toDateString();
    const ultimo = dadosGame.ultimoAcesso;

    if (!ultimo) {
        dadosGame.streakDias = 1;
    } else {
        const diffDias = Math.floor((new Date(hoje) - new Date(ultimo)) / (1000 * 60 * 60 * 24));

        if (diffDias === 0) {
            // Mesmo dia, mantém streak
        } else if (diffDias === 1) {
            // Dia seguido, aumenta streak
            dadosGame.streakDias++;
        } else {
            // Quebrou o streak
            dadosGame.streakDias = 1;
        }
    }

    dadosGame.ultimoAcesso = hoje;
    salvarDadosGame();
}

// Adicionar XP
function adicionarXP(quantidade, motivo) {
    dadosGame.xp += quantidade;
    dadosGame.pontosTotais += quantidade;

    // Verificar level up
    while (dadosGame.xp >= calcularXPProximoNivel()) {
        dadosGame.xp -= calcularXPProximoNivel();
        dadosGame.nivel++;
        mostrarNotificacao(`🎉 Level Up! Você alcançou o nível ${dadosGame.nivel}!`);
    }

    salvarDadosGame();

    if (motivo) {
        mostrarNotificacao(`⚡ +${quantidade} XP: ${motivo}`);
    }
}

// Calcular XP necessário para próximo nível
function calcularXPProximoNivel() {
    return 100 * dadosGame.nivel;
}

// Verificar conquistas
function verificarConquistas() {
    const cursosTotal = cursos.length;
    const cursosConcluidos = cursos.filter(c => c.status === 'concluido').length;
    const notasTotal = notas?.length || 0;
    const pomodorosTotal = sessoesHoje || 0;

    // Verificar cada conquista
    conquistas.forEach(conquista => {
        // Se já desbloqueou, pular
        if (dadosGame.conquistasDesbloqueadas.includes(conquista.id)) return;

        let desbloquear = false;

        switch (conquista.id) {
            case 'primeiro_curso': desbloquear = cursosTotal >= 1; break;
            case 'cinco_cursos': desbloquear = cursosTotal >= 5; break;
            case 'dez_cursos': desbloquear = cursosTotal >= 10; break;
            case 'primeiro_completo': desbloquear = cursosConcluidos >= 1; break;
            case 'cinco_completos': desbloquear = cursosConcluidos >= 5; break;
            case 'dez_completos': desbloquear = cursosConcluidos >= 10; break;
            case 'primeira_nota': desbloquear = notasTotal >= 1; break;
            case 'cinco_notas': desbloquear = notasTotal >= 5; break;
            case 'primeira_trilha': desbloquear = trilhaAtiva !== null; break;
            case 'pomodoro_5': desbloquear = pomodorosTotal >= 5; break;
            case 'pomodoro_25': desbloquear = pomodorosTotal >= 25; break;
            case 'streak_7': desbloquear = dadosGame.streakDias >= 7; break;
            case 'streak_30': desbloquear = dadosGame.streakDias >= 30; break;
            case 'progresso_100': desbloquear = cursos.some(c => c.progresso === 100); break;
        }

        if (desbloquear) {
            desbloquearConquista(conquista);
        }
    });
}

// Desbloquear conquista
function desbloquearConquista(conquista) {
    dadosGame.conquistasDesbloqueadas.push(conquista.id);
    adicionarXP(conquista.xp, null);

    mostrarNotificacao(`🏆 Conquista Desbloqueada: ${conquista.nome}! (+${conquista.xp} XP)`);

    salvarDadosGame();
    renderizarGamificacao();
}

// Renderizar gamificação
function renderizarGamificacao() {
    // Perfil
    document.getElementById('avatarNivel').textContent = dadosGame.nivel;
    document.getElementById('perfilNome').textContent = obterTituloNivel();
    document.getElementById('nivelAtual').textContent = dadosGame.nivel;
    document.getElementById('xpAtual').textContent = dadosGame.xp;
    document.getElementById('xpProximo').textContent = calcularXPProximoNivel();

    const porcentagemXP = (dadosGame.xp / calcularXPProximoNivel()) * 100;
    document.getElementById('xpFill').style.width = porcentagemXP + '%';

    // Stats
    document.getElementById('streakDias').textContent = dadosGame.streakDias;
    document.getElementById('totalBadges').textContent = dadosGame.conquistasDesbloqueadas.length;
    document.getElementById('totalPontos').textContent = dadosGame.pontosTotais;

    // Conquistas
    renderizarConquistas();

    // Rankings
    renderizarRankings();

    // Desafios
    renderizarDesafios();
}

// Obter título baseado no nível
function obterTituloNivel() {
    if (dadosGame.nivel < 5) return 'Iniciante';
    if (dadosGame.nivel < 10) return 'Aprendiz';
    if (dadosGame.nivel < 15) return 'Estudante';
    if (dadosGame.nivel < 20) return 'Dedicado';
    if (dadosGame.nivel < 30) return 'Expert';
    if (dadosGame.nivel < 50) return 'Mestre';
    return 'Lenda';
}

// Renderizar conquistas
function renderizarConquistas() {
    const container = document.getElementById('conquistasGrid');

    container.innerHTML = conquistas.map(conquista => {
        const desbloqueada = dadosGame.conquistasDesbloqueadas.includes(conquista.id);

        return `
            <div class="conquista-card ${desbloqueada ? 'desbloqueada' : 'bloqueada'}">
                ${desbloqueada ? '<div class="conquista-badge">✓</div>' : ''}
                <div class="conquista-icon">${conquista.icon}</div>
                <div class="conquista-nome">${conquista.nome}</div>
                <div class="conquista-desc">${conquista.desc}</div>
            </div>
        `;
    }).join('');
}

// Renderizar rankings
function renderizarRankings() {
    const concluidos = cursos.filter(c => c.status === 'concluido').length;
    const tempoTotal = tempoTotalHoje || 0;
    const progressoMedio = cursos.length > 0
        ? Math.round(cursos.reduce((acc, c) => acc + c.progresso, 0) / cursos.length)
        : 0;

    document.getElementById('rankingCursos').textContent = concluidos;
    document.getElementById('rankingTempo').textContent = Math.floor(tempoTotal / 60) + 'h';
    document.getElementById('rankingTaxa').textContent = progressoMedio + '%';
}

// Renderizar desafios
function renderizarDesafios() {
    const container = document.getElementById('desafiosLista');

    container.innerHTML = desafiosSemanais.map(desafio => {
        let progresso = 0;

        switch (desafio.id) {
            case 'completar_2_cursos':
                progresso = cursos.filter(c => c.status === 'concluido').length;
                break;
            case 'adicionar_5_cursos':
                progresso = cursos.length;
                break;
            case 'pomodoro_10':
                progresso = sessoesHoje || 0;
                break;
            case 'criar_3_notas':
                progresso = notas?.length || 0;
                break;
        }

        progresso = Math.min(progresso, desafio.meta);
        const porcentagem = (progresso / desafio.meta) * 100;
        const completo = progresso >= desafio.meta;

        return `
            <div class="desafio-card ${completo ? 'desafio-completo' : ''}">
                <div class="desafio-info">
                    <div class="desafio-titulo">
                        ${completo ? '✅' : '🎯'} ${desafio.nome}
                    </div>
                    <div class="desafio-desc">${desafio.desc}</div>
                    <div class="desafio-progresso">
                        <div class="desafio-bar">
                            <div class="desafio-bar-fill" style="width: ${porcentagem}%"></div>
                        </div>
                        <span class="desafio-texto">${progresso}/${desafio.meta}</span>
                    </div>
                </div>
                <div class="desafio-recompensa">
                    <div class="desafio-xp">${completo ? '✓' : '+' + desafio.xp}</div>
                    <div class="desafio-label">${completo ? 'Completo' : 'XP'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Integrar gamificação com ações do usuário
const originalAdicionarCurso = adicionarCurso;
adicionarCurso = function (event) {
    originalAdicionarCurso.call(this, event);
    adicionarXP(10, 'Curso adicionado');
    verificarConquistas();
};

const originalSalvarNotaAtual = salvarNotaAtual;
salvarNotaAtual = function () {
    originalSalvarNotaAtual.call(this);
    adicionarXP(5, 'Nota salva');
    verificarConquistas();
};

const originalFinalizarSessao = finalizarSessao;
finalizarSessao = function () {
    originalFinalizarSessao.call(this);
    if (modoAtual === 'pomodoro') {
        adicionarXP(15, 'Pomodoro completado');
        verificarConquistas();
    }
};

// Atualizar showSection para carregar gamificação
const originalShowSection4 = showSection;
showSection = function (sectionId) {
    originalShowSection4.call(this, sectionId);

    if (sectionId === 'gamificacao') {
        carregarDadosGame();
    }
};

// Carregar gamificação ao fazer login
const originalFazerLogin2 = fazerLogin;
fazerLogin = function (event) {
    originalFazerLogin2.call(this, event);
    carregarDadosGame();
};

// FERRAMENTAS IA - GERADOR DE RESUMOS E OCR

// GERADOR DE RESUMOS
function gerarResumo() {
    const texto = document.getElementById('textoOriginal').value.trim();
    const tamanho = document.getElementById('tamanhoResumo').value;

    if (texto.length < 100) {
        mostrarNotificacao('❌ O texto deve ter pelo menos 100 caracteres!');
        return;
    }

    // Desabilitar botão
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Gerando resumo...';

    // Simular processamento (em produção, usaria API de IA)
    setTimeout(() => {
        const resumo = gerarResumoAutomatico(texto, tamanho);

        document.getElementById('textoResumo').textContent = resumo;
        document.getElementById('resultadoResumo').style.display = 'block';

        btn.disabled = false;
        btn.textContent = '✨ Gerar Resumo';

        mostrarNotificacao('✅ Resumo gerado com sucesso!');

        // Adicionar XP
        if (typeof adicionarXP === 'function') {
            adicionarXP(20, 'Resumo gerado');
        }
    }, 1500);
}

// Algoritmo de resumo (extractive summarization)
function gerarResumoAutomatico(texto, tamanho) {
    // Dividir em sentenças
    const sentencas = texto.match(/[^.!?]+[.!?]+/g) || [texto];

    // Calcular quantidade de sentenças no resumo
    let numSentencas;
    switch (tamanho) {
        case 'curto': numSentencas = Math.min(3, sentencas.length); break;
        case 'medio': numSentencas = Math.min(5, sentencas.length); break;
        case 'longo': numSentencas = Math.min(8, sentencas.length); break;
        default: numSentencas = 5;
    }

    // Calcular "importância" de cada sentença (baseado em palavras-chave)
    const palavrasImportantes = extrairPalavrasChave(texto);
    const sentencasComScore = sentencas.map(sentenca => {
        const palavras = sentenca.toLowerCase().split(/\s+/);
        const score = palavras.reduce((acc, palavra) => {
            return acc + (palavrasImportantes[palavra] || 0);
        }, 0);
        return { sentenca, score };
    });

    // Ordenar por importância e pegar as melhores
    const melhoresSentencas = sentencasComScore
        .sort((a, b) => b.score - a.score)
        .slice(0, numSentencas)
        .map(item => item.sentenca.trim());

    // Manter ordem original
    const resumoOrdenado = sentencas
        .filter(s => melhoresSentencas.includes(s.trim()))
        .join(' ');

    return resumoOrdenado || sentencas.slice(0, numSentencas).join(' ');
}

// Extrair palavras-chave (TF-IDF simplificado)
function extrairPalavrasChave(texto) {
    const stopwords = new Set(['o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'sem', 'sob', 'um', 'uma', 'uns', 'umas', 'e', 'ou', 'mas', 'que', 'se', 'quando', 'onde', 'como', 'é', 'são', 'foi', 'ser', 'ter', 'mais', 'muito', 'também', 'já', 'só']);

    const palavras = texto.toLowerCase().match(/\b\w+\b/g) || [];
    const frequencia = {};

    palavras.forEach(palavra => {
        if (palavra.length > 3 && !stopwords.has(palavra)) {
            frequencia[palavra] = (frequencia[palavra] || 0) + 1;
        }
    });

    return frequencia;
}

// Copiar resumo
function copiarResumo() {
    const texto = document.getElementById('textoResumo').textContent;
    navigator.clipboard.writeText(texto);
    mostrarNotificacao('📋 Resumo copiado!');
}

// Salvar resumo como nota
function salvarResumoComoNota() {
    if (typeof notas === 'undefined') {
        mostrarNotificacao('❌ Sistema de notas não disponível!');
        return;
    }

    const resumo = document.getElementById('textoResumo').textContent;
    const textoOriginal = document.getElementById('textoOriginal').value;

    const novaNota = {
        id: Date.now(),
        titulo: 'Resumo Gerado - ' + new Date().toLocaleDateString('pt-BR'),
        conteudo: `# Resumo Gerado\n\n${resumo}\n\n---\n\n## Texto Original\n\n${textoOriginal.substring(0, 500)}...`,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };

    notas.unshift(novaNota);
    salvarNotas();

    mostrarNotificacao('💾 Resumo salvo como nota!');
}

// OCR - PROCESSAR IMAGEM
let ocrWorker = null;

async function processarImagemOCR(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
        mostrarNotificacao('❌ Por favor, selecione uma imagem válida!');
        return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('imagemPreview').src = e.target.result;
        document.getElementById('previewContainer').style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Esconder resultado anterior
    document.getElementById('resultadoOCR').style.display = 'none';

    // Mostrar progresso
    document.getElementById('ocrProgresso').style.display = 'block';
    document.getElementById('ocrProgressoFill').style.width = '0%';
    document.getElementById('ocrStatus').textContent = 'Inicializando OCR...';

    try {
        // Inicializar Tesseract
        if (!ocrWorker) {
            ocrWorker = await Tesseract.createWorker('por', 1, {
                logger: (info) => {
                    if (info.status === 'recognizing text') {
                        const progresso = Math.round(info.progress * 100);
                        document.getElementById('ocrProgressoFill').style.width = progresso + '%';
                        document.getElementById('ocrStatus').textContent = `Extraindo texto... ${progresso}%`;
                    }
                }
            });
        }

        // Processar imagem
        const { data: { text } } = await ocrWorker.recognize(file);

        // Mostrar resultado
        document.getElementById('textoOCR').value = text.trim();
        document.getElementById('ocrProgresso').style.display = 'none';
        document.getElementById('resultadoOCR').style.display = 'block';

        mostrarNotificacao('✅ Texto extraído com sucesso!');

        // Adicionar XP
        if (typeof adicionarXP === 'function') {
            adicionarXP(25, 'OCR processado');
        }

    } catch (error) {
        console.error('Erro no OCR:', error);
        document.getElementById('ocrProgresso').style.display = 'none';
        mostrarNotificacao('❌ Erro ao processar imagem. Tente novamente!');
    }
}

// Copiar texto OCR
function copiarTextoOCR() {
    const texto = document.getElementById('textoOCR').value;
    navigator.clipboard.writeText(texto);
    mostrarNotificacao('📋 Texto copiado!');
}

// Salvar OCR como nota
function salvarOCRComoNota() {
    if (typeof notas === 'undefined') {
        mostrarNotificacao('❌ Sistema de notas não disponível!');
        return;
    }

    const texto = document.getElementById('textoOCR').value.trim();

    if (!texto) {
        mostrarNotificacao('❌ Nenhum texto para salvar!');
        return;
    }

    const novaNota = {
        id: Date.now(),
        titulo: 'Texto Extraído - ' + new Date().toLocaleDateString('pt-BR'),
        conteudo: `# Texto Extraído por OCR\n\n${texto}`,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };

    notas.unshift(novaNota);
    salvarNotas();

    mostrarNotificacao('💾 Texto salvo como nota!');
}

// Drag and drop para OCR
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');

    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#3b82f6';
            uploadArea.style.background = 'var(--bg-primary)';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';

            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const input = document.getElementById('imagemOCR');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                input.files = dataTransfer.files;
                processarImagemOCR({ target: input });
            }
        });
    }
});

// ============================================
// SISTEMA DE VIDEOAULAS YOUTUBE
// ============================================
let videoaulasTemp = [];

// Extrair ID do vídeo do YouTube
function extrairYoutubeID(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Adicionar videoaula
function adicionarVideoaula() {
    const link = document.getElementById('linkYoutube').value.trim();

    if (!link) {
        mostrarNotificacao('❌ Cole um link do YouTube!');
        return;
    }

    const videoId = extrairYoutubeID(link);

    if (!videoId) {
        mostrarNotificacao('❌ Link do YouTube inválido!');
        return;
    }

    // Verificar duplicado
    if (videoaulasTemp.some(v => v.id === videoId)) {
        mostrarNotificacao('⚠️ Este vídeo já foi adicionado!');
        return;
    }

    const videoaula = {
        id: videoId,
        url: link,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        titulo: 'Videoaula'
    };

    videoaulasTemp.push(videoaula);
    renderizarVideoaulasTemp();

    document.getElementById('linkYoutube').value = '';
    mostrarNotificacao('✅ Videoaula adicionada!');
}

// Renderizar videoaulas temporárias (no formulário)
function renderizarVideoaulasTemp() {
    const container = document.getElementById('listaVideoaulas');

    if (!container) return;

    if (videoaulasTemp.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9em; margin: 10px 0;">Nenhuma videoaula adicionada ainda</p>';
        return;
    }

    container.innerHTML = videoaulasTemp.map((video, index) => `
        <div class="video-item">
            <div class="video-item-info">
                <img src="${video.thumbnail}" alt="Thumbnail" class="video-thumb">
                <span class="video-title">🎥 Videoaula ${index + 1}</span>
            </div>
            <button class="btn-remove-video" onclick="removerVideoaulaTemp(${index})">
                🗑️ Remover
            </button>
        </div>
    `).join('');
}

// Remover videoaula temporária
function removerVideoaulaTemp(index) {
    videoaulasTemp.splice(index, 1);
    renderizarVideoaulasTemp();
    mostrarNotificacao('🗑️ Videoaula removida!');
}

// Abrir modal de vídeo
function abrirVideoModal(videoId, titulo) {
    const modal = document.createElement('div');
    modal.className = 'modal-video show';
    modal.id = 'modalVideo';
    modal.innerHTML = `
        <div class="modal-video-content">
            <div class="modal-video-header">
                <h3>${titulo}</h3>
                <button class="btn-close-video" onclick="fecharVideoModal()">✕</button>
            </div>
            <div class="modal-video-body">
                <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                </iframe>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharVideoModal();
        }
    });
}

// Fechar modal de vídeo
function fecharVideoModal() {
    const modal = document.getElementById('modalVideo');
    if (modal) modal.remove();
}

// Limpar videoaulas ao entrar na seção adicionar
document.addEventListener('DOMContentLoaded', () => {
    const originalShowSectionVideo = showSection;
    showSection = function (sectionId) {
        originalShowSectionVideo.call(this, sectionId);

        if (sectionId === 'adicionar') {
            setTimeout(() => renderizarVideoaulasTemp(), 100);
        }
    };
});

// Toggle categoria personalizada
function toggleCategoriaCustom() {
    const categoria = document.getElementById('categoria').value;
    const customInput = document.getElementById('categoriaCustom');
    
    if (categoria === 'Outros') {
        customInput.style.display = 'block';
        customInput.required = true;
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
}

// ============================================
// SISTEMA DE CERTIFICADOS
// ============================================

// Verificar se desbloqueou certificado ao concluir curso
function verificarCertificado(cursoId) {
    const curso = cursos.find(c => c.id === cursoId);
    
    if (!curso) return;
    
    // Se chegou em 100% e não tem certificado ainda
    if (curso.progresso === 100 && !curso.certificado) {
        const certificado = {
            id: `CERT-${Date.now()}`,
            cursoId: curso.id,
            nomeCurso: curso.nome,
            categoria: curso.categoria,
            nomeAluno: usuarioAtual,
            dataEmissao: new Date().toLocaleDateString('pt-BR'),
            dataEmissaoISO: new Date().toISOString()
        };
        
        curso.certificado = certificado;
        salvarDados();
        
        // Adicionar XP bônus
        if (typeof adicionarXP === 'function') {
            adicionarXP(200, 'Certificado conquistado');
        }
        
        // Modal personalizado bonito
        setTimeout(() => {
            mostrarModalCertificadoConquistado(certificado);
        }, 800);
    }
}

// Modal de certificado conquistado
function mostrarModalCertificadoConquistado(certificado) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modalCertConquistado';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-cert-conquistado">
            <div class="modal-cert-confetti">
                <div class="confetti">🎉</div>
                <div class="confetti">🎊</div>
                <div class="confetti">✨</div>
                <div class="confetti">🌟</div>
                <div class="confetti">⭐</div>
                <div class="confetti">💫</div>
            </div>
            
            <div class="modal-cert-content">
                <div class="cert-trophy-animation">
                    <div class="trophy-icon">🏆</div>
                    <div class="trophy-shine"></div>
                </div>
                
                <h2 class="cert-title-conquistado">PARABÉNS!</h2>
                <p class="cert-subtitle-conquistado">Você conquistou um certificado!</p>
                
                <div class="cert-info-conquistado">
                    <div class="cert-curso-badge">
                        <div class="badge-icon">📚</div>
                        <div class="badge-text">
                            <div class="badge-nome">${certificado.nomeCurso}</div>
                            <div class="badge-categoria">${certificado.categoria}</div>
                        </div>
                    </div>
                    
                    <div class="cert-conquista-badge">
                        <span class="badge-100">💯</span>
                        <span class="badge-text-100">100% Concluído</span>
                    </div>
                </div>
                
                <div class="cert-acoes-conquistado">
                    <button class="btn-cert-ver" onclick="verCertificadoConquistado('${certificado.id}')">
                        🎓 Ver Certificado
                    </button>
                    <button class="btn-cert-depois" onclick="fecharModalCertConquistado()">
                        Visualizar Depois
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animação de entrada
    setTimeout(() => {
        modal.querySelector('.modal-cert-conquistado').classList.add('show');
    }, 10);
}

// Ver certificado conquistado
function verCertificadoConquistado(certId) {
    fecharModalCertConquistado();
    
    const curso = cursos.find(c => c.certificado && c.certificado.id === certId);
    if (curso) {
        setTimeout(() => {
            abrirCertificado(curso.certificado);
        }, 300);
    }
}

// Fechar modal de certificado conquistado
function fecharModalCertConquistado() {
    const modal = document.getElementById('modalCertConquistado');
    if (modal) {
        modal.querySelector('.modal-cert-conquistado').classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Renderizar lista de certificados
function renderizarCertificados() {
    const container = document.getElementById('listaCertificados');
    const semCerts = document.getElementById('semCertificados');
    
    const cursosComCertificado = cursos.filter(c => c.certificado);
    
    if (cursosComCertificado.length === 0) {
        container.innerHTML = '';
        semCerts.style.display = 'block';
        return;
    }
    
    semCerts.style.display = 'none';
    
    container.innerHTML = `
        <div class="certificados-grid">
            ${cursosComCertificado.map(curso => `
                <div class="certificado-card" onclick="abrirCertificado(${JSON.stringify(curso.certificado).replace(/"/g, '&quot;')})">
                    <div class="certificado-header-card">
                        <div class="certificado-icon-card">🏆</div>
                        <div class="certificado-badge-100">100%</div>
                    </div>
                    <div class="certificado-info-card">
                        <div class="certificado-titulo-card">${curso.nome}</div>
                        <div class="certificado-categoria-card">📚 ${curso.categoria}</div>
                        <div class="certificado-data-card">
                            📅 Concluído em ${curso.certificado.dataEmissao}
                        </div>
                    </div>
                    <button class="btn-ver-certificado">
                        👁️ Ver Certificado
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Abrir modal do certificado
function abrirCertificado(certificado) {
    const modal = document.createElement('div');
    modal.className = 'modal-certificado show';
    modal.id = 'modalCertificado';
    
    modal.innerHTML = `
        <div class="certificado-container">
            <div class="certificado-content" id="certificadoParaDownload">
                <!-- Decorações -->
                <div class="cert-decoration top-left">📚</div>
                <div class="cert-decoration top-right">🎓</div>
                <div class="cert-decoration bottom-left">⭐</div>
                <div class="cert-decoration bottom-right">🏆</div>
                
                <!-- Header -->
                <div class="certificado-header-main">
                    <div class="cert-logo">🎓</div>
                    <h1 class="cert-title">CERTIFICADO</h1>
                    <p class="cert-subtitle">LACERDASH</p>
                </div>
                
                <!-- Body -->
                <div class="certificado-body">
                    <p class="cert-outorga">Certificamos que</p>
                    
                    <h2 class="cert-nome-aluno">${certificado.nomeAluno}</h2>
                    
                    <p class="cert-outorga">concluiu com êxito o curso</p>
                    
                    <div class="cert-curso-info">
                        <div class="cert-curso-nome">${certificado.nomeCurso}</div>
                        <div class="cert-curso-categoria">${certificado.categoria}</div>
                    </div>
                    
                    <div class="cert-conquista">
                        <span>💯</span>
                        <span>100% de Conclusão</span>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="certificado-footer">
                    <div class="cert-assinatura">
                        <div class="cert-linha"></div>
                        <div class="cert-assinatura-nome">Lacerdash</div>
                        <div class="cert-assinatura-cargo">Plataforma de Aprendizado</div>
                    </div>
                    
                    <div class="cert-data-emissao">
                        <div class="cert-data-label">Data de Emissão</div>
                        <div class="cert-data-valor">${certificado.dataEmissao}</div>
                    </div>
                    
                    <div class="cert-id">
                        <div class="cert-id-label">Certificado ID</div>
                        <div class="cert-id-valor">${certificado.id}</div>
                    </div>
                </div>
            </div>
            
            <!-- Ações -->
            <div class="certificado-acoes">
                <button class="btn-cert-action btn-download-cert" onclick="baixarCertificadoPNG()">
                    📥 Baixar PNG
                </button>
                <button class="btn-cert-action btn-compartilhar-cert" onclick="compartilharCertificado('${certificado.nomeCurso}')">
                    📤 Compartilhar
                </button>
                <button class="btn-cert-action btn-fechar-cert" onclick="fecharCertificado()">
                    ✕ Fechar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharCertificado();
        }
    });
}

// Fechar certificado
function fecharCertificado() {
    const modal = document.getElementById('modalCertificado');
    if (modal) modal.remove();
}

// Baixar certificado como PNG
async function baixarCertificadoPNG() {
    mostrarNotificacao('📸 Gerando imagem do certificado...');
    
    try {
        // Usar html2canvas para capturar
        const elemento = document.getElementById('certificadoParaDownload');
        
        // Importar html2canvas dinamicamente
        if (typeof html2canvas === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            document.head.appendChild(script);
            
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }
        
        const canvas = await html2canvas(elemento, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
        });
        
        // Converter para PNG e baixar
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificado-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
            
            mostrarNotificacao('✅ Certificado baixado!');
        });
        
    } catch (error) {
        console.error('Erro ao gerar certificado:', error);
        mostrarNotificacao('❌ Erro ao gerar imagem. Tente novamente!');
    }
}

// Compartilhar certificado
function compartilharCertificado(nomeCurso) {
    const texto = `🎓 Acabei de conquistar o certificado do curso "${nomeCurso}"! 💯`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Certificado Conquistado!',
            text: texto
        }).catch(() => {});
    } else {
        // Copiar texto
        navigator.clipboard.writeText(texto);
        mostrarNotificacao('📋 Texto copiado! Cole nas redes sociais!');
    }
}

// Modificar a função de editar curso para verificar certificado
const originalEditarCurso2 = editarCurso;
editarCurso = function(id) {
    const curso = cursos.find(c => c.id === id);
    
    // Se tem certificado e vai editar, avisar que vai perder
    if (curso && curso.certificado && curso.progresso === 100) {
        if (!confirm('⚠️ Este curso tem certificado. Ao editar, você poderá perder o certificado se alterar o progresso. Deseja continuar?')) {
            return;
        }
    }
    
    originalEditarCurso2.call(this, id);
};

// Atualizar showSection para carregar certificados
const originalShowSection6 = showSection;
showSection = function(sectionId) {
    originalShowSection6.call(this, sectionId);
    
    if (sectionId === 'certificados') {
        renderizarCertificados();
    }
};

// Integrar verificação de certificado ao salvar curso
// Adicionar script para verificar quando progresso chegar a 100%
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-editar')) {
        const cursoId = parseInt(e.target.getAttribute('onclick').match(/\d+/)[0]);
        const curso = cursos.find(c => c.id === cursoId);
        
        // Guardar progresso anterior
        if (curso) {
            window.progressoAnterior = curso.progresso;
        }
    }
});

// Hook no adicionarCurso para verificar se foi edição com 100%
const originalAdicionarCurso2 = adicionarCurso;
adicionarCurso = function(event) {
    event.preventDefault();
    
    const progresso = parseInt(document.getElementById('progresso').value) || 0;
    
    // Chamar original
    originalAdicionarCurso2.call(this, event);
    
    // Se chegou em 100%, verificar certificado
    if (progresso === 100) {
        const ultimoCurso = cursos[cursos.length - 1];
        if (ultimoCurso) {
            verificarCertificado(ultimoCurso.id);
        }
    }
};

// Atualizar progresso automaticamente baseado no status
function atualizarProgressoPorStatus() {
    const status = document.getElementById('status').value;
    const progressoInput = document.getElementById('progresso');
    const progressoGroup = progressoInput.closest('.form-group');
    
    if (status === 'concluido') {
        progressoInput.value = 100;
        progressoGroup.style.opacity = '0.5';
        progressoGroup.style.pointerEvents = 'none';
        progressoInput.disabled = true;
    } else {
        progressoGroup.style.opacity = '1';
        progressoGroup.style.pointerEvents = 'auto';
        progressoInput.disabled = false;
        
        // Sugestões de progresso baseado no status
        if (status === 'nao-iniciado' && progressoInput.value > 0) {
            progressoInput.value = 0;
        } else if (status === 'em-andamento' && progressoInput.value === 0) {
            progressoInput.value = 10; // sugestão
        } else if (status === 'pausado' && progressoInput.value === 0) {
            progressoInput.value = 25; // sugestão
        }
    }
}

// ============================================
// BIBLIOTECA DE RECURSOS
// ============================================
let recursos = [];

// Carregar recursos
function carregarRecursos() {
    if (!usuarioAtual) return;
    
    const chave = `recursos_${usuarioAtual}`;
    const dados = localStorage.getItem(chave);
    
    if (dados) {
        recursos = JSON.parse(dados);
    } else {
        recursos = [];
    }
}

// Salvar recursos
function salvarRecursos() {
    if (!usuarioAtual) return;
    
    const chave = `recursos_${usuarioAtual}`;
    localStorage.setItem(chave, JSON.stringify(recursos));
}

// Abrir modal de adicionar recurso
function abrirModalRecurso(recursoId = null) {
    const recursoEdit = recursoId ? recursos.find(r => r.id === recursoId) : null;
    const titulo = recursoEdit ? 'Editar Recurso' : 'Adicionar Novo Recurso';
    
    const modal = document.createElement('div');
    modal.className = 'modal-recurso show';
    modal.id = 'modalRecurso';
    
    // Preencher select de cursos
    const optionsCursos = cursos.map(c => 
        `<option value="${c.id}" ${recursoEdit && recursoEdit.cursoId === c.id ? 'selected' : ''}>${c.nome}</option>`
    ).join('');
    
    modal.innerHTML = `
        <div class="modal-recurso-content">
            <div class="modal-recurso-header">
                <h3>${titulo}</h3>
            </div>
            
            <div class="modal-recurso-body">
                <form id="formRecurso" onsubmit="salvarRecurso(event, ${recursoId})">
                    <div class="form-group">
                        <label>Título *</label>
                        <input type="text" id="recursoTitulo" required 
                               value="${recursoEdit ? recursoEdit.titulo : ''}"
                               placeholder="Ex: Documentação Oficial Python">
                    </div>
                    
                    <div class="form-group">
                        <label>Tipo *</label>
                        <select id="recursoTipo" required>
                            <option value="link" ${recursoEdit?.tipo === 'link' ? 'selected' : ''}>🔗 Link</option>
                            <option value="pdf" ${recursoEdit?.tipo === 'pdf' ? 'selected' : ''}>📄 PDF</option>
                            <option value="video" ${recursoEdit?.tipo === 'video' ? 'selected' : ''}>🎥 Vídeo</option>
                            <option value="artigo" ${recursoEdit?.tipo === 'artigo' ? 'selected' : ''}>📰 Artigo</option>
                            <option value="outro" ${recursoEdit?.tipo === 'outro' ? 'selected' : ''}>📌 Outro</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>URL *</label>
                        <input type="url" id="recursoUrl" required 
                               value="${recursoEdit ? recursoEdit.url : ''}"
                               placeholder="https://...">
                    </div>
                    
                    <div class="form-group">
                        <label>Curso Relacionado *</label>
                        <select id="recursoCurso" required>
                            <option value="">Selecione...</option>
                            ${optionsCursos}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Descrição</label>
                        <textarea id="recursoDescricao" rows="3" 
                                  placeholder="Breve descrição do recurso...">${recursoEdit ? recursoEdit.descricao : ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Tags (separadas por vírgula)</label>
                        <input type="text" id="recursoTags" 
                               value="${recursoEdit && recursoEdit.tags ? recursoEdit.tags.join(', ') : ''}"
                               placeholder="Ex: documentação, python, avançado">
                        <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                            Use vírgulas para separar as tags
                        </small>
                    </div>
                </form>
            </div>
            
            <div class="modal-recurso-footer">
                <button class="btn-modal btn-cancelar" onclick="fecharModalRecurso()">Cancelar</button>
                <button class="btn-modal btn-confirmar" onclick="document.getElementById('formRecurso').requestSubmit()">
                    ${recursoEdit ? 'Atualizar' : 'Adicionar'}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalRecurso();
    });
}

// Fechar modal recurso
function fecharModalRecurso() {
    const modal = document.getElementById('modalRecurso');
    if (modal) modal.remove();
}

// Salvar recurso
function salvarRecurso(event, recursoId) {
    event.preventDefault();
    
    const titulo = document.getElementById('recursoTitulo').value.trim();
    const tipo = document.getElementById('recursoTipo').value;
    const url = document.getElementById('recursoUrl').value.trim();
    const cursoId = parseInt(document.getElementById('recursoCurso').value);
    const descricao = document.getElementById('recursoDescricao').value.trim();
    const tagsInput = document.getElementById('recursoTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    
    if (recursoId) {
        // Editar
        const recurso = recursos.find(r => r.id === recursoId);
        if (recurso) {
            recurso.titulo = titulo;
            recurso.tipo = tipo;
            recurso.url = url;
            recurso.cursoId = cursoId;
            recurso.descricao = descricao;
            recurso.tags = tags;
            recurso.dataAtualizacao = new Date().toISOString();
        }
        mostrarNotificacao('✅ Recurso atualizado!');
    } else {
        // Novo
        const recurso = {
            id: Date.now(),
            titulo,
            tipo,
            url,
            cursoId,
            descricao,
            tags,
            dataCriacao: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
        };
        recursos.push(recurso);
        mostrarNotificacao('✅ Recurso adicionado!');
    }
    
    salvarRecursos();
    fecharModalRecurso();
    renderizarRecursos();
}

// Renderizar recursos
function renderizarRecursos() {
    const container = document.getElementById('listaRecursos');
    const semRecursos = document.getElementById('semRecursos');
    
    // Atualizar filtro de cursos
    const filtroCurso = document.getElementById('filtroCursoBiblioteca');
    filtroCurso.innerHTML = '<option value="todos">Todos os Cursos</option>' +
        cursos.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    
    if (recursos.length === 0) {
        container.innerHTML = '';
        semRecursos.style.display = 'block';
        return;
    }
    
    semRecursos.style.display = 'none';
    
    const iconesTipo = {
        'link': '🔗',
        'pdf': '📄',
        'video': '🎥',
        'artigo': '📰',
        'outro': '📌'
    };
    
    container.innerHTML = `
        <div class="recursos-grid">
            ${recursos.map(recurso => {
                const curso = cursos.find(c => c.id === recurso.cursoId);
                const nomeCurso = curso ? curso.nome : 'Curso não encontrado';
                
                return `
                    <div class="recurso-card">
                        <div class="recurso-header">
                            <div class="recurso-tipo-icon">${iconesTipo[recurso.tipo]}</div>
                            <div class="recurso-acoes-quick">
                                <button class="btn-recurso-acao" onclick="abrirRecurso('${recurso.url}')" title="Abrir">
                                    🔗
                                </button>
                                <button class="btn-recurso-acao" onclick="abrirModalRecurso(${recurso.id})" title="Editar">
                                    ✏️
                                </button>
                                <button class="btn-recurso-acao" onclick="deletarRecurso(${recurso.id})" title="Deletar">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        
                        <div class="recurso-titulo">${recurso.titulo}</div>
                        
                        ${recurso.descricao ? `
                            <div class="recurso-descricao">${recurso.descricao}</div>
                        ` : ''}
                        
                        ${recurso.tags && recurso.tags.length > 0 ? `
                            <div class="recurso-tags">
                                ${recurso.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                        
                        <div class="recurso-footer">
                            <span class="recurso-curso-badge">${nomeCurso}</span>
                            <span class="recurso-data">${new Date(recurso.dataCriacao).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Abrir recurso
function abrirRecurso(url) {
    window.open(url, '_blank');
}

// Deletar recurso
function deletarRecurso(id) {
    if (!confirm('Deseja deletar este recurso?')) return;
    
    recursos = recursos.filter(r => r.id !== id);
    salvarRecursos();
    renderizarRecursos();
    mostrarNotificacao('🗑️ Recurso deletado!');
}

// Filtrar recursos
function filtrarRecursos() {
    const cursoFiltro = document.getElementById('filtroCursoBiblioteca').value;
    const tipoFiltro = document.getElementById('filtroTipoBiblioteca').value;
    const buscaFiltro = document.getElementById('buscaBiblioteca').value.toLowerCase();
    
    let recursosOriginais = [...recursos];
    let recursosFiltrados = recursosOriginais;
    
    if (cursoFiltro !== 'todos') {
        recursosFiltrados = recursosFiltrados.filter(r => r.cursoId === parseInt(cursoFiltro));
    }
    
    if (tipoFiltro !== 'todos') {
        recursosFiltrados = recursosFiltrados.filter(r => r.tipo === tipoFiltro);
    }
    
    if (buscaFiltro) {
        recursosFiltrados = recursosFiltrados.filter(r =>
            r.titulo.toLowerCase().includes(buscaFiltro) ||
            r.descricao.toLowerCase().includes(buscaFiltro) ||
            r.tags.some(tag => tag.toLowerCase().includes(buscaFiltro))
        );
    }
    
    // Renderizar temporariamente
    recursos = recursosFiltrados;
    renderizarRecursos();
    recursos = recursosOriginais;
}

// Carregar biblioteca ao entrar na seção
const originalShowSection7 = showSection;
showSection = function(sectionId) {
    originalShowSection7.call(this, sectionId);
    
    if (sectionId === 'biblioteca') {
        carregarRecursos();
        renderizarRecursos();
    }
};

// Carregar recursos ao fazer login
carregarRecursos();

// ============================================
// SISTEMA DE BACKUP AUTOMÁTICO E VERSÕES
// ============================================
let backupAutomaticoAtivo = false;
let historicoVersoes = [];

// Carregar configurações de backup
function carregarConfigBackup() {
    if (!usuarioAtual) return;
    
    const ativo = localStorage.getItem(`backup_auto_${usuarioAtual}`);
    backupAutomaticoAtivo = ativo === 'true';
    
    document.getElementById('backupAutoToggle').checked = backupAutomaticoAtivo;
    
    // Carregar histórico
    const historico = localStorage.getItem(`historico_versoes_${usuarioAtual}`);
    historicoVersoes = historico ? JSON.parse(historico) : [];
    
    atualizarInfoBackup();
}

// Toggle backup automático
function toggleBackupAutomatico() {
    backupAutomaticoAtivo = document.getElementById('backupAutoToggle').checked;
    localStorage.setItem(`backup_auto_${usuarioAtual}`, backupAutomaticoAtivo);
    
    if (backupAutomaticoAtivo) {
        mostrarNotificacao('✅ Backup automático ativado!');
        criarBackupAutomatico('Ativação do backup automático');
    } else {
        mostrarNotificacao('⏸️ Backup automático desativado!');
    }
}

// Criar backup automático
function criarBackupAutomatico(motivo = 'Alteração nos dados') {
    if (!backupAutomaticoAtivo && motivo !== 'Ativação do backup automático') return;
    
    const backup = {
        id: Date.now(),
        data: new Date().toISOString(),
        motivo: motivo,
        dados: {
            cursos: cursos,
            notas: notas || [],
            recursos: recursos || [],
            trilhaAtiva: trilhaAtiva,
            dadosGame: dadosGame || {}
        },
        tamanho: JSON.stringify({cursos, notas, recursos}).length
    };
    
    historicoVersoes.unshift(backup);
    
    // Manter apenas últimos 10 backups
    if (historicoVersoes.length > 10) {
        historicoVersoes = historicoVersoes.slice(0, 10);
    }
    
    localStorage.setItem(`historico_versoes_${usuarioAtual}`, JSON.stringify(historicoVersoes));
    atualizarInfoBackup();
}

// Atualizar informações de backup
function atualizarInfoBackup() {
    const ultimoBackupEl = document.getElementById('ultimoBackup');
    const totalBackupsEl = document.getElementById('totalBackups');
    
    if (historicoVersoes.length > 0) {
        const ultimo = new Date(historicoVersoes[0].data);
        const agora = new Date();
        const diff = Math.floor((agora - ultimo) / 1000 / 60); // minutos
        
        let textoTempo;
        if (diff < 1) textoTempo = 'Agora mesmo';
        else if (diff < 60) textoTempo = `${diff} min atrás`;
        else if (diff < 1440) textoTempo = `${Math.floor(diff / 60)}h atrás`;
        else textoTempo = `${Math.floor(diff / 1440)} dias atrás`;
        
        ultimoBackupEl.textContent = textoTempo;
        totalBackupsEl.textContent = historicoVersoes.length;
    } else {
        ultimoBackupEl.textContent = 'Nunca';
        totalBackupsEl.textContent = '0';
    }
    
    renderizarHistoricoVersoes();
}

// Renderizar histórico de versões
function renderizarHistoricoVersoes() {
    const container = document.getElementById('listaVersoes');
    
    if (historicoVersoes.length === 0) {
        container.innerHTML = '<div class="versoes-vazio">📦 Nenhum backup salvo ainda</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="versoes-lista">
            ${historicoVersoes.map((versao, index) => {
                const data = new Date(versao.data);
                const dataFormatada = data.toLocaleString('pt-BR');
                const tamanhoKB = (versao.tamanho / 1024).toFixed(2);
                
                return `
                    <div class="versao-item">
                        <div class="versao-info">
                            <div class="versao-data">
                                📅 ${dataFormatada}
                                ${index === 0 ? '<span style="color: #10b981; margin-left: 10px;">● Mais recente</span>' : ''}
                            </div>
                            <div class="versao-detalhes">
                                ${versao.motivo} • ${versao.dados.cursos.length} cursos • ${tamanhoKB} KB
                            </div>
                        </div>
                        <div class="versao-acoes">
                            <button class="btn-versao btn-restaurar" onclick="restaurarVersao(${versao.id})">
                                ↻ Restaurar
                            </button>
                            <button class="btn-versao btn-comparar" onclick="compararVersao(${versao.id})">
                                👁️ Ver
                            </button>
                            ${index !== 0 ? `
                                <button class="btn-versao btn-deletar-versao" onclick="deletarVersao(${versao.id})">
                                    🗑️
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Restaurar versão
function restaurarVersao(versaoId) {
    const versao = historicoVersoes.find(v => v.id === versaoId);
    if (!versao) return;
    
    const dataVersao = new Date(versao.data).toLocaleString('pt-BR');
    
    if (!confirm(`Deseja restaurar o backup de ${dataVersao}?\n\nOs dados atuais serão substituídos!`)) return;
    
    // Criar backup antes de restaurar
    criarBackupAutomatico('Antes de restaurar versão anterior');
    
    // Restaurar dados
    cursos = versao.dados.cursos || [];
    notas = versao.dados.notas || [];
    recursos = versao.dados.recursos || [];
    trilhaAtiva = versao.dados.trilhaAtiva || null;
    dadosGame = versao.dados.dadosGame || {};
    
    // Salvar
    salvarDados();
    salvarNotas();
    salvarRecursos();
    salvarTrilhaAtiva();
    salvarDadosGame();
    
    mostrarNotificacao('✅ Versão restaurada com sucesso!');
    
    // Atualizar interface
    atualizarEstatisticas();
    renderizarCursos();
    atualizarInfoBackup();
}

// Comparar/Ver versão
function compararVersao(versaoId) {
    const versao = historicoVersoes.find(v => v.id === versaoId);
    if (!versao) return;
    
    const dataVersao = new Date(versao.data).toLocaleString('pt-BR');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.id = 'modalComparar';
    
    const cursosVersao = versao.dados.cursos || [];
    const notasVersao = versao.dados.notas || [];
    const recursosVersao = versao.dados.recursos || [];
    
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 700px;">
            <div class="modal-header">
                <h3>📊 Visualizar Backup - ${dataVersao}</h3>
            </div>
            <div class="modal-body" style="max-height: 500px; overflow-y: auto;">
                <div style="margin-bottom: 20px;">
                    <h4 style="color: var(--text-primary); margin-bottom: 10px;">📚 Cursos (${cursosVersao.length})</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${cursosVersao.slice(0, 10).map(c => `
                            <li style="padding: 8px; background: var(--bg-secondary); margin-bottom: 5px; border-radius: 6px;">
                                ${c.nome} - ${c.progresso}%
                            </li>
                        `).join('')}
                        ${cursosVersao.length > 10 ? `<li style="color: var(--text-secondary);">... e mais ${cursosVersao.length - 10}</li>` : ''}
                    </ul>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: var(--text-primary); margin-bottom: 10px;">📝 Notas (${notasVersao.length})</h4>
                    ${notasVersao.length > 0 ? `
                        <p style="color: var(--text-secondary);">${notasVersao.length} notas salvas</p>
                    ` : '<p style="color: var(--text-secondary);">Nenhuma nota</p>'}
                </div>
                
                <div>
                    <h4 style="color: var(--text-primary); margin-bottom: 10px;">📚 Recursos (${recursosVersao.length})</h4>
                    ${recursosVersao.length > 0 ? `
                        <p style="color: var(--text-secondary);">${recursosVersao.length} recursos salvos</p>
                    ` : '<p style="color: var(--text-secondary);">Nenhum recurso</p>'}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-modal btn-cancelar" onclick="fecharModalComparar()">Fechar</button>
                <button class="btn-modal btn-confirmar" onclick="fecharModalComparar(); restaurarVersao(${versaoId})">
                    Restaurar Esta Versão
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalComparar();
    });
}

function fecharModalComparar() {
    const modal = document.getElementById('modalComparar');
    if (modal) modal.remove();
}

// Deletar versão
function deletarVersao(versaoId) {
    if (!confirm('Deletar este backup?')) return;
    
    historicoVersoes = historicoVersoes.filter(v => v.id !== versaoId);
    localStorage.setItem(`historico_versoes_${usuarioAtual}`, JSON.stringify(historicoVersoes));
    
    atualizarInfoBackup();
    mostrarNotificacao('🗑️ Backup deletado!');
}

// Limpar histórico
function limparHistoricoVersoes() {
    if (!confirm('Deletar TODOS os backups do histórico?\n\nO backup mais recente será mantido.')) return;
    
    if (historicoVersoes.length > 0) {
        historicoVersoes = [historicoVersoes[0]];
    }
    
    localStorage.setItem(`historico_versoes_${usuarioAtual}`, JSON.stringify(historicoVersoes));
    atualizarInfoBackup();
    mostrarNotificacao('🗑️ Histórico limpo!');
}

// Interceptar salvamentos para criar backup automático
const originalSalvarDados = salvarDados;
salvarDados = function() {
    originalSalvarDados.call(this);
    if (backupAutomaticoAtivo) {
        criarBackupAutomatico('Alteração nos cursos');
    }
};

// Carregar backup ao fazer login
const originalFazerLogin3 = fazerLogin;
fazerLogin = function(event) {
    originalFazerLogin3.call(this, event);
    carregarConfigBackup();
};

// Atualizar ao entrar na seção dados
const originalShowSection8 = showSection;
showSection = function(sectionId) {
    originalShowSection8.call(this, sectionId);
    
    if (sectionId === 'dados') {
        carregarConfigBackup();
        atualizarEstatisticasDados();
    }
};

// Carregar ao iniciar
carregarConfigBackup();

// ============================================
// IA ASSISTENTE DE ESTUDOS
// ============================================

// Analisar perfil do usuário
function analisarPerfilAprendizado() {
    const totalCursos = cursos.length;
    const concluidos = cursos.filter(c => c.status === 'concluido').length;
    const emAndamento = cursos.filter(c => c.status === 'em-andamento').length;
    const progressoMedio = totalCursos > 0 
        ? Math.round(cursos.reduce((acc, c) => acc + c.progresso, 0) / totalCursos)
        : 0;
    
    // Calcular velocidade de conclusão
    let velocidade = 'Normal';
    if (concluidos >= 5) velocidade = 'Rápida';
    else if (concluidos >= 10) velocidade = 'Muito Rápida';
    else if (concluidos < 2 && totalCursos > 5) velocidade = 'Lenta';
    
    // Calcular consistência
    let consistencia = 'Moderada';
    if (progressoMedio >= 70) consistencia = 'Alta';
    else if (progressoMedio >= 40) consistencia = 'Boa';
    else if (progressoMedio < 30) consistencia = 'Baixa';
    
    // Definir tipo de aprendiz
    let tipoAprendiz = 'Explorador';
    const categorias = {};
    cursos.forEach(c => {
        categorias[c.categoria] = (categorias[c.categoria] || 0) + 1;
    });
    
    const categoriaDominante = Object.keys(categorias).length;
    if (categoriaDominante === 1) tipoAprendiz = 'Especialista';
    else if (categoriaDominante >= 4) tipoAprendiz = 'Polímata';
    else if (emAndamento > concluidos * 2) tipoAprendiz = 'Multitarefa';
    else if (concluidos > emAndamento * 2) tipoAprendiz = 'Focado';
    
    return { velocidade, consistencia, tipoAprendiz, progressoMedio, concluidos, emAndamento };
}

// Gerar recomendações personalizadas
function gerarRecomendacoes() {
    const perfil = analisarPerfilAprendizado();
    const recomendacoes = [];
    
    // Recomendação 1: Baseada em cursos pausados
    const pausados = cursos.filter(c => c.status === 'pausado');
    if (pausados.length > 0) {
        recomendacoes.push({
            icon: '⏸️',
            titulo: 'Cursos Pausados Precisam de Atenção',
            texto: `Você tem ${pausados.length} curso(s) pausado(s). Que tal retomar "${pausados[0].nome}"? Retomar pode te dar +50 XP!`,
            acao: 'Ver Cursos Pausados',
            tipo: 'atencao'
        });
    }
    
    // Recomendação 2: Baseada em progresso
    if (perfil.progressoMedio < 30) {
        recomendacoes.push({
            icon: '🎯',
            titulo: 'Foco é a Chave do Sucesso',
            texto: 'Seu progresso médio está baixo. Sugestão: Escolha 1-2 cursos prioritários e foque neles até 50% de conclusão.',
            acao: 'Ver Melhores Práticas',
            tipo: 'alerta'
        });
    }
    
    // Recomendação 3: Baseada em tempo
    if (perfil.velocidade === 'Lenta' && perfil.emAndamento > 3) {
        recomendacoes.push({
            icon: '⚡',
            titulo: 'Menos é Mais',
            texto: `Você tem ${perfil.emAndamento} cursos em andamento. Reduzir para 2-3 pode aumentar sua taxa de conclusão em até 60%!`,
            acao: 'Priorizar Cursos',
            tipo: 'info'
        });
    }
    
    // Recomendação 4: Baseada em conquistas
    if (perfil.concluidos >= 3) {
        recomendacoes.push({
            icon: '🏆',
            titulo: 'Continue Assim!',
            texto: `Você já concluiu ${perfil.concluidos} cursos! Está no caminho certo. Mais ${10 - perfil.concluidos} para desbloquear a conquista "Mestre".`,
            acao: 'Ver Conquistas',
            tipo: 'positivo'
        });
    }
    
    // Recomendação 5: Técnica Pomodoro
    const usouPomodoro = typeof sessoesHoje !== 'undefined' && sessoesHoje > 0;
    if (!usouPomodoro && perfil.emAndamento > 0) {
        recomendacoes.push({
            icon: '🍅',
            titulo: 'Experimente a Técnica Pomodoro',
            texto: 'Estudos mostram que Pomodoro aumenta a produtividade em 25%. Que tal começar uma sessão agora?',
            acao: 'Iniciar Pomodoro',
            tipo: 'info'
        });
    }
    
    // Recomendação 6: Notas
    const temNotas = typeof notas !== 'undefined' && notas && notas.length > 0;
    if (!temNotas && perfil.emAndamento > 0) {
        recomendacoes.push({
            icon: '📝',
            titulo: 'Anotações Melhoram a Retenção',
            texto: 'Fazer anotações aumenta a retenção de conteúdo em 34%. Comece criando resumos dos seus cursos!',
            acao: 'Criar Nota',
            tipo: 'info'
        });
    }
    
    return recomendacoes;
}

// Gerar plano de estudos inteligente
function gerarPlanoEstudos() {
    const cursosAtivos = cursos.filter(c => c.status === 'em-andamento' || c.status === 'pausado');
    
    if (cursosAtivos.length === 0) {
        mostrarNotificacao('❌ Você precisa ter cursos em andamento para gerar um plano!');
        return;
    }
    
    // Priorizar cursos (maior progresso primeiro)
    const cursosPrioritarios = [...cursosAtivos]
        .sort((a, b) => b.progresso - a.progresso)
        .slice(0, 3);
    
    const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const plano = [];
    
    diasSemana.forEach((dia, index) => {
        const atividades = [];
        
        if (index < 5) { // Segunda a Sexta
            // Manhã: Curso principal
            if (cursosPrioritarios[0]) {
                atividades.push({
                    hora: '08:00',
                    curso: cursosPrioritarios[0].nome,
                    duracao: '1h',
                    tipo: 'estudo'
                });
            }
            
            // Tarde: Segundo curso
            if (cursosPrioritarios[1]) {
                atividades.push({
                    hora: '14:00',
                    curso: cursosPrioritarios[1].nome,
                    duracao: '45min',
                    tipo: 'estudo'
                });
            }
            
            // Noite: Revisão
            atividades.push({
                hora: '20:00',
                curso: 'Revisão e Notas',
                duracao: '30min',
                tipo: 'revisao'
            });
        } else { // Fim de semana
            if (index === 5) { // Sábado - Intensivo
                if (cursosPrioritarios[0]) {
                    atividades.push({
                        hora: '09:00',
                        curso: cursosPrioritarios[0].nome,
                        duracao: '2h',
                        tipo: 'estudo'
                    });
                }
                if (cursosPrioritarios[2]) {
                    atividades.push({
                        hora: '15:00',
                        curso: cursosPrioritarios[2].nome,
                        duracao: '1h',
                        tipo: 'estudo'
                    });
                }
            } else { // Domingo - Leve
                atividades.push({
                    hora: '10:00',
                    curso: 'Revisão Semanal',
                    duracao: '1h',
                    tipo: 'revisao'
                });
            }
        }
        
        plano.push({ dia, atividades });
    });
    
    renderizarPlanoEstudos(plano);
    mostrarNotificacao('✨ Plano de estudos gerado!');
}

// Renderizar plano de estudos
function renderizarPlanoEstudos(plano) {
    const container = document.getElementById('planoEstudos');
    
    container.innerHTML = plano.map(diaPlano => `
        <div class="plano-dia">
            <div class="plano-dia-header">
                <div class="plano-dia-nome">${diaPlano.dia}</div>
                <div class="plano-dia-total">
                    ${diaPlano.atividades.length} atividade(s)
                </div>
            </div>
            <div class="plano-atividades">
                ${diaPlano.atividades.map(ativ => `
                    <div class="plano-atividade">
                        <div class="plano-atividade-hora">${ativ.hora}</div>
                        <div class="plano-atividade-info">
                            <div class="plano-atividade-curso">
                                ${ativ.tipo === 'estudo' ? '📚' : '📝'} ${ativ.curso}
                            </div>
                            <div class="plano-atividade-duracao">⏱️ ${ativ.duracao}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Gerar insights e previsões
function gerarInsights() {
    const perfil = analisarPerfilAprendizado();
    const insights = [];
    
    // Insight 1: Tempo para completar
    const cursosAtivos = cursos.filter(c => c.status === 'em-andamento');
    if (cursosAtivos.length > 0) {
        const progressoTotal = cursosAtivos.reduce((acc, c) => acc + c.progresso, 0);
        const progressoRestante = (cursosAtivos.length * 100) - progressoTotal;
        const diasEstimados = Math.ceil(progressoRestante / 10); // 10% por dia (média)
        
        insights.push({
            icon: '⏳',
            titulo: 'Previsão de Conclusão',
            texto: `Com seu ritmo atual, você completará todos os cursos em andamento em aproximadamente ${diasEstimados} dias!`,
            tipo: 'info'
        });
    }
    
    // Insight 2: Melhor categoria
    const categorias = {};
    cursos.filter(c => c.status === 'concluido').forEach(c => {
        categorias[c.categoria] = (categorias[c.categoria] || 0) + 1;
    });
    
    if (Object.keys(categorias).length > 0) {
        const melhorCategoria = Object.entries(categorias).sort((a, b) => b[1] - a[1])[0];
        insights.push({
            icon: '🏆',
            titulo: 'Sua Especialidade',
            texto: `Você se destaca em ${melhorCategoria[0]} com ${melhorCategoria[1]} curso(s) concluído(s)!`,
            tipo: 'positivo'
        });
    }
    
    // Insight 3: Streak
    const streak = typeof dadosGame !== 'undefined' && dadosGame.streakDias ? dadosGame.streakDias : 0;
    if (streak >= 7) {
        insights.push({
            icon: '🔥',
            titulo: 'Sequência Impressionante!',
            texto: `Você está estudando há ${streak} dias seguidos! Continue assim para manter a consistência.`,
            tipo: 'positivo'
        });
    } else if (streak < 3) {
        insights.push({
            icon: '📅',
            titulo: 'Construa uma Rotina',
            texto: 'Estudar todos os dias, mesmo que por 15 minutos, aumenta a retenção em 50%. Que tal começar um streak?',
            tipo: 'atencao'
        });
    }
    
    // Insight 4: Taxa de abandono
    const pausados = cursos.filter(c => c.status === 'pausado').length;
    if (pausados > cursos.length * 0.3) {
        insights.push({
            icon: '⚠️',
            titulo: 'Alto Índice de Pausas',
            texto: `${Math.round(pausados / cursos.length * 100)}% dos seus cursos estão pausados. Considere reduzir a quantidade de cursos simultâneos.`,
            tipo: 'alerta'
        });
    }
    
    return insights;
}

// Gerar sugestões de melhoria
function gerarSugestoesMelhoria() {
    const melhorias = [
        {
            titulo: 'Use a Técnica Pomodoro',
            descricao: 'Estudar em blocos de 25 minutos com pausas de 5 minutos aumenta o foco e reduz a fadiga mental em 40%.'
        },
        {
            titulo: 'Faça Anotações Ativas',
            descricao: 'Resumir conceitos com suas próprias palavras melhora a retenção em 34%. Use a seção de Notas!'
        },
        {
            titulo: 'Revise Periodicamente',
            descricao: 'A curva do esquecimento mostra que revisar após 1 dia, 3 dias e 7 dias aumenta a retenção em 80%.'
        },
        {
            titulo: 'Mantenha Consistência',
            descricao: 'Estudar 30 minutos por dia é mais efetivo que 3 horas uma vez por semana. Pequenos passos diários!'
        },
        {
            titulo: 'Ensine o que Aprende',
            descricao: 'Explicar conceitos para outros (ou para si mesmo) consolida o aprendizado. Crie resumos e compartilhe!'
        }
    ];
    
    return melhorias;
}

// Renderizar IA Assistente
function renderizarIAAssistente() {
    const perfil = analisarPerfilAprendizado();
    
    // Atualizar perfil
    document.getElementById('tipoAprendiz').textContent = perfil.tipoAprendiz;
    document.getElementById('velocidadeConclusao').textContent = perfil.velocidade;
    document.getElementById('consistencia').textContent = perfil.consistencia;
    
    // Renderizar recomendações
    const recomendacoes = gerarRecomendacoes();
    const containerRec = document.getElementById('iaRecomendacoes');
    
    if (recomendacoes.length === 0) {
        containerRec.innerHTML = '<p style="color: var(--text-secondary);">Tudo certo por enquanto! Continue assim! 🎉</p>';
    } else {
        containerRec.innerHTML = recomendacoes.map(rec => `
            <div class="recomendacao-ia">
                <div class="recomendacao-ia-header">
                    <div class="recomendacao-ia-icon">${rec.icon}</div>
                    <div class="recomendacao-ia-titulo">${rec.titulo}</div>
                </div>
                <div class="recomendacao-ia-texto">${rec.texto}</div>
                <div class="recomendacao-ia-acao">${rec.acao}</div>
            </div>
        `).join('');
    }
    
    // Gerar plano inicial
    if (cursos.filter(c => c.status === 'em-andamento' || c.status === 'pausado').length > 0) {
        gerarPlanoEstudos();
    } else {
        document.getElementById('planoEstudos').innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                📚 Adicione cursos em andamento para gerar seu plano personalizado!
            </div>
        `;
    }
    
    // Renderizar insights
    const insights = gerarInsights();
    const containerInsights = document.getElementById('iaInsights');
    
    containerInsights.innerHTML = `
        <div class="insights-grid">
            ${insights.map(insight => `
                <div class="insight-card ${insight.tipo}">
                    <div class="insight-header">
                        <div class="insight-icon">${insight.icon}</div>
                        <div class="insight-titulo">${insight.titulo}</div>
                    </div>
                    <div class="insight-texto">${insight.texto}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Renderizar melhorias
    const melhorias = gerarSugestoesMelhoria();
    const containerMelhorias = document.getElementById('iaMelhorias');
    
    containerMelhorias.innerHTML = melhorias.map((melhoria, index) => `
        <div class="melhoria-item">
            <div class="melhoria-numero">${index + 1}</div>
            <div class="melhoria-conteudo">
                <div class="melhoria-titulo">${melhoria.titulo}</div>
                <div class="melhoria-descricao">${melhoria.descricao}</div>
            </div>
        </div>
    `).join('');
}

// Carregar IA ao entrar na seção
const originalShowSection9 = showSection;
showSection = function(sectionId) {
    originalShowSection9.call(this, sectionId);
    
    if (sectionId === 'ia-assistente') {
        renderizarIAAssistente();
    }
};

// Atualizar recomendações quando adicionar/editar curso
const originalAdicionarCurso3 = adicionarCurso;
adicionarCurso = function(event) {
    originalAdicionarCurso3.call(this, event);
    
    // Se estiver na tela da IA, atualizar
    const iaSection = document.getElementById('ia-assistente');
    if (iaSection && iaSection.classList.contains('active')) {
        setTimeout(() => renderizarIAAssistente(), 500);
    }
};

// ============================================
// EFEITOS VISUAIS MODERNOS
// ============================================




// CONFETE AO CONQUISTAR ALGO
function launchConfetti() {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Integrar confete com conquistas
const originalAdicionarXP3 = typeof adicionarXP !== 'undefined' ? adicionarXP : null;
if (originalAdicionarXP3) {
    adicionarXP = function(quantidade, motivo) {
        originalAdicionarXP3.call(this, quantidade, motivo);
        if (quantidade >= 200) {
            launchConfetti();
        }
    };
}

// ONDAS DE FUNDO
const waveContainer = document.createElement('div');
waveContainer.className = 'wave-bg';
waveContainer.innerHTML = `
    <div class="wave"></div>
    <div class="wave"></div>
    <div class="wave"></div>
`;
document.body.appendChild(waveContainer);

// PARALLAX CIRCLES
const parallaxLayer = document.createElement('div');
parallaxLayer.className = 'parallax-layer';
parallaxLayer.innerHTML = `
    <div class="parallax-circle"></div>
    <div class="parallax-circle"></div>
    <div class="parallax-circle"></div>
`;
document.body.insertBefore(parallaxLayer, document.body.firstChild);

// RIPPLE EFFECT
function createRipple(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// Adicionar ripple em todos os botões
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        createRipple(e);
    }
});

// SCROLL REVEAL
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1 });

// Aplicar reveal em cards
setTimeout(() => {
    document.querySelectorAll('.stat-card, .curso-card, .grafico-card').forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });
}, 100);

// 3D TILT EFFECT
function initTiltEffect() {
    const tiltElements = document.querySelectorAll('.stat-card, .curso-card');
    
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

// Inicializar tilt ao carregar
setTimeout(initTiltEffect, 500);

// Reinicializar ao trocar de seção
const originalShowSection10 = showSection;
showSection = function(sectionId) {
    originalShowSection10.call(this, sectionId);
    setTimeout(initTiltEffect, 300);
};

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

console.log('🎨 Efeitos visuais carregados com sucesso!');

// ============================================
// SISTEMA DE PERSONALIZAÇÃO AVANÇADA
// ============================================

let personalizacoes = {
    tema: 'light',
    cor: 'blue',
    layout: 'normal',
    animacoes: true,
    efeitos: true
};

// Toggle dropdown de personalização
function togglePersonalizacao() {
    const dropdown = document.getElementById('personalizacaoDropdown');
    
    // CRÍTICO: Move o dropdown para fora do header (body)
    if (dropdown.parentElement.id !== 'body-dropdown-container') {
        const container = document.createElement('div');
        container.id = 'body-dropdown-container';
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999999;';
        document.body.appendChild(container);
        container.appendChild(dropdown);
        dropdown.style.pointerEvents = 'all';
    }
    
    dropdown.classList.toggle('show');
    dropdown.classList.toggle('hidden');
}

// Carregar personalizações salvas
function carregarPersonalizacoes() {
    if (!usuarioAtual) return;
    
    const chave = `personalizacoes_${usuarioAtual}`;
    const dados = localStorage.getItem(chave);
    
    if (dados) {
        personalizacoes = JSON.parse(dados);
        aplicarPersonalizacoes();
    }
}

// Salvar personalizações
function salvarPersonalizacoes() {
    if (!usuarioAtual) return;
    
    const chave = `personalizacoes_${usuarioAtual}`;
    localStorage.setItem(chave, JSON.stringify(personalizacoes));
}

// Aplicar personalizações
function aplicarPersonalizacoes() {
    // Aplicar tema
    document.documentElement.setAttribute('data-theme', personalizacoes.tema);
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === personalizacoes.tema) {
            btn.classList.add('active');
        }
    });
    
    // Aplicar cor
    document.body.setAttribute('data-color', personalizacoes.cor);
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.color === personalizacoes.cor) {
            btn.classList.add('active');
        }
    });
    
    // Aplicar layout
    document.body.setAttribute('data-layout', personalizacoes.layout);
    document.querySelectorAll('.layout-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.layout === personalizacoes.layout) {
            btn.classList.add('active');
        }
    });
    
    // Aplicar animações
    if (document.getElementById('animacoesToggle')) {
        document.getElementById('animacoesToggle').checked = personalizacoes.animacoes;
    }
    if (!personalizacoes.animacoes) {
        document.body.classList.add('no-animations');
    } else {
        document.body.classList.remove('no-animations');
    }
    
    // Aplicar efeitos
    if (document.getElementById('efeitosToggle')) {
        document.getElementById('efeitosToggle').checked = personalizacoes.efeitos;
    }
    if (!personalizacoes.efeitos) {
        document.body.classList.add('no-effects');
    } else {
        document.body.classList.remove('no-effects');
    }
    
    // Atualizar cores principais
    aplicarCorPrincipal(personalizacoes.cor);
}

// Mudar tema
function mudarTemaPersonalizado(tema) {
    personalizacoes.tema = tema;
    document.documentElement.setAttribute('data-theme', tema);
    
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === tema) {
            btn.classList.add('active');
        }
    });
    
    salvarPersonalizacoes();
    atualizarGraficos();
    
    const mensagem = tema === 'dark' ? '🌙 Tema escuro ativado' : '☀️ Tema claro ativado';
    mostrarNotificacao(mensagem);
}

// Mudar cor principal
function mudarCorPrincipal(cor) {
    personalizacoes.cor = cor;
    document.body.setAttribute('data-color', cor);
    
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.color === cor) {
            btn.classList.add('active');
        }
    });
    
    aplicarCorPrincipal(cor);
    salvarPersonalizacoes();
    mostrarNotificacao('🎨 Cor alterada!');
}

// Aplicar cor principal (CSS vars)
function aplicarCorPrincipal(cor) {
    const cores = {
        blue: { primary: '#3b82f6', secondary: '#2563eb' },
        purple: { primary: '#8b5cf6', secondary: '#7c3aed' },
        pink: { primary: '#ec4899', secondary: '#db2777' },
        green: { primary: '#10b981', secondary: '#059669' },
        orange: { primary: '#f59e0b', secondary: '#d97706' },
        red: { primary: '#ef4444', secondary: '#dc2626' }
    };
    
    const corSelecionada = cores[cor];
    document.documentElement.style.setProperty('--color-primary', corSelecionada.primary);
    document.documentElement.style.setProperty('--color-secondary', corSelecionada.secondary);
}

// Mudar layout
function mudarLayout(layout) {
    personalizacoes.layout = layout;
    document.body.setAttribute('data-layout', layout);
    
    document.querySelectorAll('.layout-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.layout === layout) {
            btn.classList.add('active');
        }
    });
    
    salvarPersonalizacoes();
    
    const mensagens = {
        normal: '📐 Layout normal',
        compacto: '📐 Layout compacto',
        detalhado: '📐 Layout detalhado'
    };
    mostrarNotificacao(mensagens[layout]);
}

// Toggle animações
function toggleAnimacoes() {
    personalizacoes.animacoes = document.getElementById('animacoesToggle').checked;
    
    if (personalizacoes.animacoes) {
        document.body.classList.remove('no-animations');
        mostrarNotificacao('✨ Animações ativadas');
    } else {
        document.body.classList.add('no-animations');
        mostrarNotificacao('⏸️ Animações desativadas');
    }
    
    salvarPersonalizacoes();
}

// Toggle efeitos
function toggleEfeitos() {
    personalizacoes.efeitos = document.getElementById('efeitosToggle').checked;
    
    if (personalizacoes.efeitos) {
        document.body.classList.remove('no-effects');
        mostrarNotificacao('🌊 Efeitos ativados');
    } else {
        document.body.classList.add('no-effects');
        mostrarNotificacao('⏸️ Efeitos desativados');
    }
    
    salvarPersonalizacoes();
}

// Resetar personalização
function resetarPersonalizacao() {
    if (!confirm('Deseja resetar todas as personalizações para o padrão?')) return;
    
    personalizacoes = {
        tema: 'light',
        cor: 'blue',
        layout: 'normal',
        animacoes: true,
        efeitos: true
    };
    
    aplicarPersonalizacoes();
    salvarPersonalizacoes();
    
    mostrarNotificacao('🔄 Personalização resetada!');
}

// Carregar personalizações ao fazer login
carregarPersonalizacoes();

console.log('🎨 Sistema de personalização carregado!');

// ============================================
// SISTEMA FINANCEIRO DE CURSOS
// ============================================
let dadosFinanceiros = {
    cursosComprados: [], // { cursoId, valor, dataCompra, roi }
    wishlist: [], // { id, nome, preco, link, dataAdicao }
    alertas: []
};

let graficoGastosChart = null;

// Carregar dados financeiros
function carregarDadosFinanceiros() {
    if (!usuarioAtual) return;
    
    const chave = `financeiro_${usuarioAtual}`;
    const dados = localStorage.getItem(chave);
    
    if (dados) {
        dadosFinanceiros = JSON.parse(dados);
    }
    
    renderizarFinanceiro();
}

// Salvar dados financeiros
function salvarDadosFinanceiros() {
    if (!usuarioAtual) return;
    
    const chave = `financeiro_${usuarioAtual}`;
    localStorage.setItem(chave, JSON.stringify(dadosFinanceiros));
}

// Renderizar seção financeira
function renderizarFinanceiro() {
    atualizarResumoFinanceiro();
    renderizarListaCursosFinanceiros();
    renderizarWishlist();
    renderizarAlertas();
    criarGraficoGastos();
}

// Atualizar resumo financeiro
function atualizarResumoFinanceiro() {
    const totalInvestido = dadosFinanceiros.cursosComprados.reduce((acc, c) => acc + c.valor, 0);
    const concluidos = dadosFinanceiros.cursosComprados.filter(c => {
        const curso = cursos.find(cr => cr.id === c.cursoId);
        return curso && curso.status === 'concluido';
    }).length;
    
    const roiMedio = dadosFinanceiros.cursosComprados.length > 0
        ? Math.round(dadosFinanceiros.cursosComprados.reduce((acc, c) => acc + (c.roi || 0), 0) / dadosFinanceiros.cursosComprados.length)
        : 0;
    
    document.getElementById('totalInvestido').textContent = `R$ ${totalInvestido.toFixed(2).replace('.', ',')}`;
    document.getElementById('totalConcluidos').textContent = concluidos;
    document.getElementById('roiMedio').textContent = `${roiMedio}%`;
    document.getElementById('totalWishlist').textContent = dadosFinanceiros.wishlist.length;
}

// Abrir modal para adicionar valores aos cursos
function abrirModalValorCurso() {
    if (cursos.length === 0) {
        mostrarNotificacao('❌ Adicione cursos primeiro!');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-financeiro show';
    modal.id = 'modalValorCurso';
    
    const cursosSelect = cursos.map(c => {
        const jaTemValor = dadosFinanceiros.cursosComprados.find(cf => cf.cursoId === c.id);
        return `<option value="${c.id}">${c.nome} ${jaTemValor ? '✓' : ''}</option>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-financeiro-content">
            <div class="modal-financeiro-header">
                <h3>💵 Adicionar Valor ao Curso</h3>
            </div>
            
            <div class="modal-financeiro-body">
                <form id="formValorCurso" onsubmit="salvarValorCurso(event)">
                    <div class="form-group">
                        <label>Curso *</label>
                        <select id="cursoFinanceiroSelect" required>
                            <option value="">Selecione...</option>
                            ${cursosSelect}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Valor Pago (R$) *</label>
                        <input type="number" id="valorCurso" required min="0" step="0.01" 
                               placeholder="Ex: 199.90">
                    </div>
                    
                    <div class="form-group">
                        <label>Data da Compra *</label>
                        <input type="date" id="dataCompraCurso" required>
                    </div>
                    
                    <div class="form-group">
                        <label>ROI Estimado (%)</label>
                        <input type="number" id="roiCurso" min="0" max="1000" 
                               placeholder="Ex: 300 (significa 300% de retorno)">
                        <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                            Deixe em branco se não souber
                        </small>
                    </div>
                </form>
            </div>
            
            <div class="modal-financeiro-footer">
                <button class="btn-modal btn-cancelar" onclick="fecharModalFinanceiro()">Cancelar</button>
                <button class="btn-modal btn-confirmar" onclick="document.getElementById('formValorCurso').requestSubmit()">
                    Salvar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Definir data de hoje como padrão
    document.getElementById('dataCompraCurso').valueAsDate = new Date();
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalFinanceiro();
    });
}

// Salvar valor do curso
function salvarValorCurso(event) {
    event.preventDefault();
    
    const cursoId = parseInt(document.getElementById('cursoFinanceiroSelect').value);
    const valor = parseFloat(document.getElementById('valorCurso').value);
    const dataCompra = document.getElementById('dataCompraCurso').value;
    const roi = parseInt(document.getElementById('roiCurso').value) || 0;
    
    // Verificar se já existe
    const index = dadosFinanceiros.cursosComprados.findIndex(c => c.cursoId === cursoId);
    
    if (index >= 0) {
        // Atualizar
        dadosFinanceiros.cursosComprados[index] = {
            cursoId,
            valor,
            dataCompra,
            roi
        };
        mostrarNotificacao('✅ Valor atualizado!');
    } else {
        // Adicionar novo
        dadosFinanceiros.cursosComprados.push({
            cursoId,
            valor,
            dataCompra,
            roi
        });
        mostrarNotificacao('✅ Valor adicionado!');
    }
    
    salvarDadosFinanceiros();
    fecharModalFinanceiro();
    renderizarFinanceiro();
}

// Fechar modal financeiro
function fecharModalFinanceiro() {
    const modal = document.getElementById('modalValorCurso') || 
                  document.getElementById('modalWishlist') || 
                  document.getElementById('modalNotaFiscal');
    if (modal) modal.remove();
}

// Renderizar lista de cursos financeiros
function renderizarListaCursosFinanceiros() {
    const container = document.getElementById('listaCursosFinanceiros');
    
    if (dadosFinanceiros.cursosComprados.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Nenhum valor adicionado ainda</p>';
        return;
    }
    
    container.innerHTML = dadosFinanceiros.cursosComprados.map(cf => {
        const curso = cursos.find(c => c.id === cf.cursoId);
        if (!curso) return '';
        
        const roiClass = cf.roi > 100 ? 'roi-positivo' : 'roi-negativo';
        
        return `
            <div class="curso-financeiro-item">
                <div class="curso-financeiro-info">
                    <div class="curso-financeiro-nome">${curso.nome}</div>
                    <div class="curso-financeiro-detalhes">
                        📅 Comprado em ${new Date(cf.dataCompra).toLocaleDateString('pt-BR')} • 
                        ${curso.categoria}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div class="curso-financeiro-valor">
                        R$ ${cf.valor.toFixed(2).replace('.', ',')}
                    </div>
                    ${cf.roi > 0 ? `
                        <span class="curso-financeiro-roi ${roiClass}">
                            ROI: ${cf.roi}%
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Abrir modal wishlist
function abrirModalWishlist() {
    const modal = document.createElement('div');
    modal.className = 'modal-financeiro show';
    modal.id = 'modalWishlist';
    
    modal.innerHTML = `
        <div class="modal-financeiro-content">
            <div class="modal-financeiro-header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <h3>🛒 Adicionar à Wishlist</h3>
            </div>
            
            <div class="modal-financeiro-body">
                <form id="formWishlist" onsubmit="salvarWishlist(event)">
                    <div class="form-group">
                        <label>Nome do Curso *</label>
                        <input type="text" id="nomeWishlist" required 
                               placeholder="Ex: Master em Python" autocomplete="off">
                    </div>
                    
                    <div class="form-group">
                        <label>Preço (R$) *</label>
                        <input type="number" id="precoWishlist" required min="0" step="0.01" 
                               placeholder="Ex: 499.00">
                    </div>
                    
                    <div class="form-group">
                        <label>Link do Curso</label>
                        <input type="url" id="linkWishlist" 
                               placeholder="https://..." autocomplete="off">
                    </div>
                    
                    <div class="form-group">
                        <label>Plataforma</label>
                        <input type="text" id="plataformaWishlist" 
                               placeholder="Ex: Udemy, Alura, Rocketseat" autocomplete="off">
                    </div>
                </form>
            </div>
            
            <div class="modal-financeiro-footer">
                <button class="btn-modal btn-cancelar" onclick="fecharModalFinanceiro()">Cancelar</button>
                <button class="btn-modal btn-confirmar" onclick="document.getElementById('formWishlist').requestSubmit()">
                    Adicionar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalFinanceiro();
    });
}

// Salvar item na wishlist
function salvarWishlist(event) {
    event.preventDefault();
    
    const item = {
        id: Date.now(),
        nome: document.getElementById('nomeWishlist').value.trim(),
        preco: parseFloat(document.getElementById('precoWishlist').value),
        link: document.getElementById('linkWishlist').value.trim(),
        plataforma: document.getElementById('plataformaWishlist').value.trim(),
        dataAdicao: new Date().toISOString()
    };
    
    dadosFinanceiros.wishlist.push(item);
    salvarDadosFinanceiros();
    fecharModalFinanceiro();
    renderizarFinanceiro();
    
    mostrarNotificacao('✅ Adicionado à wishlist!');
}

// Renderizar wishlist
function renderizarWishlist() {
    const container = document.getElementById('listaWishlist');
    
    if (dadosFinanceiros.wishlist.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Sua wishlist está vazia</p>';
        return;
    }
    
    container.innerHTML = dadosFinanceiros.wishlist.map(item => `
        <div class="wishlist-item">
            <div class="wishlist-item-info">
                <div class="wishlist-item-nome">${item.nome}</div>
                <div class="wishlist-item-preco">
                    💰 R$ ${item.preco.toFixed(2).replace('.', ',')}
                    ${item.plataforma ? ` • 📍 ${item.plataforma}` : ''}
                </div>
            </div>
            <div class="wishlist-item-acoes">
                ${item.link ? `
                    <button class="btn-wishlist-acao btn-comprar" onclick="window.open('${item.link}', '_blank')">
                        🔗 Abrir
                    </button>
                ` : ''}
                <button class="btn-wishlist-acao btn-comprar" onclick="comprarDaWishlist(${item.id})">
                    ✅ Comprei
                </button>
                <button class="btn-wishlist-acao btn-remover-wishlist" onclick="removerDaWishlist(${item.id})">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// Comprar da wishlist
function comprarDaWishlist(itemId) {
    const item = dadosFinanceiros.wishlist.find(w => w.id === itemId);
    if (!item) return;
    
    if (!confirm(`Marcar "${item.nome}" como comprado e adicionar aos cursos?`)) return;
    
    // Criar curso
    const novoCurso = {
        id: Date.now(),
        nome: item.nome,
        categoria: 'Outros',
        status: 'nao-iniciado',
        progresso: 0,
        anotacoes: `Comprado da wishlist por R$ ${item.preco.toFixed(2)}`,
        videoaulas: [],
        dataInicio: new Date().toLocaleDateString('pt-BR'),
        dataUltimaAtualizacao: new Date().toLocaleDateString('pt-BR')
    };
    
    cursos.push(novoCurso);
    salvarDados();
    
    // Adicionar valor financeiro
    dadosFinanceiros.cursosComprados.push({
        cursoId: novoCurso.id,
        valor: item.preco,
        dataCompra: new Date().toISOString().split('T')[0],
        roi: 0
    });
    
    // Remover da wishlist
    dadosFinanceiros.wishlist = dadosFinanceiros.wishlist.filter(w => w.id !== itemId);
    
    salvarDadosFinanceiros();
    renderizarFinanceiro();
    atualizarEstatisticas();
    
    mostrarNotificacao('✅ Curso adicionado e removido da wishlist!');
}

// Remover da wishlist
function removerDaWishlist(itemId) {
    const item = dadosFinanceiros.wishlist.find(w => w.id === itemId);
    if (!item) return;
    
    if (!confirm(`Remover "${item.nome}" da wishlist?`)) return;
    
    dadosFinanceiros.wishlist = dadosFinanceiros.wishlist.filter(w => w.id !== itemId);
    salvarDadosFinanceiros();
    renderizarFinanceiro();
    
    mostrarNotificacao('🗑️ Removido da wishlist!');
}

// Renderizar alertas (simulado)
function renderizarAlertas() {
    const container = document.getElementById('listaAlertas');
    
    // Gerar alertas automáticos baseado na wishlist
    const alertas = [];
    
    dadosFinanceiros.wishlist.forEach(item => {
        // Simular desconto aleatório (em produção, você integraria com APIs reais)
        if (Math.random() > 0.7) {
            const desconto = Math.floor(Math.random() * 50) + 10;
            alertas.push({
                titulo: `🔥 ${item.nome} com ${desconto}% OFF!`,
                descricao: `De R$ ${item.preco.toFixed(2)} por R$ ${(item.preco * (1 - desconto/100)).toFixed(2)}`,
                link: item.link
            });
        }
    });
    
    if (alertas.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Nenhuma promoção ativa no momento</p>';
        return;
    }
    
    container.innerHTML = alertas.map(alerta => `
        <div class="alerta-item">
            <div class="alerta-icon">🎉</div>
            <div class="alerta-info">
                <div class="alerta-titulo">${alerta.titulo}</div>
                <div class="alerta-descricao">${alerta.descricao}</div>
            </div>
            ${alerta.link ? `
                <button class="btn-wishlist-acao btn-comprar" onclick="window.open('${alerta.link}', '_blank')">
                    Ver Oferta
                </button>
            ` : ''}
        </div>
    `).join('');
}

// Gerar nota fiscal
function gerarNotaFiscal() {
    if (dadosFinanceiros.cursosComprados.length === 0) {
        mostrarNotificacao('❌ Adicione valores aos cursos primeiro!');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.id = 'modalNotaFiscal';
    
    const numeroNF = `NF-${Date.now()}`;
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const horaEmissao = new Date().toLocaleTimeString('pt-BR');
    
    const totalGeral = dadosFinanceiros.cursosComprados.reduce((acc, c) => acc + c.valor, 0);
    
    const linhasTabela = dadosFinanceiros.cursosComprados.map((cf, index) => {
        const curso = cursos.find(c => c.id === cf.cursoId);
        if (!curso) return '';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${curso.nome}</td>
                <td>${curso.categoria}</td>
                <td style="text-align: right;">R$ ${cf.valor.toFixed(2).replace('.', ',')}</td>
            </tr>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-container" style="max-width: 850px;">
            <div class="nota-fiscal-container" id="notaFiscalParaDownload">
                <div class="nota-fiscal-header">
                    <h2>📄 NOTA FISCAL DE SERVIÇO</h2>
                    <div class="nota-fiscal-numero">Nº ${numeroNF}</div>
                </div>
                
                <div class="nota-fiscal-body">
                    <div class="nota-fiscal-info">
                        <div>
                            <div class="nota-fiscal-campo">
                                <div class="nota-fiscal-label">EMITENTE</div>
                                <div class="nota-fiscal-valor-campo">Lacerdash</div>
                            </div>
                            <div class="nota-fiscal-campo">
                                <div class="nota-fiscal-label">CNPJ</div>
                                <div class="nota-fiscal-valor-campo">00.000.000/0001-00</div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="nota-fiscal-campo">
                                <div class="nota-fiscal-label">CLIENTE</div>
                                <div class="nota-fiscal-valor-campo">${usuarioAtual}</div>
                            </div>
                            <div class="nota-fiscal-campo">
                                <div class="nota-fiscal-label">DATA DE EMISSÃO</div>
                                <div class="nota-fiscal-valor-campo">${dataEmissao} ${horaEmissao}</div>
                            </div>
                        </div>
                    </div>
                    
                    <table class="nota-fiscal-tabela">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Curso</th>
                                <th>Categoria</th>
                                <th style="text-align: right;">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhasTabela}
                        </tbody>
                    </table>
                    
                    <div class="nota-fiscal-total">
                        <div class="nota-fiscal-total-label">VALOR TOTAL</div>
                        <div class="nota-fiscal-total-valor">R$ ${totalGeral.toFixed(2).replace('.', ',')}</div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer" style="padding: 20px; background: var(--bg-secondary);">
                <button class="btn-modal btn-cancelar" onclick="fecharModalFinanceiro()">Fechar</button>
                <button class="btn-modal btn-confirmar" onclick="baixarNotaFiscal()">
                    📥 Baixar PDF
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fecharModalFinanceiro();
    });
}

// Baixar nota fiscal como PDF
async function baixarNotaFiscal() {
    mostrarNotificacao('📄 Gerando nota fiscal...');
    
    try {
        const elemento = document.getElementById('notaFiscalParaDownload');
        
        // Importar html2canvas se necessário
        if (typeof html2canvas === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            document.head.appendChild(script);
            
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }
        
        const canvas = await html2canvas(elemento, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
        });
        
        // Converter para imagem e baixar
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `nota-fiscal-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
            
            mostrarNotificacao('✅ Nota fiscal baixada!');
        });
        
    } catch (error) {
        console.error('Erro ao gerar nota fiscal:', error);
        mostrarNotificacao('❌ Erro ao gerar nota fiscal!');
    }
}

// Criar gráfico de gastos
function criarGraficoGastos() {
    const ctx = document.getElementById('graficoGastos');
    if (!ctx) return;
    
    if (dadosFinanceiros.cursosComprados.length === 0) {
        if (graficoGastosChart) {
            graficoGastosChart.destroy();
            graficoGastosChart = null;
        }
        return;
    }
    
    // Agrupar por categoria
    const gastosPorCategoria = {};
    dadosFinanceiros.cursosComprados.forEach(cf => {
        const curso = cursos.find(c => c.id === cf.cursoId);
        if (curso) {
            gastosPorCategoria[curso.categoria] = (gastosPorCategoria[curso.categoria] || 0) + cf.valor;
        }
    });
    
    const labels = Object.keys(gastosPorCategoria);
    const data = Object.values(gastosPorCategoria);
    
    const cores = [
        '#10b981', '#3b82f6', '#f59e0b', '#ec4899',
        '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
    ];
    
    if (graficoGastosChart) {
        graficoGastosChart.destroy();
    }
    
    graficoGastosChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Investimento (R$)',
                data: data,
                backgroundColor: cores,
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `R$ ${context.parsed.y.toFixed(2).replace('.', ',')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        },
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--border-color').trim()
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-primary').trim()
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Integrar com showSection
const originalShowSection11 = showSection;
showSection = function(sectionId) {
    originalShowSection11.call(this, sectionId);
    
    if (sectionId === 'financeiro') {
        carregarDadosFinanceiros();
    }
};

// Carregar ao fazer login
carregarDadosFinanceiros();

console.log('💰 Sistema Financeiro carregado!');