export interface CountryView {
  id: number;
  code: string;
  name: string;
}

export interface ProvinceView {
  id: number;
  country_id: number;
  code: string;
  name: string;
}

export interface CantonView {
  id: number;
  province_id: number;
  code: string;
  name: string;
}

export interface DistrictView {
  id: number;
  canton_id: number;
  code: string;
  name: string;
}
