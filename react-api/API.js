const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;
const { ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});


const { MongoClient } = require('mongodb');
const uri = "mongodb://0.0.0.0:27017/";

app.get('/users/get', async (req, res) => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const users = await client.db("mydb").collection("users").find({}).toArray();
    await client.close();
    res.status(200).send(users);
  } catch (error) {
    console.error("Error in /users route:", error);
    res.status(500).send({
      "status": 'error',
      "message": 'Internal Server Error',
      "error": error.message
    });
  }  
}); 

app.post('/users/post', async (req, res) => {
    try {
        const users = req.body;
        const client = new MongoClient(uri);
        await client.connect();
        
        // ตรวจสอบว่ามี PID ที่ซ้ำกันอยู่ในฐานข้อมูลหรือไม่
        const existingUser = await client.db("mydb").collection("users").findOne({ PID: users.PID });
        if (existingUser) {
            // อัปเดตเวลาของ PID อันเดิม
            await client.db("mydb").collection("users").updateOne(
                { PID: users.PID },
                { $set: { time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }) } }
            );
            await client.close();
            return res.status(200).json({ status: 'ok', message: 'User with PID ' + users.PID + ' is updated' });
        }

        // สร้าง ObjectId ใหม่
        const newId = new ObjectId();
        const currentTime = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }); // สร้างวันที่และเวลาปัจจุบัน
        await client.db("mydb").collection("users").insertOne({ 
            _id: newId, // ใช้ ObjectId เป็นไอดี
            PID: users.PID,
            time: currentTime // เพิ่มฟิลด์ time ที่มีค่าเป็นเวลาปัจจุบัน
        });
        await client.close();
        res.status(200).send({
            "status": 'ok',
            "message": 'User with PID ' + users.PID + ' is started',
        });
    } catch (error) {
        console.error("Error in /users route:", error);
        res.status(500).send({
            "status": 'error',
            "message": 'Internal Server Error',
            "error": error.message
        });
    }
});


app.delete('/users/delete', async (req, res) => {
  try {
    const PID = req.body.PID;
    const client = new MongoClient(uri);
    await client.connect();
    await client.db("mydb").collection("users").deleteOne({ "PID": PID });
    await client.close();
    res.status(200).send({
      "status": 'ok',
      "message": 'User with PID ' + PID + ' is deleted',
    });
  } catch (error) {
    console.error("Error in /users route:", error);
    res.status(500).send({
      "status": 'error',
      "message": 'Internal Server Error',
      "error": error.message
    });
  }
});

app.get('/question/get', async (req, res) => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const users = await client.db("mydb").collection("question").find({}).toArray();
    await client.close();
    res.status(200).send(users);
  } catch (error) {
    console.error("Error in /users route:", error);
    res.status(500).send({
      "status": 'error',
      "message": 'Internal Server Error',
      "error": error.message
    });
  }  
}); 


app.post('/question/post', async (req, res) => {
  try {
    const questionData = req.body;
    const client = new MongoClient(uri);
    await client.connect();

    // ตรวจสอบว่ามีคำถามที่ QuestionsNo ซ้ำกันหรือไม่
    const existingQuestion = await client.db("mydb").collection("question").findOne({ QuestionsNo: questionData.QuestionsNo });
    if (existingQuestion) {
      // ถ้าซ้ำกันให้อัพเดทเฉพาะ message เท่านั้น
      await client.db("mydb").collection("question").updateOne(
        { QuestionsNo: questionData.QuestionsNo },
        { $set: { Message: questionData.Message } }
      );

      await client.close();
      return res.status(200).send({
        "status": 'ok',
        "message": 'Question with QuestionsNo ' + questionData.QuestionsNo + ' is updated',
      });
    } else {
      // ถ้าไม่ซ้ำกันให้ใช้ QuestionsNo จากข้อมูลที่ได้รับมาจากไคลเอ็นต์
      const newId = new ObjectId();
      await client.db("mydb").collection("question").insertOne({
        _id: newId, // ใช้ ObjectId เป็นไอดี
        QuestionsNo: questionData.QuestionsNo,
        Message: questionData.Message
      });

      await client.close();

      return res.status(200).send({
        "status": 'ok',
        "message": 'Question with QuestionsNo ' + questionData.QuestionsNo + ' is posted',
      });
    }
  } catch (error) {
    console.error("Error posting question:", error);
    res.status(500).send({
      "status": 'error',
      "message": 'Internal Server Error',
      "error": error.message
    });
  }
});

app.delete('/question/delete', async (req, res) => {
  try {
    const QuestionsNo = req.body.QuestionsNo;
    const client = new MongoClient(uri);
    await client.connect();
    
    // ตรวจสอบว่ามีคำถามที่ตรงกับ QuestionsNo ที่ระบุหรือไม่
    const deletedQuestion = await client.db("mydb").collection("question").findOne({ "QuestionsNo": QuestionsNo });
    if (!deletedQuestion) {
      await client.close();
      return res.status(404).send({
        "status": 'error',
        "message": 'Question No ' + QuestionsNo + ' not found',
      });
    }
    
    // ลบคำถาม
    await client.db("mydb").collection("question").deleteOne({ "QuestionsNo": QuestionsNo });
    await client.close();
    res.status(200).send({
      "status": 'ok',
      "message": 'Question No ' + QuestionsNo + ' is deleted',
    });
  } catch (error) {
    console.error("Error in /question route:", error);
    res.status(500).send({
      "status": 'error',
      "message": 'Internal Server Error',
      "error": error.message
    });
  }
});








app.post('/answer', (req, res) => {
  if (!req.body || Object.keys(req.body).length !== 1) {
      return res.status(400).json({ error: "Invalid data format" });
  }
  
  const key = Object.keys(req.body)[0];
  if (!data.answer.hasOwnProperty(key)) {
      return res.status(400).json({ error: "Invalid key" });
  }

  data.answer[key] = req.body[key];
  
  res.json({ message: "Answer received successfully" });
});


app.listen(port, () => {
    console.log(`CORS-enabled web server listening on port http://localhost:${port}`);
  });
  