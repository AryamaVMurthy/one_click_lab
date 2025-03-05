from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import Optional, List, Annotated, Dict, Any
from datetime import datetime
import uuid
import logging

from models.lab import (
    Lab, LabCreate, LabUpdate, LabResponse, LabsResponse,
    Section, SectionWithModules, LabWithSections,
    TextModule, QuizModule, ImageModule, VideoModule, ModuleReference
)
from models.user import User
from database import (
    get_labs_collection, get_sections_collection, 
    get_modules_collection, get_deployments_collection
)
from routes.auth import get_current_user
from utils.mongo_utils import serialize_mongo_doc

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(tags=["labs"])

# Helper functions
async def get_lab_by_id(lab_id: str) -> Optional[Lab]:
    """Get a lab by ID from MongoDB"""
    lab = await get_labs_collection().find_one({"id": lab_id})
    if lab:
        # Serialize MongoDB document to handle ObjectId
        lab = serialize_mongo_doc(lab)
        return Lab(**lab)
    return None

async def get_section_by_id(section_id: str) -> Optional[Section]:
    """Get a section by ID from MongoDB"""
    section = await get_sections_collection().find_one({"id": section_id})
    if section:
        # Serialize MongoDB document to handle ObjectId
        section = serialize_mongo_doc(section)
        return Section(**section)
    return None

async def get_sections_by_lab_id(lab_id: str) -> List[Section]:
    """Get all sections for a lab from MongoDB"""
    sections_cursor = get_sections_collection().find({"labId": lab_id}).sort("order", 1)
    sections = []
    async for section in sections_cursor:
        # Serialize MongoDB document to handle ObjectId
        section = serialize_mongo_doc(section)
        sections.append(Section(**section))
    return sections

async def get_module(module_id: str, module_type: str):
    """Get a module by ID and type from MongoDB"""
    module = await get_modules_collection().find_one({"id": module_id, "type": module_type})
    if not module:
        return None
    
    # Serialize MongoDB document to handle ObjectId
    module = serialize_mongo_doc(module)
    
    # Return the appropriate module type
    if module_type == "text":
        return TextModule(**module)
    elif module_type == "quiz":
        return QuizModule(**module)
    elif module_type == "image":
        return ImageModule(**module)
    elif module_type == "video":
        return VideoModule(**module)
    return None

async def get_modules_by_section_id(section_id: str):
    """Get all modules for a section from MongoDB"""
    modules_cursor = get_modules_collection().find({"sectionId": section_id})
    modules = []
    async for module in modules_cursor:
        # Serialize MongoDB document to handle ObjectId
        module = serialize_mongo_doc(module)
        
        # Create the appropriate module type
        if module["type"] == "text":
            modules.append(TextModule(**module))
        elif module["type"] == "quiz":
            modules.append(QuizModule(**module))
        elif module["type"] == "image":
            modules.append(ImageModule(**module))
        elif module["type"] == "video":
            modules.append(VideoModule(**module))
    
    # Sort modules by order
    modules.sort(key=lambda x: x.order)
    return modules

async def assemble_lab_with_sections(lab: Lab):
    """Assemble a complete lab with all sections and modules"""
    # Get all sections for this lab
    sections = await get_sections_by_lab_id(lab.id)
    
    # Create a LabWithSections object
    lab_with_sections = LabWithSections(
        id=lab.id,
        title=lab.title,
        description=lab.description,
        author=lab.author,
        status=lab.status,
        isPublished=lab.isPublished,
        createdAt=lab.createdAt,
        updatedAt=lab.updatedAt,
        publishedAt=lab.publishedAt,
        deploymentUrls=lab.deploymentUrls,
        sections=[]
    )
    
    # Add sections with modules
    for section in sections:
        section_with_modules = SectionWithModules(
            id=section.id,
            title=section.title,
            order=section.order,
            createdAt=section.createdAt,
            updatedAt=section.updatedAt,
            modules=[]
        )
        
        # Get modules for this section
        modules = await get_modules_by_section_id(section.id)
        
        # Add modules to section
        for module in modules:
            section_with_modules.modules.append(module.dict())
        
        # Add section to lab
        lab_with_sections.sections.append(section_with_modules)
    
    return lab_with_sections

# API Endpoints
@router.post(
    "/labs",
    response_model=LabResponse,
    summary="Create a new lab",
    description="Create a new lab with title and description.",
    responses={
        200: {
            "description": "Lab created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "lab_id",
                        "title": "Introduction to Python",
                        "description": "Learn the basics of Python programming language"
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "unauthorized", "message": "Invalid access token"}}
                }
            }
        }
    }
)
async def create_lab(lab: LabCreate, current_user: User = Depends(get_current_user)):
    return await create_new_lab(lab, current_user)

