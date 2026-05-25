class Participant:
    def __init__(self, name, email="", share_percentage=100):
        self.name = name
        self.email = email
        self.share_percentage = share_percentage  # For uneven splits

class ExpenseItem:
    def __init__(self, description, price, payer, participants=None):
        self.description = description
        self.price = price
        self.payer = payer  # Who paid
        self.participants = participants or []  # Who should share

class ExpenseSession:
    def __init__(self):
        self.participants = []
        self.items = []
        self.total = 0
        self.owes = {}  # Who owes whom how much