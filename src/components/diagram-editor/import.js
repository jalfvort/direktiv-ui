import { ActionsNodes, NodeStartBlock } from "./nodes";
import YAML from 'js-yaml'


export const exampleWorkflow2 =
`
description: A simple 'switch' state that checks whether the age provided is older than 18.
states:
- id: data
  type: noop
  transform:
    age: 27
  transition: check
- id: check
  type: switch
  conditions:
  - condition: 'jq(.age > 18)'
    transition: olderthan18
  defaultTransition: youngerthan18
- id: olderthan18
  type: noop
  transform: 
    result: "You are older than 18."
- id: youngerthan18
  type: noop
  transform: 
    result: "You are younger than 18."
`
export const exampleWorkflow =
`
functions:
- id: greeter
  image: direktiv/greeting:v1
  type: reusable
- id: solve2
  image: direktiv/solve:v1
  type: reusable
description: A simple 'eventXor' that waits for events to be received.
states:
- id: event-xor
  type: eventXor
  timeout: PT1H
  events:
  - event: 
      type: solveexpressioncloudevent
    transition: solve
  - event: 
      type: greetingcloudevent
    transition: greet
- id: greet
  type: action
  action:
    function: greeter
    input: jq(.greetingcloudevent.data)
  transform: 
    greeting: jq(.return.greeting)
- id: solve
  type: action
  action:
    function: solve2
    input: jq(.solveexpressioncloudevent.data)
  transform: 
    solvedexpression: jq(.return)
`

export function importFromYAML(diagramEditor, setFunctions, wfYAML) {
    const wfData = YAML.load(wfYAML)
    let nodeIDToStateIDMap = {}
    let pos = {x: 20, y: 200}

    // Set functions
    if (wfData.functions) {
        setFunctions(wfData.functions)
    }

    // Add StartNode
    const startNodeID = diagramEditor.addNode(NodeStartBlock.name, NodeStartBlock.connections.input, NodeStartBlock.connections.output, pos.x, pos.y, `node ${NodeStartBlock.family}`, {
        family: NodeStartBlock.family, 
        type: NodeStartBlock.type, 
        formData: {}, 
        schemaKey: NodeStartBlock.data.schemaKey 
    }, NodeStartBlock.html, false)
    
    // Iterate over states
    for (let i = 0; i < wfData.states.length; i++) {
        const state = wfData.states[i];
        const result = ActionsNodes.filter(ActionsNode => ActionsNode.family === "primitive" && ActionsNode.type === state.type)

        if (result.length === 0) {
            console.warn("State type not found when importing from YAML")
            continue
        }

        // Offset X
        pos.x += 220

        // Add Node to Diagram
        const newNode = result[0]

        // Create nodeData from state
        let newNodeData = Object.assign({}, state)
        console.log("1state.id = ", state.id)

        delete newNodeData["type"]
        delete newNodeData["id"]
        console.log("2state.id = ", state.id)

        // Convert transform

        const transformCallback = importProcessTransformCallback[newNode.name]
        if (transformCallback) {
            transformCallback(newNodeData)
        } else {
            const defaultCallback = importProcessTransformCallback["Default"]
            defaultCallback(newNodeData)
        }

        console.log("newNodeData = ", newNodeData)
        console.log("IMPORT newNode = ", newNode)
        

        const nodeID = diagramEditor.addNode(newNode.name, newNode.connections.input, newNode.connections.output, pos.x, pos.y, `node ${newNode.family}`, {
            family: newNode.family, 
            type: newNode.type, 
            id: state.id,
            formData: newNodeData, 
            schemaKey: newNode.data.schemaKey 
        }, newNode.html, false)

        console.log("state.id = ", state.id)

         nodeIDToStateIDMap[state.id] = nodeID
         console.log("nodeIDToStateIDMap = ", nodeIDToStateIDMap)

    }

    // Iterate over states again and create connections
    for (let i = 0; i < wfData.states.length; i++) {
        const state = wfData.states[i];
        const nodeID = nodeIDToStateIDMap[state.id]
        const node = diagramEditor.getNodeFromId(nodeID)

        // Connect Start Node to first state
        if (i === 0) {
            diagramEditor.addConnection(startNodeID, nodeID, 'output_1','input_1')
        }

        let connCallback = importConnectionsCallbackMap[node.name]
        if (connCallback) {
            connCallback(diagramEditor, state, nodeID, nodeIDToStateIDMap)
            continue
        }

        // Default Add Connections
        if (state.transition) {
            const nextNodeID = nodeIDToStateIDMap[state.transition]
            console.log("nextNodeID = ", nodeIDToStateIDMap)
            diagramEditor.addConnection(nodeID, nextNodeID, 'output_1','input_1')
        }
    }

}

