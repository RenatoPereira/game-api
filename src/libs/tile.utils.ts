import { AxialCoordinates } from "honeycomb-grid";

export const getUnitKey = (position: AxialCoordinates) => {
    return `${position.q},${position.r}`;
}