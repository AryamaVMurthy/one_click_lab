Detailed Set of Rules to Define the JSON
These rules ensure the JSON is structured, flexible, and detailed enough to regenerate any physics experiment simulation via prompting, with an emphasis on interactivity and display quality.




Generalisation: 

{
  "simulation_name": "string",
  "description": "string",
  "domain": "string",  // e.g., "physics", "chemistry", "programming"
  "system": {
    "type": "string",  // e.g., "physical", "chemical", "computational"
    "entities": [
      {
        "type": "string",      // e.g., "object", "molecule", "code_block"
        "id": "string",        // Unique identifier
        "properties": {},      // Key-value pairs (e.g., "mass": "state_name")
        "connections": ["string"],  // Optional, links to other entity IDs
        "interactive_properties": {  // Optional, defines interactivity
          "draggable": "boolean",
          "clickable": "boolean",
          "hoverable": "boolean"
        }
      }
    ],
    "context": {           // Optional, defines the environment or scope
      "type": "string",    // e.g., "fluid", "cell", "runtime"
      "properties": {}     // e.g., {"temperature": "state_name"}
    }
  },
  "state": [
    {
      "name": "string",
      "symbol": "string",  // Optional, for display (e.g., "m", "pH")
      "type": "string",    // e.g., "number", "string", "array", "object"
      "unit": "string",    // Optional, e.g., "g", "mol/L"
      "adjustable": "boolean",
      "range": ["min", "max"],  // Optional, for adjustable state
      "default": "any",
      "calculated": "boolean",
      "formula": "string"  // Optional, e.g., "mass / volume"
    }
  ],
  "constants": [
    {
      "name": "string",
      "symbol": "string",  // Optional
      "value": "any",
      "unit": "string"     // Optional
    }
  ],
  "rules": [
    {
      "target": "string",  // State or entity property to update (e.g., "position")
      "formula": "string", // Logic, equation, or algorithm (e.g., "v * t")
      "condition": "string",  // Optional, e.g., "t > 0"
      "type": "string"     // e.g., "equation", "algorithm", "reaction"
    }
  ],
  "inputs": [
    {
      "state": "string",   // Links to a state variable (optional)
      "target": "string",  // Optional, e.g., "entity:ID" or "tool:ID"
      "type": "string",    // e.g., "slider", "button", "text_input", "code_editor"
      "label": "string",
      "properties": {},    // Type-specific (e.g., "min", "max", "action")
      "condition": "string"  // Optional, e.g., "mode == 'edit'"
    }
  ],
  "presentation": {
    "scene": {
      "type": "string",    // e.g., "2d", "3d", "static"
      "objects": [
        {
          "type": "string",  // e.g., "circle", "image", "text", "molecule"
          "id": "string",    // Optional, links to entity or unique ID
          "properties": {},  // e.g., "position": "state_name", "src": "asset_id"
          "interactive": "boolean",
          "events": [
            {
              "type": "string",  // e.g., "click", "drag"
              "updates": {},     // e.g., {"position": "dragX"}
              "action": "string" // Optional, e.g., "toggleVisibility"
            }
          ]
        }
      ]
    },
    "graphs": [
      {
        "x_axis": "string",  // State or calculated value
        "y_axis": "string",
        "label": "string",
        "style": "string",   // e.g., "line", "scatter"
        "properties": {}     // e.g., "color", "grid"
      }
    ],
    "outputs": [
      {
        "state": "string",
        "label": "string",
        "format": "string"   // e.g., "%.2f"
      }
    ],
    "indicators": [
      {
        "type": "string",    // e.g., "gauge", "label"
        "state": "string",
        "properties": {}     // e.g., "unit", "position"
      }
    ]
  },
  "constraints": [
    {
      "expression": "string",  // e.g., "mass > 0"
      "message": "string"
    }
  ],
  "tools": [
    {
      "type": "string",    // e.g., "timer", "pipette", "debugger"
      "id": "string",
      "label": "string",
      "properties": {}     // e.g., "unit", "precision"
    }
  ],
  "interactions": [
    {
      "entity_id": "string",  // Optional, links to "system.entities.id"
      "tool": "string",       // Optional, links to "tools.id"
      "event": "string",      // e.g., "click", "drag", "hover"
      "action": "string",     // e.g., "toggleState", "measure", "execute"
      "properties": {}        // Action-specific (e.g., "states": ["on", "off"])
    }
  ],
  "assets": [
    {
      "id": "string",      // Unique identifier
      "type": "string",    // e.g., "image", "audio", "video"
      "src": "string",     // Path or URL (e.g., "images/cell.png")
      "properties": {}     // Optional, e.g., "alt": "Cell Diagram"
    }
  ],
  "additional_points": {}  // Flexible key-value pairs for extras
}





