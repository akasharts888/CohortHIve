const axios = require('axios');
const CourseProgress = require('../models/CourseProgress');
const User = require('../models/User')
const multer = require('multer');
const fs = require('fs');
const FormData = require("form-data");
const ChatSession = require("../models/chatHistory");

const upload = multer({ dest: 'uploads/' })

const startSession = async (req, res) => {
  const { user_id } = req.body;
  try {
    const newSession = await ChatSession.create({ user_id, messages: [] });
    res.status(201).json({ sessionId: newSession._id });
  } catch (err) {
    res.status(500).json({ error: 'Could not create session' });
  }
};


const handleTopicIntro = async (req, res) => {
  const { message } = req.body;
  console.log("user topic : ",message)
  try {
    const response = await axios.post('http://localhost:5813/course-intro', {
        "user_input":message,
    });
    console.log("generated intro is ::",response.data.response);
    res.status(200).json({ reply: response.data.response });
  } catch (error) {
    console.error('Error forwarding to Python:', error.message);
    res.status(500).json({ reply: "⚠️ Failed to get response from AI." });
  }
};

const handleFollowUp = async (req, res) => {
    const userId = req.user.id;
    const { message ,session_id,file_id} = req.body;
    console.log("user message : ",message,session_id,userId,file_id)
    try {
      const response = await axios.post('http://localhost:5813/ask',{ 
        "user_input": message,
        "user_id":userId,
        "session_id":session_id,
        "file_id":file_id
      });
      console.log(response)
      const reply = response.data?.response || "⚠️ No reply from model.";
      res.status(200).json({ reply });
    } catch (error) {
      console.error('Error at /ask:', error.message);
      res.status(500).json({ reply: "⚠️ Failed to get an answer." });
    }
};

const SuggestQuery = async (req,res) => {
  const { botMsg,userMsg } = req.body;
  console.log("Get call for suggest ::",botMsg.text);

  if (!botMsg) {
    return res.status(400).json({ error: 'Missing reply content' });
  }

  try {
    const pythonResponse = await axios.post('http://localhost:5813/suggest-query', {
      "userMsg": userMsg.text,
      "botMsg": botMsg.text
    });

    const suggestions = pythonResponse.data.response || [];
    console.log("suggestions are ::",suggestions);
    res.json({ suggestions: suggestions.slice(0, 5) });

  } catch (error) {
    console.error('Error calling Python backend:', error.message);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
}

const LiveVoiceChat = async (req,res) => {
  const userId = req.user.id;
  const { input ,session_id} = req.body; 
  console.log("UserInput :: ",input)
  try {
    const response = await axios.post('http://localhost:5813/ask-voice', {
      user_input: input,
      user_id:userId,
      session_id:sess
    });

    res.json({
      response: response.data.response,
      audio: response.data.audio
    });
  } catch (error) {
    console.error("Error with Python API:", error);
    res.status(500).json({ error: "Error fetching data from Python API" });
  }
}


const NewTopic = async (req, res) => {
  const userId = req.user.id;
  const Course = await CourseProgress.findOne({user_id:userId});
  const today = new Date().toISOString().split("T")[0];
  let course_name, topic_names;
  if (Course) {
    course_name = Course.course_name;
    topic_names = Course.topic_history.map(topic => topic.topic_name);
    
    const alreadyHasTodayTopic = Course.topic_history.some(t => {
      const topicDate = new Date(t.date).toISOString().split("T")[0];
      return topicDate === today;
    });
    
    if (alreadyHasTodayTopic) {
      console.log("Topic already provided for today. Skipping Python call.");
      const todayTopic = Course.topic_history.find(
        (t) => new Date(t.date).toISOString().split("T")[0] === today
      );
      
      const friendlyResponse = `
        Welcome back, dear student! 🌟 It looks like you've already explored "${todayTopic.topic_name}" today. 
        Why not take a moment to review it or try some practice exercises to solidify your understanding? 
        If you're eager for more, come back tomorrow for a fresh topic in ${course_name}! Keep shining! ✨
      `;

      return res.json({ response: friendlyResponse }); 
    }
  } else {
    console.log("user_id",userId);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    course_name = user.course; 
    topic_names = [];
  }

  console.log("Payload to Python:", {
    "course_name": course_name,
    "topic_names": topic_names
  });
  try {
    const response = await axios.post('http://localhost:5813/learn', {
      "course_name": course_name,
      "topic_names":topic_names
    })
    
    const Topic_name = response.data.Topic_name
    const explanation = response.data.content

    if (Course) {
      await CourseProgress.updateOne(
        { _id: Course._id },
        { 
          $push: { 
            topic_history: {
              topic_name: Topic_name,
              date: new Date()
            }
          }
        }
      );
    } else {
      await CourseProgress.create({
        user_id: userId,
        course_name,
        topic_history: [{
          topic_name: Topic_name,
          date: new Date()
        }]
      });
    }
    res.json({
      response: explanation,
    });
  } catch (error) {
    console.error("Error with Python API:", error);
    res.status(500).json({ error: "Error fetching data from Python API" });
  }
}

const UploadFile = async (req, res) => {
  const userId = req.user.id;
  const file = req.file;
  const sessionId = req.body.sessionId;

  console.log("Get this data ::",file,sessionId)

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path));
    formData.append('session_id', sessionId);

    const response = await axios.post('http://localhost:5813/upload-file', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('Response from Python backend:', response.data);

    // Delete temp file after sending
    fs.unlink(file.path, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Error deleting temp file:', unlinkErr);
      }
    });
    const uploadedFileName = file.originalname;
    let session = await ChatSession.findOne({ session_id: sessionId, user_id: userId });
    
    if (session) {
      session.uploadedFileName = uploadedFileName;
      await session.save();
    } else {
      const user = await User.findById(userId); // Get username
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const newSession = new ChatSession({
        user_id: userId,
        username: user.username,
        session_id: sessionId,
        messages: [], // Start with empty messages
        uploadedFileName: uploadedFileName
      });
      await newSession.save();
    }
    
    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Error sending file to Python server:', error.message);

    // Clean up file if error
    fs.unlink(file.path, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Error deleting temp file after failure:', unlinkErr);
      }
    });

    return res.status(500).json({ error: 'Failed to forward file to AI server' });
  }
};

module.exports = {
    handleTopicIntro,
    handleFollowUp,
    startSession,
    SuggestQuery,
    LiveVoiceChat,
    NewTopic,
    UploadFile
};
