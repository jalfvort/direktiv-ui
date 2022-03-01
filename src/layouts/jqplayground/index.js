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
import { onSubmitCallbackMap, setConnections } from './util';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import SearchField from "react-search-field";
import Fuse from 'fuse.js';
import { ActionsNodes } from "./nodes";


import SearchInput, { createFilter } from 'react-search-input'
import { exampleWorkflow, importFromYAML } from './import';

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
                key={key}
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

export default function JQPlayground() {
    const [diagramEditor, setDiagramEditor] = useState(null);
    const [selectedNodeID, setSelectedNodeID] = useState(0);
    const [selectedNode, setSelectedNode] = useState(null);
    const [formRef, setFormRef] = useState(null);
    const [error, setError] = useState(null)
    const [mouseDown, setMouseDown] = useState(false)

    const [actionDrawerWidth, setActionDrawerWidth] = useState(0)
    const [actionDrawerWidthOld, setActionDrawerWidthOld] = useState(200)
    const [actionDrawerMinWidth, setActionDrawerMinWidth] = useState(0)

    const [formDrawerWidth, setFormDrawerWidth] = useState(240)
    const [formDrawerWidthOld, setFormDrawerWidthOld] = useState(240)
    const [formDrawerMinWidth, setFormDrawerMinWidth] = useState(160)
    const [formDrawerAutoShow, setFormDrawerAutoShow] = useState(true)

    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuAnchorPoint, setContextMenuAnchorPoint] = useState({ x: 0, y: 0 });
    const [contextMenuResults, setContextMenuResults] = useState(ActionsNodes)

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


            editor.addNode('StartBlock', 0, 1, 1, 200, "node special start", { family: "special", type: "start", schemaKey: 'stateSchemaSwitch', formData: {} }, 'Start Block', false);

            setDiagramEditor(editor)
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
            <FlexBox id="builder-page" className="col gap" style={{ paddingRight: "8px" }}>
                {error ?
                    <Alert className="critical" style={{ flex: "0" }}>{error} </Alert>
                    :
                    <></>
                }
                {/* <div style={{height:"600px", width: "600px"}}> */}
                <div className='toolbar'>
                    <div className='btn' onClick={() => {
                        setError(null)
                        //TODO: Split into another function
                        //TODO: Export to non-destructive json ✓
                        let rawExport = diagramEditor.export()
                        let rawData = rawExport.drawflow.Home.data
                        let wfData = { states: [] }
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

                    }}>
                        <div>Export</div>
                    </div>
                    <div className='btn' onClick={() => {
                        if (actionDrawerMinWidth === 0) {
                            setActionDrawerMinWidth(20)
                            setActionDrawerWidth(actionDrawerWidthOld)
                        } else {
                            setActionDrawerMinWidth(0)
                            setActionDrawerWidth(0)
                        }
                    }}>
                        <div>{actionDrawerMinWidth === 0 ? "Show Actions" : "Hide Actions"}</div>
                    </div>
                    <div className='btn' onClick={() => {
                        if (formDrawerMinWidth === 0) {
                            setFormDrawerMinWidth(20)
                            setFormDrawerWidth(formDrawerWidthOld)
                        } else {
                            setFormDrawerMinWidth(0)
                            setFormDrawerWidth(0)
                        }
                    }}>
                        <div>{formDrawerMinWidth === 0 ? "Show Details" : "Hide Details"}</div>
                    </div>
                    <div className='btn' onClick={() => {
                        if (formDrawerMinWidth === 0) {
                            setFormDrawerMinWidth(20)
                            setFormDrawerWidth(formDrawerWidthOld)
                        } else {
                            setFormDrawerMinWidth(0)
                            setFormDrawerWidth(0)
                        }
                    }}>
                        <div>Auto Show Details</div>
                    </div>
                    <div className='btn' onClick={() => {
                        importFromYAML(diagramEditor, exampleWorkflow)
                    }}>
                        <div>Import</div>
                    </div>
                    <div>
                        CURRENTLY SELECTED NODE: {selectedNodeID}
                    </div>
                </div>
                <FlexBox style={{ margin: "5px", borderRadius: "16px", overflow: "hidden", boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px" }}>
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
                        <div id="drawflow" style={{ height: "100%", width: "100%" }}
                            onDrop={(ev) => {
                                console.log("onDrop event = ", ev)
                                ev.preventDefault();
                                var nodeIndex = ev.dataTransfer.getData("nodeIndex");
                                console.log("event data = ", nodeIndex)

                                let pos_x = ev.clientX
                                let pos_y = ev.clientY
                                const newNode = ActionsNodes[nodeIndex]

                                pos_x = pos_x * (diagramEditor.precanvas.clientWidth / (diagramEditor.precanvas.clientWidth * diagramEditor.zoom)) - (diagramEditor.precanvas.getBoundingClientRect().x * (diagramEditor.precanvas.clientWidth / (diagramEditor.precanvas.clientWidth * diagramEditor.zoom)));
                                pos_y = pos_y * (diagramEditor.precanvas.clientHeight / (diagramEditor.precanvas.clientHeight * diagramEditor.zoom)) - (diagramEditor.precanvas.getBoundingClientRect().y * (diagramEditor.precanvas.clientHeight / (diagramEditor.precanvas.clientHeight * diagramEditor.zoom)));
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
                                        schema={selectedNode ? SchemaMap[selectedNode.data.schemaKey] : {}}
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

export function BackupJQPlayground() {

    const [filter, setFilter] = useState(localStorage.getItem('jqFilter') ? localStorage.getItem('jqFilter') : ".")
    const [input, setInput] = useState(localStorage.getItem('jqInput') ? localStorage.getItem('jqInput') : JSON.stringify({}, null, 2))
    const [error, setError] = useState(null)



    const { data, err, executeJQ, cheatSheet } = useJQPlayground(Config.url, localStorage.getItem("apikey"))

    const executeAndSave = useCallback((...args) => {
        localStorage.setItem('jqInput', input)
        localStorage.setItem('jqFilter', filter)
        executeJQ(...args)
    }, [executeJQ, filter, input])

    // Save state every 2 seconds
    useEffect(() => {
        if (filter == null || input == null) {
            return
        }

        let timer = setInterval(async () => {
            localStorage.setItem('jqInput', input)
            localStorage.setItem('jqFilter', filter)
        }, 2000)

        return function cleanup() {
            clearInterval(timer)
        }
    }, [filter, input])


    useEffect(() => {
        setError(err)
    }, [err])

    return (
        <FlexBox id="jq-page" className="col gap" style={{ paddingRight: "8px" }}>
            <JQFilter data={input} query={filter} error={error} setFilter={setFilter} executeJQ={executeAndSave} setError={setError} />
            <FlexBox className="gap col" >
                <FlexBox className="gap wrap">
                    <FlexBox style={{ minWidth: "380px" }}>
                        <JQInput input={input} setInput={setInput} />
                    </FlexBox>
                    <FlexBox style={{ minWidth: "380px" }}>
                        <JQOutput data={data} />
                    </FlexBox>
                </FlexBox>
            </FlexBox>
            <FlexBox className="gap col" >
                <FlexBox className="gap box-wrap">
                    <HowToJQ />
                    <ExamplesJQ cheatSheet={cheatSheet} setFilter={setFilter} setInput={setInput} executeJQ={executeAndSave} />
                </FlexBox>
            </FlexBox>
        </FlexBox>
    )
}

function HowToJQ() {
    return (
        <FlexBox className="how-to-jq">
            <ContentPanel style={{ width: "100%" }}>
                <ContentPanelTitle>
                    <ContentPanelTitleIcon>
                        <VscFileCode />
                    </ContentPanelTitleIcon>
                    <FlexBox className="gap" style={{ alignItems: "center" }}>
                        <div>
                            How it works
                        </div>
                        <HelpIcon msg={"Brief instructions on how JQ Playground works"} />
                    </FlexBox>
                </ContentPanelTitle>
                <ContentPanelBody>
                    <FlexBox className="col gap" style={{ fontSize: "10pt" }}>
                        <span style={{ fontWeight: "bold" }}>JQ Playground is an envrioment where you can quickly test your jq commands against JSON.</span>
                        <span>There are two inputs in the playground:</span>
                        <ul>
                            <li><span style={{ fontWeight: "bold" }}>Filter</span> - This is the jq command that will be used to transform your JSON input</li>
                            <li><span style={{ fontWeight: "bold" }}>JSON</span> - This is the JSON input that will be transformed</li>
                        </ul>
                        <div>
                            The transformed JSON is shown in the Result output field.
                        </div>
                        <div>
                            For information on the JQ syntax, please refer to the offical JQ manual online.
                        </div>
                        <Button className="reveal-btn small shadow">
                            <FlexBox className="gap">
                                <VscArrowRight className="auto-margin" />
                                <a href="https://stedolan.github.io/jq/manual/">
                                    View JQ Manual
                                </a>
                            </FlexBox>
                        </Button>
                    </FlexBox>
                </ContentPanelBody>
            </ContentPanel>
        </FlexBox>
    )
}

function ExamplesJQ(props) {
    const { cheatSheet, setFilter, setInput, executeJQ } = props

    async function loadJQ(f, i) {
        setFilter(f)
        setInput(JSON.stringify(JSON.parse(i), null, 2))
        await executeJQ(f, btoa(i))
    }

    const half = Math.ceil(cheatSheet.length / 2);

    const firstHalf = cheatSheet.slice(0, half)
    const secondHalf = cheatSheet.slice(-half)

    return (
        <FlexBox style={{ flex: 2 }}>
            <ContentPanel style={{ minHeight: "280px", width: "100%" }}>
                <ContentPanelTitle>
                    <ContentPanelTitleIcon>
                        <VscFileCode />
                    </ContentPanelTitleIcon>
                    <FlexBox className="gap" style={{ alignItems: "center" }}>
                        <div>
                            Cheatsheet
                        </div>
                        <HelpIcon msg={"A list of examples that you can load into the playground"} />
                    </FlexBox>
                </ContentPanelTitle>
                <ContentPanelBody >

                    <table style={{ width: "50%", fontSize: "10pt" }}>
                        <tbody>
                            {firstHalf.map((obj) => {
                                return (
                                    <tr>
                                        <td className="jq-example" style={{ width: "25%" }}>
                                            {obj.example}
                                        </td>
                                        <td>
                                            {obj.tip}
                                        </td>
                                        <td style={{ width: "20%" }} onClick={() => loadJQ(obj.filter, obj.json)}>
                                            <Button className="reveal-btn small shadow">
                                                <FlexBox className="gap">
                                                    <VscFileCode className="auto-margin" />
                                                    <div>
                                                        Load
                                                    </div>
                                                </FlexBox>
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>

                    </table>
                    <table style={{ width: "50%", fontSize: "10pt" }}>
                        <tbody>
                            {secondHalf.map((obj) => {
                                return (
                                    <tr>
                                        <td style={{ width: "25%" }} className="jq-example">
                                            {obj.example}
                                        </td>
                                        <td>
                                            {obj.tip}
                                        </td>
                                        <td style={{ width: "20%" }} onClick={() => loadJQ(obj.filter, obj.json)}>
                                            <Button className="reveal-btn small shadow">
                                                <FlexBox className="gap">
                                                    <VscFileCode className="auto-margin" />
                                                    <div>
                                                        Load
                                                    </div>
                                                </FlexBox>
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </ContentPanelBody>
            </ContentPanel>
        </FlexBox>
    )
}

function JQOutput(props) {
    const { data } = props

    const [output, setOutput] = useState("")

    useEffect(() => {
        if (data !== output) {
            if (data) {
                setOutput(data.toString())
            }
        }
    }, [data, output])

    return (
        <ContentPanel style={{ width: "100%" }}>
            <ContentPanelTitle>
                <ContentPanelTitleIcon>
                    <VscFileCode />
                </ContentPanelTitleIcon>
                <FlexBox className="gap" style={{ alignItems: "center" }}>
                    <div>
                        Output
                    </div>
                    <HelpIcon msg={"The output of the JQ query"} />
                </FlexBox>
            </ContentPanelTitle>
            <ContentPanelBody >
                <FlexBox style={{ overflow: "hidden", height: "422px", maxHeight: "422px" }}>
                    <DirektivEditor readonly={true} value={output} dlang={"json"} />
                </FlexBox>
            </ContentPanelBody>
        </ContentPanel>
    )
}

function JQInput(props) {
    const { input, setInput } = props
    return (
        <ContentPanel style={{ width: "100%" }}>
            <ContentPanelTitle>
                <ContentPanelTitleIcon>
                    <VscFileCode />
                </ContentPanelTitleIcon>
                <FlexBox className="gap" style={{ alignItems: "center" }}>
                    <div>
                        Input
                    </div>
                    <HelpIcon msg={"The input to feed the JQ query"} />
                </FlexBox>
            </ContentPanelTitle>
            <ContentPanelBody >
                <FlexBox style={{ overflow: "hidden", height: "422px", maxHeight: "422px" }}>
                    <DirektivEditor readonly={false} value={input} setDValue={setInput} dlang={"json"} />
                </FlexBox>
            </ContentPanelBody>
        </ContentPanel>
    )
}

function JQFilter(props) {
    const { data, setFilter, setError, executeJQ, query, error } = props

    async function execute() {
        setError(null)
        // setFilter("")
        try {
            const result = await executeJQ(query, btoa(data))
            return {
                error: false,
                data: result
            }
        } catch (e) {
            setError(e.toString())
            return {
                error: true,
                msg: e.toString()
            }
        }

    }


    return (
        <FlexBox style={{ maxHeight: "205px" }}>
            <ContentPanel style={{ width: "100%" }}>
                <ContentPanelTitle>
                    <ContentPanelTitleIcon>
                        <VscFileCode />
                    </ContentPanelTitleIcon>
                    <FlexBox className="gap" style={{ alignItems: "center" }}>
                        <div>
                            JQ Filter
                        </div>
                        <HelpIcon msg={"A simple JQ playground to test your queries"} />
                    </FlexBox>
                </ContentPanelTitle>
                <ContentPanelBody >
                    <FlexBox className="gap wrap" style={{ height: "40px" }}>
                        <FlexBox style={{ fontSize: "12pt" }} >
                            <input style={{ height: "28px", width: "100%" }} onChange={(e) => setFilter(e.target.value)} value={query} placeholder={"Enter a Filter to JQ on"} type="text" />
                        </FlexBox>
                        <FlexBox style={{ maxWidth: "65px" }}>

                            <Button className="small" onClick={() => execute()}>
                                Execute
                            </Button>
                        </FlexBox>
                    </FlexBox>
                </ContentPanelBody>
                <FlexBox>
                    {error ? <Alert className="error-message"><div><span>error executing JQ command:</span>{error.replace("execute jq: error executing JQ command:", "")}</div></Alert> : null}
                </FlexBox>
            </ContentPanel>
        </FlexBox>
    )
}