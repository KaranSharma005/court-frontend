import MainAreaLayout from "../components/main-layout/main-layout";
import CustomTable from "../components/CustomTable";
import { useState, useEffect } from 'react';
import { ReaderClient } from '../store';
import { useParams } from "react-router";
import type { ColumnsType } from 'antd/es/table';
import {
    Tag,
    message,
} from 'antd';

interface Template {
    id: string;
    templateName: string;
    rejectionReason : string;
    createdAt: string;
}

export default function RejectedDocPreview() {
    const [columns, setColumns] = useState<ColumnsType<any>>([]);
    const [row, setRow] = useState<Template[]>([]);
    const id = useParams()?.id;

    const handleError = (
        error: unknown,
        fallbackMsg = "Something went wrong"
    ) => {
        console.error(error);
        if (error instanceof Error) return message.error(error.message);
        if (typeof error === "string") return message.error(error);
        return message.error(fallbackMsg);
    };

    useEffect(() => {
        async function getFields() {
            try {
                if (!id) return;
                const response = await ReaderClient.getTemplateFields(id);
                const templateVars = response?.templateVar?.templateVariables;

                if (Array.isArray(templateVars)) {
                    const columns: ColumnsType<any> = [
                        ...templateVars
                            .filter((col) => col.showOnExcel)
                            .map((col) => ({
                                title: col.name,
                                dataIndex: col.name,
                                key: col.name,
                            })),
                        {
                            title: "Status",
                            dataIndex: "signStatus",
                            render: () => {
                                return <Tag color="red">Rejected</Tag>;
                            },
                        },
                        {
                            title: "Rejected Reason",
                            dataIndex: "rejectionReason",
                            key: "rejectionReason",
                        },
                    ];

                    setColumns(columns);
                } else {
                    console.error("templateVariables is not an array:", templateVars);
                }
            } catch (err) {
                handleError(err, "Failed to load template fields");
            }
        }

        getFields();
    }, []);

    useEffect(() => {
        const onloadFunction = async () => {
            if (!id)
                return;
            const response = await ReaderClient.rejectedList(id);
            const rejectedRows = response?.rejectedDoc;
            const formattedRows = rejectedRows.map((doc: any) => ({
                ...doc.data,
                id : doc.id,
                rejectionReason : doc.rejectionReason,
            })) || [];
            setRow(formattedRows);
        }
        onloadFunction();
    }, [])
    return (
        <MainAreaLayout
            title="Rejected Documents"
        >
            <CustomTable
                columns={columns}
                data={row}
                serialNumberConfig={{ name: "", show: true }}
                key="_id"
            />
        </MainAreaLayout>
    )
}