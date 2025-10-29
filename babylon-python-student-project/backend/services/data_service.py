from flask import jsonify

class DataService:
    def __init__(self):
        self.data = []

    def get_data(self):
        return jsonify(self.data)

    def add_data(self, item):
        self.data.append(item)
        return jsonify({"message": "Item added successfully", "item": item}), 201

    def clear_data(self):
        self.data.clear()
        return jsonify({"message": "Data cleared successfully"})