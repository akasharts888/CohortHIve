from fastapi import FastAPI,HTTPException,UploadFile,Form
import uvicorn
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError,Field
from dotenv import load_dotenv
import os
from langchain.chains import create_retrieval_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from bson.objectid import ObjectId
from datetime import datetime
from typing import List, Union
from langchain.agents import Tool
from langchain_groq.chat_models import ChatGroq
from langchain.schema import SystemMessage, HumanMessage
import json
import re
import logging
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.prebuilt import create_react_agent
from langchain_community.utilities.tavily_search import TavilySearchAPIWrapper
from together import Together
import base64
import tempfile
import pyttsx3
from bson import ObjectId
from datetime import datetime
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from langchain.chains.summarize import load_summarize_chain
from pymongo import MongoClient, ReturnDocument
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.schema import Document
import time
from typing import Optional
from uuid import uuid4

load_dotenv()
app = FastAPI()

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("⚠️ Validation Error:", exc)
    return JSONResponse(
        status_code=422,
        content={"error": "Validation error", "details": exc.errors()},
    )

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    user_input: str
    user_id:str
    session_id:str
    file_id: Optional[bool] = None

class QuizeRequest(BaseModel):
    course_name: str
    topic_name:str

class suggestRequest(BaseModel):
    userMsg: str
    botMsg:str

class NewTopic(BaseModel):
    course_name: str
    topic_names: List[str] = []

class Summary(BaseModel):
    content:str
    note_id:str
    user_id:str

class ChatWithNote(BaseModel):
    note_id:str
    query:str

class EditNote(BaseModel):
    currentContent:str
    prompt:str

# ---- Embedding model setup ----
embed_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
pinecone_api_key = os.getenv("PINECONE_API_KEY")
pinecone_environment = os.getenv("PINECONE_ENVIRONMENT")

pc = Pinecone(api_key=pinecone_api_key)

summary_index_name = "summary"
index_name = "chohorthive"

if summary_index_name not in pc.list_indexes().names():
    pc.create_index(
        name=summary_index_name,
        dimension=384,
        metric='cosine',
        spec=ServerlessSpec(
            cloud='aws',
            region=pinecone_environment
        )
    )
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=384,
        metric='cosine',
        spec=ServerlessSpec(
            cloud='aws',
            region=pinecone_environment
        )
    )

pinecone_summary_index = pc.Index(summary_index_name)
pinecone_index = pc.Index(index_name)

# ---- LangChain vectorstore setup ----

# Loading ENV
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY ")

# model_name = "google/flan-t5-small"
# tokenizer = AutoTokenizer.from_pretrained(model_name)
# model_suggest = AutoModelForSeq2SeqLM.from_pretrained(model_name)
GROQ_MODEL = os.getenv("GROQ_MODEL")
GROQ_API = os.getenv("GROQ_API")
TOGETHER_API = os.getenv("TOGETHER_API")
print("together API ::",TOGETHER_API)
mongoClient = MongoClient("mongodb://localhost:27017/")

db = mongoClient.autotutor

quiz_collection = db.quizresults
course_collection = db.courseprogresses
chat_collection = db.chatsessions
user_collection = db.users
note_collection = db.notes
print(db.list_collection_names())

# groq = Groq(api_key=GROQ_API)
system_message = """
    You are an intelligent, knowledgeable Tutor with deep understanding of all subjects.
    You always answer clearly, kindly, and directly — using your own reasoning.

    ⚠️ If you use external tools (like web-search), NEVER mention or acknowledge them.
    ⚠️ Do NOT say "I searched", "I found online", or "here is what I got from a tool".
    Speak as if everything came from your own expertise.

    Only use the 'web-search' tool if absolutely necessary (e.g., recent events, obscure facts).
    Prefer answering directly whenever possible.

    Your job is to make the student feel like they're learning from a wise teacher, not an AI or tool-user.
"""

system_prompt = SystemMessage(system_message)
def messages_for(user_messages):
    return [
        {"role": "system", "content": system_message},
      {"role": "user", "content": user_messages }
    ]  
llm = ChatGroq(
    groq_api_key=GROQ_API,
    model_name=GROQ_MODEL
)
model2 = Together(api_key=TOGETHER_API)

def extract_final_ai_content(messages):
    for msg in reversed(messages):
        if isinstance(msg, AIMessage) and msg.content.strip():
            return msg.content.strip()
    return None

