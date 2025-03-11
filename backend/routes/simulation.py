from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any
import os
import json
import logging
import traceback
import html
import uuid
import re
from datetime import datetime
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from models.user import User
from utils.auth_bypass import get_user_dependency
from routes.auth import get_current_user
from database import get_labs_collection
from utils.mongo_utils import serialize_mongo_doc

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Simulation"])

# Get the appropriate user dependency
current_user_dependency = get_user_dependency()

class SimulationRequest(BaseModel):
    input: str
    agent: Literal["json", "html", "both"]
    json_state: Optional[dict] = None
    html_memory: Optional[str] = None
    chat_memory: list = []

class SimulationResponse(BaseModel):
    json: Optional[dict] = None
    html: Optional[str] = None

class SaveSimulationRequest(BaseModel):
    labId: str
    sectionId: str
    moduleId: Optional[str] = None
    title: str
    htmlContent: str
    description: Optional[str] = None
    jsonStructure: Optional[str] = None  # Changed from Dict[str, Any] to str

class SaveSimulationResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Updated JSON agent prompt
JSON_AGENT_PROMPT = """
You are the JSON Agent, an expert at creating detailed JSON structures for interactive simulations. Your task is to:
1. Analyze the User's Prompt: Carefully interpret the simulation request, identifying how UI controls influence the simulation and what visuals are required also enhance stuff accordingly to ensure that the simulation is generated to make the student's learning experience better. Ensure to make it very interactive.
2. Generate a Comprehensive JSON:
   - state: Define all variables, including those controlled by UI elements (e.g., "speed", "mass"), with initial values.
   - inputs: Specify UI controls (e.g., sliders, buttons) with explicit links to state variables (e.g., a slider for "speed" updates "current_speed"), including ranges, labels, and step sizes.
   - presentation: Detail fully working visual elements (e.g., objects, graphs) that depend on state variables (e.g., an object's "y_position" changes with "speed"), ensuring at least one visual is included for visual simulations.
   - rules: Include precise logic or equations to update state variables based on user inputs and drive visual changes (e.g., "y_position = y_position + current_speed").
   - interactions: Define detailed interaction specifications for every component:
     - For UI controls: How they update state (e.g., slider "onchange" updates "current_speed").
     - For visuals: Maximum interactivity (e.g., "draggable": true, "clickable": true) with effects (e.g., "updates": {"position": "dragX, dragY"}).
3. Ensure Maximum Interactivity and Connections:
   - Every UI control must map to a specific state variable with clear interaction details (e.g., real-time updates on drag or click).
   - Every visual element must reference state variables for its properties (e.g., size, position, color) and support maximum interactivity (e.g., drag, click, hover) wherever possible.
   - Include update rules to ensure state changes dynamically affect visuals without fail.
   - Verify all interaction details are defined and implementable (e.g., dragging a block updates its exact position in state).
   - Ensure to add graphs and intereactivity and observation data tables for the experiment wherever it is nescessary.
4. Handle Iterative Prompting: Adjust the JSON to incorporate new controls, visuals, or interaction changes as requested by the user, maintaining full functionality.
5. Avoid Mistakes: Double-check that every component's interaction details are fully specified and correctly tied to the state and visuals.
IMPORTANT : ONLY GIVE THE FINAL JSON AS THE OUTPUT"""

# Updated HTML agent prompt
HTML_AGENT_PROMPT = """You are the HTML Agent, an expert at generating functional, visually stunning web simulations from JSON. Your task is to:
1. Interpret the JSON: Extract state variables, UI controls, visual elements, rules, and detailed interaction specifications.
2. Generate HTML, CSS, and JavaScript:
   - UI Controls: Implement fully functional sliders, buttons, etc., with precise interaction details (e.g., a slider updates "current_speed" on drag), matching JSON specifications (e.g., range, step size).
   - Visuals: Render fully working simulation elements (e.g., via canvas or SVG) that dynamically update based on state variables (e.g., an object moves when "current_speed" changes), ensuring maximum interactivity (e.g., draggable, clickable).
   - Logic: Implement all rules to recalculate state variables and refresh visuals whenever the state changes, with no detail omitted.
   - Interactions: Enable every specified interaction (e.g., drag, click, hover) for UI controls and visuals, ensuring state updates are precise (e.g., dragging an object updates "position" in real-time).
   - Instructions: Also ensure to give the user instructions on how to use the simulation and the explaination of the simulation.
3. Ensure Maximum Interactivity and Connections:
   - Attach event listeners to all UI controls (e.g., "oninput" for sliders, "onclick" for buttons) to update state variables instantly.
   - Tie visual properties (e.g., "element.style.top = state.y_position") to state variables and implement all interactions (e.g., drag events with exact position updates).
   - Include a main update function that runs rules and refreshes visuals after every state change, ensuring seamless responsiveness.
   - Render at least one visual element if specified in "presentation", with maximum interactivity wherever possible.
   - Ensure to add graphs and intereactivity and observation data tables for the experiment wherever it is nescessary.
4. Create a Stunning, Good-Looking Design:
   - Use modern, responsive design (e.g., flexbox, CSS Grid) for a clean, professional layout.
   - Apply smooth animations (e.g., CSS transitions, GSAP) for visual updates to enhance dynamism and engagement.
   - Ensure a polished aesthetic with consistent colors, modern fonts, clear labels, and visually appealing styling across all components.
5. Implement Every Detail Without Mistakes:
   - Verify every UI control updates its state variable as defined (e.g., slider drag updates "mass" instantly).
   - Ensure all visual elements are created, tied to state variables, and fully interactive (e.g., dragging works flawlessly).
   - Test that state changes (from UI or rules) trigger immediate, accurate visual updates.
   - Confirm all interactions (e.g., drag, click) match JSON specifications and update the simulation correctly.
IMPORTANT : ONLY GIVE THE FINAL HTML AS THE OUTPUT"""

