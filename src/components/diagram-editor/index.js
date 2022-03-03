import { useJQPlayground } from 'direktiv-react-hooks';
import { useCallback, useEffect, useState } from 'react';
import { VscFileCode, VscArrowRight, VscGear, VscListUnordered, VscSymbolEvent } from 'react-icons/vsc';
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

import { SchemaMap } from "../../components/diagram-editor/jsonSchema"
import Form from '@rjsf/core';
import { onSubmitCallbackMap, setConnections } from '../../components/diagram-editor/util';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import SearchField from "react-search-field";
import Fuse from 'fuse.js';
import { ActionsNodes, NodeStateAction } from "../../components/diagram-editor/nodes";
import { useNamespaceServices } from "direktiv-react-hooks";



import SearchInput, { createFilter } from 'react-search-input'
import { exampleWorkflow, importFromYAML } from '../../components/diagram-editor/import';
import Modal, { ButtonDefinition } from '../modal';

import Ajv from "ajv"

const uiSchema = {
    "transform": {
        "jqQuery": {
            "ui:widget": "textarea"
        },
        "rawYAML": {
            "ui:widget": "textarea"
        }
    }
}

const actionsNodesFuse = new Fuse(ActionsNodes, {
    keys: ['name']
})


function Actions(props) {
    const cache = new CellMeasurerCache({
        fixedWidth: false,
        fixedHeight: true
    })

    function rowRenderer({ index, parent, key, style }) {
        return (
            <CellMeasurer
                key={`action-${key}`}
                cache={cache}
                parent={parent}
                columnIndex={0}
                rowIndex={index}
            >
                <div style={{ ...style, minHeight: "90px", height: "90px", cursor: "move", userSelect: "none", display: "flex" }}>
                    <div className={`action ${ActionsNodes[index].family} action-${ActionsNodes[index].type}`} draggable={true} node-index={index} onDragStart={(ev) => {
                        console.log("onDragStart = ", ev);
                        console.log("ev.target.getAttribute(node-index) = ", ev.target.getAttribute("node-index"))
                        ev.dataTransfer.setData("nodeIndex", ev.target.getAttribute("node-index"));
                    }}>
                        <div style={{ marginLeft: "5px" }}>
                            <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5", justifyContent: "space-between" }}>
                                <span style={{ whiteSpace: "pre-wrap", cursor: "move", fontSize: "13px" }}>
                                    {ActionsNodes[index].name}
                                </span>
                                <a style={{ whiteSpace: "pre-wrap", cursor: "pointer", fontSize: "11px", paddingRight: "3px" }} href={`${ActionsNodes[index].info.link}`} target="_blank">More Info</a>

                            </div>
                            <div style={{ fontSize: "10px", lineHeight: "10px", paddingTop: "2px" }}>
                                <p style={{ whiteSpace: "pre-wrap", cursor: "move", margin: "0px" }}>
                                    {ActionsNodes[index].info.description}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </CellMeasurer>
        );
    }

    return (
        <AutoSizer>
            {({ height, width }) => (
                <div style={{ height: "100%", minHeight: "100%" }}>
                    <List
                        width={width}
                        height={height}
                        rowRenderer={rowRenderer}
                        deferredMeasurementCache={cache}
                        scrollToIndex={0}
                        rowCount={ActionsNodes.length}
                        rowHeight={90}
                        scrollToAlignment={"start"}
                    />
                </div>
            )}
        </AutoSizer>
    )
}

