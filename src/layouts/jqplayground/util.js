import { useJQPlayground } from 'direktiv-react-hooks';
import { useCallback, useEffect, useState } from 'react';
import { VscFileCode, VscArrowRight } from 'react-icons/vsc';
import Button from '../../components/button';
import ContentPanel, { ContentPanelBody, ContentPanelTitle, ContentPanelTitleIcon } from '../../components/content-panel';
import DirektivEditor from '../../components/editor';
import Alert from '../../components/alert';
import FlexBox from '../../components/flexbox';
import HelpIcon from '../../components/help';
import { Config } from '../../util';
import './style.css';
import Drawflow from 'drawflow';
import { Resizable } from 're-resizable';
import styleDrawflow from 'drawflow/dist/drawflow.min.css'
import YAML from "json-to-pretty-yaml"
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

import { SchemaMap } from "./jsonSchema"
import Form from '@rjsf/core';

// Recursively walk through nodes and sets transitions of each state
export function setConnections(nodeID, previousNodeID, rawData, wfData) {

    // Stop recursive walk if previous node is not first connections
    // If we dont do this we'll there is a chance that we create the same state multiple times
    if (!isFirstConnection(nodeID, previousNodeID, rawData)) {
        return
    }

    // Use Custom connection callback logic if it exists for data type
    console.log("rawData[nodeID].name = ", rawData[nodeID].name)
    let connCallback = connectionsCallbackMap[rawData[nodeID].name]
    if (connCallback) {
        connCallback(nodeID, previousNodeID, rawData, wfData)
        return
    }

    let state = { id: rawData[nodeID].data.id, type: rawData[nodeID].data.type, ...rawData[nodeID].data.formData }

    // Default connections logic
    for (const outputID in rawData[nodeID].outputs) {
        if (Object.hasOwnProperty.call(rawData[nodeID].outputs, outputID)) {
            const output = rawData[nodeID].outputs[outputID];
            if (output.connections.length > 0) {
                console.log("output.connections = ", output.connections)
                const nextNode = rawData[output.connections[0].node]
                state.transition = nextNode.data.id
                setConnections(output.connections[0].node, nodeID, rawData, wfData)
            }
        }
    }

    wfData.states.push(state)
    return
}

// connectionsCallbackMap : Map of functions to be used in setConnections function
const connectionsCallbackMap = {
    "StateSwitch": (nodeID, previousNodeID, rawData, wfData) => {
        console.log("inside callback V2 !!!!")
        // Stop recursive walk if previous node is not first connections
        // If we dont do this we'll there is a chance that we create the same state multiple times
        if (!isFirstConnection(nodeID, previousNodeID, rawData)) {
            return
        }

        let state = { id: rawData[nodeID].data.id, type: rawData[nodeID].data.type, ...rawData[nodeID].data.formData }


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

                    setConnections(output.connections[0].node, nodeID, rawData, wfData)
                }
            }

        }

        wfData.states.push(state)
    }
}

// isFirstConnection : Returns true if the previous node is the current nodes first connection
function isFirstConnection(nodeID, previousNodeID, rawData) {
    return (rawData[nodeID].inputs["input_1"].connections[0].node === `${previousNodeID}`)
}

export const onSubmitCallbackMap = {
    "StateSwitch": (node, diagramEditor) => {
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
        
    }
}


