import MainAreaLayout from "../components/main-layout/main-layout";
import CustomTable from "../components/CustomTable";
import { ReaderClient, useAppStore } from '../store';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver'
import { useParams } from "react-router";
import type { ColumnsType } from 'antd/es/table';

import { useState, useEffect } from 'react';
import {
	Button,
	Form,
	message,
	Card,
	Upload,
	Flex
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export default function RequestPage() {
	const [form] = Form.useForm();
	const id = useParams()?.id;
	const [buttonClick, setButtonClick] = useState(false)
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [fields, setFields] = useState<ColumnsType<any>>([]);
	const [isDispatched, setDispatched] = useState(false);

	const [tableData, setTableData] = useState<any[]>([]);
	const record = useAppStore((state) => state.selectedRecord);
	const [name, setName] = useState<string>("");

	useEffect(() => {
		async function getFields() {
			try {
				if (!id) return;
				const response = await ReaderClient.getTemplateFields(id);

				const templateVars = response?.templateVar?.templateVariables;
				setName(response?.name);
				if (Array.isArray(templateVars)) {
					const columns: ColumnsType<any> = templateVars
						.filter((col) => col.showOnExcel)
						.map((col) => ({
							title: col.name,
							dataIndex: col.name,
							key: col.name
						}));

					columns.push({
						title: "Actions",
						key: "actions",
						render: (_: unknown, record: any) => (
							<>
								<Button type="link" onClick={() => handlePreview(record?.id, id)}>Preview</Button>
								{
									isDispatched == false && (
										<Button type="link" danger onClick={() => handleDocDelete(record?.id)}>Delete</Button>
									)
								}
							</>
						),
					});
					setFields(columns);
				} else {
					console.error("templateVariables is not an array:", templateVars);
				}
			} catch (err) {
				handleError(err, "Failed to load template fields");
			}
		}

		getFields();
	}, []);

	const handleDocDelete = async (docId: string) => {
		try {
			console.log(id, docId);
			
			if (!id) return;
			const response = await ReaderClient.deleteDoc(docId, id);
			const rowDataFromBackend = response?.finalOutput;
			const data = rowDataFromBackend.map((item: any) => ({
				id: item.id,
				...item.data,
			}));
			setTableData(data);
		} catch (err) {
			handleError("Failed to delete template");
		}
	}

	const handlePreview = async (templateID: string, id: string) => {
		try {
			const response = await ReaderClient.handlePreview(templateID, id);
			console.log(response);

		}
		catch (error) {
			handleError("Failed to preview template");
		}
	}

	interface excelFields {
		name: string,
		required: boolean,
		showOnExcel: boolean,
		_id: string
	}

	const handleFileChange = (info: any) => {
		const file = info?.file?.originFileObj || info?.file;
		if (file) {
			setSelectedFile(file);
		}
	};

	const downloadtemplate = () => {
		try {
			const fields = record?.templateVariables;

			const fieldsToShow = fields.filter((f: excelFields) => f.showOnExcel);
			const row: Record<string, string> = {};
			fieldsToShow.forEach((field: excelFields) => {
				row[field.name] = "";
			});

			const data = [row];
			const worksheet = XLSX.utils.json_to_sheet(data);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, "Dates");

			const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
			const blob = new Blob([buffer], { type: "application/octet-stream" });
			saveAs(blob, "template.xlsx");
		}
		catch (err) {
			handleError(err, "Failed to save template");
		}
	}

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
		async function onloadFunction() {
			try {
				if (!id) return;
				const response = await ReaderClient.getAllDoc(id);
				const rowDataFromBackend = response?.finalOutput;
				setDispatched(response?.isDispatched || false);
				const data = rowDataFromBackend.map((item: any) => ({
					id: item.id,
					...item.data,
				}));

				setTableData(data);
			}
			catch (err) {
				handleError(err, "Failed to save template");
			}
		}

		onloadFunction();
	}, []);

	const handleExcelFile = async () => {
		try {
			const formData = new FormData();
			if (selectedFile) {
				formData.append("excelFile", selectedFile);
			} else {
				throw new Error("No file selected");
			}
			if (!id) return;
			const response = await ReaderClient.handleBulkUpload(formData, id);
			const rowDataFromBackend = response?.finalOutput;

			const data = rowDataFromBackend.map((item: any) => ({
				id: item.id,
				...item.data,
			}));

			setTableData(data);
		}
		catch (err) {
			handleError(err, "Failed to save template");
		}
	}

	return (
		<MainAreaLayout
			title={name}
			extra={
				<>
					<Button
						type="primary"
						onClick={() => {
							setButtonClick(true);
							form.resetFields();
						}}
						className="px-6 py-2 text-lg rounded-md"
					>
						Bulk Upload
					</Button>
					<Button onClick={() => downloadtemplate()} type="primary">
						Download Template
					</Button>
				</>
			}
		>
			{buttonClick && (
				<Card>
					<Flex gap="large">
						<Upload
							accept=".xls,.xlsx"
							name="excelFile"
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
						<Button type="primary" onClick={() => handleExcelFile()}>Upload</Button>
					</Flex>
				</Card>
			)}

			<CustomTable
				columns={fields}
				data={tableData}
				serialNumberConfig={{ name: "", show: true }}
				key="id"
			/>
		</MainAreaLayout>

	)
}