function FunctionsList(props) {
    const {functionList, setFunctionList} = props

    // const [functionList, setFunctionList] = useState([])
    const [newFunctionFormRef, setNewFunctionFormRef] = useState(null)
    const [formData, setFormData] = useState({})
    // const {data} = useNamespaceServices(Config.url, false, namespace, localStorage.getItem("apikey"))

    // console.log("useNamespaceServices data = ", data)


    const ajv = new Ajv()
    const schema = SchemaMap["functionSchema"]
    const validate = ajv.compile(schema)


    useEffect(() => {
        console.log("mounting functions list")
        return () => { console.log("unmounting functions list")};
    },[])

    // useEffect(()=>{
    //     const newfMap = functionsList.reduce(function(result, item, index, array) {
    //         result[item.id] = item;
    //         return result;
    //       }, {}) 

    //       console.log("updating function map to =", newfMap)
    //     setFunctionMap({...newfMap})
    //     console.log()
    // },[functionsList])

    const cache = new CellMeasurerCache({
        fixedWidth: false,
        fixedHeight: true
    })

    function rowRenderer({ index, parent, key, style }) {
        return (
            <CellMeasurer
                key={key}
                cache={cache}
                parent={parent}
                columnIndex={0}
                rowIndex={index}
            >
                <div style={{ ...style, minHeight: "6px", height: "64px", cursor: "move", userSelect: "none", display: "flex" }}>
                    <div className={`function`} draggable={true} function-index={index} onDragStart={(ev) => {
                        // console.log("onDragStart = ", ev);
                        // console.log("ev.target.getAttribute(node-index) = ", ev.target.getAttribute("node-index"))
                        ev.dataTransfer.setData("functionIndex", ev.target.getAttribute("function-index"));
                    }}>
                        <div style={{ marginLeft: "5px" }}>
                            <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5", justifyContent: "space-between" }}>
                                <span style={{ whiteSpace: "pre-wrap", cursor: "move", fontSize: "13px" }}>
                                    ID: {functionList[index].id}
                                </span>
                                <div style={{ whiteSpace: "pre-wrap", cursor: "pointer", fontSize: "11px", paddingRight: "3px" }}>
                                    Edit
                                </div>
                            </div>
                            <div style={{ fontSize: "10px", lineHeight: "10px", paddingTop: "2px" }}>
                                Type: {functionList[index].type}
                            </div>
                            <div style={{ fontSize: "10px", lineHeight: "10px", paddingTop: "2px" }}>
                                {functionList[index].service ? `Service: ${functionList[index].service}`: ""}
                                {functionList[index].image ? `Image: ${functionList[index].image}`: ""}
                                {functionList[index].workflow ? `Workflow: ${functionList[index].workflow}`: ""}
                            </div>
                        </div>

                    </div>
                </div>
            </CellMeasurer>
        );
    }

    return (
        <>
            <Modal
                style={{ justifyContent: "center" }}
                className="run-workflow-modal"
                modalStyle={{ color: "black" }}
                title={`Run Workflow`}
                onClose={() => {
                    //TODO:
                }}
                onOpen={() => {
                    //TODO:
                }}
                actionButtons={[
                    ButtonDefinition("Create Function", async () => {
                        newFunctionFormRef.click()

                        // Check if form data is valid
                        if (!validate(formData)){
                            throw Error("Invalid Function")
                        }

                        // Throw error if id already exists
                        const result = functionList.filter(functionItem => functionItem.id === formData.id)
                        if (result.length > 0) {
                            throw Error(`Function '${formData.id}' already exists`)
                        }

                        // Update list
                        setFunctionList((oldfList)=>{
                            oldfList.push(formData)
                            return [...oldfList]
                        })
                    }, "small blue", ()=>{}, true, false),
                    ButtonDefinition("Cancel", async () => {
                    }, "small light", ()=>{}, true, false)
                ]}
                button={(
                    <div className={`btn function-btn`}>
                        New function
                    </div>
                )}
            >
                <FlexBox className="col" style={{ height: "45vh", width: "35vw", minWidth: "250px", minHeight: "200px", justifyContent: "space-between" }}>
                    <div style={{overflow: "auto"}}>
                        {/* <label style={{fontSize: "11px", lineHeight: "13px", fontWeight: "bold"}}>
                            Choose Function Type*
                        </label>
                        <p style={{fontSize: "9px", lineHeight: "12px", margin: "0px 0px 4px 0px"}}>
                            Function type of new service
                        </p>
                        <select style={{width:"100%"}} defaultValue={newServiceType} onChange={(e)=>setNewServiceType(e.target.value)} style={{marginBottom:"4px", height:"26px", lineHeight:"20px", padding:"0px"}}>
                            <option value="reusable">Reusable</option>
                            <option value="knative-namespace">Namespace Service</option>
                            <option value="knative-global">Global Service</option>
                            <option value="subflow">Subflow</option>
                        </select> */}

                        <Form
                            id={"builder-form"}
                            onSubmit={(form) => {
                            }}
                            schema={schema}
                            formData={formData}
                            onChange={(e)=>{
                                setFormData(e.formData)
                            }}
                        >
                            <button ref={setNewFunctionFormRef} style={{ display: "none" }} />
                        </Form>
                    </div>
                    {/* <div style={{minWidth: "28px"}}>
                        <div className="btn" onClick={()=>{
                            console.log(newFunctionFormRef.click())
                        }}>
                            Create Function
                        </div>
                    </div> */}

                </FlexBox>
            </Modal>
            {functionList.length > 0 ? (
                <AutoSizer>
                    {({ height, width }) => (
                            <List
                                width={width}
                                height={height}
                                rowRenderer={rowRenderer}
                                deferredMeasurementCache={cache}
                                scrollToIndex={0}
                                rowCount={functionList.length}
                                rowHeight={64}
                                scrollToAlignment={"start"}
                            />
                    )}
                </AutoSizer>)
                :
                (<>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        No maidens?
                    </div>
                </>)}
        </>
    )
}