const importConnectionsCallbackMap = {
    "StateSwitch": (diagramEditor, state, nodeID, nodeIDToStateIDMap) => {
        if (state.defaultTransition) {
            const nextNodeID = nodeIDToStateIDMap[state.defaultTransition]
            diagramEditor.addConnection(nodeID, nextNodeID, 'output_1','input_1')
        }

        if (state.conditions) {
            for (let i = 0; i < state.conditions.length; i++) {
                const cond = state.conditions[i];
                const nextNodeID = nodeIDToStateIDMap[cond.transition]   
                const nextNode = diagramEditor.getNodeFromId(nextNodeID)               
                const newPosY = nextNode.pos_y + (100*(i+1));

                diagramEditor.drawflow.drawflow.Home.data[nextNodeID].pos_y = newPosY;
                document.getElementById(`node-${nextNodeID}`).style.top = `${newPosY}px`;
                diagramEditor.updateConnectionNodes(`node-${nextNodeID}`);

                diagramEditor.addNodeOutput(nodeID)
                diagramEditor.addConnection(nodeID, nextNodeID, `output_${i+2}`,'input_1')

            }
        }
        
    },
    "StateEventXor": (diagramEditor, state, nodeID, nodeIDToStateIDMap) => {
        if (state.events) {
            for (let i = 0; i < state.events.length; i++) {
                const event = state.events[i];
                const nextNodeID = nodeIDToStateIDMap[event.transition]   
                const nextNode = diagramEditor.getNodeFromId(nextNodeID)               
                const newPosY = nextNode.pos_y + (100*(i+1));

                diagramEditor.drawflow.drawflow.Home.data[nextNodeID].pos_y = newPosY;
                document.getElementById(`node-${nextNodeID}`).style.top = `${newPosY}px`;
                diagramEditor.updateConnectionNodes(`node-${nextNodeID}`);

                if (i > 0) {
                    diagramEditor.addNodeOutput(nodeID)
                }
                
                diagramEditor.addConnection(nodeID, nextNodeID, `output_${i+1}`,'input_1')

            }
        } else {
            console.warn("StateEventXor did not have events")
        }
        
    },
    // "StateGenerateEvent": (diagramEditor, states, nodeIDToStateIDMap) => {
        
    // },
    // "StateSetter": (diagramEditor, states, nodeIDToStateIDMap) => {
        
    // }
}

function importDefaultProcessTransformCallback(state, transformKey) {
        const oldTransform = state[transformKey]
        if (!oldTransform) {
            // No transform
            delete state[transformKey]
        } else if (typeof state[transformKey] === "object") {
            delete state[transformKey]

            state[transformKey] = {
                selectionType: "Key Value",
                "keyValue": oldTransform
            }
        } else {
            state[transformKey] = {
                selectionType: "JQ Query",
                "jqQuery": oldTransform
            }
        }
}

const importProcessTransformCallback = {
    "Default": (state) => {importDefaultProcessTransformCallback(state, "transform")},
    "StateEventXor":  (state) => {
        for (let i = 0; i < state.events.length; i++) {
            importDefaultProcessTransformCallback(state.events[i], "transform")
        }
    },
    "StateGenerateEvent": (state) => {
        importDefaultProcessTransformCallback(state.event, "data")
        importDefaultProcessTransformCallback(state, "transform")
    },
    "StateSetter":  (state) => {
        for (let i = 0; i < state.variables.length; i++) {
            importDefaultProcessTransformCallback(state.variables[i], "value")
        }

        importDefaultProcessTransformCallback(state, "transform")
        
    },
    "StateForeach": (state) => {
        importDefaultProcessTransformCallback(state.action, "input")
        importDefaultProcessTransformCallback(state, "transform")
    },
    "StateAction": (state) => {
        importDefaultProcessTransformCallback(state.action, "input")
        importDefaultProcessTransformCallback(state, "transform")
    }
}