async def create_new_lab(lab_data: LabCreate, current_user: User):
    """Create a new lab"""
    # Create lab document
    lab_id = str(uuid.uuid4())
    lab = Lab(
        id=lab_id,
        title=lab_data.title,
        description=lab_data.description,
        author={
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email
        },
        sectionRefs=[],
        status="draft",
        isPublished=False,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    
    # Insert into database
    await get_labs_collection().insert_one(lab.dict())
    
    # Create a default section
    section_id = str(uuid.uuid4())
    section = Section(
        id=section_id,
        labId=lab_id,
        title="Introduction",
        order=1,
        moduleRefs=[],
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    
    # Insert section into database
    await get_sections_collection().insert_one(section.dict())
    
    # Update lab with section reference
    await get_labs_collection().update_one(
        {"id": lab_id},
        {"$push": {"sectionRefs": section_id}}
    )
    
    # Create default text module
    module_id = str(uuid.uuid4())
    module = TextModule(
        id=module_id,
        sectionId=section_id,
        type="text",
        title="Getting Started",
        content="<p>Welcome to your new lab!</p>",
        order=1,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    
    # Insert module into database
    await get_modules_collection().insert_one(module.dict())
    
    # Update section with module reference
    module_ref = ModuleReference(id=module_id, type="text", order=1)
    await get_sections_collection().update_one(
        {"id": section_id},
        {"$push": {"moduleRefs": module_ref.dict()}}
    )
    
    # Fetch the complete lab
    complete_lab = await get_lab_by_id(lab_id)
    lab_with_sections = await assemble_lab_with_sections(complete_lab)
    
    return {
        "success": True,
        "data": lab_with_sections,
        "error": None
    }

@router.get(
    "/labs/{lab_id}",
    response_model=LabResponse,
    summary="Fetch a lab by ID",
    description="Fetch a lab by its unique ID.",
    responses={
        200: {
            "description": "Lab fetched successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "lab_id",
                        "title": "Introduction to Python",
                        "description": "Learn the basics of Python programming language"
                    }
                }
            }
        },
        404: {
            "description": "Lab not found",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "not_found", "message": "Lab not found"}}
                }
            }
        }
    }
)
async def get_lab(lab_id: str = Path(..., title="The ID of the lab to get")):
    """Get a lab by ID"""
    lab = await get_lab_by_id(lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Assemble complete lab with sections and modules
    lab_with_sections = await assemble_lab_with_sections(lab)
    
    return {
        "success": True,
        "data": lab_with_sections,
        "error": None
    }

@router.put(
    "/labs/{lab_id}",
    response_model=LabResponse,
    summary="Update a lab by ID",
    description="Update a lab by its unique ID.",
    responses={
        200: {
            "description": "Lab updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "lab_id",
                        "title": "Advanced Python",
                        "description": "Learn advanced Python concepts"
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "unauthorized", "message": "Invalid access token"}}
                }
            }
        },
        404: {
            "description": "Lab not found",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "not_found", "message": "Lab not found"}}
                }
            }
        }
    }
)
async def update_lab(lab_id: str, lab: LabUpdate, current_user: User = Depends(get_current_user)):
    return await update_existing_lab(lab_id, lab, current_user)

