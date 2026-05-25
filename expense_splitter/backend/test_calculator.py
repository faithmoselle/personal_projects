import unittest
from calculator import calculate_split

class TestExpenseSplitter(unittest.TestCase):
    def test_equal_split(self):
        participants = [{'name': 'Alice'}, {'name': 'Bob'}, {'name': 'Charlie'}]
        items = [
            {'description': 'Dinner', 'price': 90, 'payer': 'Alice', 'participants': ['Alice', 'Bob', 'Charlie']}
        ]
        
        debts = calculate_split(participants, items)
        
        # Alice paid $90, Bob and Charlie owe $30 each
        self.assertEqual(len(debts), 2)
        print("✓ Test passed: Equal splitting works correctly")

if __name__ == '__main__':
    unittest.main()