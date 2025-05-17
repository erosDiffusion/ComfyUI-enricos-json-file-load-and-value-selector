# Select key from JSON (Alpha)

![workflow](./example_workflows/demo.jpg)



## What does this do ?
- this node lists json files in the ComfyUI input folder
- shows a dropdown where you can select such a node
- reads  the content of the file (key value pairs)
- shows the key/value pair in a dropdown
- when you select the dropdown the "motion" field is populated with the key corresponding to the selection
- when you run the node the text is submitted as output (you can also input free text)

## Install
To install the node via manager 
- open the comfy ui manager popup 
- choose the option "Install via Git URL"
- paste: https://github.com/erosDiffusion/ComfyUI-enricos-json-file-load-and-value-selector.git

### Note
For this to work you need to set
```security_level = weak ```

in 
```<your comfy install folder>\user\default\ComfyUI-Manager\config.ini```

### Alternative install 
with git installed:
```git clone  https://github.com/erosDiffusion/ComfyUI-enricos-json-file-load-and-value-selector.git ```
into your custom nodes folder 

### Trivia:
This node uses a custom DOM Widget and custom routes.