async def update_existing_lab(lab_id: str, lab_data: LabUpdate, current_user: User):
    """Update a lab"""
    # Check if lab exists
    lab = await get_lab_by_id(lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Check if user is the author
    if lab.author.id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this lab")
    
    # Update fields
    update_data = lab_data.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.now().isoformat()
    
    if "status" in update_data and update_data["status"] == "published" and lab.status != "published":
        update_data["isPublished"] = True
        update_data["publishedAt"] = datetime.now().isoformat()
    
    # Update in database
    await get_labs_collection().update_one(
        {"id": lab_id},
        {"$set": update_data}
    )
    
    # Get updated lab
    updated_lab = await get_lab_by_id(lab_id)
    lab_with_sections = await assemble_lab_with_sections(updated_lab)
    
    return {
        "success": True,
        "data": lab_with_sections,
        "error": None
    }

@router.delete(
    "/labs/{lab_id}",
    summary="Delete a lab by ID",
    description="Delete a lab by its unique ID.",
    responses={
        200: {
            "description": "Lab deleted successfully",
            "content": {
                "application/json": {
                    "example": {"message": "Lab deleted successfully"}
                }
            }
        },
        404: {
            "description": "Lab not found",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "not_found", "message": "Lab not found"}}
                }
            }
        }
    }
)
async def delete_lab(
    lab_id: str = Path(..., title="The ID of the lab to delete"),
    current_user: Annotated[User, Depends(get_current_user)] = None
):
    """Delete a lab"""
    # Check if lab exists
    lab = await get_lab_by_id(lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Check if user is the author
    if lab.author.id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this lab")
    
    # Get all sections
    sections = await get_sections_by_lab_id(lab_id)
    
    # For each section, delete all modules
    for section in sections:
        # Delete all modules in this section
        await get_modules_collection().delete_many({"sectionId": section.id})
    
    # Delete all sections
    await get_sections_collection().delete_many({"labId": lab_id})
    
    # Delete the lab
    await get_labs_collection().delete_one({"id": lab_id})
    
    return {
        "success": True,
        "message": "Lab deleted successfully",
        "error": None
    }

@router.get(
    "/labs",
    response_model=LabsResponse,
    summary="Fetch all labs",
    description="Fetch all labs with pagination and filtering.",
    responses={
        200: {
            "description": "Labs fetched successfully",
            "content": {
                "application/json": {
                    "example": {
                        "labs": [
                            {
                                "id": "lab_id",
                                "title": "Introduction to Python",
                                "description": "Learn the basics of Python programming language"
                            }
                        ],
                        "total": 1,
                        "page": 1,
                        "limit": 10,
                        "totalPages": 1
                    }
                }
            }
        }
    }
)
async def get_labs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query("all", regex="^(all|draft|published)$"),
    search: Optional[str] = Query(None)
):
    """Get all labs with pagination and filtering"""
    # Build filter
    filter_query = {}
    
    if status != "all":
        filter_query["status"] = status
    
    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Count total labs
    total = await get_labs_collection().count_documents(filter_query)
    
    # Calculate total pages
    total_pages = (total + limit - 1) // limit
    
    # Apply pagination
    skip = (page - 1) * limit
    
    # Get labs
    labs_cursor = get_labs_collection().find(filter_query).sort("updatedAt", -1).skip(skip).limit(limit)
    labs = []
    async for lab in labs_cursor:
        # Serialize MongoDB document to handle ObjectId
        lab = serialize_mongo_doc(lab)
        labs.append(Lab(**lab))
    
    # For each lab, get basic info about its sections
    labs_with_section_counts = []
    for lab in labs:
        section_count = await get_sections_collection().count_documents({"labId": lab.id})
        lab_dict = lab.dict()
        lab_dict["sectionCount"] = section_count
        labs_with_section_counts.append(lab_dict)
    
    return {
        "success": True,
        "data": {
            "labs": labs_with_section_counts,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages
        },
        "error": None
    }