tavily_tool = TavilySearchAPIWrapper(tavily_api_key=TAVILY_API_KEY)

def tavily_search_wrapper(query: str) -> str:
    result = tavily_tool.results(query=query,max_results=2)
    return "\n".join([r["content"] for r in result])

search_tool = Tool(
    name="web-search",
    func=tavily_search_wrapper,
    description="Useful when a question needs up-to-date or uncommon information from the web."
)

react_agent = create_react_agent(llm, tools=[search_tool],state_modifier=system_prompt)

class LearningResponse(BaseModel):
    new_topic: str = Field(description="The name of the new topic to be learned")
    explanation: str = Field(description="A beginner-friendly, thorough explanation of the topic")

@app.post("/course-intro")
async def topic_intro(chat_request:ChatRequest):
    print("Get a call from /course-intro")
    topic = chat_request.user_input
    print(f"Topic is: ",topic)
    prompt = f"""
            You are an expert educator designing a professional Markdown-formatted course introduction for: "{topic}".

            ## Instructions:

            - Start with a warm, exciting welcome message using a level-1 heading (`#`).
            - Clearly explain what the course is about in 2-3 short paragraphs.
            - Use bullet points to list key concepts covered in the course.
            - Add a section called **"Why Learn This?"** to explain the importance of the topic.
            - Keep the tone professional yet motivating. Speak with clarity, never over-promising.
            - Format the content cleanly using **Markdown syntax** (like headings, bold, lists, and tables).
            - Do not mention AI, tools, limitations, or system behavior.

            🔒 Your response must ONLY be the final Markdown-formatted course intro. No extra messages, no explanations.
        """
    
    try:
        # response = groq.chat.completions.create(model=GROQ_MODEL, messages=messages_for(prompt))
        result_dict = react_agent.invoke({"messages": HumanMessage(prompt)})
        response = extract_final_ai_content(result_dict['messages'])
        
        print(response)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Agent failed: {str(e)}"})

    return JSONResponse(content={"response": response}, status_code=200)

@app.post("/ask-voice")
async def ask_from_voice(chat_request: ChatRequest):
    logger.info("Received request at /ask endpoint.")
    logger.debug(f"Raw chat_request object: {chat_request}")

    try:
        query = chat_request.user_input
        user_id = chat_request.user_id
        session_id = chat_request.session_id
        logger.info(f"User Query: {query} | user_id: {user_id} | session_id: {session_id}")

        user_cursor = user_collection.find_one({"_id": ObjectId(user_id)})
        user_name = user_cursor.get("username", "")
        course_name = user_cursor.get("course", "")
        
        needs_data = check_needs_user_data(query)

        if needs_data.needs_user_data:
            quiz_results, last_topics = DB_Data(user_id,session_id,chat_collection)
            analysis = analyze_performance(quiz_results, last_topics, query)
            profile_summary = f"""
                Learning Analysis:
                {analysis}
            """
        else:
            profile_summary = "No deep learning analysis required for this query."
        
        chat_history = MongoDBChatMessageHistory(
            session_id=session_id,
            connection_string=mongodbUri,
            database_name="autotutor",
            collection_name="chat_histories",
        )

        previous_messages = chat_history.messages
        history_text = "\n".join([msg.content for msg in previous_messages[-3:]])
        
        user_query = f"""
            You are a personal tutor helping a student named {user_name} in the course "{course_name}".
            Your job is to answer the student's question with empathy, accuracy, and clarity.
            Here is a profile of the student based on your internal memory:
            {profile_summary}

            Conversation history:
            {history_text}

            Now, using this background, answer the student’s current question:
            "{query}"

            ⚠️ Do NOT mention any analysis, tools, or models. Answer as if you’re the student's real tutor.
        """
        
        result_dict = react_agent.invoke({"messages": HumanMessage(user_query)})
        response_text = extract_final_ai_content(result_dict['messages'])
        
        chat_history.add_user_message(query)
        chat_history.add_ai_message(response_text)
        # Convert response text to voice using pyttsx3
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
            engine = pyttsx3.init()
            engine.save_to_file(response_text, temp_audio.name)
            engine.runAndWait()

            # Encode MP3 to base64 to send to frontend
            with open(temp_audio.name, "rb") as f:
                audio_bytes = f.read()
                audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        return JSONResponse(content={
            "response": response_text,
            "audio": audio_base64
        }, status_code=200)

    except Exception as e:
        print("Voice Chat Error:", str(e))
        return JSONResponse(status_code=500, content={"error": str(e)})

