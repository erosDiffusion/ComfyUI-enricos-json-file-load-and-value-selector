import os
import json
import folder_paths
from server import PromptServer
from aiohttp import web

# Define API endpoints outside the node class
@PromptServer.instance.routes.get("/api/enricos/selector/list_files")
async def list_files(request):
    """API endpoint to list files in the input directory"""
    # Use the correct path to the ComfyUI input directory 
    comfy_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    input_dir = os.path.join(comfy_path, "input")
    
    try:
        # Ensure the input directory exists
        if not os.path.exists(input_dir):
            os.makedirs(input_dir)
            
        # List files in the directory
        files = [f for f in os.listdir(input_dir) if os.path.isfile(os.path.join(input_dir, f))]
        
        return web.json_response({"files": files})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

@PromptServer.instance.routes.get("/api/enricos/selector/get_file_content")
async def get_file_content(request):
    """API endpoint to get the content of a specific file"""
    filename = request.query.get("filename")
    if not filename:
        return web.json_response({"error": "Filename parameter is required"}, status=400)
    
    comfy_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    input_dir = os.path.join(comfy_path, "input")
    file_path = os.path.join(input_dir, filename)
    
    try:
        if not os.path.exists(file_path):
            return web.json_response({"error": f"File {filename} not found"}, status=404)
            
        with open(file_path, "r") as f:
            content = json.load(f)
            
        return web.json_response({"content": content})
    except json.JSONDecodeError:
        return web.json_response({"error": f"File {filename} is not valid JSON"}, status=400)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

class SelectorNode:
    """
    A node that allows selecting files from a directory and then selecting values from those files.
    """
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "motion": ("STRING", {"default": "", "multiline": True}),
            },
        }

    RETURN_TYPES = ("STRING",)
    FUNCTION = "process"
    CATEGORY = "enricos"
    
    def process(self, motion):
        # Simply return the input motion as output
        return (motion,)

NODE_CLASS_MAPPINGS = {
    "SelectorNode": SelectorNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SelectorNode": "Selector"
}
