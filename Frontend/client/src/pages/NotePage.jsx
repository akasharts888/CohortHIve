import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import NoteCard from '../components/Notecard';
import NoteEditor from '../components/NoteEditor';
import { AnimatePresence } from 'framer-motion';
import { CiSearch } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [selectedColor, setSelectedColor] = useState('#FECACA');
    const [editingNote, setEditingNote] = useState(null);
    const [newNoteId, setNewNoteId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    // 🆕 Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const NOTES_PER_PAGE = 8;
    const indexOfLastNote = currentPage * NOTES_PER_PAGE;
    const indexOfFirstNote = indexOfLastNote - NOTES_PER_PAGE;
    
    const filteredNotes = notes.filter(note => {
        const search = searchQuery.toLowerCase();
        const titleMatch = note.title.toLowerCase().includes(search);
        const contentMatch = note.content?.toLowerCase().includes(search); // optional chaining
        return titleMatch || contentMatch;
    });
    const currentNotes = filteredNotes.slice(indexOfFirstNote, indexOfLastNote);
    const totalPages = Math.ceil(filteredNotes.length / NOTES_PER_PAGE);

    const handleEditNote = (noteId) => {
    navigate(`/notes/${noteId}`);
    };
    const fetchNotes = async () => {
        try{
            const response = await fetch('http://localhost:5000/api/fetch-notes',{
                credentials: 'include',
            });
            // console.log("fetched res ::",response);
            const data = await response.json();
            if(data.length>0){
                setNotes(data)
            }
            return data || [];
        } catch (err){
            console.error('Failed to fetch notes history:', err);
        }
    };

    const saveNote = async (note) => {
        const method = note._id ? 'PUT' : 'POST';
        console.log("Note id is ::",note);
        if (note._id) {
            try{
                const response = await fetch(`http://localhost:5000/api/update-note/${note._id}`, {
                    method,
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({note:note}),
                });
                const data = await response.json();
                return data;
            } catch (err) {
                console.error('Failed to fetch chat history:', err);
            }
        } else {
        // Create new note
            try{
                console.log("this is note at front ::",note)
                const response = await fetch(`http://localhost:5000/api/create-note`, {
                    method,
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({note:note}),
                });
                const data = await response.json();
                return data;
            } catch (err) {
                console.error('Failed to fetch chat history:', err);
            }
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleSave = async (note) => {
        const saved = await saveNote(note);
        setNotes((prev) =>
        prev.some(n => n._id === saved._id)
            ? prev.map(n => (n._id === saved._id ? saved : n))
            : [saved, ...prev]
        );
    };

    // Add a new note
    const handleAddNote = async (color) => {
        const newNote = {
            title: 'New Note',
            content: '',
            color: color || selectedColor,
            updatedAt: new Date(),
        };
        const result = await saveNote(newNote);
        setNotes((prev) => [result, ...prev]);
        setNewNoteId(result._id);
        setTimeout(() => setNewNoteId(null), 1000);
    };

    

    return (
        <div className="min-h-screen flex justify-center pt-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 px-6 py-10">
            <div className="w-full max-w-7xl bg-white/60 dark:bg-white/10 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden flex">
                <div className="w-30 p-4 bg-white/30 dark:bg-gray-900/40 p-6 rounded-l-3xl shadow-inner">
                    <Sidebar
                        onAdd={handleAddNote}
                        onColorSelect={setSelectedColor}
                        selectedColor={selectedColor}
                    />
                </div>
                <div className="flex-1 p-10 overflow-auto relative">
                    <div className="relative mb-8 w-full max-w-md mx-auto">
                        <CiSearch className="absolute left-4 top-3 text-gray-400 text-xl" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1); // Optional: reset to page 1 on search
                            }}
                            className="w-full pl-12 pr-5 py-3 text-lg rounded-xl shadow-md focus:ring-2 focus:ring-indigo-400 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-8 tracking-tight">My Notes</h1>
                    {notes.length === 0 ? (
                        <div className="text-gray-500 dark:text-gray-300 italic text-lg">No notes yet. Time to make something brilliant 💡</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 transition-all duration-300">
                                {currentNotes.map((note) => (
                                    <NoteCard key={note._id} note={note} isNew={note._id === newNoteId} />
                                ))}
                            </div>
                            <div className="flex justify-center mt-8 space-x-4">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-gray-700 dark:text-gray-200">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
                </div>
                {/* <AnimatePresence>
                    {editingNote && (
                        <NoteEditor
                        key={editingNote._id}
                        note={editingNote}
                        onClose={() => setEditingNote(null)}
                        onDelete={handleDeleteNote}
                        onSave={handleSaveNote}
                        onColorChange={handleColorChange}
                        />
                    )}
                </AnimatePresence> */}

            </div>
        </div>
    );
};

export default NotesPage;