class NeedsUserDataResponse(BaseModel):
    needs_user_data: bool = Field(description="Does this query need the student's learning data?")

def check_needs_user_data(user_input: str) -> Union[NeedsUserDataResponse, dict]:
    prompt = f"""
    You are an intelligent AI that decides whether a student's question requires access to their learning profile.

    ## Use Case
    Set `needs_user_data = True` when the query:
    - Mentions performance, quizzes, scores, strengths, weaknesses, or progress.
    - Asks for personalized feedback, analysis, next steps, recommendations.
    - Involves learning trajectory, past mistakes, or advice on what to study.
    - Uses phrases like "how am I doing", "my progress", "what should I focus on", etc.

    Otherwise, return `needs_user_data = False`.

    Only return pure JSON:
    {{
        "needs_user_data": true | false
    }}

    User Query:
    "{user_input}"
    """
    try:
        structured_llm = llm.with_structured_output(NeedsUserDataResponse)
        response = structured_llm.invoke(prompt)
        # print("model response is ::",response)
        return response
    except Exception as e:
        print(f"Model is not working fine: {e}")
        return NeedsUserDataResponse(needs_user_data=False)


def get_chat_history(session_id, user_id=None):
    try:
        
        # Build query
        query = {"session_id": session_id}
        if user_id:
            query["user_id"] = ObjectId(user_id) if isinstance(user_id, str) else user_id

        # Fetch the document
        chat_doc = chat_collection.find_one(query)

        if not chat_doc or "messages" not in chat_doc:
            print("No chat document or messages found for this session_id")
            return []

        # Get messages and sort by timestamp (ascending for chronological order)
        messages = chat_doc["messages"]
        messages.sort(key=lambda x: x.get("timestamp", datetime.min))

        last_5_messages = messages[:5]
        # Convert to langchain-like format (optional)
        converted_messages = [
            {"type": "human" if msg["sender"] == "user" else "ai", "data": {"content": msg["text"]}}
            for msg in last_5_messages
        ]

        return converted_messages

    except Exception as e:
        print(f"Error retrieving chat history: {e}")
        return []
    
def DB_Data(user_id,session_id,chat_collect):
    try:
        user_id_obj = ObjectId(user_id) if isinstance(user_id, str) else user_id
    except Exception as e:
        print(f"Invalid user_id format: {e}")
        return {"results": [], "total_documents": 0}
    ## Quiz Data..
    quiz_cursor = quiz_collection.find({"user_id":user_id_obj})
   
    quiz_results = []
    for quiz in quiz_cursor:
        score = quiz.get("score", 0)
        quiz_results.append(score)
    
    ## course_collection...
    progress_cursor = course_collection.find_one({"user_id":user_id_obj})
    last_topics = [topic_obj["topic_name"] for topic_obj in progress_cursor.get("topic_history", [])] if progress_cursor.get("topic_history") else []
    
    ## Last 5 Conversation with this particular session_id if available
    
    return quiz_results, last_topics

def analyze_performance(quiz_results, topics_learned, user_query):
    system_prompt = """
            You are a highly intelligent educational analyst trained in learning science and student performance evaluation.

            Your task is to analyze a student's past quiz performance, learning history, and current question. Based on this, identify the student's strengths, weaknesses, learning intent, and how their current question relates to their course trajectory.

            ⚠️ Always respond in pure JSON. Do not include explanation or extra text.

            Use this format exactly:
            {
            "strengths": [list of topics or skills the user has mastered],
            "weaknesses": [list of concepts the user needs improvement on],
            "query_topic_relation": "related" | "new_topic",
            "user_intent": "clarification" | "deepening_understanding" | "application" | "exploration",
            "summary": "short summary (max 3 sentences) of student's current learning situation"
            }
    """
    # conversation_summary="\n".join([msg.content for msg in conversation_summary])
    user_prompt = f"""
        Total Quizzes Taken: {len(quiz_results)} (each out of 10)
        Quiz Results: {quiz_results}
        Topics Learned: {topics_learned}
        Current User Question: "{user_query}"

        Respond using the exact JSON structure.
    """
    actual_prompt = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    response = model2.chat.completions.create(
                model="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
                messages=actual_prompt
            )
    model2_response = response.choices[0].message.content
    return model2_response


