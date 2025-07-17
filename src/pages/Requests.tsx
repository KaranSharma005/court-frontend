import MainAreaLayout from "../components/main-layout/main-layout";
import CustomTable from "../components/CustomTable";
import { useNavigate } from "react-router";
import { ReaderClient, useAppStore, userClient, OfficerClient } from '../store';
import { Button, Input, Form, Drawer, message, Upload, Tag, Modal, Select, Radio, Progress, Flex } from "antd";
const Option = Select;
import { useEffect, useState } from "react";
import { UploadOutlined } from '@ant-design/icons';
import socket from "../client/socket";
const { Search } = Input;
import { Template, Officer, SignatureInt, statusMap } from '../utils/index';
import { getActions, handleError } from "../utils/requestUtils";

export default function Requests() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selctedOfficerId, setSelectedOfficerId] = useState<string>("");
    const [selectedRecord, setSelectedRecord] = useState<string>("");
    const [searchValue, setSearchValue] = useState<string>("");
    const [filteredRow, setFilteredRow] = useState<Template[]>([]);
    const [reasonModal, setReasonModal] = useState(false);
    const [rejectReason, setRejectionReason] = useState<string>("");
    const [delegateModal, setDelegateModal] = useState(false);
    const [delegateReason, setDelegateReason] = useState<string>("");
    const [selectedSignature, setSelectedSignature] = useState<SignatureInt | null>(null);
    const [signatureList, setSignatureList] = useState<SignatureInt[]>([]);
    const [signModal, setSignModal] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [row, setRow] = useState<Template[]>([]);
    const setRecord = useAppStore().setRecord;
    const role = useAppStore()?.session?.role;
    const sessionId = useAppStore((state) => state.session?.userId);

    useEffect(() => {
        const handleDocumentAssigned = (data: Template) => {
            try {
                setRow((prev) => [...prev, data]);
            }
            catch (err) {
                handleError(err, "Error Occured");
            }
        };

        socket.on("signature-request", handleDocumentAssigned);
        return () => {
            socket.off("signature-request", handleDocumentAssigned);
        };
    }, [socket]);

    useEffect(() => {
        const handleProcessing = (data: string) => {
            try {
                setRow((prevRows) =>
                    prevRows.map((row) =>
                        row.id === data ? { ...row, signStatus: 4 } : row
                    )
                );
                // setSignModal(false);
            }
            catch (err) {
                handleError(err, "Error Occured");
            }
        }
        socket.on("processing-sign", handleProcessing);
        return () => {
            socket.off("processing-sign", handleProcessing)
        }
    }, [socket]);

    useEffect(() => {
        const handleCount = (templateId: string) => {
            setRow((prevRows) =>
                prevRows.map((row) => {
                    if (row.id === templateId) {
                        return {...row,signCount: (row.signCount || 0) + 1};
                    }
                    return row;
                })
            );
        };
        socket.on("sign-count", handleCount);
        return () => {
            socket.off("sign-count", handleCount);
        };
    }, []);


    useEffect(() => {
        const handleComplete = (data: string) => {
            setRow((prev) => prev.map((row) => row.id == data ? { ...row, signStatus: 5 } : row))
        }
        socket.on("sign-complete", handleComplete);
        return () => {
            socket.off("sign-complete", handleComplete);
        }
    }, [socket])

    useEffect(() => {
        async function onloadFunction() {
            try {
                const response = await OfficerClient.getSignatures();
                setSignatureList(response?.allSignature);
                console.log(response?.allSignature);
            }
            catch (err) {
                handleError(err, "Error in getting signature list");
            }
        }
        onloadFunction();
    }, [])

    const onPreview = async (record: Template) => {
        try {
            const id = record?.id;
            const previewURL = `http://localhost:3000/template/preview/${id}`;
            window.open(previewURL, '');
        }
        catch (err) {
            handleError(err, "Failed to preview template");
        }
    }

    const showAllDocs = (record: Template) => {
        console.log(record?.signCount);
        setRecord(record);
        navigate(`/dashboard/request/${record.id}`);
    }

    const deleteTemplate = async (id: string) => {
        try {
            const response = await ReaderClient.deleteTemplate(id);
            setRow(response?.templatesData);
            message.success("Template deleted successfully!");
        }
        catch (err) {
            handleError(err, "Failed to save template");
        }
    }

    const cloneTemplate = async (id: string) => {
        try {
            const response = await ReaderClient.clone(id);
            setRow(response?.templatesData);
        }
        catch (err) {
            handleError(err, "Failed to clone template");
        }
    }

    const handleOk = async () => {
        try {
            await ReaderClient.sendForSignature(selectedRecord, selctedOfficerId);
            setIsModalOpen(false);
            getAll();
        }
        catch (err) {
            handleError("Failed to delegate");
        }
    }

    const handleCancel = () => {
        try {
            setIsModalOpen(false);
        }
        catch (err) {
            handleError("Failed to cancel");
        }
    }

    const sendForSignature = async (record: Template) => {
        try {
            setSelectedRecord(record?.id);
            setIsModalOpen(true);
        }
        catch (err) {
            handleError(err, "Failed to save template");
        }
    }

    const handleSign = async (id: string) => {
        try {
            setSelectedRecord(id);
            setSignModal(true);
        }
        catch (err) {
            handleError(err, "Failed to Sign");
        }
    }

    const handleDelegate = (id: string) => {
        try {
            setSelectedRecord(id);
            setDelegateModal(true);
        }
        catch (err) {
            handleError(err, "Failed to delegate");
        }
    }

    const handleRejectAll = async (id: string) => {
        try {
            setSelectedRecord(id);
            setReasonModal(true);
        }
        catch (err) {
            handleError(err, "Failed to delegate");
        }
    }
    async function getAll() {
        try {
            const response = await ReaderClient.allTemplates();
            setRow(response?.templatesData);
        }
        catch (err) {
            handleError(err, "Failed to fetch Requests");
        }
    }

    async function getForOfficer() {         //REquest for officer
        try {
            const response = await OfficerClient.getRequests();
            setRow(response?.requests);
        }
        catch (error) {
            handleError(error, "Failed to fetch Requests");
        }
    }

    useEffect(() => {
        if (role === 3) {
            getAll();
        }
        else if (role === 2) {
            getForOfficer();
        }
    }, [])

    useEffect(() => {
        async function onload() {
            try {
                const response = await userClient.getOfficers();
                const officersList = response?.officers;
                setOfficers(officersList);
            }
            catch (err) {
                handleError(err, "Failed to load template fields");
            }
        }
        onload();
    }, []);

    const showRejectedDocs = async (id: string) => {
        try {
            navigate(`/dashboard/rejectedReq/${id}`);
        }
        catch (err) {
            handleError(err, "Error in showing rejected documents");
        }
    }

    const columns = [
        {
            title: 'Title',
            dataIndex: 'templateName',
            render: (text: String, record: Template) => (
                <Button type="link" onClick={() => onPreview(record)}>{text}</Button>
            ),
        },
        {
            title: 'Number of Documents',
            dataIndex: 'data',
            render: (_: any, record: Template) => (
                <Button type="link" onClick={() => showAllDocs(record)}>
                    {record.data?.length || 0}
                </Button>
            ),
        },
        {
            title: 'Rejected Documents',
            dataIndex: 'data',
            render: (_: any, record: Template) => {
                const rejectedCount = record.data?.filter(d => d.rejectionReason)?.length || 0;
                return (
                    <Button type="link" onClick={() => showRejectedDocs(record?.id)}>
                        {rejectedCount}
                    </Button>
                );
            },
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            render: (date: Date) => new Date(date).toLocaleString(),
        },
        {
            title: 'Request Status',
            dataIndex: 'signStatus',
            render: (status: number, record : Template) => {
                const statusObj = statusMap[status];
                if (!statusObj) return null;
                const label = status == 4 ? `${statusObj.label} (${record.signCount})` : statusObj.label;
                return (<>
                <Flex>
                <Tag color={statusObj.color}>{label}</Tag>
                {status == 4 && (<Progress type="circle" size={30} percent={(record?.signCount/record?.data?.length)*100} />)}
                </Flex>
                </>)
            },
        },

        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Template) =>
                getActions({
                    record, role, sessionId, cloneTemplate, sendForSignature, deleteTemplate, handleSign, handleDelegate, handleRejectAll,
                }),
        },
    ];

    const handleTemplateSubmission = async () => {
        try {
            const values = await form.validateFields();

            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("description", values.description);
            if (selectedFile) {
                formData.append("file", selectedFile);
            } else {
                throw new Error("No file selected");
            }
            await ReaderClient.templateRequest(formData);

            message.success("Template uploaded successfully");
            const response = await ReaderClient.allTemplates();
            setRow(response?.templatesData);

            setIsDrawerOpen(false);
            form.resetFields();
            setSelectedFile(null);
        }
        catch (err) {
            handleError(err, "Failed to save template");
        }
    };

    const handleFileChange = (info: any) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            setSelectedFile(file);
        }
    };

    useEffect(() => {
        if (searchValue === "") {
            setFilteredRow(row);
        }
    }, [searchValue, row]);

    const onSearch = (value: string) => {
        try {
            setSearchValue(value);
            const filteredData = row.filter((item) => {
                return item?.templateName?.toLowerCase().includes(value.toLowerCase());
            })
            setFilteredRow(filteredData);
        }
        catch (err) {
            handleError(err, "An error occured");
        }
    }

    const handleCancell = () => {
        try {
            setReasonModal(false);
            setRejectionReason("");
        }
        catch (err) {
            handleError(err, "An error occured");
        }
    }

    const handleRejectionOk = async () => {
        try {
            await OfficerClient.rejectAll(selectedRecord, rejectReason);
            setReasonModal(false);
            getAll();
        }
        catch (err) {
            handleError(err, "Error in rejection");
        }
    }

    const onDelegateOk = async () => {
        try {
            await OfficerClient.delegateRequest(selectedRecord, delegateReason);
            setDelegateModal(false);
        }
        catch (err) {
            handleError(err, "Error in delegating request");
        }
    }

    const onSignOk = async () => {
        try {
            if (!selectedSignature) return;
            const { id, url } = selectedSignature;
            setSignModal(false);
            await OfficerClient.signDocuments(selectedRecord, url, id);
        }
        catch (err) {
            handleError(err, "Error in document");
            setSignModal(false);
        }
    }

    return (
        <>
            <MainAreaLayout
                title="Court Management"
                extra={
                    <>
                        <Search placeholder="input search text" onSearch={onSearch} style={{ width: 200 }} allowClear onChange={(e) => onSearch(e.target.value)} />
                        <Button
                            type="primary"
                            onClick={() => {
                                setIsDrawerOpen(true);
                                form.resetFields();
                                setSelectedFile(null);
                            }}
                            className="px-6 py-2 text-lg rounded-md"
                        >
                            New Request for Signature
                        </Button>
                    </>
                }
            >
                <CustomTable
                    columns={columns}
                    data={filteredRow}
                    serialNumberConfig={{ name: "", show: true }}
                    key="_id"
                />
                <Drawer
                    placement="right"
                    width={400}
                    open={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                >
                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={handleTemplateSubmission}
                    >
                        <Form.Item
                            label="Title"
                            name="title"
                            rules={[{ required: true, message: "Title is required" }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Upload Template"
                            name="templateFile"
                            rules={[{ required: true, message: "Template is required" }]}
                        >
                            <Upload
                                name="file"
                                beforeUpload={() => false}
                                onChange={handleFileChange}
                                showUploadList={{ showRemoveIcon: true }}
                                onRemove={() => setSelectedFile(null)}
                            >
                                <Button icon={<UploadOutlined />}>
                                    Click to Upload
                                </Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item
                            label="Description"
                            name="description"
                        >
                            <Input />
                        </Form.Item>
                        <Button type="primary" block htmlType="submit">
                            Submit
                        </Button>
                    </Form>
                </Drawer>
                {isModalOpen && (
                    <Modal
                        title="Select Whon to send Request"
                        closable={{ 'aria-label': 'Custom Close Button' }}
                        open={isModalOpen}
                        onOk={handleOk}
                        onCancel={handleCancel}
                    >
                        <Select style={{ width: '100%' }} placeholder="Select Officer"
                            onChange={(value) => { setSelectedOfficerId(value); }}
                        >
                            {officers?.map((officer) => (
                                <Option key={officer?.id} value={officer?.id}>
                                    {officer.name}
                                </Option>
                            ))
                            }
                        </Select>
                    </Modal>
                )}
                {reasonModal && (
                    <Modal
                        title="Rejection Reason"
                        closable={{ 'aria-label': 'Custom Close Button' }}
                        open={reasonModal}
                        onOk={handleRejectionOk}
                        onCancel={handleCancell}
                    >
                        <Input.TextArea rows={4} placeholder="Enter Rejection Reason" value={rejectReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        >
                        </Input.TextArea>
                    </Modal>
                )}
                {delegateModal && (
                    <Modal
                        title="Delegation Reason"
                        closable={{ 'aria-label': 'Custom Close Button' }}
                        open={delegateModal}
                        onOk={onDelegateOk}
                        onCancel={() => setDelegateModal(false)}
                    >
                        <Input.TextArea rows={4} placeholder="Enter Rejection Reason" value={delegateReason}
                            onChange={(e) => setDelegateReason(e.target.value)}
                        >
                        </Input.TextArea>
                    </Modal>
                )}
                {signModal && (
                    <Modal
                        title="Select Signature"
                        closable={{ 'aria-label': 'Custom Close Button' }}
                        open={signModal}
                        onOk={onSignOk}
                        onCancel={() => setSignModal(false)}
                    >
                        <Radio.Group
                            onChange={(e) => setSelectedSignature(e.target.value)}
                            value={selectedSignature}
                            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                        >
                            {signatureList.map((item, index) => {
                                const imageUrl = `http://localhost:3000/signature/${item.url}`;
                                return (
                                    <Radio key={index} value={item}>
                                        <img
                                            src={imageUrl} alt={`Signature ${index + 1}`}
                                            style={{ height: '80px', border: '1px solid #ccc', padding: '5px', borderRadius: '8px', }}
                                        />
                                    </Radio>
                                );
                            })}
                        </Radio.Group>
                    </Modal>
                )}
            </MainAreaLayout>
        </>
    );
}