@router.post("/simulation", response_model=SimulationResponse)
async def create_simulation(request: SimulationRequest):
    """Generate simulation content using AI"""
    try:
        # Log the request
        logger.info(f"Simulation request: {request.agent} agent for: '{request.input[:50]}...'")
        
        # Initialize the ChatAnthropic model with updated parameters
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if not anthropic_api_key:
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY environment variable not set")
        
        # Initialize Claude model with the updated configuration
        model = ChatAnthropic(
            model="claude-3-7-sonnet-latest", 
            temperature=0.3, 
            anthropic_api_key=anthropic_api_key,
            max_tokens=50000
        )

        # Create initial message history
        message_history = []
        
        # Add chat memory if provided
        if request.chat_memory:
            message_history.extend([
                SystemMessage(content=msg["content"]) if msg["role"] == "system" 
                else (HumanMessage(content=msg["content"]) if msg["role"] == "user" 
                else AIMessage(content=msg["content"]))
                for msg in request.chat_memory
            ])
        
        # Generate JSON content
        json_output = None
        if request.agent in ["json", "both"]:
            # Format messages for LangChain with system message first
            json_messages = [SystemMessage(content=JSON_AGENT_PROMPT)]
            
            # Add any existing chat memory if not already added
            if not request.chat_memory:
                for msg in message_history:
                    if not isinstance(msg, SystemMessage):
                        json_messages.append(msg)
            
            # Prepare input message for JSON generation
            input_message = f"Create a JSON specification for: {request.input}"
            if request.json_state:
                input_message += f"\n\nExisting JSON to modify:\n{json.dumps(request.json_state, indent=2)}"
            logger.debug(f"Input for JSON agent: {input_message}")
            
            json_messages.append(HumanMessage(content=input_message))
            json_response = await model.ainvoke(json_messages)
            
            # Extract and process the JSON content
            raw_json_text = json_response.content
            logger.debug(f"Raw JSON response: {raw_json_text[:500]}...")
            
            try:
                # Try to parse as direct JSON first
                json_output = json.loads(raw_json_text)
                logger.info("Successfully parsed direct JSON content")
            except json.JSONDecodeError:
                # If direct parsing fails, try to extract JSON from markdown code block
                json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw_json_text)
                if json_match:
                    try:
                        json_output = json.loads(json_match.group(1))
                        logger.info("Successfully parsed JSON from code block")
                    except json.JSONDecodeError as e:
                        # Log the error but continue with the raw text
                        logger.warning(f"JSON validation failed: {str(e)}, returning raw text")
                        json_output = raw_json_text
                else:
                    logger.warning("No JSON code block found, using raw text")
                    json_output = raw_json_text
        
        # Generate HTML content
        html_content = None
        if request.agent in ["html", "both"]:
            # Create a fresh message history for HTML generation
            html_messages = [SystemMessage(content=HTML_AGENT_PROMPT)]
            
            # Prepare JSON input for HTML generation
            json_input = request.json_state if request.json_state else json_output
            
            # Format the input for HTML generation
            input_content = json.dumps({
                "json": json_input,
                "previous_html": request.html_memory
            })
            
            html_messages.append(HumanMessage(content=input_content))
            
            # Generate HTML content
            html_response = await model.ainvoke(html_messages)
            
            # Extract the HTML content
            html_text = html_response.content
            logger.debug(f"Raw HTML response: {html_text[:500]}...")
            
            # Extract HTML from code blocks if present
            html_match = re.search(r'```(?:html)?\s*([\s\S]*?)\s*```', html_text)
            if html_match:
                html_content = html_match.group(1)
                logger.info("Extracted HTML from code block")
            else:
                html_content = html_text
                logger.info("Using raw HTML content")
            
            # Clean up HTML escape sequences
            html_content = html_content.replace('\\n', '\n')
            html_content = html_content.replace('\\r', '\r')
            html_content = html_content.replace('\\t', '\t')
            html_content = html.unescape(html_content)
        
        # Return the appropriate response based on request
        response = SimulationResponse()
        if request.agent in ["json", "both"] and json_output:
            response.json = json_output
        if request.agent in ["html", "both"] and html_content:
            response.html = html_content
        
        return response
    except Exception as e:
        logger.error(f"Error generating simulation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating simulation: {str(e)}")