def retrieve_from_pinecone(session_id:str,query:str):
    vectorstore = PineconeVectorStore(index_name=index_name, namespace=session_id, embedding=embed_model)
    retriever = vectorstore.as_retriever()
    retrieved_docs = retriever.get_relevant_documents(query)
    return retrieved_docs
mongodbUri="mongodb://localhost:27017/"
needs_data = ""
@app.post("/ask")
async def agentic_answer(chat_request:ChatRequest):
    logger.info("Received request at /ask endpoint.")
    logger.debug(f"Raw chat_request object: {chat_request}")
    try:
        query = chat_request.user_input
        user_id = chat_request.user_id
        session_id = chat_request.session_id
        logger.info(f"User Query: {query} | user_id: {user_id} | session_id: {session_id}")

        if chat_request.file_id is True:
            file_id_present = True
        elif chat_request.file_id is False or chat_request.file_id is None:
            file_id_present = False
        

        user_cursor = user_collection.find_one({"_id": ObjectId(user_id)})
        user_name = user_cursor.get("username", "")
        course_name = user_cursor.get("course", "")
        
        needs_data = check_needs_user_data(query)

        if needs_data.needs_user_data:
            quiz_results, last_topics = DB_Data(user_id,session_id,chat_collection)
            analysis = analyze_performance(quiz_results, last_topics, query)
            profile_summary = f"""
                Learning Analysis:
                {analysis}
            """
        else:
            profile_summary = "No deep learning analysis required for this query."
        
        chat_history = MongoDBChatMessageHistory(
            session_id=session_id,
            connection_string=mongodbUri,
            database_name="autotutor",
            collection_name="chat_histories",
        )
        if file_id_present:
            relevant_docs = retrieve_from_pinecone(session_id, query)
        else:
            relevant_docs = []

        previous_messages = chat_history.messages
        history_text = "\n".join([msg.content for msg in previous_messages[-3:]])
        print("retreived docs are ::",relevant_docs)
        file_context = ""
        if relevant_docs:
            file_context = f"""
            📄 Relevant File Information (from uploaded file):
            {"".join([doc.page_content for doc in relevant_docs])}
            """
        user_query = f"""
            You are a personal tutor helping a student named {user_name} in the course "{course_name}".
            Your job is to answer the student's question with empathy, accuracy, and clarity.

            Student Profile:
            {profile_summary}

            Conversation history:
            {history_text}

            📄 Uploaded File Content:
            {file_context}  

            ⚡ INSTRUCTION:
            - Always prioritize information from the Uploaded File Content FIRST when answering.
            - If the answer cannot be fully found in the Uploaded File, then and ONLY then, carefully use your general knowledge or web search.
            - Be natural, thoughtful, and explain the reasoning as a wise human tutor would.

            Now, answer the student’s question based on the instructions above:
            "{query}"

            ⚠️ Reminder: Do NOT mention analysis, tools, models, or any process. Speak directly like a human tutor.
        """


        result_dict = react_agent.invoke({"messages": HumanMessage(user_query)})
        response = extract_final_ai_content(result_dict['messages'])
        chat_history.add_user_message(query)
        chat_history.add_ai_message(response)
        return JSONResponse(content={"response": response}, status_code=200)
    except Exception as e:
        print("error we get ::",e)
        return JSONResponse(content={"error": f"{str(e)} and {str(needs_data)}"}, status_code=500)

