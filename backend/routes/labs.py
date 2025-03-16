from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import Optional, List, Annotated, Dict, Any
from datetime import datetime
import uuid
import logging

from models.lab import (
    Lab, LabCreate, LabUpdate, LabResponse, LabsResponse,
    Section, TextModule, QuizModule, ImageModule, VideoModule,
    PaginationInfo, LabsData
)
from models.user import User
from database import get_labs_collection, get_users_collection
from utils.auth_bypass import get_user_dependency
from routes.auth import get_current_user
from utils.mongo_utils import serialize_mongo_doc
from fastapi.responses import FileResponse
import zipfile
import io
import os
from pathlib import Path
import shutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(tags=["labs"])

# Get the appropriate user dependency
current_user_dependency = get_user_dependency()

# Helper functions
async def get_lab_by_id(lab_id: str) -> Optional[Lab]:
    """Get a lab by ID from MongoDB"""
    lab = await get_labs_collection().find_one({"id": lab_id})
    if lab:
        # Serialize MongoDB document to handle ObjectId
        lab = serialize_mongo_doc(lab)
        return Lab(**lab)
    return None

# API Endpoints

@router.post("/labs", response_model=LabResponse)
async def create_lab(lab: LabCreate, current_user: User = Depends(current_user_dependency)):
    """
    Create a new lab
    """
    try:
        # Create lab with the current user as author
        lab_data = await create_new_lab(lab, current_user)
        
        return {
            "success": True,
            "data": lab_data,
            "error": None
        }
    except Exception as e:
        logger.error(f"Error creating lab: {e}")
        return {
            "success": False,
            "data": None,
            "error": str(e)
        }

