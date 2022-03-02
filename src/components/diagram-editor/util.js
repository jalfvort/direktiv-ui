import { useJQPlayground } from 'direktiv-react-hooks';
import { useCallback, useEffect, useState } from 'react';
import { VscFileCode, VscArrowRight } from 'react-icons/vsc';
import Button from '../button';
import ContentPanel, { ContentPanelBody, ContentPanelTitle, ContentPanelTitleIcon } from '../content-panel';
import DirektivEditor from '../editor';
import Alert from '../alert';
import FlexBox from '../flexbox';
import HelpIcon from '../help';
import { Config } from '../../util';
import './style.css';
import Drawflow from 'drawflow';
import { Resizable } from 're-resizable';
import styleDrawflow from 'drawflow/dist/drawflow.min.css'
import YAML from "json-to-pretty-yaml"
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

import { SchemaMap } from "./jsonSchema"
import Form from '@rjsf/core';

//  processTransform : Converts json schema form to direktiv yaml on the properties that accept jq.
//  Because we support both a jq string a key value json schema input, we need to process these values into
//  something direkitv yaml can use. 
//
//  stateData: The parent of a value that contains a jqQuery or key value property
//  transformKey: The key of the property that contains this value. This will usually be 'transform'
//  but there are some scenarios where it is something else. e.g. "data" from generateEvent
function processTransform(stateData, transformKey) {
    if (!stateData[transformKey]) {
        return
    }

    const selectionType = stateData[transformKey]["selectionType"]
    const keyValue = stateData[transformKey]["keyValue"] ? stateData[transformKey]["keyValue"] : {}
    const jqQuery = stateData[transformKey]["jqQuery"] ? stateData[transformKey]["jqQuery"] : ""
    
    delete stateData[transformKey]["keyValue"]
    delete stateData[transformKey]["jqQuery"]
    delete stateData[transformKey]["selectionType"]

    if (selectionType && selectionType === "Key Value") {
        stateData[transformKey] = {...keyValue}
    } else if (selectionType && selectionType === "JQ Query") {
        stateData[transformKey] = jqQuery
    }

    if (stateData[transformKey] === "" || stateData[transformKey] === {}){
        delete stateData[transformKey]
    }
    
    return
}

// Recursively walk through nodes and sets transitions of each state
export function setConnections(nodeID, previousNodeID, rawData, wfData) {

    // Stop recursive walk if previous node is not first connections
    // If we dont do this we'll there is a chance that we create the same state multiple times
    if (!isFirstConnection(nodeID, previousNodeID, rawData)) {
        return
    }

    // Use Custom connection callback logic if it exists for data type
    console.log("rawData[nodeID].name = ", rawData[nodeID].name)
    let currentNode = rawData[nodeID]
    let connCallback = connectionsCallbackMap[currentNode.name]
    if (connCallback) {
        connCallback(nodeID, previousNodeID, rawData, wfData)
        return
    }



    let state = { id: currentNode.data.id, type: currentNode.data.type, ...currentNode.data.formData }
    processTransform(state, "transform")

    // Default connections logic
    processConnection(nodeID, rawData, state, wfData)

    return
}

// default handler for connections
function processConnection(nodeID, rawData, state, wfData) {
    const currentNode = rawData[nodeID]
    // Default connections logic
    for (const outputID in currentNode.outputs) {
        if (Object.hasOwnProperty.call(currentNode.outputs, outputID)) {
            const output = currentNode.outputs[outputID];
            if (output.connections.length > 0) {
                console.log("output.connections = ", output.connections)
                const nextNode = rawData[output.connections[0].node]
                state.transition = nextNode.data.id
                setConnections(output.connections[0].node, nodeID, rawData, wfData)
            }
        }
    }

    wfData.states.push(state)
}