@app.post("/upload-file")
async def upload_file(file: UploadFile, session_id: str = Form(...)):
    try:
        # Generate a unique file ID
        file_id = str(uuid4())
        logger.info(f"Generated file ID: {file_id}")

        # Save the uploaded PDF file to a temporary location
        file_location = f"temp_{file_id}.pdf"
        with open(file_location, "wb") as f:
            f.write(await file.read())
        logger.info(f"File saved to {file_location}")

        # Step 1: Try to extract digital text using PyPDFLoader
        try:
            loader = PyPDFLoader(file_location)
            docs = loader.load()
            extracted_text = "".join(doc.page_content for doc in docs)
            logger.info(f"Extracted {len(extracted_text)} characters of text using PyPDFLoader")
        except Exception as e:
            logger.error(f"Error extracting text with PyPDFLoader: {str(e)}")
            extracted_text = ""  # Fallback to empty string
            docs = []
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=32)
        final_documents = text_splitter.split_documents(docs)
        
        batch_size = 100
        for i in range(0, len(final_documents), batch_size):
            batch_docs = final_documents[i:i + batch_size]
            try:
                vectors = embed_model.embed_documents([doc.page_content for doc in batch_docs])
            except Exception as embedding_error:
                logger.error(f"Error generating embeddings: {str(embedding_error)}")
                raise HTTPException(status_code=500, detail="Error generating embeddings")

            to_upsert = [
                {
                    "id": f"{file_id}-{i+j}",
                    "values": vector,
                    "metadata": {"text": doc.page_content}
                }
                for j, (vector, doc) in enumerate(zip(vectors, batch_docs))
            ]
            logger.info(f"Upserting {len(to_upsert)} vectors into Pinecone, batch {i // batch_size + 1}")

            try:
                pinecone_index.upsert(vectors=to_upsert, namespace=session_id)
            except Exception as upsert_error:
                logger.error(f"Error upserting vectors into Pinecone: {str(upsert_error)}")
                raise HTTPException(status_code=500, detail="Error upserting vectors into Pinecone")
        os.remove(file_location)
        return {"message": "File uploaded and vectors stored in the vector database", "session_id": session_id}
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/ask")
# async def agentic_answer(chat_request: ChatRequest):
#     print("Get a call from /ask")
#     query = chat_request.user_input

#     async def response_generator():
#         try:
#             # Call the Groq API with streaming enabled
#             # response_stream = groq.chat.completions.create(
#             #     model=GROQ_MODEL,
#             #     messages=messages_for(query),
#             #     stream=True
#             # )
#             response_stream = react_agent.invoke({"messages": HumanMessage(query)})
#             # Use regular for loop for sync iterator inside async generator
#             print("response_stream",response_stream)
#             # for chunk in response_stream:
#             #     if chunk.choices and chunk.choices[0].delta:
#             #         token = chunk.choices[0].delta.content or ""
#             #         if token:
#             #             print(token)
#             #             yield token
#             #         await asyncio.sleep(0)  # Yield control to the event loop

#         except Exception as e:
#             print("error we get ::", e)
#             yield f"\n[ERROR]: {str(e)}"

#     return StreamingResponse(response_generator(), media_type="text/plain")
@app.post("/suggest-query")
async def learn(chat_request: suggestRequest):
    print("Get a call from /suggest-query")
    userMsg= chat_request.userMsg
    botMsg= chat_request.botMsg
    print(f"user query is :: {userMsg,botMsg}")
    try:
        questions = []
        for i in range(1, 4):
            already_generated = "\n".join([f"{idx+1}. {q}" for idx, q in enumerate(questions)])
            sub_prompt = f"""Generate question #{i} that the user might ask next based on the following conversation:
            user: {userMsg}
            bot: {botMsg}

            Do NOT repeat these already generated questions:
            {already_generated if already_generated else 'None'}
            Important: return only the question and nothing else!!
            """
            response = model2.chat.completions.create(
                model="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
                messages=messages_for(sub_prompt)
            )
            print("question is ::",response.choices[0].message.content)
            questions.append(response.choices[0].message.content)
        return JSONResponse(content={"response": questions}, status_code=200)
    except Exception as e:
        print("error we get ::",e)
        return JSONResponse(content={"error": str(e)}, status_code=500)

def generate_combined_prompt(course_name: str, taught_topics: list[str]) -> str:
    taught_str = ", ".join(taught_topics) if taught_topics else "nothing yet"
    
    return f"""
    You are an expert AI tutor for the course '{course_name}' with dual capabilities:
    1. Curriculum planning (suggesting new topics)
    2. Detailed topic teaching
    
    The student has learned: {taught_str}
    
    Your tasks:
    1. Suggest ONE new relevant topic they haven't learned and try to make the course outline as beginner to advance level
    2. Provide a comprehensive explanation of that topic
    
    Requirements:
    - The new topic must logically follow their current progress and be relevant to recent trends in '{course_name}'.
    - The explanation should be beginner-friendly yet thorough
    - Include 1-2 practical examples
    - Make the content easy to understand for a beginner-to-intermediate student.
    - Use clear formatting with paragraphs and bullet points
    
    Respond in this exact JSON format:
    {{
        "new_topic": "string (topic name only)",
        "explanation": "A beginner-friendly, thorough explanation of the topic in plain string format"
    }}
    """

