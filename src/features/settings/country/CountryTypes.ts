export interface CountryType {
    id: number;
    name: string;
    flag: string | null;
    position: {
        lat: number;
        lng: number;
    }
    cities: CityType[]
}

export interface CityType {
    id: number;
    name: string;
    position: {
        lat: number;
        lng: number;
    }
}