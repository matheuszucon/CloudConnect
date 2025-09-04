// ===================================================================================
// CONFIGURAÇÃO DA API DO AIRTABLE E AVISO DE SEGURANÇA
// ===================================================================================
// ATENÇÃO: Expor seu Token de API (API Token) no código do frontend (navegador)
// é um RISCO DE SEGURANÇA. Qualquer pessoa pode inspecionar a página e roubar
// seu token, ganhando acesso à sua conta Airtable.
//
// PARA PRODUÇÃO, a abordagem correta é:
// 1. Criar um backend (ex: com Node.js, Python) ou uma Serverless Function.
// 2. Armazenar o token de forma segura no backend como uma variável de ambiente (secret).
// 3. Fazer as chamadas para a API do Airtable a partir do seu backend.
// 4. O frontend se comunica APENAS com o seu backend, nunca diretamente com o Airtable.
//
// Para este exemplo, e se um backend não for uma opção:
// 1. Vá para https://airtable.com/create/tok e crie um novo token.
// 2. Dê ao token um escopo (scope) RESTRITO, permitindo acesso apenas à base
//    e às permissões necessárias (ex: data.records:read, data.records:write).
// 3. SUBSTITUA o token antigo abaixo pelo novo token com escopo limitado.
// ===================================================================================
const API_TOKEN = 'patni6XM2TEmGTI1t.f23a8b748ef5230864de4708afa88c5ba0112eb7468fbcaad1a4c1c1b265a6e9'; // <-- ALERTA DE SEGURANÇA: Substitua por um token de escopo limitado.
const BASE_ID = 'appS86SIiJ8lDO5my';
const TABLE_NAME = 'Clientes';
const API_URL = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

const addForm = document.getElementById('add-contact-form');
const searchInput = document.getElementById('search-input');
const contactTableBody = document.getElementById('contact-table-body');
const contactTableContainer = document.getElementById('contact-table-container');
const tableHead = document.querySelector('#contact-table-container thead');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const emptyState = document.getElementById('empty-state');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-contact-form');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const toastContainer = document.getElementById('toast-container');

let allContacts = [];
let contactToDeleteId = null;
let currentSortColumn = 'Nome';
let currentSortDirection = 'asc';

