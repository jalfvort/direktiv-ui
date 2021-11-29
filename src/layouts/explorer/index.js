import React, {useState} from 'react';
import './style.css';
import { IoAdd, IoClose, IoFolder, IoFolderOpen, IoSearch } from 'react-icons/io5';
import ContentPanel, { ContentPanelBody, ContentPanelHeaderButton, ContentPanelHeaderButtonIcon, ContentPanelTitle, ContentPanelTitleIcon } from '../../components/content-panel';
import FlexBox from '../../components/flexbox';
import { VscTriangleDown } from 'react-icons/vsc';
import { Config, GenerateRandomKey } from '../../util';
import { FiEdit, FiFolder } from 'react-icons/fi';
import { FcWorkflow } from 'react-icons/fc';
import { HiOutlineTrash } from 'react-icons/hi';
import { useNodes } from 'direktiv-react-hooks';
import { useNavigate, useParams } from 'react-router';
import Modal, {ButtonDefinition} from '../../components/modal'
import DirektivEditor from '../../components/editor';
import { BsCodeSlash } from 'react-icons/bs';
import Button from '../../components/button';
import Pagination from '../../components/pagination';


function Explorer(props) {
    const params = useParams()
    const {namespace}  = props
    let filepath = "/"
    if(!namespace){
        return ""
    }

    if(params["*"] !== undefined){
        filepath = `/${params["*"]}`
    }

    return(
        <>
            <SearchBar />
            <FlexBox className="col gap" style={{ paddingRight: "8px" }}>
                <ExplorerList  namespace={namespace} path={filepath}/>
            </FlexBox>
        </>
    )
}

export default Explorer;

function SearchBar(props) {
    return(
        <div className="explorer-searchbar">
            <FlexBox className="">
                <IoSearch className="auto-margin" />
                <input placeholder={"Search items"}></input>
            </FlexBox>
        </div>
    );
}

