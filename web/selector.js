import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// Register the SelectorNode widget
app.registerExtension({
    name: "Enricos.Selector",
    
    // This hook is called before node registration, when the graph is first initialized
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // Only apply to our specific node
        if (nodeData.name !== "SelectorNode") {
            return;
        }

        // Store original methods
        const onExecuted = nodeType.prototype.onExecuted;
          // Override the node creation method
        nodeType.prototype.onNodeCreated = function() {
            // When the node is created in the graph
            
            // First, get the motion widget reference
            const motionWidget = this.widgets && this.widgets.length > 0 ? 
                this.widgets.find(w => w.name === "motion") : null;
                
            if (motionWidget) {
                this.initialValue = motionWidget.value;
            }
            
            // Create the container div for the selector UI
            const containerDiv = document.createElement("div");
            containerDiv.style.padding = "10px";
            containerDiv.style.backgroundColor = "#2a2a2a";
            containerDiv.style.borderRadius = "8px";
            containerDiv.style.width = "100%";
            containerDiv.style.boxSizing = "border-box";
            containerDiv.style.overflow = "hidden";
            containerDiv.id = "selector_" + this.id;
            
            // Create the file dropdown
            const fileSelectContainer = document.createElement("div");
            fileSelectContainer.style.marginBottom = "10px";
            
            const fileLabel = document.createElement("label");
            fileLabel.innerText = "Select File:";
            fileLabel.style.display = "block";
            fileLabel.style.marginBottom = "5px";
            fileLabel.style.fontWeight = "bold";
            
            const fileSelect = document.createElement("select");
            fileSelect.style.width = "100%";
            fileSelect.style.padding = "5px";
            fileSelect.style.borderRadius = "4px";
            fileSelect.style.backgroundColor = "#3a3a3a";
            fileSelect.style.color = "white";
            fileSelect.style.border = "1px solid #555";
            
            fileSelectContainer.appendChild(fileLabel);
            fileSelectContainer.appendChild(fileSelect);
            
            // Create the value dropdown
            const valueSelectContainer = document.createElement("div");
            
            const valueLabel = document.createElement("label");
            valueLabel.innerText = "Select Key-Value:";
            valueLabel.style.display = "block";
            valueLabel.style.marginBottom = "5px";
            valueLabel.style.fontWeight = "bold";
            
            const valueSelect = document.createElement("select");
            valueSelect.style.width = "100%";
            valueSelect.style.padding = "5px";
            valueSelect.style.borderRadius = "4px";
            valueSelect.style.backgroundColor = "#3a3a3a";
            valueSelect.style.color = "white";
            valueSelect.style.border = "1px solid #555";
            
            valueSelectContainer.appendChild(valueLabel);
            valueSelectContainer.appendChild(valueSelect);
            
            // Create refresh button
            const refreshContainer = document.createElement("div");
            refreshContainer.style.textAlign = "right";
            refreshContainer.style.marginBottom = "10px";
            
            const refreshButton = document.createElement("button");
            refreshButton.innerText = "Refresh Files";
            refreshButton.style.padding = "5px 10px";
            refreshButton.style.backgroundColor = "#444";
            refreshButton.style.color = "white";
            refreshButton.style.border = "none";
            refreshButton.style.borderRadius = "4px";
            refreshButton.style.cursor = "pointer";
            
            // Add hover effect
            refreshButton.addEventListener("mouseover", () => {
                refreshButton.style.backgroundColor = "#555";
            });
            refreshButton.addEventListener("mouseout", () => {
                refreshButton.style.backgroundColor = "#444";
            });
            
            refreshContainer.appendChild(refreshButton);
            
            // Add "Loading..." option
            const loadingOption = document.createElement("option");
            loadingOption.text = "Loading...";
            loadingOption.disabled = true;
            fileSelect.appendChild(loadingOption);
            fileSelect.selectedIndex = 0;
            
            const loadingValueOption = document.createElement("option");
            loadingValueOption.text = "Select a file first";
            loadingValueOption.disabled = true;
            valueSelect.appendChild(loadingValueOption);
            valueSelect.selectedIndex = 0;
            
            // Add the containers to the main container
            containerDiv.appendChild(refreshContainer);
            containerDiv.appendChild(fileSelectContainer);
            containerDiv.appendChild(valueSelectContainer);
            
            // Add the DOM widget to the node
            this.selectorWidget = this.addDOMWidget("selector", "selector", containerDiv, {
                hideOnZoom: false
            });
            
            // Store references to UI elements as properties of the node
            this.fileSelect = fileSelect;
            this.valueSelect = valueSelect;
            this.refreshButton = refreshButton;
            
            // Set up event handlers
            refreshButton.addEventListener("click", () => {
                this.loadFiles();
            });
            
            fileSelect.addEventListener("change", () => {
                this.loadFileContent(fileSelect.value);
            });
            
            valueSelect.addEventListener("change", () => {
                const selectedKey = valueSelect.value;
                if (selectedKey) {
                    // Update the node's input widget value
                    if (this.widgets) {
                        const motionWidget = this.widgets.find(w => w.name === "motion");
                        if (motionWidget) {
                            motionWidget.value = selectedKey;
                            
                            // Trigger change event to update the graph
                            try {
                                if (typeof motionWidget.callback === 'function') {
                                    motionWidget.callback(selectedKey);
                                }
                            } catch (e) {
                                console.error("Error triggering widget callback:", e);
                            }
                            
                            // Make sure the node is flagged as changed
                            this.setDirtyCanvas(true, true);
                        }
                    }
                }
            });
            
            // Load files from the API
            this.loadFiles();
            
            // Set a reasonable size for the node
            this.setSize([300, 180]);
        };          // Handle node removal
        nodeType.prototype.onRemoved = function() {
            try {
                // Clean up event listeners
                if (this.fileSelect) {
                    this.fileSelect.onchange = null;
                }
                
                if (this.valueSelect) {
                    this.valueSelect.onchange = null;
                }
                
                if (this.refreshButton) {
                    this.refreshButton.onclick = null;
                }
            } catch (error) {
                console.warn("Error during SelectorNode cleanup:", error);
            }
        }
        // Add methods to load data from the API        // Load files from the API endpoint
        nodeType.prototype.loadFiles = async function() {
            try {
                if (!this.fileSelect) {
                    console.error("File select element not initialized");
                    return;
                }
                
                // Show loading state for the refresh button if it exists
                if (this.refreshButton) {
                    const originalText = this.refreshButton.innerText;
                    this.refreshButton.innerText = "Loading...";
                    this.refreshButton.disabled = true;
                    
                    // Reset button after a timeout
                    setTimeout(() => {
                        this.refreshButton.innerText = originalText;
                        this.refreshButton.disabled = false;
                    }, 2000);
                }                
                // Use the correct API endpoint path to match the Python backend
                const response = await api.fetchApi("/api/enricos/selector/list_files");
                
                // Handle possible error responses before trying to parse JSON
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
                  // Safe JSON parsing with better error handling
                let data;
                try {
                    // Use a single method to read the response to avoid 
                    // "body stream already read" errors
                    data = await response.json();
                } catch (parseError) {
                    console.error("JSON parsing error:", parseError);
                    throw new Error(`Failed to parse server response: ${parseError.message}`);
                }
                
                if (data.files && Array.isArray(data.files)) {
                    // Clear existing options
                    while (this.fileSelect.options.length > 0) {
                        this.fileSelect.remove(0);
                    }
                    
                    if (data.files.length === 0) {
                        const noFilesOption = document.createElement("option");
                        noFilesOption.text = "No files found";
                        noFilesOption.disabled = true;
                        this.fileSelect.appendChild(noFilesOption);
                    } else {
                        // Add empty option as first
                        const emptyOption = document.createElement("option");
                        emptyOption.text = "-- Select a file --";
                        emptyOption.value = "";
                        this.fileSelect.appendChild(emptyOption);
                        
                        // Add file options
                        data.files.forEach(file => {
                            const option = document.createElement("option");
                            option.text = file;
                            option.value = file;
                            this.fileSelect.appendChild(option);
                        });
                        
                        // If we have an initial value, try to select it
                        if (this.initialValue) {
                            // We need to check all files to find which one contains the key
                            this.findFileContainingKey(this.initialValue);
                        }
                    }
                }            } catch (error) {
                console.error("Error loading files:", error);
                if (this.fileSelect) {
                    // Clear existing options
                    while (this.fileSelect.options.length > 0) {
                        this.fileSelect.remove(0);
                    }                
                    const errorOption = document.createElement("option");
                    // Add more specific error message to help with debugging
                    errorOption.text = `Error: ${error.message || "Unknown error"}`;
                    errorOption.title = error.toString(); // Show full error on hover
                    errorOption.disabled = true;
                    this.fileSelect.appendChild(errorOption);
                }
            }
        };
        
        // Find which file contains the specified key
        nodeType.prototype.findFileContainingKey = async function(keyToFind) {
            if (!this.fileSelect || !keyToFind) {
                console.error("File select element not initialized or no key to find");
                return;
            }
            
            // Go through each file and check if it contains the key
            for (let i = 1; i < this.fileSelect.options.length; i++) {
                if (!this.fileSelect.options[i]) continue;
                  const fileName = this.fileSelect.options[i].value;
                if (!fileName) continue;
                
                try {
                    const response = await api.fetchApi(`/api/enricos/selector/get_file_content?filename=${encodeURIComponent(fileName)}`);
                    
                    // Handle possible error responses                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                    }
                    
                    let data;
                    try {
                        // Use a single method to read the response
                        data = await response.json();
                    } catch (parseError) {
                        throw new Error(`Failed to parse file content: ${parseError.message}`);
                    }
                    
                    if (data.content && typeof data.content === 'object') {
                        // Check if this file contains the key
                        if (keyToFind in data.content) {
                            // Select this file
                            this.fileSelect.value = fileName;
                            // Load content for this file
                            await this.loadFileContent(fileName, keyToFind);
                            break;
                        }
                    }
                } catch (error) {
                    console.error(`Error checking file ${fileName}:`, error);
                }
            }
        };
        
        // Load the content of a specific file and populate the value dropdown
        nodeType.prototype.loadFileContent = async function(fileName, keyToSelect) {
            if (!this.valueSelect) {
                console.error("Value select element not initialized");
                return;
            }
            
            if (!fileName) {
                // Clear the value dropdown if no file is selected
                while (this.valueSelect.options.length > 0) {
                    this.valueSelect.remove(0);
                }
                
                const noFileOption = document.createElement("option");
                noFileOption.text = "Select a file first";
                noFileOption.disabled = true;
                this.valueSelect.appendChild(noFileOption);
                return;
            }
            
            try {
                // Show loading state
                while (this.valueSelect.options.length > 0) {
                    this.valueSelect.remove(0);
                }
                
                const loadingOption = document.createElement("option");
                loadingOption.text = "Loading...";
                loadingOption.disabled = true;
                this.valueSelect.appendChild(loadingOption);
                
                // Fetch file content
                const response = await api.fetchApi(`/api/enricos/selector/get_file_content?filename=${encodeURIComponent(fileName)}`);
                
                // Handle possible error responses
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
                
                // Safe JSON parsing
                let data;
                try {
                    // Use a single method to read the response
                    data = await response.json();
                } catch (parseError) {
                    console.error("JSON parsing error:", parseError);
                    throw new Error(`Failed to parse file content: ${parseError.message}`);
                }
                
                // Clear existing options
                while (this.valueSelect.options.length > 0) {
                    this.valueSelect.remove(0);
                }
                
                if (data.content && typeof data.content === 'object') {
                    // Create empty option as first
                    const emptyOption = document.createElement("option");
                    emptyOption.text = "-- Select a key-value --";
                    emptyOption.value = "";
                    this.valueSelect.appendChild(emptyOption);
                    
                    // Add options for each key-value pair in the JSON
                    Object.keys(data.content).forEach(key => {
                        const value = data.content[key];
                        const option = document.createElement("option");
                        
                        // Format the display text nicely
                        let displayValue = typeof value === 'string' ? value : JSON.stringify(value);
                        if (displayValue.length > 30) {
                            displayValue = displayValue.substring(0, 30) + '...';
                        }
                        
                        option.text = `${key}: ${displayValue}`;
                        option.value = key;
                        this.valueSelect.appendChild(option);
                    });
                    
                    // If we have a key to select, select it
                    if (keyToSelect && this.valueSelect.querySelector(`option[value="${keyToSelect}"]`)) {
                        this.valueSelect.value = keyToSelect;
                        
                        // Also update the widget value
                        if (this.widgets) {
                            const motionWidget = this.widgets.find(w => w.name === "motion");
                            if (motionWidget) {
                                motionWidget.value = keyToSelect;
                            }
                        }
                    }
                } else {
                    const noContentOption = document.createElement("option");
                    noContentOption.text = "No valid content found";
                    noContentOption.disabled = true;
                    this.valueSelect.appendChild(noContentOption);
                }
            } catch (error) {
                console.error("Error loading file content:", error);
                const errorOption = document.createElement("option");
                errorOption.text = `Error: ${error.message || "Unknown error"}`;
                errorOption.title = error.toString(); // Show full error on hover
                errorOption.disabled = true;
                this.valueSelect.appendChild(errorOption);
            }
        };
    }
});
