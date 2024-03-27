from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db = client["mydb"]
data = []
@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/users/get', methods=['GET'])
def get_users():
    try:
        users = list(db.users.find({}))
        # Convert ObjectId to string
        for user in users:
            user['_id'] = str(user['_id'])
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"status": "error", "message": "Internal Server Error", "error": str(e)}), 500


@app.route('/users/post', methods=['POST'])
def post_user():
    try:
        user_data = request.json
        existing_user = db.users.find_one({"PID": user_data["PID"]})
        if existing_user:
            db.users.update_one({"PID": user_data["PID"]}, {"$set": {"time": user_data["time"]}})
            return jsonify({"status": "ok", "message": f"User with PID {user_data['PID']} is updated"}), 200
        else:
            user_data["_id"] = ObjectId()
            db.users.insert_one(user_data)
            return jsonify({"status": "ok", "message": f"User with PID {user_data['PID']} is started"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": "Internal Server Error", "error": str(e)}), 500

@app.route('/users/delete', methods=['DELETE'])
def delete_user():
    try:
        PID = request.json["PID"]
        db.users.delete_one({"PID": PID})
        return jsonify({"status": "ok", "message": f"User with PID {PID} is deleted"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": "Internal Server Error", "error": str(e)}), 500
from bson import ObjectId



@app.route('/question/get', methods=['GET'])
def get_questions():
    try:
        questions = list(db.question.find({}))
        data = questions
        print(data)
        for question in questions:
            question['_id'] = str(question['_id'])  # แปลง ObjectID เป็น string
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"status": "error", "message": "Internal Server Error", "error": str(e)}), 500


@app.route('/question/post', methods=['POST'])
def post_question():
    try:
        question_data = request.json
        questions_no = question_data["QuestionsNo"]
        message = question_data["Message"]
        existing_question = db.question.find_one({"QuestionsNo": questions_no})
        if existing_question:
            db.question.update_one({"QuestionsNo": questions_no}, {"$set": {"Message": message}})
            return jsonify({"status": "ok", "message": f"Question with QuestionsNo {question_data['QuestionsNo']} is updated"}), 200
        else:
            question_data["_id"] = ObjectId()
            db.question.insert_one(question_data)
            return jsonify({"status": "ok", "message": f"Question with QuestionsNo {question_data['QuestionsNo']} is posted"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": "Internal Server Error", "error": str(e)}), 500
  
@app.route('/question/delete', methods=['DELETE'])
def delete_question():
    try:
        QuestionsNo = request.json["QuestionsNo"]
        deleted_question = db.question.find_one({"QuestionsNo": QuestionsNo})
        if not deleted_question:
            return jsonify({"status": "error", "message": f"Question No {QuestionsNo} not found"}), 404
        db.question.delete_one({"QuestionsNo": QuestionsNo})
        return jsonify({"status": "ok", "message": f"Question No {QuestionsNo} is deleted"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": "Internal Server Error", "error": str(e)}), 500

@app.route('/answer', methods=['POST'])
def receive_answer():
    try:
        data = request.json
        if not data or len(data) != 1:
            return jsonify({"error": "Invalid data format"}), 400
        key = next(iter(data))
        if key not in ["answer"]:
            return jsonify({"error": "Invalid key"}), 400
        data["answer"][key] = data[key]
        return jsonify({"message": "Answer received successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": "Internal Server Error", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
