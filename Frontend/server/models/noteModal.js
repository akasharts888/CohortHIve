const mongoose = require('mongoose');

const NoteCardSchema = new mongoose.Schema({
    title:String,
    content: String,
    summary:{ type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    color:String,
});

const NoteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  noteCards: [NoteCardSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model('Note', NoteSchema);
