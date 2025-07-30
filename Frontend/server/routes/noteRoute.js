const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const {
    fetchUserNotes,
    createNoteCard,
    updateNoteCard,
    deleteNoteCard,
    fetchNoteCard,
    getCardSummary,
    askFromNote,
    editNote
} = require('../controllers/noteController');

router.get('/fetch-notes',authMiddleware,fetchUserNotes);
router.get('/fetch-summary/:card_id',authMiddleware,getCardSummary);
router.post('/fetch-note',authMiddleware,fetchNoteCard);
router.post('/create-note',authMiddleware,createNoteCard);
router.post('/ask-note/:card_id',authMiddleware,askFromNote);
router.post('/edit-note-with-prompt',authMiddleware,editNote);
router.put('/update-note/:card_id',authMiddleware, updateNoteCard);
router.delete('/delete-note/:card_id',authMiddleware, deleteNoteCard);

module.exports = router;