const Note = require('../models/noteModal')
const axios = require('axios');

const fetchUserNotes = async (req,res) => {
    const user_id = req.user.id;
    try {
        const userNotes = await Note.findOne({user_id:user_id})
        if (!userNotes) {
            return res.status(200).json({ noteCards: [] }); // No notes yet
        }
        res.status(200).json(userNotes.noteCards);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

const createNoteCard = async (req, res) => {
    const user_id = req.user.id;
    const note  = req.body;
    const title = note.note.title;
    const content = note.note.content;
    const color = note.note.color;
    console.log("Get this note for saving::",note.note,title,content,color);
    try {
      let userNotes = await Note.findOne({ user_id });
  
      const newCard = {
        title,
        content,
        updatedAt: new Date(),
        createdAt: new Date(),
        color,
      };
  
      if (userNotes) {
        userNotes.noteCards.unshift(newCard); // Add new noteCard at top
        userNotes.updatedAt = new Date();
        await userNotes.save();
      } else {
        userNotes = new Note({
          user_id,
          noteCards: [newCard],
          updatedAt: new Date(),
        });
        await userNotes.save();
      }
  
      res.status(201).json(userNotes.noteCards[0]); // Return the newly added card
    } catch (error) {
      console.error('Error creating note:', error);
      res.status(500).json({ message: 'Server error' });
    }
};
function getNewOrChangedChunks(oldContent, newContent) {
  const oldParagraphs = oldContent.split('\n').map(p => p.trim()).filter(Boolean);
  const newParagraphs = newContent.split('\n').map(p => p.trim()).filter(Boolean);

  const changed = [];

  newParagraphs.forEach((para) => {
    if (!oldParagraphs.includes(para)) {
      changed.push(para);
    }
  });

  return changed.join('\n\n');
}

const updateNoteCard = async (req, res) => {
    const user_id = req.user.id;
    const { card_id } = req.params;
    const note  = req.body;
    const title = note.note.title;
    const content = note.note.content;
    const color = note.note.color;
    console.log("Get this note for Update ::",note.note,title,content,color);
    
    try {
      const userNotes = await Note.findOne({ user_id });
  
      if (!userNotes) {
        return res.status(404).json({ message: 'Notes not found' });
      }
  
      // Find the specific noteCard
      const noteCard = userNotes.noteCards.id(card_id);
      if (!noteCard) {
        return res.status(404).json({ message: 'NoteCard not found' });
      }

      const changed_content = getNewOrChangedChunks(noteCard.content,content);
      console.log("Changed Text is ::",changed_content,changed_content.length);
      if (changed_content.length != 0){
        axios.post('http://localhost:5813/generate-summary', {
          content: changed_content,
          note_id: card_id,
          user_id:user_id
        }).catch(err => console.error("Summary gen failed:", err));
      }
      
      // Update fields
      if (title !== undefined) noteCard.title = title;
      if (content !== undefined) noteCard.content = content;
      if (color !== undefined) noteCard.color = color;
      noteCard.updatedAt = new Date();
  
      userNotes.updatedAt = new Date();
      await userNotes.save();
  
      res.status(200).json(noteCard);
    } catch (error) {
      console.error('Error updating noteCard:', error);
      res.status(500).json({ message: 'Server error' });
    }
};

const getCardSummary = async (req, res) => {
  const user_id = req.user.id;
  const { card_id } = req.params;
  try {
    const userNotes = await Note.findOne({ user_id });

    if (!userNotes) {
      return res.status(404).json({ message: 'Notes not found' });
    }

    // Find the specific noteCard
    const noteCard = userNotes.noteCards.id(card_id);
    if (!noteCard) {
      return res.status(404).json({ message: 'NoteCard not found' });
    }

    res.status(200).json(noteCard.summary);
  }catch (error) {
    console.error('Error updating noteCard:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const askFromNote = async (req,res) => {
  const { question } = req.body;
  const { card_id } = req.params;
  try {
    const response = await axios.post('http://localhost:5813/ask-note',{ 
      "note_id": card_id,
      "query":question
    });
    console.log(response)
    const reply = response.data?.response || "⚠️ No reply from model.";
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error at /ask:', error.message);
    res.status(500).json({ reply: "⚠️ Failed to get an answer." });
  }
}

const editNote = async (req,res) => {
  const { prompt, currentContent } = req.body;
  try {
    const response = await axios.post('http://localhost:5813/edit-note',{ 
      "currentContent": currentContent,
      "prompt":prompt
    });
    console.log(response)
    const reply = response.data?.response || "⚠️ No reply from model.";
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error at /ask:', error.message);
    res.status(500).json({ reply: "⚠️ Failed to get an answer." });
  }
}
const deleteNoteCard = async (req, res) => {
    const user_id = req.user.id;
    const { card_id } = req.params;

    console.log("id ::",card_id);
    try {
      const userNotes = await Note.findOne({ user_id });
      if (!userNotes) {
        return res.status(404).json({ message: 'No notes found for user' });
      }
  
      const index = userNotes.noteCards.findIndex(card => card._id.toString() === card_id);
      if (index === -1) {
        return res.status(404).json({ message: 'NoteCard not found' });
      }
  
      userNotes.noteCards.splice(index, 1); // Removes the embedded subdocument
      userNotes.updatedAt = new Date();
      await userNotes.save();
  
      res.status(200).json({ message: 'NoteCard deleted successfully' });
    } catch (error) {
      console.error('Error deleting noteCard:', error);
      res.status(500).json({ message: 'Server error' });
    }
};

const fetchNoteCard = async (req,res) => {
  const user_id = req.user.id;
  const { noteId } = req.body;
  
  if (!noteId) {
    return res.status(400).json({ message: 'Note ID is required' });
  }

  try {
    const userNotes = await Note.findOne({ user_id });
    if (!userNotes) {
      return res.status(404).json({ message: 'No notes found for user' });
    }

    const note = userNotes.noteCards.find(
      (n) => n._id.toString() === noteId
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    return res.status(200).json(note);

  }catch (error) {
    console.error('Error fetching noteCard:', error);
    res.status(500).json({ message: 'Server error' });
  }
}


module.exports = {
    fetchUserNotes,
    createNoteCard,
    updateNoteCard,
    deleteNoteCard,
    fetchNoteCard,
    getCardSummary,
    askFromNote,
    editNote
}
  