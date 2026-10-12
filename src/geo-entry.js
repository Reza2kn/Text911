import {geoAlbersUsa,geoMercator} from 'd3-geo';
const projection=geoAlbersUsa().scale(1180).translate([490,310]);
export function projectLocation(longitude,latitude){return projection([longitude,latitude]);}