function ExplorerList(props) {
    const {namespace, path} = props

    const [name, setName] = useState("")
    const [wfData, setWfData] = useState("")
    const [wfTemplate, setWfTemplate] = useState("")
    // const [pageNo, setPageNo] = useState(1);

    const {data, err, templates, createNode, deleteNode, renameNode, toggleWorkflow, getWorkflowRouter } = useNodes(Config.url, true, namespace, path)

    console.log(data, err, templates)

    if(data === null) {
        return ""
    }

    if(data.node.type === "workflow") {
        return <div>its a workflow not a directory</div>
    }

    return(
        <>
        <ContentPanel>
            <ContentPanelTitle>
                <ContentPanelTitleIcon>
                    <IoFolderOpen/>
                </ContentPanelTitleIcon>
                <FlexBox>
                    Explorer
                </FlexBox>
                <div className="explorer-sort-by">
                    <div className="esb-label inline" style={{marginRight: "8px"}}>
                        Sort by:
                    </div>
                    <div className="esb-field inline">
                        <FlexBox className="gap">
                            <div className="inline">
                                Name
                            </div>
                            <VscTriangleDown className="auto-margin"/>
                        </FlexBox>
                    </div>
                </div>
                <ContentPanelHeaderButton style={{ maxWidth: "90px", width: "90px", minWidth: "90px" }}>
                    <Modal title="New Directory" 
                        escapeToCancel
                        button={(
                            <div style={{display:"flex"}}>
                                <ContentPanelHeaderButtonIcon>
                                    <IoAdd/>
                                </ContentPanelHeaderButtonIcon>
                                Directory
                            </div>
                        )}  
                        onClose={()=>{
                            setName("")
                        
                        }}
                        actionButtons={[
                            ButtonDefinition("Add", async () => {
                                let err = await createNode(name, "directory")
                                if(err) return err
                            }, "small blue", true, false),
                            ButtonDefinition("Cancel", () => {
                            }, "small light", true, false)
                        ]}
                    >
                        <FlexBox  className="col gap" style={{fontSize: "12px"}}>
                            <div style={{width: "100%", paddingRight: "12px", display: "flex"}}>
                                <input value={name} onChange={(e)=>setName(e.target.value)} autoFocus placeholder="Enter a directory name" />
                            </div>
                        </FlexBox>
                    </Modal>
                </ContentPanelHeaderButton>
                <ContentPanelHeaderButton style={{ maxWidth: "80px", width: "80px", minWidth: "80px" }}>
                    <Modal title="New Workflow" 
                        escapeToCancel
                        button={(
                            <div style={{display:"flex"}}>
                                <ContentPanelHeaderButtonIcon>
                                    <IoAdd/>
                                </ContentPanelHeaderButtonIcon>
                                Workflow
                            </div>
                        )}  
                        onClose={()=>{
                            setWfData("")
                            setWfTemplate("")
                            setName("")
                        }}
                        actionButtons={[
                            ButtonDefinition("Add", async () => {
                                let err = await createNode(name, "workflow", wfData)
                                if (err) return err
                            }, "small blue", true, false),
                            ButtonDefinition("Cancel", () => {
                            }, "small light", true, false)
                        ]}
                    >
                        <FlexBox className="col gap" style={{fontSize: "12px", minHeight: "300px", minWidth: "450px"}}>
                            <div style={{width: "100%", paddingRight: "12px", display: "flex"}}>
                                <input value={name} onChange={(e)=>setName(e.target.value)} autoFocus placeholder="Enter workflow name" />
                            </div>
                            <select value={wfTemplate} onChange={(e)=>{
                                setWfTemplate(e.target.value)
                                // todo set wfdata to template on change
                                setWfData(templates[e.target.value])
                            }}>
                                <option value="" >Choose a workflow template...</option>
                                {Object.keys(templates).map((obj)=>{
                                    return(
                                        <option value={obj}>{obj}</option>
                                    )
                                })}
                            </select>
                            <FlexBox className="gap" style={{maxHeight: "500px"}}>
                                <FlexBox style={{overflow:"hidden"}}>
                                    <DirektivEditor dlang={"yaml"} width={"500px"} value={wfData} setDValue={setWfData} height={"500px"}/>
                                </FlexBox>
                            </FlexBox>
                        </FlexBox>
                    </Modal>
                </ContentPanelHeaderButton>
            </ContentPanelTitle>
            <ContentPanelBody>
                <FlexBox className="col">
                    {data.children.edges.length === 0 ? 
                            <div className="explorer-item">
                                <FlexBox className="explorer-item-container">
                                    <FlexBox style={{display:"flex", alignItems:"center"}} className="explorer-item-icon">
                                        <IoSearch />
                                    </FlexBox>
                                    <FlexBox style={{fontSize:"10pt"}} className="explorer-item-name">
                                        No results found under '{path}'.
                                    </FlexBox>
                                    <FlexBox className="explorer-item-actions gap">
                    
                                    </FlexBox>
                                </FlexBox>
                            </div>
                    :
                    <>
                    {data.children.edges.map((obj) => {
                        if (obj.node.type === "directory") {
                            return (<DirListItem namespace={namespace} renameNode={renameNode} deleteNode={deleteNode} path={obj.node.path} key={GenerateRandomKey("explorer-item-")} name={obj.node.name} />)
                        } else if (obj.node.type === "workflow") {
                            return (<WorkflowListItem namespace={namespace} renameNode={renameNode} deleteNode={deleteNode} path={obj.node.path} key={GenerateRandomKey("explorer-item-")} name={obj.node.name} />)
                        }
                        return ""
                    })}</>}
                </FlexBox>
            </ContentPanelBody>
        </ContentPanel>
        <FlexBox style={{maxHeight: "32px"}}>
        <FlexBox>
            <Button className="small light" style={{ display: "flex" }}>
                <ContentPanelHeaderButtonIcon>
                    <BsCodeSlash style={{ maxHeight: "12px", marginRight: "4px" }} />
                </ContentPanelHeaderButtonIcon>
                Open API Commands
            </Button>
        </FlexBox>
        {/* <Pagination max={10} currentIndex={pageNo} pageNoSetter={setPageNo} /> */}
    </FlexBox>
    </>
    )
}

