import fetcher from './request'
import { config } from '../config'
import { Shape } from '@/Types';
export function getLibraries() {
    return fetcher(`${config.gatewayApiUrl}/isometric/library?status=active`, 'get', undefined, true)
}

export async function getShapes(library?: string): Promise<Shape[]> {
    let query = '';
    if(library) query = `${query}library=${library}&`
    const shapeResp: any[] = await fetcher(`${config.gatewayApiUrl}/isometric/shapes?${query}status=active`, 'get', undefined, true)
    const updatedShapes : Shape[] = shapeResp.map(x => {
        return {
            name: x.name,
            type: x.type,
            attachTo: x.attachto,
            svgFile: x.name,
            svgContent: x.svgcontent
        }
    });
    return updatedShapes
}