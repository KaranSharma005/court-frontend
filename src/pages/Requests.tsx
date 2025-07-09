import MainAreaLayout from "../components/main-layout/main-layout";
import CustomTable from "../components/CustomTable";
import { useNavigate } from "react-router";
import { ReaderClient, useAppStore } from '../store';
import {
    Button,
    Input,
    Form,
    Drawer,
    message,
    Upload,
    Tag,
    Flex
} from "antd";
import { useEffect, useState } from "react";
import type { GetProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

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

const statusMap: Record<number, { color: string, label: string }> = {
    0: { color: 'red', label: 'Unsigned' },
    1: { color: 'green', label: 'Signed' },
    2: { color: 'orange', label: 'Pending' },
};

export default function Requests() {
    const onSearch: SearchProps['onSearch'] = (value, _e, info) => console.log(info?.source, value);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [row, setRow] = useState<Template[]>([]);
    const setRecord = useAppStore().setRecord;

    const onPreview = async (record: Template) => {
        try {
            const id = record?.id;
            // const buffer = await ReaderClient.showPreview(id);
            // const pdfBlob = new Blob([buffer], { type: 'application/pdf' });
            // const fileURL = URL.createObjectURL(pdfBlob);
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

    const deleteTemplate = async (id : string) => {
        try{
            const response = await ReaderClient.deleteTemplate(id);
            setRow(response?.templatesData);
            message.success("Template deleted successfully!");
        }
        catch (err) {
            handleError(err, "Failed to save template");
        }
    }

    const cloneTemplate = async (id : string) => {
        try{
            const response = await ReaderClient.clone(id);
            setRow(response?.templatesData);
        }
        catch (err) {
            handleError(err, "Failed to save template");
        }
    }

    const getActions = (record: Template) => {
        console.log(record);
        if(record?.data?.length == 0){
            return(
                <>
                    <Flex gap="middle">
                        <Button type="primary" onClick={() => cloneTemplate(record.id)}>Clone</Button>
                        <Button danger onClick={() => deleteTemplate(record.id)}>Delete</Button>
                    </Flex>
                    
                </>
            )
        }
    }

    useEffect(() => {
        async function getAll() {
            try {
                const response = await ReaderClient.allTemplates();
                setRow(response?.templatesData);
            }
            catch (err) {
                handleError(err, "Failed to save template");
            }
        }
        getAll();
    }, [])

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
        </MainAreaLayout>
    );
}
