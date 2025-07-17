import { Dropdown, Button, Tag, MenuProps, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { GetActionsProps } from './index';

export const getActions = ({
    record,
    role,
    sessionId,
    cloneTemplate,
    sendForSignature,
    deleteTemplate,
    handleSign,
    handleDelegate,
    handleRejectAll,
}: GetActionsProps) => {
    const totalDocs = record?.data?.length || 0;
    const rejectedCount = record?.data?.filter((d) => d.rejectionReason)?.length || 0;

    if (totalDocs > 0 && rejectedCount === totalDocs && role === 2) {
        return <Tag color="#fa541c">Rejected</Tag>;
    }

    if (role === 3 || record?.createdBy === sessionId) {
        const items: MenuProps["items"] = [
            {
                key: "clone",
                label: "Clone",
                onClick: () => cloneTemplate(record.id),
            },
        ];

        if (record?.signStatus === 0 && totalDocs > 0) {
            items.push({
                key: "dispatch",
                label: "Send for Signature",
                onClick: () => sendForSignature(record),
            });
        }

        if (record?.signStatus === 0) {
            items.push({
                key: "delete",
                label: "Delete",
                danger: true,
                onClick: () => deleteTemplate(record.id),
            });
        }

        if (record?.signStatus === 3) {
            items.push({
                key: "sign",
                label: "Sign",
                onClick: () => handleSign(record.id),
            });
        }

        return (
            <Dropdown menu={{ items }} trigger={["click"]}>
                <Button>
                    Actions <DownOutlined />
                </Button>
            </Dropdown>
        );
    } else if (role === 2) {
        if (record?.signStatus === 3) {
            return <Tag color="#722ed1">Delegated</Tag>;
        }

        if (record?.signStatus === 5) {
            return <Tag color="#52c41a">Signed</Tag>;
        }

        const items: MenuProps["items"] = [];

        if (record?.assignedTo && record?.signStatus === 1) {
            items.push({
                key: "sign",
                label: "Sign",
                onClick: () => handleSign(record.id),
            });
        }

        if (record?.signStatus === 1) {
            items.push({
                key: "delegate",
                label: "Delegate",
                onClick: () => handleDelegate(record.id),
            });
        }

        if (record?.signStatus === 0) {
            items.push({
                key: "delete",
                label: "Delete",
                danger: true,
                onClick: () => deleteTemplate(record.id),
            });
        }

        if (record?.signStatus === 1) {
            items.push({
                key: "rejectAll",
                label: "Reject All",
                danger: true,
                onClick: () => handleRejectAll(record.id),
            });
        }

        return (
            <Dropdown menu={{ items }} trigger={["click"]}>
                <Button>
                    Actions <DownOutlined />
                </Button>
            </Dropdown>
        );
    }

    return null;
};

export const handleError = (
    error: unknown,
    fallbackMsg = "Something went wrong"
) => {
    console.error(error);
    if (error instanceof Error) return message.error(error.message);
    if (typeof error === "string") return message.error(error);
    return message.error(fallbackMsg);
};