function DirListItem(props) {

    let {name, path, deleteNode, renameNode, namespace} = props;

    const navigate = useNavigate()
    const [renameValue, setRenameValue] = useState(path)
    const [rename, setRename] = useState(false)
    const [err, setErr] = useState("")


    return(
        <div style={{cursor:"pointer"}} onClick={(e)=>{
            navigate(`/n/${namespace}/explorer/${path.substring(1)}`)
        }} className="explorer-item">
            <FlexBox className="explorer-item-container">
                <FlexBox className="explorer-item-icon">
                    <FiFolder className="auto-margin" />
                </FlexBox>
                {
                    rename ? 
                    <FlexBox className="explorer-item-name">
                        <input type="text" value={renameValue} onKeyPress={async (e)=>{
                            if(e.key === "Enter"){
                                console.log('enter pressed')
                                let err = await renameNode("", path, renameValue)
                                if(err){
                                    setErr(err)
                                    return
                                }
                                setRename(!rename)
                            }
                        }} onChange={(e)=>setRenameValue(e.target.value)} autoFocus style={{maxWidth:"300px", height:"38px"}}/>
                        {err !== "" ? 
                        <span>{err}</span>
                        :""
                        }
                     </FlexBox>
                    :
                    <FlexBox className="explorer-item-name">
                        {name}
                    </FlexBox>
                }
                
                <FlexBox className="explorer-item-actions gap">
                {rename ? 
                    <FlexBox onClick={(ev)=>{
                        setRename(!rename)
                        setErr("")
                        ev.stopPropagation()
                    }}>
                        <IoClose className="auto-margin" />
                    </FlexBox>
                    :
                    <FlexBox onClick={(ev)=>{
                        setRename(!rename)
                        setErr("")
                        ev.stopPropagation()
                    }}>
                        <FiEdit className="auto-margin" />
                    </FlexBox>}
                    <FlexBox onClick={(ev)=>ev.stopPropagation()}>

                    <Modal
                            escapeToCancel
                            style={{
                                flexDirection: "row-reverse",
                            }}
                            title="Delete a directory" 
                            button={(
                                <FlexBox>
                                    <HiOutlineTrash className="auto-margin red-text" />
                                </FlexBox>
                            )}
                            actionButtons={
                                [
                                    ButtonDefinition("Delete", async () => {
                                        let err = await deleteNode(path)
                                        if (err) return err
                                    }, "small red", true, false),
                                    ButtonDefinition("Cancel", () => {
                                    }, "small light", true, false)
                                ]
                            } 
                        >
                                <FlexBox className="col gap">
                            <FlexBox >
                                Are you sure you want to delete '{name}'?
                                <br/>
                                This action cannot be undone.
                            </FlexBox>
                        </FlexBox>
                    </Modal>
                    </FlexBox>

                </FlexBox>
            </FlexBox>
        </div>
    )
}

function WorkflowListItem(props) {

    let {name, path, deleteNode, renameNode, namespace} = props;

    const navigate= useNavigate()
    const [renameValue, setRenameValue] = useState(path)
    const [rename, setRename] = useState(false)
    const [err, setErr] = useState("")

    console.log(name, path)
    return(
        <div style={{cursor:"pointer"}} onClick={()=>{
            navigate(`/n/${namespace}/explorer/${path.substring(1)}`)
        }} className="explorer-item">
            <FlexBox className="explorer-item-container">
                <FlexBox className="explorer-item-icon">
                    <FcWorkflow className="auto-margin" />
                </FlexBox>
                {
                    rename ? 
                    <FlexBox className="explorer-item-name">
                        <input type="text" value={renameValue} onKeyPress={async (e)=>{
                            if(e.key === "Enter"){
                                console.log('enter pressed')
                                let err = await renameNode("", path, renameValue)
                                if(err){
                                    setErr(err)
                                    return
                                }
                                setRename(!rename)
                            }
                        }} onChange={(e)=>setRenameValue(e.target.value)} autoFocus style={{maxWidth:"300px", height:"38px"}}/>
                        {err !== "" ? 
                        <span>{err}</span>
                        :""
                        }
                     </FlexBox>
                    :
                    <FlexBox className="explorer-item-name">
                        {name}
                    </FlexBox>
                }
                
                <FlexBox className="explorer-item-actions gap">
                    {rename ? 
                    <FlexBox onClick={(ev)=>{
                        setRename(!rename)
                        setErr("")
                        ev.stopPropagation()
                    }}>
                        <IoClose className="auto-margin" />
                    </FlexBox>
                    :
                    <FlexBox onClick={(ev)=>{
                        setRename(!rename)
                        setErr("")
                        ev.stopPropagation()
                    }}>
                        <FiEdit className="auto-margin" />
                    </FlexBox>}
                    <FlexBox onClick={(ev)=>ev.stopPropagation()}>

                        <Modal
                                escapeToCancel
                                style={{
                                    flexDirection: "row-reverse",
                                }}
                                title="Delete a workflow" 
                                button={(
                                    <FlexBox style={{alignItems:'center'}}>
                                        <HiOutlineTrash className="auto-margin red-text" />
                                    </FlexBox>
                                )}
                                actionButtons={
                                    [
                                        ButtonDefinition("Delete", async () => {
                                            let err = await deleteNode(path)
                                            if (err) return err
                                        }, "small red", true, false),
                                        ButtonDefinition("Cancel", () => {
                                        }, "small light", true, false)
                                    ]
                                } 
                            >
                                    <FlexBox className="col gap">
                                <FlexBox >
                                    Are you sure you want to delete '{name}'?
                                    <br/>
                                    This action cannot be undone.
                                </FlexBox>
                            </FlexBox>
                            </Modal>
                </FlexBox>
                </FlexBox>
            </FlexBox>
        </div>
    )
}