export default function DiagramEditor(props) {
    const {workflow, namespace, updateWorkflow} = props

    const [diagramEditor, setDiagramEditor] = useState(null);
    const [load, setLoad] = useState(false);

    const [selectedNodeID, setSelectedNodeID] = useState(0);
    const [selectedNode, setSelectedNode] = useState(null);
    const [formRef, setFormRef] = useState(null);
    const [error, setError] = useState(null)
    const [mouseDown, setMouseDown] = useState(false)

    const [actionDrawerWidth, setActionDrawerWidth] = useState(0)
    const [actionDrawerWidthOld, setActionDrawerWidthOld] = useState(200)
    const [actionDrawerMinWidth, setActionDrawerMinWidth] = useState(0)

    const [functionDrawerWidth, setFunctionDrawerWidth] = useState(0)
    const [functionDrawerWidthOld, setFunctionDrawerWidthOld] = useState(200)
    const [functionDrawerMinWidth, setFunctionDrawerMinWidth] = useState(0)
    const [functionList, setFunctionList] = useState([])

    const [formDrawerWidth, setFormDrawerWidth] = useState(340)
    const [formDrawerWidthOld, setFormDrawerWidthOld] = useState(340)
    const [formDrawerMinWidth, setFormDrawerMinWidth] = useState(200)
    const [formDrawerAutoShow, setFormDrawerAutoShow] = useState(true)

    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuAnchorPoint, setContextMenuAnchorPoint] = useState({ x: 0, y: 0 });
    const [contextMenuResults, setContextMenuResults] = useState(ActionsNodes)

    useEffect(() => {
        console.log("mounting")
        return () => { console.log("unmounting")};
    },[])

    useEffect(() => {
        var id = document.getElementById("drawflow");
        console.log("id = ", id)
        if (!diagramEditor) {
            let editor = new Drawflow(id)
            editor.start()
            editor.on('nodeSelected', function (id) {
                console.log("select node: ", id)
                setSelectedNodeID(id)
                const newNode = editor.getNodeFromId(id)
                console.log("selected node = ", newNode)
                setSelectedNode(newNode)
            })

            editor.on('nodeCreated', function (id) {
                let newNode = editor.getNodeFromId(id)

                // If node was created without id, geneate one
                if (!newNode.data.id) {
                    newNode.data.id = `node-${id}-${newNode.data.type}`
                }

                editor.updateNodeDataFromId(id, newNode.data)
            })

            editor.on('mouseUp', function (e) {
                // console.log("mouseUp event = ", e);
            })

            editor.on('nodeUnselected', function (e) {
                setSelectedNodeID(0)
                setSelectedNode(null)
                console.log("nodeUnselected event = ", e);
            })

            editor.on('nodeRemoved', function (e) {
                setSelectedNodeID(0)
                setSelectedNode(null)
                console.log("nodeRemoved removed = ", e);
            })

            editor.on('click', function (e) {
                console.log("user click event = ", e);
                setShowContextMenu(false)
                setMouseDown(true);
            })

            editor.on('mouseUp', function (e) {
                console.log("user mouseUp event = ", e);
                setMouseDown(false);
            })


            // editor.addNode('StartBlock', 0, 1, 1, 200, "node special start", { family: "special", type: "start", schemaKey: 'stateSchemaSwitch', formData: {} }, 'Start Block', false);

            setDiagramEditor(editor)

            // Import if workflow prop is passed
            if (workflow) {
                importFromYAML(editor, setFunctionList, workflow)
            }
        }
    }, [diagramEditor])

    useEffect(() => {
        if (selectedNodeID === 0) {
            setFormDrawerMinWidth(0)
            setFormDrawerWidth(0)
        } else {
            console.log("formDrawerWidthOld = ", formDrawerWidthOld)
            setFormDrawerMinWidth(20)
            setFormDrawerWidth(formDrawerWidthOld)
        }
    }, [selectedNodeID, formDrawerWidthOld])

    const resizeStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexDirection: "column",
        background: "#f0f0f0",
        zIndex: 30,
    };



    const resizeStyleForm = {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexDirection: "column",
        background: "#f0f0f0",
        zIndex: 30,
        position: "absolute",
        top: "0px",
        bottom: "0px",
        right: "0px",
    };

    function formDrawerVisibility(width, mouseIsDown) {
        if (width === 0) {
            return { pointerEvents: "none", opacity: 0 }
        }
        if (mouseIsDown) {
            return { pointerEvents: "none", opacity: 0.5, transition: "opacity cubic-bezier(1,-0.00,.09,.59) 0.3s" }
        }

        return {}
    }

    const handleClick = useCallback(() => (showContextMenu ? setShowContextMenu(false) : null), [showContextMenu]);
    useEffect(() => {
        if (!showContextMenu) {
            setContextMenuResults(ActionsNodes)
        }
    }, [showContextMenu]);

    useEffect(() => {
        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("click", handleClick);
        };
    });

    const getSchema = useCallback(() => {
        let baseSchema = SchemaMap[selectedNode.data.schemaKey]
        if (selectedNode.data.schemaKey !== "stateSchemaAction") {
            return baseSchema
        }


        // TODO: convert to callback map
        let availableFunctions = []
        for (let i = 0; i < functionList.length; i++) {
            const f = functionList[i];
            availableFunctions.push(f.id)
        }

        console.log("availableFunctions = ", availableFunctions)

        baseSchema.properties.action.properties.function.enum = availableFunctions

        return baseSchema
    }, [selectedNode, functionList])


    return (
        <>
            {showContextMenu ? (
                <div
                    id='context-menu'
                    className="context-menu"
                    style={{
                        top: contextMenuAnchorPoint.y,
                        left: contextMenuAnchorPoint.x
                    }}
                >
                    <div style={{ textAlign: "center", padding: "2px" }}>
                        Add Node
                    </div>
                    <input autoFocus type="search" id="fname" name="fname" onChange={(ev) => {
                        console.log("ev search = ", ev.target.value)
                        setContextMenuResults(actionsNodesFuse.search(ev.target.value))
                        console.log(contextMenuResults)
                    }}
                        onKeyDown={(ev) => {
                            if (ev.key === 'Enter' && contextMenuResults.length > 0) {
                                // TODO: Make function
                                const newNode = contextMenuResults[0].item ? contextMenuResults[0].item : contextMenuResults[0]
                                let pos_x = contextMenuAnchorPoint.x * (diagramEditor.precanvas.clientWidth / (diagramEditor.precanvas.clientWidth * diagramEditor.zoom)) - (diagramEditor.precanvas.getBoundingClientRect().x * (diagramEditor.precanvas.clientWidth / (diagramEditor.precanvas.clientWidth * diagramEditor.zoom)));
                                let pos_y = contextMenuAnchorPoint.y * (diagramEditor.precanvas.clientHeight / (diagramEditor.precanvas.clientHeight * diagramEditor.zoom)) - (diagramEditor.precanvas.getBoundingClientRect().y * (diagramEditor.precanvas.clientHeight / (diagramEditor.precanvas.clientHeight * diagramEditor.zoom)));
                                diagramEditor.addNode(newNode.name, newNode.connections.input, newNode.connections.output, pos_x, pos_y, `node ${newNode.family}`, { family: newNode.family, type: newNode.type, ...newNode.data }, newNode.html, false)
                                setShowContextMenu(false)
                            }
                        }}
                    ></input>
                    <ul >
                        {
                            contextMenuResults.map((obj) => {
                                return (
                                    <li onClick={() => {
                                        const newNode = obj.item ? obj.item : obj
                                        let pos_x = contextMenuAnchorPoint.x * (diagramEditor.precanvas.clientWidth / (diagramEditor.precanvas.clientWidth * diagramEditor.zoom)) - (diagramEditor.precanvas.getBoundingClientRect().x * (diagramEditor.precanvas.clientWidth / (diagramEditor.precanvas.clientWidth * diagramEditor.zoom)));
                                        let pos_y = contextMenuAnchorPoint.y * (diagramEditor.precanvas.clientHeight / (diagramEditor.precanvas.clientHeight * diagramEditor.zoom)) - (diagramEditor.precanvas.getBoundingClientRect().y * (diagramEditor.precanvas.clientHeight / (diagramEditor.precanvas.clientHeight * diagramEditor.zoom)));
                                        diagramEditor.addNode(newNode.name, newNode.connections.input, newNode.connections.output, pos_x, pos_y, `node ${newNode.family}`, { family: newNode.family, type: newNode.type, ...newNode.data }, newNode.html, false)
                                        setShowContextMenu(false)
                                    }}>
                                        {obj.name ? obj.name : obj.item.name}
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
            ) : (
                <> </>
            )}
            <FlexBox id="builder-page" className="col" style={{ paddingRight: "8px" }}>
                {error ?
                    <Alert className="critical" style={{ flex: "0" }}>{error} </Alert>
                    :
                    <></>
                }
                {/* <div style={{height:"600px", width: "600px"}}> */}
                <div className='toolbar'>
                    <div className='toolbar-btn' onClick={() => {
                        setError(null)
                        //TODO: Split into another function
                        //TODO: Export to non-destructive json ✓
                        let rawExport = diagramEditor.export()
                        let rawData = rawExport.drawflow.Home.data
                        let wfData = { functions: functionList, states: [] }
                        //TODO: 
                        // - Find Start Block ✓
                        // - Check if there are multiple start blocks
                        const startBlockIDs = diagramEditor.getNodesFromName("StartBlock")
                        console.log("startBlockIDs = ", startBlockIDs)
                        let startBlock = rawData[startBlockIDs[0]];
                        let startState

                        // Find Start State
                        for (const outputID in startBlock.outputs) {
                            if (Object.hasOwnProperty.call(startBlock.outputs, outputID)) {
                                const output = startBlock.outputs[outputID];
                                console.log("--> Found output = ", output)
                                // TODO: handle to connections in start
                                console.log("output.connections = ", output.connections)
                                if (output.connections.length === 0) {
                                    setError("Start Node is not connected to any node")
                                    return
                                }
                                startState = rawData[output.connections[0].node]
                                console.log("--> Found startState = ", startState)
                                break
                            }
                        }

                        // Set Transitions
                        console.log(" rawData = ", rawData)
                        setConnections(startState.id, startBlock.id, rawData, wfData)
                        wfData.states.reverse()

                        console.log("wfData = ", wfData)
                        console.log("---- Workflow ---")
                        console.log(YAML.stringify(wfData))

                        if (updateWorkflow) {
                            updateWorkflow(wfData)
                        } else {
                            console.warn("updateWorkflow callback missing")
                        }
                    }}>
                        <VscGear style={{fontSize:"256px", width:"48px"}}/>
                        <div>Compile</div>
                    </div>
                    <div className='toolbar-btn' onClick={() => {
                        if (actionDrawerMinWidth === 0) {
                            setActionDrawerMinWidth(20)
                            setActionDrawerWidth(actionDrawerWidthOld)

                            // Hide Functions
                            setFunctionDrawerMinWidth(0)
                            setFunctionDrawerWidth(0)
                        } else {
                            setActionDrawerMinWidth(0)
                            setActionDrawerWidth(0)
                        }
                    }}>
                        {actionDrawerMinWidth === 0 ?
                        <>
                        <VscListUnordered style={{fontSize:"256px",  width:"48px"}}/>
                        <div>Show Nodes</div>
                        </>
                        :
                        <>
                        <VscListUnordered style={{fontSize:"256px",  width:"48px"}}/>
                        <div>Hide Nodes</div>
                        </>
                        }
                    </div>
                    <div className='toolbar-btn' onClick={() => {
                        if (functionDrawerMinWidth === 0) {
                            setFunctionDrawerMinWidth(20)
                            setFunctionDrawerWidth(actionDrawerWidthOld)

                            // Hide Node Actions
                            setActionDrawerMinWidth(0)
                            setActionDrawerWidth(0)
                        } else {
                            setFunctionDrawerMinWidth(0)
                            setFunctionDrawerWidth(0)
                        }
                    }}>
                        {actionDrawerMinWidth === 0 ?
                        <>
                        <VscSymbolEvent style={{fontSize:"256px",  width:"48px"}}/>
                        <div>Show Functions</div>
                        </>
                        :
                        <>
                        <VscSymbolEvent style={{fontSize:"256px",  width:"48px"}}/>
                        <div>Hide Functions</div>
                        </>
                        }
                    </div>
                    {/* <div className='btn' onClick={() => {
                        if (formDrawerMinWidth === 0) {
                            setFormDrawerMinWidth(20)
                            setFormDrawerWidth(formDrawerWidthOld)
                        } else {
                            setFormDrawerMinWidth(0)
                            setFormDrawerWidth(0)
                        }
                    }}>
                        <div>{formDrawerMinWidth === 0 ? "Show Details" : "Hide Details"}</div>
                    </div> */}
                    {/* <div className='btn' onClick={() => {
                        if (formDrawerMinWidth === 0) {
                            setFormDrawerMinWidth(20)
                            setFormDrawerWidth(formDrawerWidthOld)
                        } else {
                            setFormDrawerMinWidth(0)
                            setFormDrawerWidth(0)
                        }
                    }}>
                        <div>Auto Show Details</div>
                    </div> */}
                    {/* <div className='btn' onClick={() => {
                        importFromYAML(diagramEditor, exampleWorkflow)
                    }}>
                        <div>Import</div>
                    </div> */}
                    {/* <div>
                        CURRENTLY SELECTED NODE: {selectedNodeID}
                    </div> */}
                </div>
                <FlexBox style={{overflow: "hidden"}}>
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            overflow: 'hidden',
                            position: "relative"
                        }}
                    >
                        <Resizable
                            style={{ ...resizeStyle, pointerEvents: actionDrawerWidth === 0 ? "none" : "", opacity: actionDrawerWidth === 0 ? 0 : 100 }}
                            size={{ width: actionDrawerWidth, height: "100%" }}
                            onResizeStop={(e, direction, ref, d) => {
                                setActionDrawerWidthOld(actionDrawerWidth + d.width)
                                setActionDrawerWidth(actionDrawerWidth + d.width)
                            }}
                            maxWidth="40%"
                            minWidth={actionDrawerMinWidth}
                        >
                            <div className={"panel left"} style={{ display: "flex" }}>
                                <div style={{ width: "100%", margin: "10px" }}>
                                    <Actions />
                                </div>

                            </div>
                        </Resizable>
                        <Resizable
                            style={{ ...resizeStyle, pointerEvents: functionDrawerWidth === 0 ? "none" : "", opacity: functionDrawerWidth === 0 ? 0 : 100 }}
                            size={{ width: functionDrawerWidth, height: "100%" }}
                            onResizeStop={(e, direction, ref, d) => {
                                setFunctionDrawerWidthOld(functionDrawerWidth + d.width)
                                setFunctionDrawerWidth(functionDrawerWidth + d.width)
                            }}
                            maxWidth="40%"
                            minWidth={functionDrawerMinWidth}
                        >
                            <div className={"panel left"} style={{ display: "flex" }}>
                                <div style={{ width: "100%", margin: "10px" }}>
                                    <FunctionsList functionList={functionList} setFunctionList={setFunctionList} namespace={namespace}/>
                                </div>
                            </div>
                        </Resizable>
                        <div id="drawflow" style={{ height: "100%", width: "100%" }}
                            onDrop={(ev) => {
                                console.log("onDrop event = ", ev)
                                ev.preventDefault();
                                var nodeIndex = ev.dataTransfer.getData("nodeIndex");
                                var functionIndex = ev.dataTransfer.getData("functionIndex");
                                console.log("nodeIndex data = ", nodeIndex)
                                console.log("functionIndex data = ", functionIndex)

                                

                                let pos_x = ev.clientX
                                let pos_y = ev.clientY
                                pos_x = pos_x * (diagramEditor.precanvas.clientWidth / (diagramEditor.precanvas.clientWidth * diagramEditor.zoom)) - (diagramEditor.precanvas.getBoundingClientRect().x * (diagramEditor.precanvas.clientWidth / (diagramEditor.precanvas.clientWidth * diagramEditor.zoom)));
                                pos_y = pos_y * (diagramEditor.precanvas.clientHeight / (diagramEditor.precanvas.clientHeight * diagramEditor.zoom)) - (diagramEditor.precanvas.getBoundingClientRect().y * (diagramEditor.precanvas.clientHeight / (diagramEditor.precanvas.clientHeight * diagramEditor.zoom)));

                                // TODO: handle function on drop in a seperate function
                                if (functionIndex !== "") {
                                    let newNode = NodeStateAction
                                    newNode.data.formData = {
                                        action: {
                                            function: functionList[functionIndex].id
                                        }
                                    }
                                    diagramEditor.addNode(newNode.name, newNode.connections.input, newNode.connections.output, pos_x, pos_y, `node ${newNode.family}`, { family: newNode.family, type: newNode.type, ...newNode.data }, newNode.html, false)

                                    return
                                }
                                
                                const newNode = ActionsNodes[nodeIndex]
                                diagramEditor.addNode(newNode.name, newNode.connections.input, newNode.connections.output, pos_x, pos_y, `node ${newNode.family}`, { family: newNode.family, type: newNode.type, ...newNode.data }, newNode.html, false)
                                // addNodeToDrawFlow(data, ev.clientX, ev.clientY);
                            }}
                            onContextMenu={(ev) => {
                                console.log("CONTEXT MENU EV = ", ev)
                                ev.preventDefault()
                                setContextMenuAnchorPoint({ x: ev.pageX, y: ev.pageY })
                                setShowContextMenu(true)
                            }}
                            onDragOver={(ev) => {
                                ev.preventDefault(ev);
                                // console.log("onDragOver event = ", ev)
                            }}
                        >
                        </div>
                        <Resizable
                            style={{ ...resizeStyleForm, ...formDrawerVisibility(formDrawerWidth, mouseDown) }}
                            onResizeStop={(e, direction, ref, d) => {
                                setFormDrawerWidthOld(formDrawerWidthOld + d.width)
                                setFormDrawerWidth(formDrawerWidth + d.width)
                            }}
                            size={{ width: formDrawerWidth, height: "100%" }}
                            maxWidth="40%"
                            minWidth={formDrawerMinWidth}
                        >
                            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderBottom: "1px solid #e5e5e5", paddingBottom: "6px", borderLeft: "7px solid rgb(131, 131, 131)", width: "100%" }}>
                                <h2 style={{ margin: "6px", textAlign: "center" }}>
                                    {selectedNode ? `${selectedNode.html} Details` : "No Node Selected"}
                                </h2>
                                <div className='btn' style={{ backgroundColor: "pink", cursor: "pointer", paddingTop: "0px", paddingBottom: "0px" }} onClick={() => {
                                    formRef.click()
                                }}>
                                    Submit
                                </div>
                            </div>
                            <div className={"panel right"} style={{ flexDirection: "column" }}>
                                <div style={{ minHeight: "200px", maxHeight: "100%", height: "0px" }}>
                                    <Form
                                        id={"builder-form"}
                                        onSubmit={(form) => {
                                            console.log("form.formData = ", form.formData)

                                            // Update form data into node
                                            const node = selectedNode
                                            node.data.formData = form.formData
                                            console.log("!!!node!#@!$!@$@! = ", node)
                                            diagramEditor.updateNodeDataFromId(selectedNodeID, node.data)

                                            // Do Custom callback logic if it exists for data type
                                            let onSubmitCallback = onSubmitCallbackMap[node.name]
                                            if (onSubmitCallback) {
                                                onSubmitCallback(selectedNodeID, diagramEditor)
                                                return
                                            }

                                            // Maybe make a function for this to getNode again
                                            setSelectedNode(node)
                                        }}
                                        schema={selectedNode ? getSchema() : {}}
                                        uiSchema={uiSchema}
                                        formData={selectedNode ? selectedNode.data.formData : {}}
                                    >
                                        <button ref={setFormRef} style={{ display: "none" }} />
                                    </Form>
                                </div>
                            </div>
                        </Resizable>
                    </div>
                </FlexBox>
                {/* </div> */}
            </FlexBox>
        </>
    )
}