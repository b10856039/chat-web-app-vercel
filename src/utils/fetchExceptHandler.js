
import { ElMessage } from "element-plus";

export default function ExceptMessageHandler(errors)
{
    let errorMsg = "";

    for(let err of errors)
    {
      errorMsg += `\n• ${err}`;
    }

    ElMessage.error(errorMsg)
}