def generate_project_prompt(course, topics: list[str]):
    topics_list = "\n".join(f"- {topic}" for topic in topics)
    return f"""
        You are a curriculum designer for AI education. A student is learning the course: "{course}".

        They have already covered the following topics:
        {topics_list}

        Your task is to design a mini project that:
        - Reinforces these concepts
        - Encourages practical application
        - Is achievable for a learner at this level
        - Includes a short project description, goals, and suggested steps

        Return only the project in a clean, student-friendly format.
"""
# @app.post("/project")
# async def porject_generator(chat_request: NewTopic):
#     print(f"Received request - Course: {chat_request.course_name}, Topics: {chat_request.topic_names}")
#     course_name = chat_request.course_name
#     topic_history = chat_request.topic_names
#     user_prompt = generate_project_prompt(course_name,topic_history)
#     try:
#         response = model2.chat.completions.create(
#             model="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
#             messages=messages_for(user_prompt)
#         )
#         response = response.choices[0].message.content
#         return JSONResponse(content={"response": response}, status_code=200)
#     except Exception as e:
#         print(f"Error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Failed to generate structured output: {str(e)}")



def update_summary(user_id: str, note_id: str, summary: str):
    result = note_collection.update_one(
        {"user_id": ObjectId(user_id), "noteCards._id": ObjectId(note_id)},
        {
            "$set": {
                "noteCards.$.summary": summary,
                "noteCards.$.updatedAt": datetime.utcnow()
            }
        }
    )
    return result.modified_count

@app.post("/generate-summary")
async def generateSummary(summary_request:Summary):
    note_id = summary_request.note_id
    content = summary_request.content
    user_id = summary_request.user_id

    docs = [Document(page_content=content)]
    # 1. Split long content into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    summary_vectorstore = PineconeVectorStore(index_name=summary_index_name, namespace=note_id, embedding=embed_model)
    # 2. Store chunks in Pinecone under namespace=note_id
    
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
            batch_docs = chunks[i:i + batch_size]
            try:
                vectors = embed_model.embed_documents([doc.page_content for doc in batch_docs])
            except Exception as embedding_error:
                logger.error(f"Error generating embeddings: {str(embedding_error)}")
                raise HTTPException(status_code=500, detail="Error generating embeddings")

            to_upsert = [
                {
                    "id": f"{note_id}-{i+j}",
                    "values": vector,
                    "metadata": {"text": doc.page_content}
                }
                for j, (vector, doc) in enumerate(zip(vectors, batch_docs))
            ]
            logger.info(f"Upserting {len(to_upsert)} vectors into Pinecone, batch {i // batch_size + 1}")

            try:
                pinecone_summary_index.upsert(vectors=to_upsert, namespace=note_id)
            except Exception as upsert_error:
                logger.error(f"Error upserting vectors into Pinecone: {str(upsert_error)}")
                raise HTTPException(status_code=500, detail="Error upserting vectors into Pinecone")
   
    retriever = summary_vectorstore.as_retriever()
    while True:
        retrieved_docs = retriever.get_relevant_documents("Summarize the content.")
        if not len(retrieved_docs)>0:
            time.sleep(5)
        else:
            break
    retrieved_docs = retriever.get_relevant_documents("Summarize the content.")
    print("retreived docs are ::",retrieved_docs)
    summarize_chain = load_summarize_chain(llm=llm, chain_type="stuff")
    summary = summarize_chain.run(retrieved_docs)
    print("Generated summary is ::",summary)
    update_count = update_summary(user_id=user_id, note_id=note_id, summary=summary)

    print(update_count)
    if update_count == 0:
        return {"message": "Failed to update summary in MongoDB."}
    else:
        return {"note_id": note_id, "summary": summary, "message": "Summary saved successfully."}

@app.post("/edit-note")
async def generateSummary(edit_note:EditNote):
    currentContent = edit_note.currentContent
    query = edit_note.prompt

    instruction = """
        You are an intelligent text editor. 
        Your job is to edit the user's provided text according to their editing prompt. 
        Focus on improving grammar, clarity, tone, and flow without changing the original meaning unless specifically requested. 
        Respond with only the fully edited text without any extra comments or explanations.
    """
    prompt = [
        {"role": "system", "content": instruction},
        {"role": "user", "content": f"Edit the following text: \n\nUser Request: {query}.\n\nNote Content: {currentContent}"}
    ]
    try:
        response = llm.invoke(prompt)
        final_response = response.content
        print("model response is ::",final_response)

        return JSONResponse(content={"response": final_response}, status_code=200)
    except Exception as e:
        print("error we get ::",e)
        return JSONResponse(content={"error": str(e)}, status_code=500)




