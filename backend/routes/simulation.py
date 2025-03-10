from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import os
import json
import logging
import traceback
import html
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Simulation"])

class SimulationRequest(BaseModel):
    input: str
    agent: Literal["json", "html", "both"]
    json_state: Optional[dict] = None
    html_memory: Optional[str] = None
    chat_memory: list = []

class SimulationResponse(BaseModel):
    json: Optional[dict] = None
    html: Optional[str] = None

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

@router.post("/simulation")
async def handle_simulation(request: SimulationRequest):
    try:
        # Log the request
        logger.info(f"Received simulation request: {request}")
        
        # Get API key from environment
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("Anthropic API key not found")
            raise HTTPException(status_code=500, detail="Anthropic API key not found")
        
        logger.info(f"Using API key: {api_key[:5]}...")
        
        # Initialize LangChain Anthropic client with the specified parameters
        llm = ChatAnthropic(
            model="claude-3-7-sonnet-latest",
            anthropic_api_key=api_key,
            max_tokens=45000,
            temperature=0.3,
        )
        
        json_output = None
        html_output = None
        
        # Process for JSON agent
        if request.agent in ["json", "both"]:
            logger.info("Processing JSON agent request")
            
            # Format messages for LangChain
            messages = [SystemMessage(content=JSON_AGENT_PROMPT)]
            
            # Add chat memory if any
            for msg in request.chat_memory:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
            
            # Add the current user input
            messages.append(HumanMessage(content=request.input))
            
            try:
                # Send request to Anthropic via LangChain
                logger.info("Sending request to Anthropic API for JSON generation")
                response = llm.invoke(messages)
                
                # Extract the content text from the response
                content_text = response.content
                logger.info(f"Received response content: {content_text[:100]}...")
                
                # Parse JSON from the response text
                try:
                    # Try to parse as direct JSON first
                    json_output = json.loads(content_text)
                except json.JSONDecodeError:
                    # If direct parsing fails, try to extract JSON from markdown code block
                    import re
                    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content_text)
                    if json_match:
                        try:
                            json_output = json.loads(json_match.group(1))
                        except json.JSONDecodeError:
                            # If both methods fail, raise an error
                            error_msg = "Failed to parse JSON from model response"
                            logger.error(error_msg)
                            raise HTTPException(status_code=500, detail=error_msg)
                    else:
                        error_msg = "No JSON found in model response"
                        logger.error(error_msg)
                        raise HTTPException(status_code=500, detail=error_msg)
                
                logger.info("Successfully processed JSON agent response")
                
            except Exception as e:
                error_msg = f"Error with Anthropic API for JSON generation: {str(e)}"
                logger.error(error_msg)
                raise HTTPException(status_code=500, detail=error_msg)

        # Process for HTML agent
        if request.agent in ["html", "both"]:
            logger.info("Processing HTML agent request")
            
            # Use the same LLM instance but with a different system prompt for HTML generation
            
            # Prepare input for HTML generation
            input_content = json.dumps({
                "json": json_output or request.json_state,
                "previous_html": request.html_memory
            })
            
            # Format messages for LangChain
            html_messages = [
                SystemMessage(content=HTML_AGENT_PROMPT),
                HumanMessage(content=input_content)
            ]
            
            try:
                # Send request to Anthropic via LangChain
                logger.info("Sending request to Anthropic API for HTML generation")
                response = llm.invoke(html_messages)
                
                # Extract the HTML content from the response
                html_output = response.content
                
                # If the HTML is in a code block, extract it
                import re
                html_match = re.search(r'```(?:html)?\s*([\s\S]*?)\s*```', html_output)
                if html_match:
                    html_output = html_match.group(1)
                
                # Clean up HTML escape sequences
                html_output = html_output.replace('\\n', '\n')
                html_output = html_output.replace('\\r', '\r')
                html_output = html_output.replace('\\t', '\t')
                html_output = html.unescape(html_output)
                
                logger.info("Successfully processed HTML agent response")
                
            except Exception as e:
                error_msg = f"Error with Anthropic API for HTML generation: {str(e)}"
                logger.error(error_msg)
                raise HTTPException(status_code=500, detail=error_msg)

        logger.info("Returning simulation response")
        return {"json": json_output, "html": html_output}

    except Exception as e:
        error_detail = str(e) + "\n" + traceback.format_exc()
        logger.error(f"Simulation API Error: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))