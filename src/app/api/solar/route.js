export const dynamic = 'force-dynamic' // defaults to auto
import { fetchSolarHistory } from "@/app/lib/data"

export async function GET(request) {
    let data = await fetchSolarHistory();
    return Response.json(data);

}