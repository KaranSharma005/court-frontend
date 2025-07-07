import MainAreaLayout from "../components/main-layout/main-layout";
// import CustomTable from "../components/CustomTable";
import { useAppStore } from '../store';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver'

import { useState } from 'react';
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
	const [buttonClick, setButtonClick] = useState(false)
	const [selectedFile, setSelectedFile] = useState<File | null>(null);;
	const record = useAppStore((state) => state.selectedRecord);
	const request = `Request : ${record?.templateName}`;

	interface excelFields {
		name: string,
		required: boolean,
		showOnExcel: boolean,
		_id: string
	}

	const handleFileChange = (info: any) => {
		const file = info.file.originFileObj || info.file;
		if (file) {
			setSelectedFile(file);
		}
	};

	const downloadtemplate = () => {
		try {
			const fields = record?.templateVariables;
			console.log(record);

			const fieldsToShow = fields.filter((f: excelFields) => f.showOnExcel);
			console.log(fieldsToShow);

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

	return (
		<MainAreaLayout
			title={request}
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
					<Button onClick={() => downloadtemplate()}>
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
							name="file"
							beforeUpload={() => false}
							onChange={handleFileChange}
							maxCount={1}
							showUploadList={{ showRemoveIcon: true }}
							onRemove={() => setSelectedFile(null)}
						>
							<Button icon={<UploadOutlined />}>
								Click to Upload
							</Button>
						</Upload>
						<Button disabled={!selectedFile} type="primary">Upload</Button>
					</Flex>
				</Card>
			)}
		</MainAreaLayout>

	)
}