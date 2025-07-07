import MainAreaLayout from "../components/main-layout/main-layout";
import {
    Upload
} from 'antd';
const Signatures: React.FC = () => {
    return(
        <MainAreaLayout
            title="Uploaded Signatures"
        >
            <Upload></Upload>
        </MainAreaLayout>
    )
}
export default Signatures;