const showToast = (message, type = 'success') => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = type === 'success' ? 'check-circle' : 'alert-circle';
    const toast = document.createElement('div');
    toast.className = `toast flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor}`;
    toast.innerHTML = `<i data-lucide="${icon}" class="h-6 w-6 mr-3"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.remove(), 3000);
};

const showUIState = (state) => {
    loadingState.classList.toggle('hidden', state !== 'loading');
    errorState.classList.toggle('hidden', state !== 'error');
    emptyState.classList.toggle('hidden', state !== 'empty');
    contactTableContainer.classList.toggle('hidden', state !== 'data');
};

const updateSortIcons = () => {
    const allHeaders = tableHead.querySelectorAll('th[data-sort]');
    allHeaders.forEach(th => {
        const icon = th.querySelector('.sort-icon');
        if (th.dataset.sort === currentSortColumn) {
            icon.setAttribute('data-lucide', currentSortDirection === 'asc' ? 'chevron-up' : 'chevron-down');
        } else {
            icon.setAttribute('data-lucide', 'chevrons-up-down');
        }
    });
    lucide.createIcons();
};

const sortAndRenderContacts = () => {
    const filteredContacts = allContacts.filter(record => {
        const searchTerm = searchInput.value.toLowerCase();
        const { Nome, Email, Telefone } = record.fields;
        return (Nome && Nome.toLowerCase().includes(searchTerm)) || (Email && Email.toLowerCase().includes(searchTerm)) || (Telefone && Telefone.toLowerCase().includes(searchTerm));
    });

    filteredContacts.sort((a, b) => {
        const valA = a.fields[currentSortColumn] || '';
        const valB = b.fields[currentSortColumn] || '';
        const comparison = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
        return currentSortDirection === 'asc' ? comparison : -comparison;
    });
    renderContacts(filteredContacts);
    updateSortIcons();
};

const renderContacts = (contacts) => {
    contactTableBody.innerHTML = '';
    if (contacts.length === 0 && searchInput.value) {
        contactTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Nenhum resultado para a busca.</td></tr>`;
    } else {
        contacts.forEach(record => {
            const { id, fields } = record;
            const { Nome, Email, Telefone } = fields;
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors duration-200';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${Nome || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Email || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${Telefone || ''}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button class="edit-btn text-indigo-600 hover:text-indigo-900 transition-transform duration-200 hover:scale-110" data-record-id="${id}" title="Editar"><i data-lucide="pencil" class="h-5 w-5"></i></button>
                    <button class="delete-btn text-red-600 hover:text-red-900 transition-transform duration-200 hover:scale-110" data-record-id="${id}" title="Excluir"><i data-lucide="trash-2" class="h-5 w-5"></i></button>
                </td>`;
            contactTableBody.appendChild(row);
        });
    }
    lucide.createIcons();
};

const setButtonLoading = (btnId, isLoading) => {
    const btn = document.getElementById(btnId);
    const text = document.getElementById(btnId.replace('-btn', '-text'));
    const spinner = document.getElementById(btnId.replace('-btn', '-spinner'));
    const icon = document.getElementById(btnId.replace('-btn', '-icon'));
    if (!btn || !text || !spinner) return;
    btn.disabled = isLoading;
    text.classList.toggle('hidden', isLoading);
    if (icon) icon.classList.toggle('hidden', isLoading);
    spinner.classList.toggle('hidden', !isLoading);
};

const fetchContacts = async () => {
    if (API_TOKEN.startsWith('SEU_') || BASE_ID.startsWith('SEU_')) {
        errorState.querySelector('p:first-of-type').textContent = 'Configuração da API Incompleta.';
        errorState.querySelector('p:last-of-type').textContent = 'Por favor, edite o código e insira seu API Token e Base ID.';
        showUIState('error');
        return;
    }
    showUIState('loading');
    try {
        const response = await fetch(`${API_URL}?sort%5B0%5D%5Bfield%5D=Nome&sort%5B0%5D%5Bdirection%5D=asc`, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        allContacts = data.records;
        if (allContacts.length > 0) {
            sortAndRenderContacts(); // Usa a função de ordenação para renderizar
            showUIState('data');
        } else {
            showUIState('empty');
        }
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        showUIState('error');
    }
};

const handleAddContact = async (event) => {
    event.preventDefault();
    setButtonLoading('add-submit-btn', true);
    const formData = new FormData(addForm);
    const contactData = { fields: { Nome: formData.get('nome'), Email: formData.get('email'), Telefone: formData.get('telefone') } };
    try {
        const response = await fetch(API_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(contactData) });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        addForm.reset();
        showToast('Contato adicionado com sucesso!');
        await fetchContacts();
    } catch (error) {
        console.error('Erro ao adicionar contato:', error);
        showToast('Falha ao adicionar contato.', 'error');
    } finally {
        setButtonLoading('add-submit-btn', false);
    }
};

const openDeleteModal = (recordId) => {
    contactToDeleteId = recordId;
    deleteModal.classList.remove('hidden');
};

const closeDeleteModal = () => {
    contactToDeleteId = null;
    deleteModal.classList.add('hidden');
};

const confirmDelete = async () => {
    if (!contactToDeleteId) return;
    try {
        const response = await fetch(`${API_URL}/${contactToDeleteId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        showToast('Contato excluído com sucesso!');
        await fetchContacts();
    } catch (error) {
        console.error('Erro ao excluir contato:', error);
        showToast('Falha ao excluir contato.', 'error');
    } finally {
        closeDeleteModal();
    }
};

const handleUpdateContact = async (event) => {
    event.preventDefault();
    setButtonLoading('edit-submit-btn', true);
    const recordId = document.getElementById('edit-record-id').value;
    const updatedData = { fields: { Nome: document.getElementById('edit-nome').value, Email: document.getElementById('edit-email').value, Telefone: document.getElementById('edit-telefone').value } };
    try {
        const response = await fetch(`${API_URL}/${recordId}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData) });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        closeEditModal();
        showToast('Contato atualizado com sucesso!');
        await fetchContacts();
    } catch (error) {
        console.error('Erro ao atualizar contato:', error);
        showToast('Falha ao atualizar contato.', 'error');
    } finally {
        setButtonLoading('edit-submit-btn', false);
    }
};

const openEditModal = (recordId) => {
    const record = allContacts.find(c => c.id === recordId);
    if (!record) return;
    document.getElementById('edit-record-id').value = record.id;
    document.getElementById('edit-nome').value = record.fields.Nome || '';
    document.getElementById('edit-email').value = record.fields.Email || '';
    document.getElementById('edit-telefone').value = record.fields.Telefone || '';
    editModal.classList.remove('hidden');
};

const closeEditModal = () => {
    editModal.classList.add('hidden');
    editForm.reset();
};

/**
 * Aplica uma máscara de telefone (XX) XXXXX-XXXX ao campo de input.
 * @param {Event} event - O evento de input.
 */
const applyPhoneMask = (event) => {
    const input = event.target;
    let value = input.value.replace(/\D/g, ""); // Remove tudo que não é dígito
    value = value.substring(0, 11); // Limita a 11 caracteres (DDD + 9 dígitos)

    if (value.length <= 10) { // Telefone com 8 dígitos (fixo) ou incompleto
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2"); // Coloca parênteses em volta dos dois primeiros dígitos
        value = value.replace(/(\d{4})(\d)/, "$1-$2");  // Coloca hífen entre o quarto e o quinto dígitos
    } else { // Celular com 9 dígitos
        value = value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3"); // Formata para (XX) XXXXX-XXXX
    }
    input.value = value;
};

document.addEventListener('DOMContentLoaded', () => { fetchContacts(); lucide.createIcons(); });
addForm.addEventListener('submit', handleAddContact);
editForm.addEventListener('submit', handleUpdateContact);
cancelEditBtn.addEventListener('click', closeEditModal);
contactTableBody.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    const recordId = target.dataset.recordId;
    if (target.classList.contains('delete-btn')) openDeleteModal(recordId);
    else if (target.classList.contains('edit-btn')) openEditModal(recordId);
});
searchInput.addEventListener('input', sortAndRenderContacts);
confirmDeleteBtn.addEventListener('click', confirmDelete);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

tableHead.addEventListener('click', (event) => {
    const header = event.target.closest('th[data-sort]');
    if (!header) return;
    const newSortColumn = header.dataset.sort;
    if (newSortColumn === currentSortColumn) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = newSortColumn;
        currentSortDirection = 'asc';
    }
    sortAndRenderContacts();
});

// Adiciona listeners para a máscara de telefone
const phoneInput = document.getElementById('telefone');
const editPhoneInput = document.getElementById('edit-telefone');
phoneInput.addEventListener('input', applyPhoneMask);
editPhoneInput.addEventListener('input', applyPhoneMask);
