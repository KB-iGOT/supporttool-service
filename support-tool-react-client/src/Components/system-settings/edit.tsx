import { useMemo, useState } from "react";
import JsonView from '@uiw/react-json-view';
import JsonViewEditor from '@uiw/react-json-view/editor';
import { lightTheme } from '@uiw/react-json-view/light';
import { darkTheme } from '@uiw/react-json-view/dark';
import { TriangleArrow } from '@uiw/react-json-view/triangle-arrow';
import { TriangleSolidArrow } from '@uiw/react-json-view/triangle-solid-arrow';
import { useParams } from "react-router-dom";
import { systemSettingsService } from "../../services/system-settings.service";
interface SystemSetting {
    id: string;
    field: string;
    value: any;
  }
export const EditSettings = () => {
    const [configData, setConfigData] = useState<SystemSetting>({
        id: "",
        field: "",
        value: ""
    });
    const {id} = useParams();

    const getConfigData = async () => {
        let response = await systemSettingsService.getConfig(id);
        if(response.responseCode === 'OK') {
            setConfigData(response.result.response);
        }
        console.log('location',response);
    }
    useMemo(() => {
        getConfigData();
    }, [id]);
    
    return (<>
     <JsonViewEditor  editable onEdit={(data: any)=> setConfigData({...configData, value: data})}  value={JSON.parse(configData.value)} keyName="root" />
    </>)
}