async def create_new_lab(lab_data: LabCreate, current_user: User):
    """Create a new lab in the database"""
    # Create a new lab
    new_lab = Lab(
        id=str(uuid.uuid4()),
        title=lab_data.title,
        description=lab_data.description,
        author={
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email
        },
        sections=[],
        status="draft",
        isPublished=False,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    
    # Insert the lab into the database
    await get_labs_collection().insert_one(new_lab.model_dump())
    
    return new_lab

@router.get("/labs/{lab_id}", response_model=LabResponse)
async def get_lab(lab_id: str = Path(..., title="The ID of the lab to get"), current_user: User = Depends(current_user_dependency)):
    """
    Get a lab by ID
    """
    try:
        # Get the lab
        lab = await get_lab_by_id(lab_id)
        if not lab:
            return {
                "success": False,
                "data": None,
                "error": "Lab not found"
            }
        
        # Check if the user is authorized to access this lab
        if lab.author.id != current_user.id and current_user.role != "admin":
            return {
                "success": False,
                "data": None,
                "error": "You do not have permission to access this lab"
            }
        
        return {
            "success": True,
            "data": lab,
            "error": None
        }
    except Exception as e:
        logger.error(f"Error getting lab: {e}")
        return {
            "success": False,
            "data": None,
            "error": str(e)
        }

@router.put("/labs/{lab_id}", response_model=LabResponse)
async def update_lab(lab_id: str, lab: LabUpdate, current_user: User = Depends(current_user_dependency)):
    """
    Update a lab
    """
    try:
        # Update the lab
        updated_lab = await update_existing_lab(lab_id, lab, current_user)
        if not updated_lab:
            return {
                "success": False,
                "data": None,
                "error": "Lab not found or you don't have permission to update it"
            }
        
        return {
            "success": True,
            "data": updated_lab,
            "error": None
        }
    except Exception as e:
        logger.error(f"Error updating lab: {e}")
        return {
            "success": False,
            "data": None,
            "error": str(e)
        }

async def update_existing_lab(lab_id: str, lab_data: LabUpdate, current_user: User):
    """Update an existing lab in the database"""
    # Get the lab
    existing_lab = await get_lab_by_id(lab_id)
    if not existing_lab:
        return None
    
    # Check if the user is authorized to update this lab
    if existing_lab.author.id != current_user.id and current_user.role != "admin":
        return None
    
    # Update fields
    update_data = {"updatedAt": datetime.now().isoformat()}
    if lab_data.title is not None:
        update_data["title"] = lab_data.title
    if lab_data.description is not None:
        update_data["description"] = lab_data.description
    if lab_data.status is not None:
        update_data["status"] = lab_data.status
        update_data["isPublished"] = lab_data.status == "published"
        if lab_data.status == "published" and not existing_lab.isPublished:
            update_data["publishedAt"] = datetime.now().isoformat()
    if lab_data.sections is not None:
        # Serialize sections to ensure proper MongoDB format
        update_data["sections"] = [section.dict() for section in lab_data.sections]
    
    # Update the lab in the database
    await get_labs_collection().update_one(
        {"id": lab_id},
        {"$set": update_data}
    )
    
    # Get the updated lab
    updated_lab = await get_lab_by_id(lab_id)
    return updated_lab

@router.delete("/labs/{lab_id}", response_model=Dict[str, Any])
async def delete_lab(
    lab_id: str = Path(..., title="The ID of the lab to delete"),
    current_user: Annotated[User, Depends(current_user_dependency)] = None
):
    """
    Delete a lab
    """
    try:
        # Get the lab
        lab = await get_lab_by_id(lab_id)
        if not lab:
            return {
                "success": False,
                "error": "Lab not found"
            }
        
        # Check if the user is authorized to delete this lab
        if lab.author.id != current_user.id and current_user.role != "admin":
            return {
                "success": False,
                "error": "You do not have permission to delete this lab"
            }
        
        # Delete the lab
        result = await get_labs_collection().delete_one({"id": lab_id})
        
        if result.deleted_count == 0:
            return {
                "success": False,
                "error": "Failed to delete lab"
            }
        
        return {
            "success": True,
            "message": "Lab deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting lab: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/labs", response_model=LabsResponse)
async def get_labs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query("all", regex="^(all|draft|published)$"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(current_user_dependency)
):
    """
    Get all labs with pagination and filtering
    """
    try:
        # Set up query filter
        filter_query = {"author.id": current_user.id}
        
        # Filter by status if not "all"
        if status != "all":
            filter_query["status"] = status
        
        # Add text search if provided
        if search:
            filter_query["$text"] = {"$search": search}
        
        # Get total count
        total = await get_labs_collection().count_documents(filter_query)
        
        # Calculate pagination
        total_pages = (total + limit - 1) // limit
        skip = (page - 1) * limit
        
        # Get labs with pagination
        cursor = get_labs_collection().find(filter_query).sort("updatedAt", -1).skip(skip).limit(limit)
        
        labs = []
        async for lab_doc in cursor:
            # Serialize MongoDB document to handle ObjectId
            lab_doc = serialize_mongo_doc(lab_doc)
            lab = Lab(**lab_doc)
            labs.append(lab)
        
        pagination = PaginationInfo(
            total=total,
            page=page,
            pages=total_pages,
            limit=limit
        )
        
        labs_data = LabsData(
            labs=labs,
            pagination=pagination
        )
        
        return {
            "success": True,
            "data": labs_data,
            "error": None
        }
    except Exception as e:
        logger.error(f"Error getting labs: {e}")
        return {
            "success": False,
            "data": None,
            "error": str(e)
        }

@router.post("/labs/{lab_id}/deploy", response_model=LabResponse)
async def deploy_lab(
    lab_id: str = Path(..., title="The ID of the lab to deploy"),
    current_user: Annotated[User, Depends(current_user_dependency)] = None
):
    """
    Deploy a lab
    """
    try:
        # Get the lab
        lab = await get_lab_by_id(lab_id)
        if not lab:
            return {
                "success": False,
                "data": None,
                "error": "Lab not found"
            }
        
        # Check if the user is authorized to deploy this lab
        if lab.author.id != current_user.id and current_user.role != "admin":
            return {
                "success": False,
                "data": None,
                "error": "You do not have permission to deploy this lab"
            }
        
        # Check if lab has content
        if not lab.sections or len(lab.sections) == 0:
            return {
                "success": False,
                "data": None,
                "error": "Cannot deploy a lab without any content"
            }
        
        # Generate deployment URL
        deployment_url = f"https://labs.oneclicklabs.io/{lab_id}"
        
        # Update lab status to published
        update_data = {
            "status": "published",
            "isPublished": True,
            "publishedAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            "deploymentUrl": deployment_url
        }
        
        # Update the lab in the database
        await get_labs_collection().update_one(
            {"id": lab_id},
            {"$set": update_data}
        )
        
        # Get the updated lab
        deployed_lab = await get_lab_by_id(lab_id)
        
        return {
            "success": True,
            "data": deployed_lab,
            "error": None
        }
    except Exception as e:
        logger.error(f"Error deploying lab: {e}")
        return {
            "success": False,
            "data": None,
            "error": str(e)
        }

@router.post("/labs/{lab_id}/sections", response_model=LabResponse)
async def add_section(
    lab_id: str,
    section_data: Dict[str, Any],
    current_user: Annotated[User, Depends(current_user_dependency)]
):
    """
    Add a new section to a lab
    """
    try:
        # Get the lab
        lab = await get_lab_by_id(lab_id)
        if not lab:
            return {
                "success": False,
                "data": None,
                "error": "Lab not found"
            }
        
        # Check if the user is authorized to update this lab
        if lab.author.id != current_user.id and current_user.role != "admin":
            return {
                "success": False,
                "data": None,
                "error": "You do not have permission to update this lab"
            }
        
        # Create section
        section = Section(
            title=section_data.get("title", "New Section"),
            order=section_data.get("order", len(lab.sections)),
            modules=[]
        )
        
        # Update the lab in the database
        await get_labs_collection().update_one(
            {"id": lab_id},
            {
                "$push": {"sections": section.model_dump()},
                "$set": {"updatedAt": datetime.now().isoformat()}
            }
        )
        
        # Get the updated lab
        updated_lab = await get_lab_by_id(lab_id)
        
        return {
            "success": True,
            "data": updated_lab,
            "error": None
        }
    except Exception as e:
        logger.error(f"Error adding section: {e}")
        return {
            "success": False,
            "data": None,
            "error": str(e)
        }

@router.post("/labs/{lab_id}/update-content", response_model=LabResponse)
async def update_lab_content(
    lab_id: str,
    content_data: Dict[str, Any],
    current_user: Annotated[User, Depends(current_user_dependency)]
):
    """
    Update the entire lab content (sections and modules)
    """
    try:
        # Get the lab
        lab = await get_lab_by_id(lab_id)
        if not lab:
            return {
                "success": False,
                "data": None,
                "error": "Lab not found"
            }
        
        # Check if the user is authorized to update this lab
        if lab.author.id != current_user.id and current_user.role != "admin":
            return {
                "success": False,
                "data": None,
                "error": "You do not have permission to update this lab"
            }
        
        # Extract sections from the content data
        sections = content_data.get("sections", [])
        
        # Update the lab in the database
        await get_labs_collection().update_one(
            {"id": lab_id},
            {
                "$set": {
                    "sections": sections,
                    "updatedAt": datetime.now().isoformat()
                }
            }
        )
        
        # Get the updated lab
        updated_lab = await get_lab_by_id(lab_id)
        
        return {
            "success": True,
            "data": updated_lab,
            "error": None
        }
    except Exception as e:
        logger.error(f"Error updating lab content: {e}")
        return {
            "success": False,
            "data": None,
            "error": str(e)
        }

async def generate_static_site(lab: Lab) -> str:
    """
    Generate a static site from lab content
    """
    # Create temp directory
    temp_dir = Path(f'/tmp/lab_export_{lab.id}')
    temp_dir.mkdir(parents=True, exist_ok=True)

    # Generate HTML content
    html_content = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <title>{lab.title}</title>
        <style>
            body {{ font-family: Arial, sans-serif; }}
        </style>
    </head>
    <body>
        <h1>{lab.title}</h1>
        <p>{lab.description}</p>
        {{% for section in lab.sections %}}
            <div class="section">
                <h2>{section.title}</h2>
                {{% for module in section.modules %}}
                    {{% if module.type == 'text' %}}
                        <div class="text-module">
                            {module.content}
                        </div>
                    {{% elif module.type == 'quiz' %}}
                        <div class="quiz-module">
                            <h3>Quiz</h3>
                            {module.questions}
                        </div>
                    {{% endif %}}
                {{% endfor %}}
            </div>
        {{% endfor %}}
    </body>
    </html>
    '''

    # Write HTML file
    with open(temp_dir / 'index.html', 'w') as f:
        f.write(html_content)

    return str(temp_dir)

@router.get("/labs/{lab_id}/export")
async def export_lab(
    lab_id: str = Path(..., title="The ID of the lab to export"),
    current_user: User = Depends(current_user_dependency)
):
    """
    Export a lab as a static site
    """
    try:
        # Get the lab
        lab = await get_lab_by_id(lab_id)
        if not lab:
            raise HTTPException(status_code=404, detail="Lab not found")

        # Check permissions
        if lab.author.id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to export this lab")

        # Generate static site
        export_dir = await generate_static_site(lab)

        # Create zip file
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w') as zf:
            for root, dirs, files in os.walk(export_dir):
                for file in files:
                    zf.write(
                        os.path.join(root, file),
                        os.path.relpath(os.path.join(root, file), export_dir)
                    )
        memory_file.seek(0)

        # Clean up
        shutil.rmtree(export_dir)

        return FileResponse(
            memory_file,
            media_type='application/zip',
            filename=f'{lab.title.replace(" ", "_")}_export.zip'
        )
    except Exception as e:
        logger.error(f"Error exporting lab: {e}")
        raise HTTPException(status_code=500, detail=str(e))