@app.post("/ask-note")
async def askQueryNote(chat_request:ChatWithNote):
    note_id = chat_request.note_id
    query = chat_request.query
    vectorstore = PineconeVectorStore(index_name=summary_index_name, namespace=note_id, embedding=embed_model)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 40})
    prompt = ChatPromptTemplate.from_template(
        """
        You are a helpful assistant. If the context is not relevant to the query then use your own knowledgebase for the answer otherwise answer the questions based on the provided context only.
        Please provide the most accurate response based on the question
        <context>
        {context}
        </context>
        Question: {input}
        """
    )
    document_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(retriever, document_chain)
    try:
        response = retrieval_chain.invoke({"input": query})  # Process the query and get the result
        print("Model response is ::",response["answer"])
        return JSONResponse(content={"response": response["answer"]}, status_code=200)  # Return the response to the user
    except Exception as e:
        print("error we get ::",e)
        return JSONResponse(content={"error": f"{str(e)} and {str(needs_data)}"}, status_code=500)

def sanitize_json_like_string(text: str) -> str:
    # Strip out tags like <tool-use> or Markdown fences
    text = re.sub(r"<[^>]+>", "", text)
    text = text.strip().removeprefix("```json").removesuffix("```").strip()

    lines = text.splitlines()
    joined = " ".join(line.strip() for line in lines)
    
    return joined

