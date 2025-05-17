# author: erosdiffusionai@gmail.com

from .SelectorNode import SelectorNode

NODE_CLASS_MAPPINGS = { 
    "SelectorNode": SelectorNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
      "SelectorNode": "📁 Selector",
}

EXTENSION_NAME = "Enrico"

WEB_DIRECTORY = "./web"

# Additional web resources to ensure they're loaded
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
