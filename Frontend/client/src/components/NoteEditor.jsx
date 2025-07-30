import React, { useState, useEffect, useRef, useMemo, useCallback, useDebugValue  } from 'react';
import { createEditor,Editor, Transforms, Text } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
// import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { useQuizStatus } from '../context/QuizContext';
const colors = ['#FECACA', '#FDE68A', '#C4B5FD', '#99F6E4', '#D9F99D'];
import { useQuizProtection } from '../components/ProtectedRoute'
const NoteEditor = () => {
  const defaultValue = useMemo(() => [
    { type: 'paragraph', children: [{ text: '' }]},
  ], []);

  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const navigate = useNavigate();
  const note_id = useParams();
  const [note, setNote] = useState();
  const [localNote, setLocalNote] = useState(null);
  const [value, setValue] = useState(defaultValue);

  // Sidebar
  const { quizTaken } = useQuizStatus();
  const { checkQuizAndRun } = useQuizProtection();
  const [showSidebar, setShowSidebar] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchNote = async (note_id) => {
    try {
        const res = await fetch("http://localhost:5000/api/fetch-note",{
          method:'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({noteId:note_id}),
        });
        const data = await res.json();
        if(data && typeof data === 'object'){
            setNote(data);
          }
          return data;
    } catch (err) {
      console.error('Failed to fetch note:', err);
    }
  }
  useEffect(() => {
      fetchNote(note_id.noteId);
  },[note_id.noteId]);

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };
  const isValidSlateContent = (content) => {
    return (
      Array.isArray(content) &&
      content.length > 0 &&
      content.every(
        (node) =>
          Array.isArray(node.children) &&
          node.children.every((child) => 'text' in child)
      )
    );
  };

  const handleGenerateSummary = async () => {
    checkQuizAndRun(quizTaken, async() => {
      setIsDrawerOpen(true);
      setShowSummary(true);
      setSummaryLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/fetch-summary/${note_id.noteId}`, {
          credentials: 'include',
        });
        const data = await response.json();
        setSummary(data || 'No summary generated.');
      } catch (err) {
        console.error(err);
        setSummary('Failed to generate summary.');
      }
      setSummaryLoading(false);
    })
  };
  
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    checkQuizAndRun(quizTaken, async() => {
      if(isEditMode){
        setChatLoading(true);
        try{
          const response = await fetch('http://localhost:5000/api/edit-note-with-prompt', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: chatInput,
              currentContent: extractPlainText(value),
            }),
          });

          const data = await response.json();
          console.log("data from AI ::",data);
          const newContentText = data.reply || '';
          if (!newContentText) {
            toast.error("AI couldn't edit the note.");
            return;
          }
          const newContentSlate = [
            { type: 'paragraph', children: [{ text: newContentText }] },
          ];
          setValue(newContentSlate);
          editor.children = newContentSlate;
          editor.onChange();
          toast.success('Note edited successfully! 🎉'); 
        }catch (error) {
          console.error('Failed to edit note:', error);
          toast.error('Failed to edit note.');
        }
        setChatLoading(false);
        setChatInput('');
        setIsEditMode(false);
      }else{
        const userMessage = { sender: 'user', message: chatInput };
        setChatHistory((prev) => [...prev, userMessage]);
        setChatInput('');
        setChatLoading(true);
        
        try {
          const response = await fetch(`http://localhost:5000/api/ask-note/${note_id.noteId}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: chatInput,
            }),
          });
          const data = await response.json();
          const aiMessage = { sender: 'ai', message: data.reply || 'No answer found.' };
          setChatHistory((prev) => [...prev, aiMessage]);
        } catch (err) {
          console.error(err);
          setChatHistory((prev) => [...prev, { sender: 'ai', message: 'Something went wrong.' }]);
        }
        setChatLoading(false);
      }
    });
    setChatInput('');
  };
  
  const isFormatActive = (editor, format) => {
    const [match] = Array.from(
      editor.children.flatMap((node) => node.children || []).filter((n) => n[format])
    );
    return !!match;
  };

  const handleDeleteNote = async (id) => {
    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-4 rounded-xl shadow-xl w-[300px] border border-gray-200 dark:border-gray-700 flex flex-col space-y-4">
        <p className="font-semibold text-lg">Delete this note?</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const response = await fetch(`http://localhost:5000/api/delete-note/${id}`, {
                  method: 'DELETE',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
  
                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error.message || 'Failed to delete note');
                }
  
                toast.success('Note deleted successfully! 🎉');
                navigate(-1); // Go back after deletion
              } catch (error) {
                console.error('Error deleting note:', error);
                toast.error('Failed to delete note. Please try again.');
              }
            }}
            className="px-4 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  const UpdateNote = async (updatedNote) =>{
    try{
      const response = await fetch(`http://localhost:5000/api/update-note/${note._id}`, {
          method:'PUT',
          credentials: 'include',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({note:updatedNote}),
      });
      const data = await response.json();
      return data;
    } catch (err) {
        console.error('Failed to fetch chat history:', err);
    }
  }

  const extractPlainText = (content) => {
    if (!Array.isArray(content)) return '';
    return content.map(node => {
      return node.children?.map(child => child.text).join('') || '';
    }).join('\n');
  };

  const handleSaveNote = async (updatedNote) => {
    const plainText = extractPlainText(updatedNote.content);
    const payload = {
        _id: updatedNote._id,
        title: updatedNote.title,
        content: plainText,
        color: updatedNote.color,
    };
    const saved = await UpdateNote(payload);
  };

  // Update localNote and value when note changes
  useEffect(() => {
    if (!note) {
      const safeDefault = [
        { type: 'paragraph', children: [{ text: '' }] },
      ];
      setLocalNote({ title: '', content: safeDefault, color: colors[0] });
      setValue(defaultValue);

      Transforms.select(editor, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 0 },
      });
      editor.children = safeDefault;
      editor.onChange();
      return;
    }

    const hasValidTitle = typeof note.title === 'string';
    const hasValidColor = typeof note.color === 'string' && colors.includes(note.color);
    
    let parsedContent = defaultValue;
    if (Array.isArray(note.content) && isValidSlateContent(note.content)) {
      parsedContent = note.content;
    } else if (typeof note.content === 'string') {
      // Convert plain text into Slate-compatible format
      parsedContent = [
        {
          type: 'paragraph',
          children: [{ text: note.content }],
        },
      ];
    }else {
      // 💥 FALLBACK if note.content is totally invalid
      parsedContent = [
        {
          type: 'paragraph',
          children: [{ text: '' }],
        },
      ];
    }

    console.log(parsedContent)
    const updatedNote = {
      title: hasValidTitle ? note.title : '',
      content:  parsedContent,
      color: hasValidColor ? note.color : colors[0],
      _id: note._id,
    };
    setLocalNote(updatedNote);
    setValue(updatedNote.content);

    if (parsedContent.length === 0 || !parsedContent[0].children || parsedContent[0].children.length === 0) {
      parsedContent = [
        {
          type: 'paragraph',
          children: [{ text: '' }],
        },
      ];
    }
    // 🔄 Force Slate to re-render content
    try {
      Transforms.select(editor, {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      });
      editor.children = parsedContent;
      editor.onChange();
    } catch (error) {
      console.error("Failed to setup editor safely:", error);
    }
  }, [note, defaultValue]);
  
  const renderLeaf = useCallback(({ attributes, children, leaf }) => {
    if (leaf.bold) children = <strong>{children}</strong>;
    if (leaf.italic) children = <em>{children}</em>;
    if (leaf.underline) children = <u>{children}</u>;
    return <span {...attributes}>{children}</span>;
  }, []);

  // console.log('📝 Initial Slate Value:', value);

  const toggleMark = (format) => {
    const isActive = isFormatActive(editor,format);
    Transforms.setNodes(
      editor,
      { [format]: isActive ? null : true },
      { match: Text.isText, split: true }
    );
  };
  const handleChange = (field, newValue) => {
    setLocalNote((prev) => ({ ...prev, [field]: newValue }));
  };

  const handleSave = (bypassProtection=false) => {
    checkQuizAndRun(quizTaken, async () => {
      const noteToSave = { ...localNote, content: value, _id: localNote._id };
      await handleSaveNote(noteToSave);
      toast.success('Note saved successfully! 🎉');
    });
  };

  if (!localNote) {
    return <div>Loading note...</div>;
  }
  const editorContent = (
    <div className="h-screen w-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden relative">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className="fixed top-1/2 right-0 z-[1100] transform -translate-y-1/2 p-2 rounded-l-full bg-white/80 dark:bg-gray-700/70 shadow-xl border border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 ease-in-out"
      >
        <motion.div
          animate={{ rotate: isDrawerOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold text-gray-700 dark:text-white"
        >
          ▶
        </motion.div>
      </button>
      

      {/* Sidebar */}
      <div className={`fixed top-5 right-0 h-full w-[450px] min-w-[280px] max-w-[600px] bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-l border-gray-300 dark:border-gray-700 rounded-l-2xl shadow-2xl z-50 transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-xl text-slate-800 dark:text-white">AI Summary</h2>
            <button onClick={() => setIsDrawerOpen(false)} className="text-red-500 text-2xl font-bold hover:scale-110 transition-transform">×</button>
          </div>
          {showSummary && (
            <div className="overflow-y-auto mb-4 p-4 bg-white/20 dark:bg-gray-700/30 rounded-lg shadow-inner text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              {summaryLoading ? (
                <p className="italic text-gray-500 dark:text-gray-400">Loading summary...</p>
              ) : (
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 shadow-md border dark:border-gray-700 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-3" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-3" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal ml-6 mb-3" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      code: ({ node, inline, ...props }) =>
                        inline ? (
                          <code className="bg-gray-800 text-yellow-300 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                        ) : (
                          <pre className="bg-gray-900 text-green-400 p-3 rounded-md overflow-auto text-sm mb-4 font-mono">
                            <code {...props} />
                          </pre>
                        ),
                      strong: ({ node, ...props }) => <strong className="font-semibold text-purple-700 dark:text-purple-300" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700 dark:text-gray-300 mb-3" {...props} />
                      ),
                    }}
                  >
                    {summary}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setShowSummary((prev) => !prev)}
            className="mb-2 text-sm self-start text-blue-600 hover:underline"
          >
            {showSummary ? 'Hide Summary' : 'Show Summary'}
          </button>
          <div className="overflow-hidden bg-white/20 dark:bg-gray-700/30 rounded-lg shadow-inner p-3 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`p-2 rounded ${msg.sender === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100 text-left'} dark:bg-gray-700`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                        code: ({ node, inline, ...props }) =>
                          inline ? (
                            <code className="bg-gray-800 text-yellow-300 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                          ) : (
                            <pre className="bg-gray-900 text-green-400 p-3 rounded-md overflow-auto text-sm mb-2 font-mono">
                              <code {...props} />
                            </pre>
                          ),
                        strong: ({ node, ...props }) => <strong className="font-semibold text-purple-700 dark:text-purple-300" {...props} />,
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700 dark:text-gray-300 mb-2" {...props} />
                        ),
                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      }}
                    >
                      {msg.message}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                placeholder={isEditMode ? "Describe how you want to edit the note..." : "Ask about this note..."}
                className="flex-1 p-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800"
              />
              <button 
                onClick={() => setIsEditMode(prev => !prev)}
                className={`px-3 py-1 rounded-lg ${isEditMode ? 'bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white'} transition`}
                title="Toggle Edit Mode"
              >
                ✏️
              </button>
              <button onClick={handleChatSubmit} disabled={chatLoading} className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="h-full w-full shadow-2xl p-8 bg-white dark:bg-gray-900 relative"
        style={{
          background: `linear-gradient(145deg, ${localNote.color}88, ${localNote.color})`,
        }}
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 z-10 bg-white/30 dark:bg-gray-800/30 p-2 rounded-xl backdrop-blur">
          <button onClick={() => navigate(-1)} className="text-blue-700 font-semibold text-md hover:underline transition">← Back</button>
          <div className="space-x-3">
            <button onClick={handleGenerateSummary} className="px-4 py-1 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">Summarize Note</button>
            <button onClick={() => handleDeleteNote(note_id.noteId)} className="text-red-600 font-semibold hover:underline transition">Delete</button>
          </div>
        </div>

        <input
          className="text-3xl font-bold w-full mb-6 bg-white/80 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-3 shadow focus:outline-none placeholder-gray-400 dark:placeholder-gray-300 transition"
          value={localNote.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />

        {/* Toolbar */}
        <div className="flex gap-3 mb-4">
          {['bold', 'italic', 'underline'].map((format) => (
            <button
              key={format}
              onClick={() => {
                toggleMark(format);
              }}
              className={`px-3 py-1 rounded-full font-semibold border transition ${
                isFormatActive(editor, format) ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-200'
              }`}
            >
              {format.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>

        <Slate editor={editor} initialValue={value} onChange={(newValue) => setValue(newValue)}>
          <Editable
            renderLeaf={renderLeaf}
            placeholder="Start writing your thoughts here..."
            className="w-full min-h-[300px] max-h-[45vh] overflow-y-auto text-lg p-4 bg-white/80 dark:bg-gray-700 rounded-xl shadow-inner focus:outline-none custom-scroll"
          />
        </Slate>

        <div className="flex gap-4 mt-6 mb-6">
          {colors.map(color => (
            <div
              key={color}
              className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${localNote.color === color ? 'ring-2 ring-black scale-110' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => {
                setLocalNote((prev) => ({ ...prev, color }));
                if (note._id) {
                  setLocalNote((prev) => ({ ...prev, color })); // Only call if _id exists
                }
              }}
            />
          ))}
        </div>

        <div className="text-rightt">
          <button
            onClick={() => handleSave()}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>

  );
  return editorContent;
};
export default NoteEditor;
  