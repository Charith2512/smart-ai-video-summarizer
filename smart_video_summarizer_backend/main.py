from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import shutil
import os
import hashlib
import json



from services.summarization import summarize_text, extract_and_summarize
from services.export_service import export_service
from services.video_service import video_service
from services.video_service import video_service
from database import engine, get_db
import models
from fastapi.responses import FileResponse

# Global Task Registry for Cancellation
active_tasks: Dict[str, bool] = {}

# Create Database Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart AI Video Summarizer Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files (Uploads)
# Ensure directory exists
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

class TextSummaryRequest(BaseModel):
    text: str
    length: str = "medium"
    format_mode: str = "paragraph"
    format_mode: str = "paragraph"
    user_id: Optional[str] = None # New Field
    force_new: bool = False

class ExportRequest(BaseModel):
    text: str

class YoutubeRequest(BaseModel):
    url: str
    length: str = "medium"
    format_mode: str = "paragraph"
    user_id: Optional[str] = None
    force_new: bool = False
    task: str = "summary" # "summary" or "highlights"
    request_id: Optional[str] = None # Unique ID for cancellation

@app.post("/cancel_processing/{request_id}")
async def cancel_processing(request_id: str):
    if request_id in active_tasks:
        active_tasks[request_id] = False # Mark as cancelled
        print(f"[CANCEL] Request {request_id} marked for cancellation.")
        return {"status": "cancelled"}
    return {"status": "not_found"}

class ExportVideoRequest(BaseModel):
    url: str
    highlights: List[dict] # [{start, end, title}]
    quality: str = "720p"


# Response Model for History
class HistoryResponse(BaseModel):
    id: int
    input_type: str
    input_content: str
    summary_output: str
    created_at: str
    file_path: Optional[str] = None
    original_filename: Optional[str] = None
    preference: str = "medium"
    format_mode: str = "paragraph"
    orig_words: int = 0
    summ_words: int = 0
    orig_sentences: int = 0
    summ_sentences: int = 0
    orig_chars: int = 0
    summ_chars: int = 0

@app.get("/")
def read_root():
    return {"message": "Smart AI Video Summarizer API is running"}