{
  "experiment_name": "Buoyancy Basics",
  "description": "Explore how objects float or sink by adjusting their mass and volume in different fluids.",
  "physics_domain": "mechanics",
  "setup": {
    "type": "mechanical_system",
    "components": [
      {
        "type": "object",
        "id": "block",
        "properties": {
          "mass": "object_mass",
          "volume": "object_volume"
        },
        "connections": [],
        "interactive_properties": {
          "draggable": true,
          "clickable": true,
          "hoverable": false
        }
      },
      {
        "type": "tank",
        "id": "tank1",
        "properties": {
          "fluid": "fluid_type"
        },
        "connections": ["block"],
        "interactive_properties": {
          "draggable": false,
          "clickable": false,
          "hoverable": false
        }
      }
    ],
    "environment": {
      "type": "fluid",
      "properties": {
        "density": "fluid_density"
      }
    }
  },
  "variables": [
    {
      "name": "object_mass",
      "symbol": "m",
      "type": "number",
      "unit": "g",
      "adjustable": true,
      "range": [1, 1000],
      "default": 50,
      "calculated": false
    },
    {
      "name": "object_volume",
      "symbol": "V",
      "type": "number",
      "unit": "cm³",
      "adjustable": true,
      "range": [1, 1000],
      "default": 50,
      "calculated": false
    },
    {
      "name": "fluid_type",
      "type": "string",
      "options": ["water", "oil", "custom"],
      "default": "water",
      "adjustable": true,
      "calculated": false
    },
    {
      "name": "fluid_density_custom",
      "symbol": "ρ_c",
      "type": "number",
      "unit": "g/cm³",
      "adjustable": true,
      "range": [0.1, 2],
      "default": 1.0,
      "calculated": false,
      "condition": "fluid_type == 'custom'"
    },
    {
      "name": "fluid_density",
      "symbol": "ρ_f",
      "type": "number",
      "unit": "g/cm³",
      "calculated": true,
      "formula": "if fluid_type == 'water' then 1.0 else if fluid_type == 'oil' then 0.8 else fluid_density_custom"
    },
    {
      "name": "submerged_volume",
      "symbol": "V_sub",
      "type": "number",
      "unit": "cm³",
      "calculated": true,
      "formula": "if object_mass <= fluid_density * object_volume then object_mass / fluid_density else object_volume"
    },
    {
      "name": "buoyant_force",
      "symbol": "F_b",
      "type": "number",
      "unit": "g",
      "calculated": true,
      "formula": "fluid_density * submerged_volume"
    },
    {
      "name": "state_of_block",
      "type": "string",
      "calculated": true,
      "formula": "if object_mass <= fluid_density * object_volume then 'floating' else 'sinking'"
    }
  ],
  "constants": [],
  "governing_equations": [
    {
      "variable": "position_of_block",
      "formula": "if state_of_block == 'floating' then 'on_surface' else 'submerged'"
    }
  ],
  "calculations": [],
  "ui_controls": [
    {
      "variable": "object_mass",
      "type": "slider",
      "label": "Mass (g)",
      "properties": {
        "min": 1,
        "max": 1000,
        "step": 1
      }
    },
    {
      "variable": "object_volume",
      "type": "slider",
      "label": "Volume (cm³)",
      "properties": {
        "min": 1,
        "max": 1000,
        "step": 1
      }
    },
    {
      "variable": "fluid_type",
      "type": "selection",
      "label": "Fluid Type",
      "properties": {
        "options": ["water", "oil", "custom"]
      }
    },
    {
      "variable": "fluid_density_custom",
      "type": "slider",
      "label": "Custom Fluid Density (g/cm³)",
      "properties": {
        "min": 0.1,
        "max": 2,
        "step": 0.1
      },
      "condition": "fluid_type == 'custom'"
    },
    {
      "target": "block",
      "type": "button",
      "label": "Place in Fluid",
      "properties": {
        "action": "placeInTank"
      }
    },
    {
      "type": "button",
      "label": "Measure Volume by Displacement",
      "properties": {
        "action": "measureVolume"
      }
    }
  ],
  "ui_outputs": [
    {
      "variable": "object_mass",
      "label": "Mass",
      "format": "%.0f g"
    },
    {
      "variable": "object_volume",
      "label": "Volume",
      "format": "%.0f cm³"
    },
    {
      "variable": "fluid_type",
      "label": "Fluid Type"
    },
    {
      "variable": "fluid_density",
      "label": "Fluid Density",
      "format": "%.1f g/cm³"
    },
    {
      "variable": "buoyant_force",
      "label": "Buoyant Force",
      "format": "%.0f g"
    },
    {
      "variable": "state_of_block",
      "label": "State",
      "format": "%s"
    }
  ],
  "visualization": {
    "scene": {
      "type": "2d",
      "objects": [
        {
          "type": "rectangle",
          "id": "tank",
          "properties": {
            "position": {"x": 0, "y": 0},
            "width": 200,
            "height": 300,
            "color": "blue"
          },
          "interactive": false
        },
        {
          "type": "rectangle",
          "id": "block",
          "properties": {
            "position": {
              "x": 50,
              "y": "if state_of_block == 'floating' then 250 else 50"
            },
            "width": 50,
            "height": "object_volume / 10",
            "color": "red"
          },
          "interactive": true,
          "events": [
            {
              "type": "click",
              "action": "togglePlacement"
            },
            {
              "type": "drag",
              "updates": {"position": "dragPosition"}
            }
          ]
        }
      ]
    },
    "graphs": [
      {
        "x_axis": "object_volume",
        "y_axis": "object_mass",
        "label": "Mass vs Volume",
        "style": "line",
        "properties": {
          "color": "green",
          "line": {
            "slope": "fluid_density",
            "intercept": 0
          }
        }
      }
    ],
    "indicators": [
      {
        "type": "label",
        "variable": "state_of_block",
        "properties": {
          "position": {"x": 10, "y": 10},
          "text": "Block is {state_of_block}"
        }
      }
    ]
  },
  "constraints": [
    {
      "expression": "object_mass > 0",
      "message": "Mass must be positive."
    },
    {
      "expression": "object_volume > 0",
      "message": "Volume must be positive."
    },
    {
      "expression": "fluid_density > 0",
      "message": "Fluid density must be positive."
    }
  ],
  "measurement_tools": [
    {
      "type": "measure",
      "id": "volume_measurement",
      "label": "Measure Volume",
      "properties": {
        "unit": "cm³"
      }
    }
  ],
  "interactions": [
    {
      "component_id": "block",
      "event": "click",
      "action": "togglePlacement",
      "properties": {
        "states": ["inTank", "outOfTank"]
      }
    },
    {
      "component_id": "block",
      "event": "drag",
      "action": "move",
      "properties": {
        "updates": {"position": "dragPosition"}
      }
    },
    {
      "tool": "volume_measurement",
      "event": "click",
      "action": "measureVolume",
      "properties": {
        "output": "object_volume"
      }
    }
  ],
  "assets": [],
  "additional_points": {
    "sound_effect": "play a splash sound when the block is placed in the tank"
  }
}




