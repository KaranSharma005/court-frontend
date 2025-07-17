export interface Template {
    id: string;
    templateName: string;
    data: {
        rejectionReason?: string;
    }[];
    createdAt: string;
    signStatus: number;
    assignedTo: string;
    createdBy: string;
    signCount: number;
}

export interface Officer {
    id: string
    name: string,
    email: string
}
export interface SignatureInt {
    url: string;
    id: string;
}

export interface excelFields {
    name: string,
    required: boolean,
    showOnExcel: boolean,
    _id: string
}

export const statusMap: Record<number, { color: string, label: string }> = {
    0: { color: 'red', label: 'Unsigned' },
    1: { color: '#1890ff', label: 'Ready to Sign' },
    2: { color: '#fa541c', label: 'Rejected' },
    3: { color: '#722ed1', label: 'Delegated' },
    4: { color: '#fa8c16', label: 'In Process' },
    5: { color: '#52c41a', label: 'Signed' },
    6: { color: '#13c2c2', label: 'Ready To Dispatch' },
    7: { color: '#faad14', label: 'Dispatched' },
};

export interface GetActionsProps {
  record: Template;
  role?: number;
  sessionId?: string;
  cloneTemplate: (id: string) => void;
  sendForSignature: (record: Template) => void;
  deleteTemplate: (id: string) => void;
  handleSign: (id: string) => void;
  handleDelegate: (id: string) => void;
  handleRejectAll: (id: string) => void;
}