@app.post("/summarize/text")
async def summarize_text_endpoint(
    request: TextSummaryRequest, 
    db: Session = Depends(get_db)
):
    try:
        # 1. Compute Hash Immediately
        content_hash = hashlib.sha256(request.text.encode('utf-8')).hexdigest()

        # 2. Check for Duplicates BEFORE AI Processing
        if request.user_id:
            existing = db.query(models.History).filter(
                models.History.user_id == request.user_id,
                models.History.content_hash == content_hash,
                models.History.preference == request.length,
                models.History.format_mode == request.format_mode
            ).first()

            if existing and not request.force_new:
                print(f"[CACHE] Text Hit found for user {request.user_id}")
                return {
                    "status": "duplicate",
                    "summary": {
                         "summary_text": existing.summary_output,
                         "stats": {
                             "original": {
                                 "words": existing.orig_words,
                                 "sentences": existing.orig_sentences,
                                 "chars": existing.orig_chars
                             },
                             "summary": {
                                 "words": existing.summ_words,
                                 "sentences": existing.summ_sentences,
                                 "chars": existing.summ_chars
                             }
                         }
                    }
                }

        # 3. Proceed with AI Processing only if no duplicate
        summary_result = summarize_text(request.text, request.length, request.format_mode)
        final_summary = summary_result.get("summary_text", "")
        stats = summary_result.get("stats", {})
        orig = stats.get("original", {})
        summ = stats.get("summary", {})

        # Save to History if user_id is present AND no error occurred
        if request.user_id and not (
            final_summary.startswith("[ERROR]") or 
            final_summary.startswith("Critical Error") or 
            final_summary.startswith("Failed to extract")
        ):
            db_record = models.History(
                # ...
                content_hash=content_hash,
                user_id=request.user_id,
                input_type="text",
                input_content=request.text,
                summary_output=final_summary,
                preference=request.length,
                format_mode=request.format_mode,
                orig_words=orig.get("words", 0),
                summ_words=summ.get("words", 0),
                orig_sentences=orig.get("sentences", 0),
                summ_sentences=summ.get("sentences", 0),
                orig_chars=orig.get("chars", 0),
                summ_chars=summ.get("chars", 0)
            )
            db.add(db_record)
            db.commit()
            db.refresh(db_record)

        return {"summary": summary_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize/upload_pdf")
def summarize_pdf_endpoint(
    file: UploadFile = File(...), 
    length: str = Form("medium"),
    format_mode: str = Form("paragraph"),

    # Accept user_id from Form Data
    user_id: str = Form(None), 
    force_new: bool = Form(False),
    db: Session = Depends(get_db)
):
    # Save file permanently if user is logged in
    file_directory = "uploads" if user_id else "."
    saved_filename = f"{file.filename}" 
    file_location = os.path.join(file_directory, saved_filename)
    
    # If temp execution needed separately, we can handle logic, but let's overwrite for simplicity 
    # or prefix with timestamp to avoid collisions (omitted for brevity)
    
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Compute Hash of File
        sha256_hash = hashlib.sha256()
        with open(file_location, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        content_hash = sha256_hash.hexdigest()

        # Check Duplicate
        if user_id:
            existing = db.query(models.History).filter(
                models.History.user_id == user_id,
                models.History.content_hash == content_hash,
                models.History.preference == length,
                models.History.format_mode == format_mode
            ).first()

            if existing and not force_new:
                 return {
                    "status": "duplicate",
                    "summary": {
                         "summary_text": existing.summary_output,
                         "stats": {
                             "original": {
                                 "words": existing.orig_words,
                                 "sentences": existing.orig_sentences,
                                 "chars": existing.orig_chars
                             },
                             "summary": {
                                 "words": existing.summ_words,
                                 "sentences": existing.summ_sentences,
                                 "chars": existing.summ_chars
                             }
                         }
                    }
                }

        summary_result = extract_and_summarize(file_location, file.content_type, length, format_mode)
        final_summary = summary_result.get("summary_text", "")
        stats = summary_result.get("stats", {})
        orig = stats.get("original", {})
        summ = stats.get("summary", {})

        # Save to History (Only if successful)
        if user_id and not (
            final_summary.startswith("[ERROR]") or 
            final_summary.startswith("Critical Error") or 
            final_summary.startswith("Failed to extract")
        ):
            # Construct accessible URL or Relative Path
            # We'll store relative path: "uploads/filename.pdf"
            relative_access_path = f"uploads/{saved_filename}"

            db_record = models.History(
                content_hash=content_hash,
                user_id=user_id,
                input_type="pdf",
                input_content=f"PDF: {file.filename}",
                summary_output=final_summary,
                file_path=relative_access_path,
                preference=length,
                format_mode=format_mode,
                orig_words=orig.get("words", 0),
                summ_words=summ.get("words", 0),
                orig_sentences=orig.get("sentences", 0),
                summ_sentences=summ.get("sentences", 0),
                orig_chars=orig.get("chars", 0),
                summ_chars=summ.get("chars", 0)
            )
            db.add(db_record)
            db.commit()
        
        return {"summary": summary_result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    # finally:
    #     # Do not delete if we want to keep it. 
    #     # Only delete if it was a temp run for anonymous user? 
    #     # For now, let's keep all files to support the "Open PDF" feature requested.
    #     pass

@app.get("/history/{user_id}")
def get_user_history(user_id: str, db: Session = Depends(get_db)):
    """Fetch all history items for a specific user, ordered by newest first."""
    history = db.query(models.History).filter(models.History.user_id == user_id).order_by(models.History.created_at.desc()).all()
    return history

@app.delete("/history/{history_id}")
def delete_history_item(history_id: int, db: Session = Depends(get_db)):
    """Delete a specific history item by ID."""
    item = db.query(models.History).filter(models.History.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History item not found")
    
    # Optionally delete file if exists
    if item.file_path and os.path.exists(item.file_path):
        try:
            os.remove(item.file_path)
        except:
            pass # Ignore file deletion errors

    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}

@app.delete("/history/clear/{user_id}")
def clear_user_history(user_id: str, filter_type: str = "all", db: Session = Depends(get_db)):
    """Delete history items for a specific user, optionally filtered by type."""
    query = db.query(models.History).filter(models.History.user_id == user_id)

    if filter_type == "highlights":
        # Delete only items that have highlights data
        query = query.filter(models.History.highlights != None)
    elif filter_type != "all" and filter_type != "compare":
        # 'compare' is a frontend-only concept, usually backed by 'all' or specific types
        # For other types (text, pdf, video), filter by input_type
        query = query.filter(models.History.input_type == filter_type)

    items = query.all()
    
    # Optional: Cleanup files
    for item in items:
        if item.file_path and os.path.exists(item.file_path):
            try:
                os.remove(item.file_path)
            except:
                pass

    # Bulk Delete
    # query.delete() does not work well with some filters if not synchronized, 
    # but for simple filters it's fine. Safer to delete by ID list if complex.
    # However, standard delete() on query object works for SQLite/Postgres usually.
    query.delete(synchronize_session=False)
    db.commit()

    return {"message": f"History cleared for filter: {filter_type}"}

@app.post("/export/pdf")
async def export_pdf(request: ExportRequest):
    try:
        file_path = export_service.generate_pdf(request.text)
        return FileResponse(file_path, filename="summary.pdf", media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/export/docx")
async def export_docx(request: ExportRequest):
    try:
        file_path = export_service.generate_docx(request.text)
        return FileResponse(file_path, filename="summary.docx", media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize/youtube")
async def summarize_youtube_endpoint(
    request: YoutubeRequest, 
    db: Session = Depends(get_db)
):
    req_id = request.request_id
    if req_id:
        active_tasks[req_id] = True # Register task
        print(f"[START] Processing Task {req_id}")

    try:
        # Define Cancellation Callback
        def check_cancel():
            if req_id and req_id in active_tasks and active_tasks[req_id] is False:
                print(f"[CANCEL] Aborting Task {req_id}...")
                raise Exception("Task Cancelled by User")

        print(f"Processing YouTube URL (Cloud Mode): {request.url}")

        # 1. Compute Hash Immediately
        content_hash = hashlib.sha256(request.url.encode('utf-8')).hexdigest()

        # 2. Check for Duplicates (Re-enabled caching)
        if request.user_id:
            # Determine correct input type for database lookup
            search_type = "highlights" if request.task == "highlights" else "video"
            
            existing = db.query(models.History).filter(
                models.History.user_id == request.user_id,
                models.History.content_hash == content_hash,
                models.History.input_type == search_type,
                models.History.preference == request.length, 
                models.History.format_mode == request.format_mode
            ).first()

            if existing and not request.force_new:
                print(f"[CACHE] Video/Highlights Hit found for {request.url}")
                
                # Check if it was a highlights task and we have highlights data
                highlights_data = None
                if existing.highlights:
                    try:
                        highlights_data = json.loads(existing.highlights)
                    except:
                        highlights_data = existing.highlights

                # Restore available qualities from DB
                restored_qualities = ["720p"]
                if existing.available_qualities:
                    restored_qualities = existing.available_qualities.split(',')

                return {
                    "status": "duplicate",
                    "summary": {
                         "summary_text": existing.summary_output,
                         "stats": {
                             "original": {
                                 "words": existing.orig_words,
                                 "sentences": existing.orig_sentences,
                                 "chars": existing.orig_chars
                             },
                             "summary": {
                                 "words": existing.summ_words,
                                 "sentences": existing.summ_sentences,
                                 "chars": existing.summ_chars
                             }
                         },
                         "highlights": highlights_data,
                         "available_qualities": restored_qualities
                    }
                }

        # 3. Call Cloud API (Gemini/Gemma)
        # return dict: {'summary_text': str, 'stats': dict, 'highlights': str}
        # Check cancel before starting heavy work
        check_cancel()

        result_payload = video_service.process_video_url(
            request.url, 
            request.length, 
            request.format_mode,
            task=request.task,
            check_cancel=check_cancel
        )
        
        final_summary = result_payload["summary_text"]
        original_stats = result_payload["stats"]
        video_title = result_payload.get("title", f"YouTube Video: {request.url}")
        
        # 4. Generate Stats for Summary
        summ_words = len(final_summary.split())
        summ_chars = len(final_summary)
        summ_sentences = final_summary.count('.') + final_summary.count('!') + final_summary.count('?')
        
        summary_result = {
            "summary_text": final_summary,
            "stats": {
                "original": original_stats["original"], # Send correct structure to frontend
                "summary": {
                    "words": summ_words,
                    "sentences": summ_sentences,
                    "chars": summ_chars
                }
            },
            "highlights": result_payload.get("highlights", ""),
            "available_qualities": result_payload.get("available_qualities", ["720p"]),
            "original_video_url": request.url # useful context
        }

        # Calculate Estimated Sizes if bitrate data exists
        quality_bitrates = result_payload.get("quality_bitrates", {})
        highlights_data = result_payload.get("highlights", [])
        
        # Calculate Total Duration of Highlights
        total_duration = 0
        if isinstance(highlights_data, list):
            for h in highlights_data:
                start = h.get('start', 0)
                end = h.get('end', 0)
                if end > start:
                    total_duration += (end - start)
        
        # Add rich size info to available_qualities for Frontend
        # Format: "720p" -> "720p (~45MB)"
        rich_qualities = []
        raw_qualities = result_payload.get("available_qualities", ["720p"])
        
        for q in raw_qualities:
            label = q
            size_mb = 0
            if q in quality_bitrates and total_duration > 0:
                # Bitrate is in kbps (usually). yt-dlp 'tbr' is kbit/s.
                # Size (KB) = Bitrate (kbps) * Duration (s) / 8
                # Size (MB) = Size (KB) / 1024
                bitrate = quality_bitrates[q]
                size_mb = (bitrate * total_duration) / (8 * 1024)
                if size_mb < 1:
                    label = f"{q} (~{size_mb:.1f}MB)"
                else:
                    label = f"{q} (~{int(size_mb)}MB)"
            
            # Frontend expects object or string? 
            # Current frontend expects strings.
            # We can change the contract to return objects in a NEW field, OR duplicate.
            # Let's add 'quality_options' list of dicts.
            rich_qualities.append({
                "quality": q,
                "label": label,
                "estimated_size_mb": size_mb
            })
            
        summary_result["quality_options"] = rich_qualities

        # 5. Save to History (Re-enabled & Fixed)
        if request.user_id:
             # Extract correct stats dict
             stat_src = original_stats.get("original", {})
             
             # Handle Highlights Serialization
             highlights_data = result_payload.get("highlights")
             highlights_json = None
             if highlights_data:
                 if isinstance(highlights_data, list):
                     highlights_json = json.dumps(highlights_data)
                 elif isinstance(highlights_data, str):
                     highlights_json = highlights_data
             
             # Determine Input Type
             record_input_type = "video"
             if request.task == "highlights" or highlights_json:
                 record_input_type = "highlights"

             db_record = models.History(
                content_hash=content_hash,
                user_id=request.user_id,
                input_type=record_input_type,
                input_content=request.url,      # URL as Content
                original_filename=video_title,  # Title as Filename
                summary_output=final_summary,
                preference=request.length,
                format_mode=request.format_mode,
                highlights=highlights_json,     # SAVE HIGHLIGHTS
                available_qualities=json.dumps(rich_qualities), # SAVE AS JSON STRING (for size info persistence)
                orig_words=stat_src.get("words", 0),
                orig_sentences=stat_src.get("sentences", 0),
                orig_chars=stat_src.get("chars", 0),
                summ_words=summ_words,
                summ_sentences=summ_sentences,
                summ_chars=summ_chars
            )
             db.add(db_record)
             db.commit()

        return {"summary": summary_result}

    except Exception as e:
        if "Task Cancelled" in str(e):
             print(f"[CANCEL] Task {req_id} cancelled.")
             return {"status": "cancelled", "message": "Task cancelled by user"}

        print(f"YouTube Cloud Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if req_id and req_id in active_tasks:
            del active_tasks[req_id]
            print(f"[CLEANUP] Removed Task {req_id}")

@app.post("/export/video")
async def export_video_endpoint(request: ExportVideoRequest):
    from fastapi.responses import StreamingResponse
    try:
        # Use StreamingResponse with SSE (Server-Sent Events)
        return StreamingResponse(
            video_service.generate_merged_highlights_stream(
                request.url, 
                request.highlights, 
                request.quality
            ),
            media_type="text/event-stream"
        )
    except Exception as e:
        print(f"[EXPORT-ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_file(filename: str):
    try:
        file_path = os.path.join(os.getcwd(), "downloads", filename)
        if os.path.exists(file_path):
            return FileResponse(file_path, media_type="video/mp4", filename=filename)
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        print(f"[EXPORT-ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