{
  "simulation_name": "Binary Search Tree Simulation",
  "description": "An interactive simulation to visualize insertion and deletion in a binary search tree.",
  "domain": "computer_science",

  "system": {
    "type": "data_structure",
    "entities": [
      {
        "type": "binary_search_tree",
        "id": "tree",
        "properties": {
          "root_id": "root_node_id"
        },
        "connections": [],
        "interactive_properties": {
          "draggable": false,
          "clickable": false,
          "hoverable": false
        }
      }
    ],
    "context": {
      "type": "runtime",
      "properties": {}
    }
  },

  "state": [
    {
      "name": "nodes",
      "symbol": "N",
      "type": "list",
      "unit": null,
      "adjustable": false,
      "default": [
        {"id": "node1", "value": 50, "left": null, "right": null}
      ],
      "calculated": false
    },
    {
      "name": "root_id",
      "symbol": "R",
      "type": "string",
      "unit": null,
      "adjustable": false,
      "default": "node1",
      "calculated": false
    },
    {
      "name": "selected_value",
      "symbol": "V",
      "type": "number",
      "unit": null,
      "adjustable": true,
      "default": null,
      "calculated": false
    }
  ],

  "constants": [],

  "rules": [
    {
      "target": "nodes",
      "formula": "insert new node with selected_value into the tree, maintaining BST properties",
      "condition": "selected_value is not null",
      "type": "algorithm"
    },
    {
      "target": "nodes",
      "formula": "delete node with selected_value from the tree, maintaining BST properties",
      "condition": "selected_value is not null and exists in tree",
      "type": "algorithm"
    }
  ],

  "inputs": [
    {
      "state": "selected_value",
      "type": "text_input",
      "label": "Enter value to insert",
      "properties": {
        "placeholder": "Enter number",
        "action": "set_insert_value"
      }
    },
    {
      "target": "tree",
      "type": "button",
      "label": "Insert",
      "properties": {
        "action": "insert"
      }
    },
    {
      "state": "selected_value",
      "type": "text_input",
      "label": "Enter value to delete",
      "properties": {
        "placeholder": "Enter number",
        "action": "set_delete_value"
      }
    },
    {
      "target": "tree",
      "type": "button",
      "label": "Delete",
      "properties": {
        "action": "delete"
      }
    }
  ],

  "presentation": {
    "scene": {
      "type": "2d",
      "objects": [
        {
          "type": "circle",
          "id": "node_{node.id}",
          "properties": {
            "position": {
              "x": "calculate_x_position(node.id, nodes, root_id)",
              "y": "calculate_y_position(node.level, nodes, root_id)"
            },
            "radius": 20,
            "fill_color": "white",
            "stroke_color": "black",
            "text": "node.value"
          },
          "interactive": true,
          "events": [
            {
              "type": "hover",
              "updates": {},
              "action": "highlight"
            }
          ]
        },
        {
          "type": "line",
          "id": "edge_{parent_id}_{child_id}",
          "properties": {
            "start": "parent_node.position",
            "end": "child_node.position",
            "color": "black",
            "width": 2
          },
          "interactive": false
        }
      ]
    },
    "graphs": [],
    "outputs": [
      {
        "state": "nodes",
        "label": "Number of nodes: {len(nodes)}"
      }
    ],
    "indicators": []
  },

  "constraints": [
    {
      "expression": "selected_value is number and selected_value >= 0",
      "message": "Value must be a non-negative number."
    }
  ],

  "tools": [],

  "interactions": [
    {
      "entity_id": "tree",
      "event": "click",
      "action": "insert",
      "properties": {
        "trigger": "insert_button_click"
      }
    },
    {
      "entity_id": "tree",
      "event": "click",
      "action": "delete",
      "properties": {
        "trigger": "delete_button_click"
      }
    }
  ],

  "assets": [],

  "additional_points": {
    "layout_algorithm": "Position nodes in a binary tree layout, with root at center, levels spaced vertically, and nodes at each level spaced horizontally.",
    "animation": "Animate node insertion and deletion with smooth transitions."
  }
}