@router.post(
    "/labs/{lab_id}/deploy",
    summary="Deploy a lab",
    description="Deploy a lab by its unique ID.",
    responses={
        200: {
            "description": "Lab deployed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "deploymentUrl": "https://example.com/labs/lab_id/version/index.html",
                        "deployedVersion": "version"
                    }
                }
            }
        },
        404: {
            "description": "Lab not found",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "not_found", "message": "Lab not found"}}
                }
            }
        }
    }
)
async def deploy_lab(
    lab_id: str = Path(..., title="The ID of the lab to deploy"),
    current_user: Annotated[User, Depends(get_current_user)] = None
):
    """Deploy a lab"""
    # Check if lab exists
    lab = await get_lab_by_id(lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Check if user is the author
    if lab.author.id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to deploy this lab")
    
    # Generate deployment version
    version = datetime.now().strftime("%Y%m%d%H%M%S")
    deployment_url = f"https://example.com/labs/{lab_id}/{version}/index.html"
    
    # Create deployment record
    deployment = {
        "labId": lab_id,
        "version": version,
        "url": deployment_url,
        "deployedAt": datetime.now().isoformat(),
        "deployedBy": current_user.id
    }
    
    # Insert deployment record
    await get_deployments_collection().insert_one(deployment)
    
    # In a real implementation, you would:
    # 1. Generate HTML from lab content
    # 2. Upload to S3
    # 3. Update CloudFront if needed
    
    # Update lab with deployment info
    if lab.deploymentUrls is None:
        # Initialize deploymentUrls if it doesn't exist
        await get_labs_collection().update_one(
            {"id": lab_id},
            {
                "$set": {
                    "deploymentUrls": {
                        "latest": deployment_url,
                        "versions": []
                    }
                }
            }
        )
    
    # Add new version
    new_version = {
        "version": version,
        "url": deployment_url,
        "deployedAt": datetime.now().isoformat()
    }
    
    # Update in database
    await get_labs_collection().update_one(
        {"id": lab_id},
        {
            "$set": {
                "deploymentUrls.latest": deployment_url
            },
            "$push": {
                "deploymentUrls.versions": new_version
            }
        }
    )
    
    return {
        "success": True,
        "data": {
            "deploymentUrl": deployment_url,
            "deployedVersion": version
        },
        "error": None
    }

# Additional endpoints for sections and modules
@router.post(
    "/labs/{lab_id}/sections",
    summary="Create a new section in a lab",
    description="Create a new section in a lab by its unique ID.",
    responses={
        200: {
            "description": "Section created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "section_id",
                        "labId": "lab_id",
                        "title": "Introduction",
                        "order": 1,
                        "moduleRefs": []
                    }
                }
            }
        },
        404: {
            "description": "Lab not found",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "not_found", "message": "Lab not found"}}
                }
            }
        }
    }
)
async def create_section(
    lab_id: str,
    section_data: dict,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Create a new section in a lab"""
    # Check if lab exists
    lab = await get_lab_by_id(lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Check if user is authorized
    if lab.author.id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to modify this lab")
    
    # Get section count to determine order
    section_count = await get_sections_collection().count_documents({"labId": lab_id})
    
    # Create section
    section_id = str(uuid.uuid4())
    section = Section(
        id=section_id,
        labId=lab_id,
        title=section_data.get("title", f"Section {section_count + 1}"),
        order=section_count + 1,
        moduleRefs=[],
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    
    # Insert section
    await get_sections_collection().insert_one(section.dict())
    
    # Update lab with section reference
    await get_labs_collection().update_one(
        {"id": lab_id},
        {"$push": {"sectionRefs": section_id}}
    )
    
    return {
        "success": True,
        "data": section,
        "error": None
    }

@router.post(
    "/sections/{section_id}/modules",
    summary="Create a new module in a section",
    description="Create a new module in a section by its unique ID.",
    responses={
        200: {
            "description": "Module created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "module_id",
                        "sectionId": "section_id",
                        "type": "text",
                        "title": "Getting Started",
                        "content": "<p>Welcome to your new lab!</p>",
                        "order": 1
                    }
                }
            }
        },
        404: {
            "description": "Section not found",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "not_found", "message": "Section not found"}}
                }
            }
        }
    }
)
async def create_module(
    section_id: str,
    module_data: dict,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Create a new module in a section"""
    # Check if section exists
    section = await get_section_by_id(section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Get lab to check authorization
    lab = await get_lab_by_id(section.labId)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Check if user is authorized
    if lab.author.id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to modify this lab")
    
    # Get module count to determine order
    module_count = len(section.moduleRefs)
    
    # Determine module type
    module_type = module_data.get("type", "text")
    
    # Create module ID
    module_id = str(uuid.uuid4())
    
    # Create module based on type
    if module_type == "text":
        module = TextModule(
            id=module_id,
            sectionId=section_id,
            type="text",
            title=module_data.get("title", ""),
            content=module_data.get("content", ""),
            order=module_count + 1,
            createdAt=datetime.now().isoformat(),
            updatedAt=datetime.now().isoformat()
        )
    elif module_type == "quiz":
        module = QuizModule(
            id=module_id,
            sectionId=section_id,
            type="quiz",
            title=module_data.get("title", ""),
            questions=module_data.get("questions", []),
            passingScore=module_data.get("passingScore", None),
            order=module_count + 1,
            createdAt=datetime.now().isoformat(),
            updatedAt=datetime.now().isoformat()
        )
    elif module_type == "image":
        module = ImageModule(
            id=module_id,
            sectionId=section_id,
            type="image",
            url=module_data.get("url", ""),
            altText=module_data.get("altText", ""),
            caption=module_data.get("caption", ""),
            order=module_count + 1,
            createdAt=datetime.now().isoformat(),
            updatedAt=datetime.now().isoformat()
        )
    elif module_type == "video":
        module = VideoModule(
            id=module_id,
            sectionId=section_id,
            type="video",
            url=module_data.get("url", ""),
            provider=module_data.get("provider", "youtube"),
            caption=module_data.get("caption", ""),
            order=module_count + 1,
            createdAt=datetime.now().isoformat(),
            updatedAt=datetime.now().isoformat()
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid module type")
    
    # Insert module
    await get_modules_collection().insert_one(module.dict())
    
    # Create module reference
    module_ref = ModuleReference(
        id=module_id,
        type=module_type,
        order=module_count + 1
    )
    
    # Update section with module reference
    await get_sections_collection().update_one(
        {"id": section_id},
        {"$push": {"moduleRefs": module_ref.dict()}}
    )
    
    return {
        "success": True,
        "data": module,
        "error": None
    }
