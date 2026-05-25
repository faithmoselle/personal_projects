def calculate_split(participants, items):
    """
    Calculate who owes whom based on items and participants
    """
    # Initialize balances
    balances = {p.name: 0 for p in participants}
    
    # Process each item
    for item in items:
        # Subtract from payer (they paid)
        balances[item.payer] -= item.price
        
        # Add to each participant who should pay
        num_sharers = len(item.participants)
        if num_sharers > 0:
            share = item.price / num_sharers
            for sharer in item.participants:
                balances[sharer] += share
    
    # Calculate simplified debts
    debts = simplify_debts(balances)
    return debts

def simplify_debts(balances):
    """
    Simplify debts using cash-flow minimization
    """
    # Group creditors and debtors
    creditors = {k: v for k, v in balances.items() if v > 0}
    debtors = {k: -v for k, v in balances.items() if v < 0}
    
    # Simplified settlement algorithm
    settlements = []
    
    # Simple algorithm: match largest debtor with largest creditor
    while debtors and creditors:
        debtor = max(debtors.items(), key=lambda x: x[1])
        creditor = max(creditors.items(), key=lambda x: x[1])
        
        amount = min(debtor[1], creditor[1])
        settlements.append({
            'from': debtor[0],
            'to': creditor[0],
            'amount': round(amount, 2)
        })
        
        # Update amounts
        debtors[debtor[0]] -= amount
        creditors[creditor[0]] -= amount
        
        # Remove if settled
        if debtors[debtor[0]] == 0:
            del debtors[debtor[0]]
        if creditors[creditor[0]] == 0:
            del creditors[creditor[0]]
    
    return settlements