@app.post("/learn") 
async def learn(chat_request: NewTopic):
    print(f"Received request - Course: {chat_request.course_name}, Topics: {chat_request.topic_names}")
    course_name = chat_request.course_name
    topic_history = chat_request.topic_names
    # Pick a new topic from topic pool

    user_prompt = generate_combined_prompt(course_name,topic_history)
    try:
        agent_result = react_agent.invoke({"messages": HumanMessage(user_prompt)})
        draft_response = extract_final_ai_content(agent_result['messages'])

        if not draft_response:
            raise ValueError("No valid response from ReAct agent")
        
        draft_response = draft_response.strip().removeprefix("```json").removesuffix("```").strip()
        # print("raw result ::",result)
    
        try:
            safe_response = sanitize_json_like_string(draft_response)
            json_data = json.loads(draft_response)
            new_topic = json_data.get("new_topic", "")
            explanation = json_data.get("explanation", "")
            if new_topic and explanation:
                return JSONResponse(content={
                    "Topic_name":new_topic,
                    "content":explanation
                })
        except json.JSONDecodeError as e:
                print(f"Didn't get valid response from model {e}")
                pass
        print(f"Drafted result from the model is {draft_response}")
        structuring_prompt = f"""
            You are an AI tutor tasked with formatting a response into a specific JSON schema.
            Below is a draft response from an AI agent about a new topic for the course '{course_name}':

            {draft_response}

            Your task is to extract or infer the new topic name only and its explanation from the draft, ensuring it aligns with the course and is trending or relevant. If the draft is incomplete or unclear, use your knowledge to provide a suitable topic name and explanation based on the course '{course_name}' and the taught topics: {', '.join(topic_history) or 'none'}.

            Requirements:
            - The new topic name  must be relevant to '{course_name}' and logically follow the taught topics.
            - The explanation must be beginner-friendly, thorough, and include 1-2 practical examples.
            - Use clear formatting with paragraphs and bullet points.
            - Make the content easy to understand for a beginner-to-intermediate student.
            - Use clear formatting with paragraphs and bullet points
    
            Return the response in the following JSON format:
            {{
                "new_topic": "string (topic name only)",
                "explanation": "A beginner-friendly, thorough explanation of the topic in plain string format"
            }}
            """
        # Bind the schema to the model for structured output
        model_with_structure = llm.with_structured_output(LearningResponse)
        # Invoke the model to structure the response
        structured_output = model_with_structure.invoke([
            system_prompt,
            HumanMessage(content=structuring_prompt)
        ])

        # Extract the fields from the Pydantic object
        new_topic = structured_output.new_topic
        explanation = structured_output.explanation
        print(f"Topic name ::",new_topic)
        print(f"explanation ::",explanation)

        return JSONResponse(content={
            "Topic_name":new_topic,
            "content":explanation
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        
        # Attempt to extract valid JSON from failed_generation if available
        try:
            print("Get into last Try Catch Block!!")
            error_str = str(e)
            failed_gen_match = re.search(r"'failed_generation':\s*'({.*?})'\s*}", error_str, re.DOTALL)
            if failed_gen_match:
                raw_failed_json = failed_gen_match.group(1).encode('utf-8').decode('unicode_escape')  # handle escaped newlines
                json_candidate = json.loads(raw_failed_json)
                
                # Optional: Clean unwanted tags from explanation
                explanation_raw = json_candidate.get("explanation", "")
                cleaned_explanation = re.sub(r'<[^>]+>', '', explanation_raw).strip()
                
                return JSONResponse(content={
                    "Topic_name": json_candidate.get("new_topic", ""),
                    "content": cleaned_explanation
                })
        except Exception as inner_e:
            print(f"Couldn't parse from failed_generation either: {inner_e}")

        raise HTTPException(status_code=500, detail=f"Failed to generate structured output: {str(e)}")

@app.post("/generate-quize")
async def genrateQuize(quize_request:QuizeRequest):
    print("Get a call from /generate-quiz")
    course_name = quize_request.course_name
    topic_name = quize_request.topic_name or " "
    if not quize_request.topic_name:
        topic_name = course_name
    print(f"Generating quiz for: {course_name} ,topic: {topic_name}")
    prompt = f"""
        You are an intelligent and strict tutor teaching {course_name}.
        Your task is to generate a quiz for the topic: "{topic_name}".

        Instructions:
        - Create 10 multiple-choice questions (MCQs).
        - Each question must have 4 options: A, B, C, D.
        - Provide the correct answer for each.
        - Provide a brief explanation for why the correct answer is correct.
        - Format the output as a JSON object like:
        {{
            "quiz": [
                {{
                    "question": "What is ...?",
                    "options": {{
                        "A": "...",
                        "B": "...",
                        "C": "...",
                        "D": "..."
                    }},
                    "answer": "B",
                    "explanation": "Option B is correct because ..."
                }},
                ...
            ]
        }}

        If the topic is recent or trending (like current LLM models or tools), feel free to do a quick search first before generating the quiz.
        Return ONLY the JSON.
    """

    # print(response)
    try:
        result_dict = react_agent.invoke({"messages": HumanMessage(prompt)})
        result = extract_final_ai_content(result_dict['messages'])
        # response = groq.chat.completions.create(
        #     model=GROQ_MODEL,
        #     messages=messages_for(prompt)
        # )
        # print(result)
        # model_response = response.choices[0].message.content
        # model_response = model_response.strip("```json").strip("```").strip()
        # json_str_match = re.search(r"\{[\s\S]*\}", model_response)
        # if not json_str_match:
        #     raise ValueError("No JSON found in the response")

        # json_str = json_str_match.group(0)
        # print("Extracted JSON string:", json_str)
        # try:
        #     quiz_dict = json.loads(json_str)
        # except json.JSONDecodeError as e:
        #     return JSONResponse(status_code=500, content={"error": f"JSON decode failed: {e}"})
        # if isinstance(quiz_dict, dict) and "quiz" in quiz_dict:
        #     quiz_data = quiz_dict["quiz"]
        # elif isinstance(quiz_dict, list):
        #     quiz_data = quiz_dict
        # else:
        #     return JSONResponse(status_code=500, content={"error": "Unexpected format in model response"})

        # return JSONResponse(content=quiz_data, status_code=200)
    # except Exception as e:
    #     print("error we get ::",e)
    #     return JSONResponse(content={"error": str(e)}, status_code=500)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Agent failed: {str(e)}"})
    try:
        result_clean = result.strip("```json").strip("```").strip()
        json_str_match = re.search(r"\{[\s\S]*\}", result_clean)
        if not json_str_match:
            raise ValueError("No valid JSON structure found.")
        quiz_dict = json.loads(json_str_match.group(0))
    except json.JSONDecodeError as e:
        return JSONResponse(status_code=500, content={"error": f"JSON decode failed: {e}"})
     # Extract quiz list
    quiz_data = quiz_dict.get("quiz", quiz_dict if isinstance(quiz_dict, list) else [])
    
    return JSONResponse(content=quiz_data, status_code=200)

if __name__=="__main__":
    uvicorn.run(app, host="0.0.0.0",port=5813)