// connectionsCallbackMap : Map of functions to be used in setConnections function
const connectionsCallbackMap = {
    "StateSwitch": (nodeID, previousNodeID, rawData, wfData) => {
        // Stop recursive walk if previous node is not first connections
        // If we dont do this we'll there is a chance that we create the same state multiple times
        if (!isFirstConnection(nodeID, previousNodeID, rawData)) {
            return
        }

        let state = { id: rawData[nodeID].data.id, type: rawData[nodeID].data.type, ...rawData[nodeID].data.formData }
        processTransform(state, "transform")

        const outputKeys = Object.keys(rawData[nodeID].outputs)
        for (let i = 0; i < outputKeys.length; i++) {
            const outputID = outputKeys[i];

            if (Object.hasOwnProperty.call(rawData[nodeID].outputs, outputID)) {
                const output = rawData[nodeID].outputs[outputID];
                if (output.connections.length > 0) {
                    const nextNode = rawData[output.connections[0].node]

                    if (i == 0) {
                        state.defaultTransition = nextNode.data.id
                    } else {
                        state.conditions[i - 1].transition = nextNode.data.id
                    }

                    // FIXME: Is this right???
                    setConnections(output.connections[0].node, nodeID, rawData, wfData)
                }
            }

        }

        wfData.states.push(state)
    },
    "StateEventXor": (nodeID, previousNodeID, rawData, wfData) => {
        // Stop recursive walk if previous node is not first connections
        // If we dont do this we'll there is a chance that we create the same state multiple times
        if (!isFirstConnection(nodeID, previousNodeID, rawData)) {
            return
        }

        let state = { id: rawData[nodeID].data.id, type: rawData[nodeID].data.type, ...rawData[nodeID].data.formData }

        for (let i = 0; i < state.events.length; i++) {
            processTransform(state.events[i], "transform")
        }

        const outputKeys = Object.keys(rawData[nodeID].outputs)
        for (let i = 0; i < outputKeys.length; i++) {
            const outputID = outputKeys[i];

            if (Object.hasOwnProperty.call(rawData[nodeID].outputs, outputID)) {
                const nodeOutput = rawData[nodeID].outputs[outputID];
                if (nodeOutput.connections.length > 0) {
                    const nextNode = rawData[nodeOutput.connections[0].node]
                    state.events[i].transition = nextNode.data.id

                    setConnections(nodeOutput.connections[0].node, nodeID, rawData, wfData)
                }
            }

        }

        wfData.states.push(state)
    },
    "StateGenerateEvent": (nodeID, previousNodeID, rawData, wfData) => {
        // Stop recursive walk if previous node is not first connections
        // If we dont do this we'll there is a chance that we create the same state multiple times
        if (!isFirstConnection(nodeID, previousNodeID, rawData)) {
            return
        }

        let state = { id: rawData[nodeID].data.id, type: rawData[nodeID].data.type, ...rawData[nodeID].data.formData }

        console.log("state.event.data = ", state.event)
        processTransform(state.event, "data")
        processTransform(state, "transform")

        // Default connections logic
        processConnection(nodeID, rawData, state, wfData)
    },
    "StateSetter": (nodeID, previousNodeID, rawData, wfData) => {
        // Stop recursive walk if previous node is not first connections
        // If we dont do this we'll there is a chance that we create the same state multiple times
        if (!isFirstConnection(nodeID, previousNodeID, rawData)) {
            return
        }

        let state = { id: rawData[nodeID].data.id, type: rawData[nodeID].data.type, ...rawData[nodeID].data.formData }

        for (let i = 0; i < state.variables.length; i++) {
            processTransform(state.variables[i], "value")
        }

        processTransform(state, "transform")

        // Default connections logic
        processConnection(nodeID, rawData, state, wfData)
    },
    "StateAction": (nodeID, previousNodeID, rawData, wfData) => {
        // Stop recursive walk if previous node is not first connections
        // If we dont do this we'll there is a chance that we create the same state multiple times
        if (!isFirstConnection(nodeID, previousNodeID, rawData)) {
            return
        }

        let state = { id: rawData[nodeID].data.id, type: rawData[nodeID].data.type, ...rawData[nodeID].data.formData }

        processTransform(state.action, "input")
        processTransform(state, "transform")

        // Default connections logic
        processConnection(nodeID, rawData, state, wfData)
    },
    "StateForeach": (nodeID, previousNodeID, rawData, wfData) => {
        // Stop recursive walk if previous node is not first connections
        // If we dont do this we'll there is a chance that we create the same state multiple times
        if (!isFirstConnection(nodeID, previousNodeID, rawData)) {
            return
        }

        let state = { id: rawData[nodeID].data.id, type: rawData[nodeID].data.type, ...rawData[nodeID].data.formData }

        processTransform(state.action, "input")
        processTransform(state, "transform")

        // Default connections logic
        processConnection(nodeID, rawData, state, wfData)
    }
}

// isFirstConnection : Returns true if the previous node is the current nodes first connection
function isFirstConnection(nodeID, previousNodeID, rawData) {
    return (rawData[nodeID].inputs["input_1"].connections[0].node === `${previousNodeID}`)
}

export const onSubmitCallbackMap = {
    "StateSwitch": (nodeID, diagramEditor) => {
        const node = diagramEditor.getNodeFromId(nodeID)
        let conditionsLength = node.data.formData.conditions ? node.data.formData.conditions.length : 0
        let outputLen = Object.keys(node.outputs).length
        for (let i = 0; i < conditionsLength; i++) {

            if (2 + i > outputLen) {
                diagramEditor.addNodeOutput(node.id)
            }
        }

        for (let i = 0; i < outputLen - 1; i++) {
            if (1 + i > conditionsLength) {
                diagramEditor.removeNodeOutput(node.id, `output_${i + 2}`)
            }
        }
        
    },
    "StateEventXor": (nodeID, diagramEditor) => {
        const node = diagramEditor.getNodeFromId(nodeID)
        let eventsLength = node.data.formData.events ? node.data.formData.events.length : 0
        console.log("node.outputs = ", node.outputs)
        let outputLen = Object.keys(node.outputs).length

        console.log("eventsLength = ", eventsLength)
        console.log("outputLen = ", outputLen)
        for (let i = 0; i < eventsLength; i++) {
            if (1 + i > outputLen) {
                diagramEditor.addNodeOutput(node.id)
            }
        }

        for (let i = 0; i < outputLen; i++) {
            if (i+1 > eventsLength) {
                diagramEditor.removeNodeOutput(node.id, `output_${i + 1}`)
            }
        }
        
    }
}


