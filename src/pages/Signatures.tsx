import MainAreaLayout from "../components/main-layout/main-layout";
import {
    Upload,
    Button,
    Flex,
    message,
    Col,
    Row,
    Space
} from 'antd';
import { useEffect, useState } from 'react';
import { ReaderClient } from '../store';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

interface Signature {
    url : string,
    _id : string
}
const Signatures: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageURL, setImageURL] = useState<Signature[]>([]);
    const handleFileChange = (info: any) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleError = (
        error: unknown,
        fallbackMsg = "Something went wrong"
    ) => {
        console.error(error);
        if (error instanceof Error) return message.error(error.message);
        if (typeof error === "string") return message.error(error);
        return message.error(fallbackMsg);
    };

    const handleSignature = async () => {
        try {
            const formData = new FormData();
            if (selectedFile) {
                formData.append("signature", selectedFile);
            } else {
                throw new Error("No file selected");
            }
            const response = await ReaderClient.uploadSignature(formData);
            setImageURL(response?.allURL);
            setSelectedFile(null);
            message.success("Signature Uploaded successfully!");
        }
        catch (err) {
            handleError(err, "Failed to save signature");
        }
    }

    useEffect(() => {
        async function getURL() {
            try {
                const response = await ReaderClient.getSignature();
                setImageURL(response?.allURL);
            }
            catch (err) {
                handleError(err, "Failed to save signature");
            }
        }
        getURL();
    }, [])

    const deleteSignature = async (id : string) => {
        try{
            const response = await ReaderClient.deleteSignature(id);
            setImageURL(response?.allURL);
            message.success("Deleted successfully!");
        }
        catch (err) {
            handleError(err, "Failed to save signature");
        }
    }

    return (
        <MainAreaLayout
            title="Uploaded Signatures"
        >
            <Flex gap="large">
                <Upload
                    accept=".png,.jpeg,.jpg"
                    name="signature"
                    beforeUpload={() => false}
                    onChange={handleFileChange}
                    maxCount={1}
                    showUploadList={{ showRemoveIcon: true }}
                    onRemove={() => setSelectedFile(null)}
                >
                    <Button icon={<UploadOutlined />} >
                        Click to Upload
                    </Button>
                </Upload>

                <Button onClick={handleSignature} type="primary">Upload</Button>
            </Flex>

            <Space>
                <div></div>
            </Space>
            <Space>
                <div>
                </div>
            </Space>

            {imageURL?.length > 0 && (
                <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
                    {
                        imageURL?.map((item: {url : string, _id : string}) => {
                            const path = `http://localhost:3000/signature/${item.url}`
                            return (
                                <Col key={item?._id} className="gutter-row" span={5}>
                                    <img src={path} alt="" height="80px" width="80px" />
                                    <DeleteOutlined onClick={() => deleteSignature(item._id)}/>   
                                </Col>
                            )
                        })
                    }
                </Row>
            )}
        </MainAreaLayout>
    )
}
export default Signatures;
