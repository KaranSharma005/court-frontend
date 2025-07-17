import MainAreaLayout from "../components/main-layout/main-layout";
import CustomTable from "../components/CustomTable";
import { OfficerClient, ReaderClient, useAppStore } from '../store';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver'
import { useParams } from "react-router";
import type { ColumnsType } from 'antd/es/table';
import { useState, useEffect, useRef } from 'react';
import { statusMap, excelFields } from '../utils/index'
import { handleError } from "../utils/requestUtils";
import {
	Button,
	Form,
	message,
	Card,
	Upload,
	Flex,
	Tag,
	Modal,
	Input
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export default function RequestPage() {
	const [form] = Form.useForm();
	const id = useParams()?.id;
	const [buttonClick, setButtonClick] = useState(false)
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [fields, setFields] = useState<ColumnsType<any>>([]);
	const [selectedRecord, setSelectedRecord] = useState<string>("");
	const [rejectReason, setRejectionReason] = useState<string>("");
	const isDispatched = useRef(false);

	const [tableData, setTableData] = useState<any[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [bulkUploadActive, setBulkUploadActive] = useState<boolean>(true);
	const record = useAppStore((state) => state.selectedRecord);
	const [name, setName] = useState<string>("");
	const [fileList, setFileList] = useState<any[]>([]);
	const role = useAppStore((state) => state.session?.role);

	useEffect(() => {
		async function getFields() {
			try {
				if (!id) return;
				const response = await ReaderClient.getTemplateFields(id);

				const templateVars = response?.templateVar?.templateVariables;
				const assignedTo = response?.assignedToExists;
				setBulkUploadActive(!assignedTo);
				setName(response?.name);

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
							render: (status: number) => {
								const { color, label } = statusMap[status] || {};
								return <Tag color={color}>{label}</Tag>;
							},
						},
						{
							title: "Rejected Reason",
							dataIndex: "rejectionReason",
							key: "rejectionReason",
						},
						{
							title: "Signed Date",
							dataIndex: "signedDate",
							key: "signedDate",
							render: (date: string) => date ? new Date(date).toLocaleDateString() : "-",
						},
						{
							title: "Actions",
							key: "actions",
							render: (_: unknown, record: any) => {
								const canReject = isDispatched.current == true && role == 2 && record?.signStatus !== 2;
								const canDelete = isDispatched.current == false;

								return (
									<>
										<Button type="link" onClick={() => handlePreview(record, id)}>Preview</Button>
										{canReject && record?.signStatus != 5 && (
											<Button type="link" danger onClick={() => handleReject(record?.id)}>Reject</Button>
										)}
										{canDelete && (
											<Button type="link" danger onClick={() => handleDocDelete(record?.id)}>Delete</Button>
										)}
									</>
								);
							},
						},
					];

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

	const handleReject = async (docId: string) => {
		try {
			setSelectedRecord(docId);
			setIsModalOpen(true);
		}
		catch (err) {
			handleError(err, "Rejection error");
		}
	}

	const handleDocDelete = async (docId: string) => {
		try {
			if (!id) return;
			const response = await ReaderClient.deleteDoc(docId, id);
			const rowDataFromBackend = response?.finalOutput;
			console.log(rowDataFromBackend);

			const data = rowDataFromBackend.map((item: any) => ({
				id: item.id,
				...item.data,
				signStatus: item.signStatus || 0,
				signedDate: item.signedDate || '',
				rejectionReason: item.rejectionReason || '',
				url: item.url || '',
			}));
			setTableData(data);
		} catch (err) {
			handleError("Failed to delete template");
		}
	}

	const handlePreview = async (record: any, templateID: string) => {
		try {
			if (record?.signStatus != 5) {
				const id = record?.id;
				const previewURL = `http://localhost:3000/template/preview/${templateID}/${id}`;
				window.open(previewURL, '');
			}
			else {
				const id = record?.id;
				const previewURL = `http://localhost:3000/template/sign-preview/${templateID}/${id}`;
				window.open(previewURL, '');
			}
		}
		catch (error) {
			handleError("Failed to preview template");
		}
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

	async function onloadFunction() {
		try {
			if (!id) return;
			const response = await ReaderClient.getAllDoc(id);
			const rowDataFromBackend = response?.finalOutput;
			// setDispatched(response?.isDispatched);
			isDispatched.current = response?.isDispatched;

			const data = rowDataFromBackend.map((item: any) => ({
				id: item.id,
				...item.data,
				signStatus: item.signStatus ?? 0,
				signedDate: item.signedDate || '',
				rejectionReason: item.rejectionReason || '',
				url: item.url || '',
			}));

			setTableData(data);
		}
		catch (err) {
			handleError(err, "Failed to save template");
		}
	}

	useEffect(() => {
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
				signStatus: item.signStatus ?? 0,
				signedDate: item.signedDate || '',
				rejectionReason: item.rejectionReason || '',
				url: item.url || '',
			}));

			setTableData(data);
		}
		catch (err) {
			handleError(err, "Failed to save template");
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

	const handleOk = async () => {
		try {
			if (!id)
				return;
			await OfficerClient.rejectOne(id, selectedRecord, rejectReason);
			onloadFunction();
			message.success("Template Rejected");
			setIsModalOpen(false);
			setRejectionReason("");
			setSelectedRecord("");
			onloadFunction();
		}
		catch (err) {
			handleError("Failed to reject");
		}
	}

	return (
		<MainAreaLayout
			title={name}
			extra={
				<>
					{
						bulkUploadActive && (
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
						)
					}
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
							fileList={fileList}
							showUploadList={{ showRemoveIcon: true }}
							onRemove={() => {
								setSelectedFile(null)
								setFileList([]);
							}
							}
						>
							<Button icon={<UploadOutlined />} >
								Click to Upload
							</Button>
						</Upload>
						<Button type="primary" onClick={() => handleExcelFile()}>Upload</Button>
					</Flex>
				</Card>
			)}

			{
				isModalOpen && (
					<Modal
						title="Rejection Reason"
						closable={{ 'aria-label': 'Custom Close Button' }}
						open={isModalOpen}
						onOk={handleOk}
						onCancel={handleCancel}
					>
						<Input.TextArea
							rows={4}
							placeholder="Enter Rejection Reason"
							value={rejectReason}
							onChange={(e) => setRejectionReason(e.target.value)}
						>
						</Input.TextArea>
					</Modal>
				)
			}

			<CustomTable
				columns={fields}
				data={tableData}
				serialNumberConfig={{ name: "", show: true }}
				key="id"
			/>
		</MainAreaLayout>
	)
}