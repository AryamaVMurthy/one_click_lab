from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union, Literal

class SimulationModule(BaseModel):
    """
    Data model for simulation module content
    """
    id: str
    type: Literal["simulation"] = "simulation"
    title: Optional[str] = None
    description: Optional[str] = None
    htmlContent: str
    jsonContent: Optional[str] = None  # Changed from Dict[str, Any] to str
    completed: Optional[bool] = False
    createdAt: str
    updatedAt: str

class SimulationRequest(BaseModel):
    """
    Request model for simulation generation API
    """
    input: str
    agent: Literal["json", "html", "both"]
    json_state: Optional[str] = None  # Changed from Dict[str, Any] to str
    html_memory: Optional[str] = None
    chat_memory: List[Dict[str, str]] = []

class SimulationResponse(BaseModel):
    """
    Response model for simulation generation API
    """
    json: Optional[str] = None  # Changed from Dict[str, Any] to str
    html: Optional[str] = None
