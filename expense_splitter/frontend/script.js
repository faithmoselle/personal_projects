// frontend/script.js
class ExpenseSplitter {
    constructor() {
        this.sessionId = null;
        this.participants = [];
        this.expenses = [];
        this.settlements = [];
        this.apiBaseUrl = 'http://localhost:5000/api';
        
        this.init();
    }

    async init() {
        await this.createSession();
        this.loadFromLocalStorage();
        this.renderParticipants();
        this.renderExpenses();
        this.updateSummary();
        this.setupEventListeners();
    }

    async createSession() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/create_session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            this.sessionId = data.session_id;
            console.log('Session created:', this.sessionId);
        } catch (error) {
            console.error('Error creating session:', error);
            // Fallback to local session ID
            this.sessionId = `local_${Date.now()}`;
        }
    }

    async addParticipant(name, email = '', share = 100) {
        const participant = {
            id: Date.now(),
            name,
            email,
            share
        };

        this.participants.push(participant);
        
        try {
            await fetch(`${this.apiBaseUrl}/add_participant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    name,
                    email,
                    share
                })
            });
        } catch (error) {
            console.error('Error adding participant to backend:', error);
        }

        this.saveToLocalStorage();
        this.renderParticipants();
        this.updateSummary();
        return participant;
    }

    async addExpense(description, amount, payer, participants) {
        const expense = {
            id: Date.now(),
            description,
            amount: parseFloat(amount),
            payer,
            participants,
            date: new Date().toLocaleDateString()
        };

        this.expenses.push(expense);
        
        try {
            await fetch(`${this.apiBaseUrl}/add_item`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    description,
                    price: amount,
                    payer,
                    participants
                })
            });
        } catch (error) {
            console.error('Error adding expense to backend:', error);
        }

        this.saveToLocalStorage();
        this.renderExpenses();
        this.updateSummary();
        return expense;
    }

    async calculateSplit() {
        if (this.participants.length === 0 || this.expenses.length === 0) {
            alert('Add participants and expenses first!');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/calculate/${this.sessionId}`);
            const data = await response.json();
            
            this.settlements = data.debts || [];
            this.renderSettlements();
            this.updateSummary(data.total);
            
        } catch (error) {
            console.error('Error calculating split:', error);
            // Fallback to client-side calculation
            this.calculateClientSide();
        }
    }

    calculateClientSide() {
        // Simple client-side calculation
        const balances = {};
        
        // Initialize balances
        this.participants.forEach(p => balances[p.name] = 0);
        
        // Process expenses
        this.expenses.forEach(expense => {
            balances[expense.payer] -= expense.amount;
            
            const shareCount = expense.participants.length;
            if (shareCount > 0) {
                const sharePerPerson = expense.amount / shareCount;
                expense.participants.forEach(p => {
                    balances[p] += sharePerPerson;
                });
            }
        });
        
        // Generate settlements
        this.settlements = this.simplifyDebts(balances);
        this.renderSettlements();
        
        const total = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        this.updateSummary(total);
    }

    simplifyDebts(balances) {
        const creditors = [];
        const debtors = [];
        
        Object.entries(balances).forEach(([name, balance]) => {
            if (balance > 0) creditors.push({ name, amount: balance });
            else if (balance < 0) debtors.push({ name, amount: -balance });
        });
        
        const settlements = [];
        
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);
        
        while (creditors.length > 0 && debtors.length > 0) {
            const creditor = creditors[0];
            const debtor = debtors[0];
            
            const amount = Math.min(creditor.amount, debtor.amount);
            
            settlements.push({
                from: debtor.name,
                to: creditor.name,
                amount: Math.round(amount * 100) / 100
            });
            
            creditor.amount -= amount;
            debtor.amount -= amount;
            
            if (creditor.amount === 0) creditors.shift();
            if (debtor.amount === 0) debtors.shift();
        }
        
        return settlements;
    }

    renderParticipants() {
        const container = document.getElementById('participantsList');
        container.innerHTML = '';
        
        if (this.participants.length === 0) {
            container.innerHTML = '<p class="placeholder">No participants added yet</p>';
            return;
        }
        
        this.participants.forEach(participant => {
            const div = document.createElement('div');
            div.className = 'participant-item';
            div.innerHTML = `
                <div class="participant-info">
                    <span class="participant-name">${participant.name}</span>
                    ${participant.email ? `<span class="participant-email">${participant.email}</span>` : ''}
                </div>
                <div>
                    <span>${participant.share}% share</span>
                    <button class="delete-btn" onclick="expenseSplitter.deleteParticipant(${participant.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    renderExpenses() {
        const container = document.getElementById('expensesList');
        container.innerHTML = '';
        
        if (this.expenses.length === 0) {
            container.innerHTML = '<p class="placeholder">No expenses added yet</p>';
            return;
        }
        
        this.expenses.forEach(expense => {
            const div = document.createElement('div');
            div.className = 'expense-item';
            div.innerHTML = `
                <div class="expense-info">
                    <span class="expense-description">${expense.description}</span>
                    <span class="expense-details">
                        Paid by ${expense.payer} • ${expense.participants.length} people
                    </span>
                </div>
                <div>
                    <span class="amount">$${expense.amount.toFixed(2)}</span>
                    <button class="delete-btn" onclick="expenseSplitter.deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    renderSettlements() {
        const container = document.getElementById('settlements');
        container.innerHTML = '';
        
        if (this.settlements.length === 0) {
            container.innerHTML = '<p class="placeholder">No settlements to show. Add expenses and calculate split.</p>';
            return;
        }
        
        this.settlements.forEach(settlement => {
            const div = document.createElement('div');
            div.className = 'settlement-item';
            div.innerHTML = `
                <div style="text-align: center;">
                    <span class="settlement-from">${settlement.from}</span>
                    <i class="fas fa-arrow-right" style="margin: 0 10px;"></i>
                    <span class="settlement-to">${settlement.to}</span>
                    <div style="margin-top: 8px;">
                        <span class="settlement-amount">$${settlement.amount.toFixed(2)}</span>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    updateSummary(total = null) {
        if (total === null) {
            total = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        }
        
        document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;
        document.getElementById('itemCount').textContent = this.expenses.length;
        document.getElementById('participantCount').textContent = this.participants.length;
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(e => e.id !== id);
        this.saveToLocalStorage();
        this.renderExpenses();
        this.updateSummary();
    }

    exportData() {
        const data = {
            sessionId: this.sessionId,
            participants: this.participants,
            expenses: this.expenses,
            settlements: this.settlements,
            total: this.expenses.reduce((sum, exp) => sum + exp.amount, 0),
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expense-split-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Data exported successfully!');
    }

    shareResults() {
        if (this.settlements.length === 0) {
            alert('Calculate splits first!');
            return;
        }

        let shareText = "📊 Expense Split Results:\n\n";
        
        this.settlements.forEach(settlement => {
            shareText += `${settlement.from} → ${settlement.to}: $${settlement.amount.toFixed(2)}\n`;
        });

        shareText += `\nTotal: $${this.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareText)
            .then(() => {
                alert('Results copied to clipboard! Share via WhatsApp, email, etc.');
            })
            .catch(() => {
                prompt('Copy the following text:', shareText);
            });
    }

    resetSession() {
        if (confirm('Are you sure you want to reset all data?')) {
            this.participants = [];
            this.expenses = [];
            this.settlements = [];
            localStorage.removeItem('expenseSplitterData');
            this.renderParticipants();
            this.renderExpenses();
            this.renderSettlements();
            this.updateSummary();
            alert('Session reset successfully!');
        }
    }

    saveToLocalStorage() {
        const data = {
            participants: this.participants,
            expenses: this.expenses,
            sessionId: this.sessionId
        };
        localStorage.setItem('expenseSplitterData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('expenseSplitterData');
        if (saved) {
            const data = JSON.parse(saved);
            this.participants = data.participants || [];
            this.expenses = data.expenses || [];
            this.sessionId = data.sessionId || this.sessionId;
        }
    }

    setupEventListeners() {
        // Participant form
        document.getElementById('participantForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('participantName').value;
            const email = document.getElementById('participantEmail').value;
            const share = parseInt(document.getElementById('sharePercentage').value) || 100;
            
            await this.addParticipant(name, email, share);
            closeModal('participantModal');
            e.target.reset();
        });

        // Expense form
        document.getElementById('expenseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const description = document.getElementById('expenseDescription').value;
            const amount = document.getElementById('expenseAmount').value;
            const payer = document.getElementById('expensePayer').value;
            
            // Get checked participants
            const checkboxes = document.querySelectorAll('.participant-checkboxes input[type="checkbox"]:checked');
            const participants = Array.from(checkboxes).map(cb => cb.value);
            
            if (participants.length === 0) {
                alert('Select at least one participant to split with!');
                return;
            }

            await this.addExpense(description, amount, payer, participants);
            closeModal('expenseModal');
            e.target.reset();
        });
    }
}

// Modal Functions
function openAddParticipantModal() {
    document.getElementById('participantModal').style.display = 'flex';
}

function openAddExpenseModal() {
    // Populate payer dropdown
    const payerSelect = document.getElementById('expensePayer');
    payerSelect.innerHTML = '<option value="">Select payer</option>';
    
    // Populate participant checkboxes
    const checkboxesContainer = document.getElementById('participantCheckboxes');
    checkboxesContainer.innerHTML = '';
    
    expenseSplitter.participants.forEach(participant => {
        // Add to payer dropdown
        const option = document.createElement('option');
        option.value = participant.name;
        option.textContent = participant.name;
        payerSelect.appendChild(option);
        
        // Add to checkboxes
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${participant.name}" checked>
            ${participant.name}
        `;
        checkboxesContainer.appendChild(label);
    });
    
    if (expenseSplitter.participants.length === 0) {
        alert('Add participants first!');
        return;
    }
    
    document.getElementById('expenseModal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Initialize the application
const expenseSplitter = new ExpenseSplitter();

// Expose to global scope for onclick handlers
window.expenseSplitter = expenseSplitter;
window.openAddParticipantModal = openAddParticipantModal;
window.openAddExpenseModal = openAddExpenseModal;
window.closeModal = closeModal;
window.calculateSplit = () => expenseSplitter.calculateSplit();
window.exportData = () => expenseSplitter.exportData();
window.shareResults = () => expenseSplitter.shareResults();
window.resetSession = () => expenseSplitter.resetSession();