@router.post("/simulation/save", response_model=SaveSimulationResponse)
async def save_simulation(
    request: SaveSimulationRequest,
    current_user: User = Depends(current_user_dependency)
):
    """Save a simulation module to a lab section"""
    try:
        logger.info(f"Saving simulation for lab: {request.labId}, section: {request.sectionId}")
        
        # Get the labs collection
        labs_collection = get_labs_collection()
        
        # Find the lab
        lab = await labs_collection.find_one({"id": request.labId})
        if not lab:
            return SaveSimulationResponse(
                success=False,
                error=f"Lab with ID {request.labId} not found"
            )
        
        # Check if the user is authorized to modify this lab
        if lab.get("author", {}).get("id") != current_user.id and current_user.role != "admin":
            return SaveSimulationResponse(
                success=False,
                error="You do not have permission to modify this lab"
            )
        
        # Prepare simulation module data
        current_time = datetime.now().isoformat()
        simulation_module = {
            "id": request.moduleId or str(uuid.uuid4()),
            "type": "simulation",
            "title": request.title,
            "htmlContent": request.htmlContent,
            "description": request.description,
            "jsonStructure": request.jsonStructure,  # Now storing as string
            "order": 0,  # Default order, will be updated if necessary
            "createdAt": current_time,
            "updatedAt": current_time
        }
        
        # Find the section and update or add the module
        section_index = None
        module_index = None
        
        for i, section in enumerate(lab.get("sections", [])):
            if section.get("id") == request.sectionId:
                section_index = i
                
                # If moduleId is provided, find and update the existing module
                if request.moduleId:
                    for j, module in enumerate(section.get("modules", [])):
                        if module.get("id") == request.moduleId:
                            module_index = j
                            # Update the order to maintain position
                            simulation_module["order"] = module.get("order", 0)
                            break
                else:
                    # No moduleId provided, so this is a new module
                    # Set order to the end of the modules list
                    simulation_module["order"] = len(section.get("modules", []))
                
                break
        
        if section_index is None:
            return SaveSimulationResponse(
                success=False,
                error=f"Section with ID {request.sectionId} not found in lab"
            )
        
        # Update or add the module
        update_operation = None
        if module_index is not None:
            # Update existing module
            update_path = f"sections.{section_index}.modules.{module_index}"
            update_operation = {
                "$set": {
                    update_path: simulation_module,
                    "updatedAt": current_time
                }
            }
        else:
            # Add new module
            update_path = f"sections.{section_index}.modules"
            update_operation = {
                "$push": {
                    update_path: simulation_module
                },
                "$set": {
                    "updatedAt": current_time
                }
            }
        
        # Update the database
        result = await labs_collection.update_one(
            {"id": request.labId},
            update_operation
        )
        
        if result.modified_count == 0:
            return SaveSimulationResponse(
                success=False,
                error="Failed to update lab. No changes were made."
            )
        
        return SaveSimulationResponse(
            success=True,
            data={
                "moduleId": simulation_module["id"],
                "message": "Simulation module saved successfully"
            }
        )
        
    except Exception as e:
        logger.error(f"Error saving simulation: {str(e)}")
        logger.error(traceback.format_exc())
        return SaveSimulationResponse(
            success=False,
            error=f"Error saving simulation: {str(e)}"
        )

@router.get("/simulation/{lab_id}/{section_id}/{module_id}", response_model=SaveSimulationResponse)
async def get_simulation(
    lab_id: str,
    section_id: str,
    module_id: str,
    current_user: User = Depends(current_user_dependency)
):
    """Get a specific simulation module"""
    try:
        logger.info(f"Getting simulation for lab: {lab_id}, section: {section_id}, module: {module_id}")
        
        # Get the labs collection
        labs_collection = get_labs_collection()
        
        # Find the lab
        lab = await labs_collection.find_one({"id": lab_id})
        if not lab:
            return SaveSimulationResponse(
                success=False,
                error=f"Lab with ID {lab_id} not found"
            )
        
        # Convert MongoDB document to Python dict
        lab = serialize_mongo_doc(lab)
        
        # Check if the user is authorized to access this lab
        if lab.get("author", {}).get("id") != current_user.id and current_user.role != "admin":
            return SaveSimulationResponse(
                success=False,
                error="You do not have permission to access this lab"
            )
        
        # Find the section and module
        for section in lab.get("sections", []):
            if section.get("id") == section_id:
                for module in section.get("modules", []):
                    if module.get("id") == module_id and module.get("type") == "simulation":
                        return SaveSimulationResponse(
                            success=True,
                            data=module
                        )
                
                # Module not found in section
                return SaveSimulationResponse(
                    success=False,
                    error=f"Simulation module with ID {module_id} not found in section"
                )
        
        # Section not found
        return SaveSimulationResponse(
            success=False,
            error=f"Section with ID {section_id} not found in lab"
        )
        
    except Exception as e:
        logger.error(f"Error getting simulation: {str(e)}")
        logger.error(traceback.format_exc())
        return SaveSimulationResponse(
            success=False,
            error=f"Error getting simulation: {str(e)}"
        )