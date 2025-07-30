const axios = require('axios');
const ProjectProgress = require('../models/ProjectModel');
const User = require('../models/User');
const CourseProgress = require('../models/CourseProgress');

const CreateProject = async (req,res) => {
    const userId = req.user.id;
    try {
        const progress = await CourseProgress.findOne({ user_id: userId });
        let course_name,topicList;
        console.log("Progress",progress)
        if (!progress ||!progress.topic_history) {
          console.log("course_name",req.user.course);
          course_name = req.user.course;
          topicList = [];
        } else{
            const lastTopics = progress.topic_history.length > 0 
              ? progress.topic_history.map((topicObj) => topicObj.topic_name)
              : [];
            topicList = lastTopics
            course_name = req.user.course;
            console.log("topic names ::",lastTopic || "No topics found");
        }

        try{
            const response = await axios.post('http://localhost:5813/project',{
                "course_name": course_name,
                "topic_names":topicList
            });

            console.log("porject result ::",response.data.response);
            if (progress) {
                await ProjectProgress.updateOne(
                  { _id: Course._id },
                  { 
                    $push: { 
                      Project_history: {
                        Project_outline: response.data.response,
                        date: new Date()
                      }
                    }
                  }
                );
              } else {
                await ProjectProgress.create({
                  user_id: userId,
                  course_name,
                  Project_history: [{
                    Project_outline: response.data.response,
                    date: new Date()
                  }]
                });
              }
              res.json({
                response: response.data.response,
                dueDate: new Date()
              });
        } catch (err) {
            console.error("Error:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }

}

const fetchPorjectHistory = async (req,res) => {
    const userId = req.user.id;
    console.log("From Project History");
    try{
        const progress = await ProjectProgress.findOne({ user_id: userId });
        const lastProject = progress.Project_history.length > 0 
            ? progress.Project_history[progress.Project_history.length - 1]
            : null;
        console.log("Got something ::",lastProject)
        res.json({
            response: lastProject.Project_outline,
            dueDate: lastProject.date
        });
    } catch (err) {
        console.error("Error fetching yesterday's topic:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    CreateProject,
    fetchPorjectHistory
}