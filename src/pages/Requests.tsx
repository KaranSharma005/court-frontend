import MainAreaLayout from "../components/main-layout/main-layout";
import CustomTable from "../components/CustomTable";
import { useNavigate } from "react-router";
import { ReaderClient, useAppStore, userClient, OfficerClient } from '../store';
import {
    Button,
    Input,
    Form,
    Drawer,
    message,
    Upload,
    Tag,
    MenuProps,
    Dropdown,
    Modal,
    Select
} from "antd";
const Option = Select;
import { useEffect, useState } from "react";
import { DownOutlined } from '@ant-design/icons';
import type { GetProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import socket from "../client/socket";

type SearchProps = GetProps<typeof Input.Search>;
const { Search } = Input;

interface Template {
    id: string;
    templateName: string;
    data: {
        rejectionReason?: string;
    }[];
    createdAt: string;
    signStatus: number;
}

interface Officer {
    id: string
    name: string,
    email: string
}

const statusMap: Record<number, { color: string, label: string }> = {
    0: { color: 'red', label: 'Unsigned' },
    1: { color: '#1890ff', label: 'Ready to Sign' },
    2: { color: '#fa541c', label: 'Delegated' },
    3: { color: '#722ed1', label: 'Rejected' },
    4: { color: '#fa8c16', label: 'In Process' },
    5: { color: '#52c41a', label: 'Signed' },
    6: { color: '#13c2c2', label: 'Ready To Dispatch' },
    7: { color: '#faad14', label: 'Dispatched' },
};

export default function Requests() {
    const onSearch: SearchProps['onSearch'] = (value, _e, info) => console.log(info?.source, value);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selctedOfficerId, setSelectedOfficerId] = useState<string>("");
    const [selectedRecord, setSelectedRecord] = useState<string>("");
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [row, setRow] = useState<Template[]>([]);
    const setRecord = useAppStore().setRecord;
    const role = useAppStore()?.session?.role;

    useEffect(() => {
        const handleDocumentAssigned = (data: Template) => {
            try {
                console.log("data" ,data);
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

    const handleDispatch = async (record: Template) => {
        try {
            setSelectedRecord(record?.id);
            setIsModalOpen(true);
        }
        catch (err) {
            handleError(err, "Failed to save template");
        }
    }


    const getActions = (record: Template) => {
        const items: MenuProps['items'] = [
            {
                key: 'clone',
                label: 'Clone',
                onClick: () => cloneTemplate(record.id),
            },
        ];

        if (record?.signStatus === 0 && record?.data?.length > 0) {
            items.push({
                key: 'dispatch',
                label: 'Send for Signature',
                onClick: () => handleDispatch(record),
            });
        }
        
        if(record?.signStatus == 0){
            items?.push({
                key: 'delete',
                label: 'Delete',
                danger: true,
                onClick: () => deleteTemplate(record.id),
            })
        }

        return (
            <Dropdown
                menu={{ items }}
                trigger={['click']}
            >
                <Button>
                    Actions <DownOutlined />
                </Button>
            </Dropdown>
        );
    };

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
            console.log(response);
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
                    rejectedCount
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
            render: (status: number) => {
                const { color, label } = statusMap[status] || {};
                return <Tag color={color}>{label}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Template) => getActions(record),
        },
    ];


    const handleError = (
        error: unknown,
        fallbackMsg = "Something went wrong"
    ) => {
        console.error(error);
        if (error instanceof Error) return message.error(error.message);
        if (typeof error === "string") return message.error(error);
        return message.error(fallbackMsg);
    };

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

    return (
        <>
            <MainAreaLayout
                title="Court Management"
                extra={
                    <>
                        <Search placeholder="input search text" onSearch={onSearch} style={{ width: 200 }} />
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
                    data={row}
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
                {
                    isModalOpen && (
                        <Modal
                            title="Select Whon to send Request"
                            closable={{ 'aria-label': 'Custom Close Button' }}
                            open={isModalOpen}
                            onOk={handleOk}
                            onCancel={handleCancel}
                        >
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Select Officer"
                                onChange={(value) => {
                                    setSelectedOfficerId(value);
                                }}
                            >
                                {
                                    officers?.map((officer) => (
                                        <Option key={officer?.id} value={officer?.id}>
                                            {officer.name}
                                        </Option>
                                    ))
                                }
                            </Select>
                        </Modal>
                    )
                }
            </MainAreaLayout>
        </>
    );
}
